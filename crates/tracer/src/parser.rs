/// Dual-format log line parser.
///
/// Parses either JSON-structured log lines (JSONL format) or plaintext
/// space-delimited log lines. JSON is tried first as the fast path; if that
/// fails the plaintext parser is used as a fallback.
///
/// Plaintext format:
/// `<timestamp> <level> <thread_id> <source> <message...> [key=value ...]`

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

/// Attempt to parse a single log line.
///
/// Tries JSON first, then falls back to the plaintext format parser.
/// Returns `None` if the line is empty or cannot be parsed by either method.
pub fn parse_line(line: &str, file_name: &str) -> Option<LogEvent> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return None;
    }

    // Fast path: try JSON first.
    if let Some(evt) = parse_json_line(trimmed, file_name) {
        return Some(evt);
    }

    // Fallback: plaintext space-delimited format.
    parse_plaintext_line(trimmed, file_name)
}

fn parse_json_line(trimmed: &str, file_name: &str) -> Option<LogEvent> {
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

/// Parse a plaintext space-delimited log line.
///
/// Expected format:
/// `2026-04-09T10:19:28.725399Z INFO main01 jet feed succeeded type=a,key=123,tracer_id=123456 elapsed_ms=200`
fn parse_plaintext_line(trimmed: &str, _file_name: &str) -> Option<LogEvent> {
    let parts: Vec<&str> = trimmed.splitn(5, ' ').collect();
    if parts.len() < 5 {
        return None;
    }

    let timestamp = parts[0].to_string();
    let level = parse_level(parts[1])?;
    let thread_id = parts[2].to_string();
    let source = parts[3].to_string();
    let message_part = parts[4];

    let (message, tracer_id, elapsed_ms) = extract_message_and_kv(message_part);

    Some(LogEvent {
        timestamp,
        level,
        target: String::new(),
        thread_id,
        source_name: source,
        message,
        tracer_id,
        elapsed_ms,
        raw_line: trimmed.to_string(),
    })
}

/// Extract the display message, tracer_id, and elapsed_ms from the trailing
/// key=value portion of a plaintext log line.
///
/// Scans for `tracer_id=<digits>` and `elapsed_ms=<digits>` anywhere in the
/// text. Matched k/v tokens are removed from the returned message.
fn extract_message_and_kv(text: &str) -> (String, Option<u64>, Option<u64>) {
    let mut tracer_id: Option<u64> = None;
    let mut elapsed_ms: Option<u64> = None;

    // Collect token ranges to remove so we can build the cleaned message.
    let mut remove_ranges: Vec<(usize, usize)> = Vec::new();

    for re in [
        regex::Regex::new(r"\btracer_id=(\d+)").unwrap(),
        regex::Regex::new(r"\belapsed_ms=(\d+)").unwrap(),
    ]
    .iter()
    {
        for cap in re.captures_iter(text) {
            let m = cap.get(0).unwrap();
            let value: u64 = cap.get(1).unwrap().as_str().parse().unwrap();

            if re.as_str().contains("tracer_id") {
                tracer_id = Some(value);
            } else {
                elapsed_ms = Some(value);
            }

            // Include any leading comma or whitespace so we don't leave dangling punctuation.
            let mut start = m.start();
            if start > 0 {
                let prev = text.as_bytes()[start - 1];
                if prev == b',' || prev == b' ' {
                    start -= 1;
                }
            }
            remove_ranges.push((start, m.end()));
        }
    }

    if remove_ranges.is_empty() {
        return (text.to_string(), tracer_id, elapsed_ms);
    }

    // Build the cleaned message by excluding matched ranges.
    remove_ranges.sort_by_key(|r| r.0);
    let mut result = String::with_capacity(text.len());
    let mut cursor = 0;
    for (start, end) in &remove_ranges {
        if *start > cursor {
            result.push_str(&text[cursor..*start]);
        }
        cursor = *end;
    }
    if cursor < text.len() {
        result.push_str(&text[cursor..]);
    }

    (result.trim().to_string(), tracer_id, elapsed_ms)
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

    // --- JSON tests (existing behaviour) ---

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

    // --- Plaintext tests (new behaviour) ---

    #[test]
    fn test_parse_plaintext_jet_info() {
        let line = "2026-04-09T10:19:28.725399Z INFO main01 jet feed succeeded type=a,key=123,tracer_id=123456 elapsed_ms=200";
        let evt = parse_line(line, "jet.2026-04-09.log").unwrap();
        assert_eq!(evt.timestamp, "2026-04-09T10:19:28.725399Z");
        assert_eq!(evt.level, LogLevel::Info);
        assert_eq!(evt.thread_id, "main01");
        assert_eq!(evt.source_name, "jet");
        assert_eq!(evt.tracer_id, Some(123456));
        assert_eq!(evt.elapsed_ms, Some(200));
        assert_eq!(evt.message, "feed succeeded type=a,key=123");
    }

    #[test]
    fn test_parse_plaintext_jet_error() {
        let line = "2026-04-09T10:19:28.725399Z ERROR main02 jet feed succeeded type=b,key=345,tracer_id=123456 elapsed_ms=200";
        let evt = parse_line(line, "jet.2026-04-09.log").unwrap();
        assert_eq!(evt.level, LogLevel::Error);
        assert_eq!(evt.thread_id, "main02");
        assert_eq!(evt.tracer_id, Some(123456));
        assert_eq!(evt.message, "feed succeeded type=b,key=345");
    }

    #[test]
    fn test_parse_plaintext_kdb_info() {
        let line = "2026-04-09T10:19:28.725399Z INFO main01 kdb feed succeeded type=a,key=123,tracer_id=123456 elapsed_ms=200";
        let evt = parse_line(line, "kdb.2026-04-09.log").unwrap();
        assert_eq!(evt.level, LogLevel::Info);
        assert_eq!(evt.source_name, "kdb");
        assert_eq!(evt.tracer_id, Some(123456));
    }

    #[test]
    fn test_parse_plaintext_kdb_error() {
        let line = "2026-04-09T10:19:28.725399Z ERROR main02 kdb feed succeeded type=b,key=345,tracer_id=123456 elapsed_ms=200";
        let evt = parse_line(line, "kdb.2026-04-09.log").unwrap();
        assert_eq!(evt.level, LogLevel::Error);
        assert_eq!(evt.source_name, "kdb");
    }

    #[test]
    fn test_parse_plaintext_no_kv() {
        let line = "2026-04-09T10:00:00.000000Z WARN main01 jet something happened";
        let evt = parse_line(line, "jet.2026-04-09.log").unwrap();
        assert_eq!(evt.level, LogLevel::Warn);
        assert_eq!(evt.message, "something happened");
        assert_eq!(evt.tracer_id, None);
        assert_eq!(evt.elapsed_ms, None);
    }

    #[test]
    fn test_parse_plaintext_only_tracer_id() {
        let line = "2026-04-09T10:00:00.000000Z INFO main01 kdb processing tracer_id=999";
        let evt = parse_line(line, "kdb.2026-04-09.log").unwrap();
        assert_eq!(evt.tracer_id, Some(999));
        assert_eq!(evt.elapsed_ms, None);
        assert_eq!(evt.message, "processing");
    }

    // --- Shared edge-case tests ---

    #[test]
    fn test_parse_empty_line() {
        assert!(parse_line("", "test.log").is_none());
        assert!(parse_line("   ", "test.log").is_none());
    }

    #[test]
    fn test_parse_invalid_json_falls_through_to_plaintext() {
        // This is not valid JSON and also not a valid plaintext line (< 5 fields).
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
