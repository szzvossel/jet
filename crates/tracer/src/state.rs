/// Tracer state — in-memory ring buffer and file offset tracking.

use std::collections::HashMap;
use std::path::PathBuf;

use crate::types::LogEvent;

/// Maximum number of events to retain in memory.
const MAX_EVENTS: usize = 10_000;

/// In-memory tracer state, protected by `Arc<RwLock<..>>`.
pub struct TracerState {
    /// Ring buffer of recent log events (newest at end).
    pub events: Vec<LogEvent>,
    /// Tracked file offsets: file_path -> (display_name, last_byte_offset).
    pub file_offsets: HashMap<PathBuf, (String, u64)>,
}

impl TracerState {
    pub fn new() -> Self {
        Self {
            events: Vec::with_capacity(MAX_EVENTS),
            file_offsets: HashMap::new(),
        }
    }

    /// Append a batch of parsed events, evicting oldest if over capacity.
    pub fn push_events(&mut self, events: Vec<LogEvent>) {
        for evt in events {
            if self.events.len() >= MAX_EVENTS {
                self.events.remove(0);
            }
            self.events.push(evt);
        }
    }

    /// Get or create the tracked offset for a file.
    pub fn get_offset(&self, path: &PathBuf) -> u64 {
        self.file_offsets
            .get(path)
            .map(|(_, off)| *off)
            .unwrap_or(0)
    }

    /// Update the tracked offset for a file.
    pub fn set_offset(&mut self, path: PathBuf, display_name: String, offset: u64) {
        self.file_offsets.insert(path, (display_name, offset));
    }

    /// Get the list of monitored file display names.
    pub fn monitored_files(&self) -> Vec<String> {
        let mut names: Vec<String> = self
            .file_offsets
            .values()
            .map(|(n, _)| n.clone())
            .collect();
        names.sort();
        names
    }
}
