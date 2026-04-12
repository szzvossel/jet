/// JSON log line parser.
///
/// Parses JSON-structured log lines (JSONL format). Each line is a self-contained
/// JSON object with fields: timestamp, level, target, thread_id, source, message,
/// tracer_id, elapsed_ms.

use crate::types::{LogEvent, LogLevel};

/// Intermediate struct for deserializing JSON log lines.
#[derive(serde::Deserialize)]
struct JsonLogLine {
    timestamp: String,
    level: String,
    #[serde(default)]
    target: String,
    #[serde(default)]
    thread_id: String,
    #[serde(default)]
    source: String,
    #[serde(default)]
    message: String,
    #[serde(default)]
    tracer_id: Option<u64>,
    #[serde(default)]
    elapsed_ms: Option<u64>,
}

/// Attempt to parse a single line as a JSON log event.
/// Returns `None` if the line is empty or cannot be parsed as valid JSON.
pub fn parse_line(line: &str, file_name: &str) -> Option<LogEvent> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return None;
    }

    let parsed: JsonLogLine = serde_json::from_str(trimmed).ok()?;

    let level = parse_level(&parsed.level)?;

    Some(LogEvent {
        timestamp: parsed.timestamp,
        level,
        target: parsed.target,
        thread_id: parsed.thread_id,
        source_name: if parsed.source.is_empty() {
            extract_source_name(file_name)
        } else {
            parsed.source
        },
        message: parsed.message,
        tracer_id: parsed.tracer_id,
        elapsed_ms: parsed.elapsed_ms,
        raw_line: trimmed.to_string(),
    })
}

fn parse_level(s: &str) -> Option<LogLevel> {
    match s.to_uppercase().as_str() {
        "TRACE" => Some(LogLevel::Trace),
        "DEBUG" => Some(LogLevel::Debug),
        "INFO" => Some(LogLevel::Info),
        "WARN" | "WARNING" => Some(LogLevel::Warn),
        "ERROR" => Some(LogLevel::Error),
        _ => None,
    }
}

/// Extract source name from file name.
/// "jet.2026-04-09.log" -> "jet"
fn extract_source_name(file_name: &str) -> String {
    file_name
        .split('.')
        .next()
        .unwrap_or("unknown")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_json_line() {
        let line = r#"{"timestamp":"2026-04-09T10:19:28.725399Z","level":"INFO","target":"main","thread_id":"01","source":"jet","message":"computation succeeded","tracer_id":123456,"elapsed_ms":200}"#;
        let evt = parse_line(line, "jet.2026-04-09.log").unwrap();
        assert_eq!(evt.level, LogLevel::Info);
        assert_eq!(evt.source_name, "jet");
        assert_eq!(evt.tracer_id, Some(123456));
        assert_eq!(evt.elapsed_ms, Some(200));
        assert_eq!(evt.message, "computation succeeded");
    }

    #[test]
    fn test_parse_line_with_missing_optional_fields() {
        let line = r#"{"timestamp":"2026-04-09T10:19:28Z","level":"ERROR","message":"something failed"}"#;
        let evt = parse_line(line, "kdb.2026-04-09.log").unwrap();
        assert_eq!(evt.level, LogLevel::Error);
        assert_eq!(evt.source_name, "kdb");
        assert_eq!(evt.tracer_id, None);
        assert_eq!(evt.elapsed_ms, None);
    }

    #[test]
    fn test_parse_empty_line() {
        assert!(parse_line("", "test.log").is_none());
        assert!(parse_line("   ", "test.log").is_none());
    }

    #[test]
    fn test_parse_invalid_json() {
        assert!(parse_line("not json at all", "test.log").is_none());
    }

    #[test]
    fn test_parse_unknown_level() {
        let line = r#"{"timestamp":"2026-04-09T10:19:28Z","level":"FATAL","message":"oops"}"#;
        assert!(parse_line(line, "test.log").is_none());
    }

    #[test]
    fn test_extract_source_name() {
        assert_eq!(extract_source_name("jet.2026-04-09.log"), "jet");
        assert_eq!(extract_source_name("kdb.2026-04-09.log"), "kdb");
        assert_eq!(extract_source_name("weird"), "weird");
    }
}
