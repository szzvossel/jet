/// KPI computation — derives metrics from the in-memory event buffer.

use std::collections::HashMap;

use crate::types::*;

/// Compute a full KPI snapshot from the current events.
pub fn compute_kpis(events: &[LogEvent], monitored_files: &[String]) -> TracerKpis {
    let total = events.len() as u64;
    let level_dist = compute_level_distribution(events);
    let error_count = level_dist.error;
    let error_rate = if total > 0 {
        error_count as f64 / total as f64
    } else {
        0.0
    };
    let latency = compute_latency_stats(events);
    let throughput = compute_throughput(events);
    let sources = compute_source_stats(events);

    TracerKpis {
        total_events: total,
        error_rate,
        level_distribution: level_dist,
        latency,
        throughput,
        sources,
        monitored_files: monitored_files.to_vec(),
        last_updated: chrono::Utc::now().to_rfc3339(),
    }
}

fn compute_level_distribution(events: &[LogEvent]) -> LogLevelDistribution {
    let mut dist = LogLevelDistribution::zero();
    for evt in events {
        dist.count_level(evt.level);
    }
    dist
}

pub fn compute_latency_stats(events: &[LogEvent]) -> LatencyStats {
    let mut values: Vec<f64> = events
        .iter()
        .filter_map(|e| e.elapsed_ms.map(|v| v as f64))
        .collect();

    if values.is_empty() {
        return LatencyStats {
            min_ms: None,
            max_ms: None,
            avg_ms: None,
            p50_ms: None,
            p95_ms: None,
            p99_ms: None,
            sample_count: 0,
        };
    }

    let count = values.len() as u64;
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let min = values[0];
    let max = *values.last().unwrap();
    let sum: f64 = values.iter().sum();
    let avg = sum / values.len() as f64;

    LatencyStats {
        min_ms: Some(min),
        max_ms: Some(max),
        avg_ms: Some(avg),
        p50_ms: Some(percentile(&values, 50.0)),
        p95_ms: Some(percentile(&values, 95.0)),
        p99_ms: Some(percentile(&values, 99.0)),
        sample_count: count,
    }
}

/// Nearest-rank percentile from a sorted slice.
fn percentile(sorted: &[f64], pct: f64) -> f64 {
    if sorted.is_empty() {
        return 0.0;
    }
    let idx = ((pct / 100.0) * (sorted.len() - 1) as f64).round() as usize;
    sorted[idx.min(sorted.len() - 1)]
}

/// Compute throughput as events per 1-minute bucket.
fn compute_throughput(events: &[LogEvent]) -> Vec<ThroughputPoint> {
    let mut buckets: HashMap<String, u64> = HashMap::new();

    for evt in events {
        // Truncate timestamp to the minute: "2026-04-09T10:19:28..." -> "2026-04-09T10:19"
        let bucket_key = evt
            .timestamp
            .chars()
            .take(16)
            .collect::<String>();
        *buckets.entry(bucket_key).or_insert(0) += 1;
    }

    let mut points: Vec<ThroughputPoint> = buckets
        .into_iter()
        .map(|(bucket, count)| ThroughputPoint { bucket, count })
        .collect();
    points.sort_by(|a, b| a.bucket.cmp(&b.bucket));
    points
}

/// Compute per-source statistics.
fn compute_source_stats(events: &[LogEvent]) -> Vec<SourceStats> {
    let mut grouped: HashMap<String, Vec<&LogEvent>> = HashMap::new();
    for evt in events {
        grouped
            .entry(evt.source_name.clone())
            .or_default()
            .push(evt);
    }

    let mut stats: Vec<SourceStats> = grouped
        .into_iter()
        .map(|(source, source_events)| {
            let total = source_events.len() as u64;
            let level_dist = compute_level_distribution_refs(&source_events);
            let error_count = level_dist.error;
            let latency = compute_latency_stats_refs(&source_events);
            SourceStats {
                source,
                total_events: total,
                error_count,
                level_distribution: level_dist,
                latency,
            }
        })
        .collect();

    stats.sort_by(|a, b| a.source.cmp(&b.source));
    stats
}

fn compute_level_distribution_refs(events: &[&LogEvent]) -> LogLevelDistribution {
    let mut dist = LogLevelDistribution::zero();
    for evt in events {
        dist.count_level(evt.level);
    }
    dist
}

fn compute_latency_stats_refs(events: &[&LogEvent]) -> LatencyStats {
    let mut values: Vec<f64> = events
        .iter()
        .filter_map(|e| e.elapsed_ms.map(|v| v as f64))
        .collect();

    if values.is_empty() {
        return LatencyStats {
            min_ms: None,
            max_ms: None,
            avg_ms: None,
            p50_ms: None,
            p95_ms: None,
            p99_ms: None,
            sample_count: 0,
        };
    }

    let count = values.len() as u64;
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let min = values[0];
    let max = *values.last().unwrap();
    let sum: f64 = values.iter().sum();
    let avg = sum / values.len() as f64;

    LatencyStats {
        min_ms: Some(min),
        max_ms: Some(max),
        avg_ms: Some(avg),
        p50_ms: Some(percentile(&values, 50.0)),
        p95_ms: Some(percentile(&values, 95.0)),
        p99_ms: Some(percentile(&values, 99.0)),
        sample_count: count,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_event(level: LogLevel, source: &str, elapsed_ms: Option<u64>) -> LogEvent {
        LogEvent {
            timestamp: "2026-04-09T10:19:28.725399Z".to_string(),
            level,
            target: "main".to_string(),
            thread_id: "01".to_string(),
            source_name: source.to_string(),
            message: "test".to_string(),
            tracer_id: Some(123),
            elapsed_ms,
            raw_line: "{}".to_string(),
        }
    }

    #[test]
    fn test_compute_kpis_empty() {
        let kpis = compute_kpis(&[], &[]);
        assert_eq!(kpis.total_events, 0);
        assert_eq!(kpis.error_rate, 0.0);
    }

    #[test]
    fn test_compute_kpis_basic() {
        let events = vec![
            make_event(LogLevel::Info, "jet", Some(100)),
            make_event(LogLevel::Error, "jet", Some(300)),
            make_event(LogLevel::Info, "kdb", Some(200)),
        ];
        let kpis = compute_kpis(&events, &["jet.log".to_string()]);
        assert_eq!(kpis.total_events, 3);
        assert!((kpis.error_rate - 1.0 / 3.0).abs() < 1e-9);
        assert_eq!(kpis.level_distribution.info, 2);
        assert_eq!(kpis.level_distribution.error, 1);
        assert_eq!(kpis.sources.len(), 2);
    }

    #[test]
    fn test_latency_stats() {
        let events = vec![
            make_event(LogLevel::Info, "jet", Some(100)),
            make_event(LogLevel::Info, "jet", Some(200)),
            make_event(LogLevel::Info, "jet", Some(300)),
            make_event(LogLevel::Info, "jet", None),
        ];
        let stats = compute_latency_stats(&events);
        assert_eq!(stats.sample_count, 3);
        assert_eq!(stats.min_ms, Some(100.0));
        assert_eq!(stats.max_ms, Some(300.0));
        assert_eq!(stats.avg_ms, Some(200.0));
    }

    #[test]
    fn test_percentile() {
        let values: Vec<f64> = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert_eq!(percentile(&values, 0.0), 1.0);
        assert_eq!(percentile(&values, 50.0), 3.0);
        assert_eq!(percentile(&values, 100.0), 5.0);
    }
}
