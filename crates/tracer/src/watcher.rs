/// Async file watcher — monitors `data/tracer/` for JSON log files.
///
/// On startup, scans existing `*.log` files. Then uses the `notify` crate
/// to watch for file modifications and creations. Reads only new bytes
/// (tracked via per-file offsets) and feeds parsed events into the shared state.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tokio::sync::RwLock;

use crate::parser;
use crate::state::TracerState;
use crate::types::LogEvent;

/// Manages the background file watcher task.
pub struct LogWatcher {
    watch_dir: PathBuf,
    state: Arc<RwLock<TracerState>>,
}

impl LogWatcher {
    pub fn new(watch_dir: PathBuf, state: Arc<RwLock<TracerState>>) -> Self {
        Self { watch_dir, state }
    }

    /// Start watching. Performs an initial scan of existing files, then spawns
    /// a background task for ongoing file monitoring.
    pub async fn start(self: &Arc<Self>) {
        // Initial scan of existing log files
        self.initial_scan().await;

        // Set up the notify watcher
        let self_clone = Arc::clone(self);
        let watch_dir = self.watch_dir.clone();

        tokio::spawn(async move {
            self_clone.run_watcher(&watch_dir).await;
        });
    }

    /// Read all existing *.log files in the watch directory.
    async fn initial_scan(&self) {
        let dir = &self.watch_dir;
        if !dir.exists() {
            eprintln!("[tracer] watch directory does not exist: {:?}", dir);
            return;
        }

        let entries = match fs::read_dir(dir) {
            Ok(e) => e,
            Err(err) => {
                eprintln!("[tracer] failed to read directory {:?}: {}", dir, err);
                return;
            }
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("log") {
                self.read_file_from(&path, 0).await;
            }
        }
    }

    /// Read new bytes from a file starting at the given offset, parse lines,
    /// and push events into the shared state.
    async fn read_file_from(&self, path: &PathBuf, from_offset: u64) {
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let mut file = match fs::File::open(path) {
            Ok(f) => f,
            Err(err) => {
                eprintln!("[tracer] failed to open {:?}: {}", path, err);
                return;
            }
        };

        let file_size = match file.metadata() {
            Ok(m) => m.len(),
            Err(_) => return,
        };

        if file_size <= from_offset {
            // No new bytes
            return;
        }

        use std::io::{Seek, SeekFrom};
        if let Err(err) = file.seek(SeekFrom::Start(from_offset)) {
            eprintln!("[tracer] seek failed for {:?}: {}", path, err);
            return;
        }

        let mut buf = String::new();
        if let Err(err) = std::io::Read::read_to_string(&mut file, &mut buf) {
            eprintln!("[tracer] read failed for {:?}: {}", path, err);
            return;
        }

        let mut new_events: Vec<LogEvent> = Vec::new();
        for line in buf.lines() {
            if let Some(evt) = parser::parse_line(line, &file_name) {
                new_events.push(evt);
            }
        }

        let new_offset = file_size;
        let mut state = self.state.write().await;
        state.set_offset(path.clone(), file_name, new_offset);
        if !new_events.is_empty() {
            state.push_events(new_events);
        }
    }

    /// Run the notify file watcher in a blocking loop.
    async fn run_watcher(&self, watch_dir: &Path) {
        let (tx, mut rx) = tokio::sync::mpsc::channel::<Event>(256);

        let mut watcher = match RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    let _ = tx.blocking_send(event);
                }
            },
            Config::default(),
        ) {
            Ok(w) => w,
            Err(err) => {
                eprintln!("[tracer] failed to create watcher: {}", err);
                return;
            }
        };

        if let Err(err) = watcher.watch(watch_dir, RecursiveMode::NonRecursive) {
            eprintln!("[tracer] failed to start watching {:?}: {}", watch_dir, err);
            return;
        }

        // watcher must remain alive for file monitoring to work
        // it will be dropped when the channel closes / task ends
        let _watcher_guard = watcher;

        while let Some(event) = rx.recv().await {
            match event.kind {
                EventKind::Modify(_) | EventKind::Create(_) => {
                    for path in &event.paths {
                        if path.extension().and_then(|e| e.to_str()) == Some("log") {
                            let offset = {
                                let state = self.state.read().await;
                                state.get_offset(path)
                            };
                            self.read_file_from(path, offset).await;
                        }
                    }
                }
                _ => {}
            }
        }
    }
}
