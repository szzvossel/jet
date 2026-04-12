/// Tracer types — domain types for log monitoring and metric dashboarding.

use serde::{Deserialize, Serialize};

/// Log severity level.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Hash)]
#[serde(rename_all = "UPPERCASE")]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

/// A single parsed log event.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEvent {
    pub timestamp: String,
    pub level: LogLevel,
    pub target: String,
    pub thread_id: String,
    pub source_name: String,
    pub message: String,
    pub tracer_id: Option<u64>,
    pub elapsed_ms: Option<u64>,
    pub raw_line: String,
}

/// Distribution of log levels.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogLevelDistribution {
    pub trace: u64,
    pub debug: u64,
    pub info: u64,
    pub warn: u64,
    pub error: u64,
}

impl LogLevelDistribution {
    pub fn zero() -> Self {
        Self {
            trace: 0,
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
        }
    }

    pub fn count_level(&mut self, level: LogLevel) {
        match level {
            LogLevel::Trace => self.trace += 1,
            LogLevel::Debug => self.debug += 1,
            LogLevel::Info => self.info += 1,
            LogLevel::Warn => self.warn += 1,
            LogLevel::Error => self.error += 1,
        }
    }
}

/// Latency statistics computed from elapsed_ms fields.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencyStats {
    pub min_ms: Option<f64>,
    pub max_ms: Option<f64>,
    pub avg_ms: Option<f64>,
    pub p50_ms: Option<f64>,
    pub p95_ms: Option<f64>,
    pub p99_ms: Option<f64>,
    pub sample_count: u64,
}

/// Throughput data point (events per time bucket).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThroughputPoint {
    pub bucket: String,
    pub count: u64,
}

/// Per-source breakdown.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceStats {
    pub source: String,
    pub total_events: u64,
    pub error_count: u64,
    pub level_distribution: LogLevelDistribution,
    pub latency: LatencyStats,
}

/// Top-level KPI snapshot.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracerKpis {
    pub total_events: u64,
    pub error_rate: f64,
    pub level_distribution: LogLevelDistribution,
    pub latency: LatencyStats,
    pub throughput: Vec<ThroughputPoint>,
    pub sources: Vec<SourceStats>,
    pub monitored_files: Vec<String>,
    pub last_updated: String,
}

/// Summary for the log event list view (paginated).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEventList {
    pub events: Vec<LogEvent>,
    pub total_count: u64,
    pub has_more: bool,
}
