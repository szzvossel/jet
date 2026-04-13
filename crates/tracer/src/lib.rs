/// jet-tracer — Centralized log monitoring, parsing, and metric dashboard.
///
/// Watches a local folder for JSON-structured log files, parses new events
/// in a streaming fashion, computes logging KPIs, and exposes them via
/// a public API for both Tauri IPC and HTTP REST endpoints.

pub mod types;
pub mod parser;
pub mod watcher;
pub mod metrics;
pub mod state;

pub use types::*;
pub use state::TracerState;

use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{oneshot, Mutex, RwLock};

use watcher::LogWatcher;

/// Handle that bundles the shared tracer state with the ability to
/// stop and restart the background file watcher.
pub struct TracerHandle {
    pub state: Arc<RwLock<TracerState>>,
    shutdown: Mutex<Option<oneshot::Sender<()>>>,
}

/// Initialize the tracer subsystem without starting the watcher.
///
/// Creates empty state and stores the intended watch directory.
/// Call `load_tracer()` to trigger a one-time scan and start live monitoring.
pub async fn init_tracer(watch_dir: PathBuf) -> Arc<TracerHandle> {
    let state = Arc::new(RwLock::new(TracerState::new(watch_dir)));

    Arc::new(TracerHandle {
        state,
        shutdown: Mutex::new(None),
    })
}

/// Scan the watch directory and start live monitoring.
///
/// Performs a one-time scan of existing `*.log` files, then starts a background
/// notify watcher for ongoing file changes. If a watcher is already running it
/// is stopped first.
pub async fn load_tracer(handle: &TracerHandle) -> Result<(), String> {
    let watch_dir = {
        let state = handle.state.read().await;
        state.watch_dir.clone()
    };

    if !watch_dir.exists() {
        return Err(format!("Directory does not exist: {}", watch_dir.display()));
    }

    // Shut down the old watcher if one is running
    {
        let mut shutdown_guard = handle.shutdown.lock().await;
        if let Some(tx) = shutdown_guard.take() {
            let _ = tx.send(());
        }
    }

    // Clear state
    {
        let mut state = handle.state.write().await;
        state.clear();
    }

    // Initial scan + start background watcher
    let watcher = Arc::new(LogWatcher::new(watch_dir, Arc::clone(&handle.state)));
    let shutdown_tx = watcher.start().await;

    {
        let mut shutdown_guard = handle.shutdown.lock().await;
        *shutdown_guard = Some(shutdown_tx);
    }

    Ok(())
}

/// Restart the tracer on a new directory.
///
/// Updates the watch directory, then triggers a load (scan + live monitoring).
pub async fn restart_tracer(handle: &TracerHandle, new_dir: PathBuf) -> Result<(), String> {
    if !new_dir.exists() {
        return Err(format!("Directory does not exist: {}", new_dir.display()));
    }

    // Update watch_dir
    {
        let mut state = handle.state.write().await;
        state.watch_dir = new_dir;
    }

    load_tracer(handle).await
}

/// Compute a fresh KPI snapshot from the current state.
pub async fn get_kpis(handle: &TracerHandle) -> TracerKpis {
    let read = handle.state.read().await;
    let events: Vec<_> = read.events.clone();
    let files = read.monitored_files();
    metrics::compute_kpis(&events, &files)
}

/// Get a paginated list of events (newest first).
pub async fn get_events(
    handle: &TracerHandle,
    page: usize,
    page_size: usize,
) -> LogEventList {
    let read = handle.state.read().await;
    let total = read.events.len() as u64;
    let start = page * page_size;
    let events: Vec<_> = read
        .events
        .iter()
        .rev()
        .skip(start)
        .take(page_size)
        .cloned()
        .collect();
    let has_more = ((start + page_size) as u64) < total;
    LogEventList {
        events,
        total_count: total,
        has_more,
    }
}
