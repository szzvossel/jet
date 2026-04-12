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
use tokio::sync::RwLock;

use watcher::LogWatcher;

/// Initialize the tracer subsystem.
///
/// Starts a background file watcher on `watch_dir`. Returns a shared state
/// handle that can be used to query KPIs and events.
pub async fn init_tracer(watch_dir: PathBuf) -> Arc<RwLock<TracerState>> {
    let state = Arc::new(RwLock::new(TracerState::new()));
    let watcher = Arc::new(LogWatcher::new(watch_dir, Arc::clone(&state)));
    watcher.start().await;
    state
}

/// Compute a fresh KPI snapshot from the current state.
pub async fn get_kpis(state: &Arc<RwLock<TracerState>>) -> TracerKpis {
    let read = state.read().await;
    let events: Vec<_> = read.events.clone();
    let files = read.monitored_files();
    metrics::compute_kpis(&events, &files)
}

/// Get a paginated list of events (newest first).
pub async fn get_events(
    state: &Arc<RwLock<TracerState>>,
    page: usize,
    page_size: usize,
) -> LogEventList {
    let read = state.read().await;
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
