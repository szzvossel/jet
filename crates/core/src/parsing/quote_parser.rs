use chrono::{Datelike, NaiveDate};

use super::types::{Direction, ExerciseStyle, OptionKind, ParsedLeg, StrategyParseResult};

// ---------------------------------------------------------------------------
// Hardcoded demo spot prices
// ---------------------------------------------------------------------------

pub fn spot_for_symbol(sym: &str) -> Result<f64, String> {
    match sym.to_uppercase().as_str() {
        "SPX" => Ok(5500.0),
        "SPY" => Ok(500.0),
        "QQQ" => Ok(400.0),
        "IWM" => Ok(200.0),
        "DIA" => Ok(400.0),
        "EEM" => Ok(40.0),
        "SX5E" => Ok(5000.0),
        other => Err(format!("Unknown symbol: {}", other)),
    }
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const MONTH_ABBREVS: &[&str] = &[
    "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
];

/// Parse a `monYY` string (e.g. `apr26`) → (month 1-12, two-digit year).
fn parse_mon_yy(s: &str) -> Option<(u32, u32)> {
    if s.len() != 5 {
        return None;
    }
    let mon_part = &s[0..3].to_lowercase();
    let yr_part = &s[3..5];
    let month = MONTH_ABBREVS.iter().position(|m| *m == mon_part)? as u32 + 1;
    let year: u32 = yr_part.parse().ok()?;
    Some((month, year))
}

/// Parse an ISO date `YYYY-MM-DD`.
fn parse_iso_date(s: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").ok()
}

/// Parse a `DDMonYY` date (e.g. `18Apr26`).
fn parse_dd_mon_yy(s: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(s, "%d%b%y").ok()
}

/// Compute the 3rd Friday of a given month/year.
fn third_friday(year: u32, month: u32) -> NaiveDate {
    let first = NaiveDate::from_ymd_opt(year as i32, month, 1).unwrap();
    let first_friday_dow = first.weekday().num_days_from_monday();
    // days until first Friday (Friday = 4 in num_days_from_monday)
    let days_to_friday = (4 + 7 - first_friday_dow) % 7;
    let first_friday = first + chrono::Duration::days(days_to_friday as i64);
    // 3rd Friday = first Friday + 14 days
    first_friday + chrono::Duration::days(14)
}

/// Resolve an expiry token to a NaiveDate.
fn resolve_expiry(token: &str) -> Result<NaiveDate, String> {
    // Try monYY first
    if let Some((month, yr2)) = parse_mon_yy(token) {
        let year = 2000 + yr2;
        let date = third_friday(year, month);
        return Ok(date);
    }
    // Try ISO YYYY-MM-DD
    if let Some(d) = parse_iso_date(token) {
        return Ok(d);
    }
    // Try DDMonYY
    if let Some(d) = parse_dd_mon_yy(token) {
        return Ok(d);
    }
    Err(format!("Invalid expiry: '{}'", token))
}

// ---------------------------------------------------------------------------
// Token classification
// -------------------------------------------------------------------

/// Keywords that should NOT be treated as symbols.
const KEYWORDS: &[&str] = &[
    "call", "put", "c", "p", "a", "e", "american", "european",
];

fn is_keyword(s: &str) -> bool {
    KEYWORDS.contains(&s.to_lowercase().as_str())
}

fn parse_option_type(s: &str) -> Option<OptionKind> {
    match s.to_lowercase().as_str() {
        "call" | "c" => Some(OptionKind::Call),
        "put" | "p" => Some(OptionKind::Put),
        _ => None,
    }
}

fn parse_style(s: &str) -> Option<ExerciseStyle> {
    match s.to_lowercase().as_str() {
        "a" | "american" => Some(ExerciseStyle::American),
        "e" | "european" => Some(ExerciseStyle::European),
        _ => None,
    }
}

// ---------------------------------------------------------------------------
// Single-leg parser
// ---------------------------------------------------------------------------

/// Parse a single leg string (no `/` separators) into a `ParsedLeg`.
/// `inherited_symbol` and `inherited_expiry` come from the first leg in multi-leg strategies.
fn parse_leg(
    tokens: &[&str],
    inherited_symbol: Option<&str>,
    inherited_expiry: Option<NaiveDate>,
) -> Result<ParsedLeg, String> {
    if tokens.is_empty() {
        return Err("Empty leg".to_string());
    }

    let mut quantity: i32 = 1;
    let mut direction = Direction::Long;
    let mut symbol: Option<String> = None;
    let mut expiry: Option<NaiveDate> = None;
    let mut strike_pct: Option<f64> = None;
    let mut strike_abs: Option<f64> = None;
    let mut option_type: Option<OptionKind> = None;
    let mut style: Option<ExerciseStyle> = None;

    let mut i = 0;
    while i < tokens.len() {
        let tok = tokens[i];

        // 1. Quantity: ^[+-]\d+$ (can appear at any position before other numeric fields)
        if quantity == 1 && direction == Direction::Long
            && tok.starts_with(|c: char| c == '+' || c == '-') && tok.len() > 1
        {
            if let Ok(q) = tok.parse::<i32>() {
                quantity = q.abs();
                direction = if q > 0 { Direction::Long } else { Direction::Short };
                i += 1;
                continue;
            }
        }

        // 2. Expiry (must come before we identify symbol if it looks like monYY)
        if expiry.is_none() && !tok.contains('%') {
            if let Ok(d) = resolve_expiry(tok) {
                expiry = Some(d);
                i += 1;
                continue;
            }
        }

        // 3. Option type (standalone)
        if option_type.is_none() {
            if let Some(ot) = parse_option_type(tok) {
                option_type = Some(ot);
                i += 1;
                continue;
            }
        }

        // 4. Exercise style
        if style.is_none() {
            if let Some(s) = parse_style(tok) {
                style = Some(s);
                i += 1;
                continue;
            }
        }

        // 5. Strike with optional attached C/P (e.g. "110%C", "105P")
        if strike_pct.is_none() && strike_abs.is_none() {
            // Percentage strike with optional type suffix: "110%C", "100%P", "110%"
            if tok.contains('%') {
                // Split on '%' to get number and optional suffix
                let parts: Vec<&str> = tok.splitn(2, '%').collect();
                let num_part = parts[0];
                let suffix = parts.get(1).map(|s| *s).unwrap_or("");
                if let Ok(pct) = num_part.parse::<f64>() {
                    strike_pct = Some(pct);
                    // Check for attached type in suffix
                    if !suffix.is_empty() {
                        if let Some(ot) = parse_option_type(suffix) {
                            option_type = Some(ot);
                        }
                    }
                    i += 1;
                    continue;
                }
            }

            // Absolute strike with optional attached C/P: "5500C", "100P"
            if let Some(rest) = tok.strip_suffix(|c: char| c == 'c' || c == 'C' || c == 'p' || c == 'P') {
                if let Ok(abs) = rest.parse::<f64>() {
                    strike_abs = Some(abs);
                    let ch = tok.chars().last().unwrap();
                    option_type = parse_option_type(&ch.to_string());
                    i += 1;
                    continue;
                }
            }

            // Plain absolute strike (bare number after expiry is known)
            if expiry.is_some() {
                if let Ok(abs) = tok.parse::<f64>() {
                    strike_abs = Some(abs);
                    i += 1;
                    continue;
                }
            }
        }

        // 6. Symbol: first alpha token not a keyword
        if symbol.is_none() && !is_keyword(tok) && tok.chars().all(|c| c.is_alphabetic()) {
            symbol = Some(tok.to_uppercase());
            i += 1;
            continue;
        }

        i += 1;
    }

    // Validate required fields, using inherited values as fallback for multi-leg
    let symbol = match symbol {
        Some(s) => s,
        None => inherited_symbol.map(|s| s.to_string()).ok_or("Missing symbol".to_string())?,
    };
    let expiry = match expiry {
        Some(d) => d,
        None => inherited_expiry.ok_or("Missing expiry".to_string())?,
    };
    let style = style.unwrap_or(ExerciseStyle::European);
    let option_type = option_type.ok_or("Missing option type (Call/Put)")?;

    // Check expiry is not in the past
    let today = chrono::Local::now().date_naive();
    if expiry < today {
        return Err(format!("Expiry {} is in the past", expiry));
    }

    // Resolve strike
    let strike = if let Some(pct) = strike_pct {
        let spot = spot_for_symbol(&symbol)?;
        spot * pct / 100.0
    } else if let Some(abs) = strike_abs {
        abs
    } else {
        return Err("Missing strike".to_string());
    };

    // Compute strike_pct if only absolute was given
    let strike_pct_val = strike_pct.unwrap_or_else(|| {
        let spot = spot_for_symbol(&symbol).unwrap_or(100.0);
        (strike / spot) * 100.0
    });

    Ok(ParsedLeg {
        symbol,
        expiry: expiry.format("%Y-%m-%d").to_string(),
        strike,
        strike_pct: (strike_pct_val * 100.0).round() / 100.0,
        option_type,
        style,
        quantity,
        direction,
    })
}

// ---------------------------------------------------------------------------
// Strategy name inference
// ---------------------------------------------------------------------------

fn infer_strategy_name(legs: &[ParsedLeg]) -> String {
    match legs.len() {
        0 => "Empty Strategy".to_string(),
        1 => "Single Option".to_string(),
        2 => {
            let a = &legs[0];
            let b = &legs[1];
            let same_type = a.option_type == b.option_type;
            let same_strike = (a.strike - b.strike).abs() < 0.01;
            let long_short = a.direction != b.direction;

            if same_type && !same_strike && long_short {
                // Call/Put spread, bull if long has lower strike for calls, higher for puts
                // Bull = long leg has the lower strike (for both calls and puts)
                let long_strike = if a.direction == Direction::Long { a.strike } else { b.strike };
                let short_strike = if a.direction == Direction::Short { a.strike } else { b.strike };
                let bull = long_strike < short_strike;
                let kind = match a.option_type {
                    OptionKind::Call => "Call",
                    OptionKind::Put => "Put",
                };
                if bull {
                    format!("Bull {} Spread", kind)
                } else {
                    format!("Bear {} Spread", kind)
                }
            } else if same_type && same_strike && long_short {
                match a.option_type {
                    OptionKind::Call => "Call Calendar Spread".to_string(),
                    OptionKind::Put => "Put Calendar Spread".to_string(),
                }
            } else if !same_type && same_strike {
                "Straddle".to_string()
            } else if !same_type && !same_strike {
                "Strangle".to_string()
            } else {
                "2-Leg Strategy".to_string()
            }
        }
        4 => {
            // Check for iron condor: 2 puts (OTM, different strikes) + 2 calls (OTM, different strikes)
            let puts: Vec<&ParsedLeg> = legs.iter().filter(|l| l.option_type == OptionKind::Put).collect();
            let calls: Vec<&ParsedLeg> = legs.iter().filter(|l| l.option_type == OptionKind::Call).collect();
            if puts.len() == 2 && calls.len() == 2 {
                let longs = legs.iter().filter(|l| l.direction == Direction::Long).count();
                let shorts = legs.iter().filter(|l| l.direction == Direction::Short).count();
                if longs == 2 && shorts == 2 {
                    return "Iron Condor".to_string();
                }
            }
            "4-Leg Strategy".to_string()
        }
        n => format!("{}-Leg Strategy", n),
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Parse a quote string into a structured strategy result.
///
/// Supports single options and multi-leg strategies separated by `/`.
pub fn parse_strategy(input: &str) -> Result<StrategyParseResult, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".to_string());
    }

    // Split into legs by `/`
    let leg_strings: Vec<&str> = trimmed.split('/').map(|s| s.trim()).collect();

    let mut legs = Vec::with_capacity(leg_strings.len());
    let mut first_symbol: Option<String> = None;
    let mut first_expiry: Option<NaiveDate> = None;

    for leg_str in &leg_strings {
        if leg_str.is_empty() {
            continue;
        }
        let tokens: Vec<&str> = leg_str.split_whitespace().collect();
        let leg = parse_leg(
            &tokens,
            first_symbol.as_deref(),
            first_expiry,
        )?;
        if first_symbol.is_none() {
            first_symbol = Some(leg.symbol.clone());
        }
        if first_expiry.is_none() {
            first_expiry = NaiveDate::parse_from_str(&leg.expiry, "%Y-%m-%d").ok();
        }
        legs.push(leg);
    }

    if legs.is_empty() {
        return Err("No legs parsed".to_string());
    }

    let strategy_name = infer_strategy_name(&legs);

    Ok(StrategyParseResult {
        strategy_name,
        legs,
    })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_format() {
        let result = parse_strategy("SPX may26 110% Call A").unwrap();
        assert_eq!(result.strategy_name, "Single Option");
        assert_eq!(result.legs.len(), 1);
        let leg = &result.legs[0];
        assert_eq!(leg.symbol, "SPX");
        assert_eq!(leg.expiry, "2026-05-15");
        assert!((leg.strike - 6050.0).abs() < 0.01);
        assert!((leg.strike_pct - 110.0).abs() < 0.01);
        assert_eq!(leg.option_type, OptionKind::Call);
        assert_eq!(leg.style, ExerciseStyle::American);
        assert_eq!(leg.quantity, 1);
        assert_eq!(leg.direction, Direction::Long);
    }

    #[test]
    fn test_absolute_strike() {
        let result = parse_strategy("SPX may26 5500 Call E").unwrap();
        let leg = &result.legs[0];
        assert!((leg.strike - 5500.0).abs() < 0.01);
        assert_eq!(leg.style, ExerciseStyle::European);
    }

    #[test]
    fn test_iso_date() {
        let result = parse_strategy("SPX 2026-05-15 110% C A").unwrap();
        let leg = &result.legs[0];
        assert_eq!(leg.expiry, "2026-05-15");
        assert_eq!(leg.option_type, OptionKind::Call);
    }

    #[test]
    fn test_dd_mon_yy_date() {
        let result = parse_strategy("SPX 15May26 110% Call A").unwrap();
        let leg = &result.legs[0];
        assert_eq!(leg.expiry, "2026-05-15");
    }

    #[test]
    fn test_shorthand_put() {
        let result = parse_strategy("SPY jun26 105P A").unwrap();
        let leg = &result.legs[0];
        assert_eq!(leg.symbol, "SPY");
        assert_eq!(leg.option_type, OptionKind::Put);
        // 105 absolute strike for SPY
        assert!((leg.strike - 105.0).abs() < 0.01);
        assert_eq!(leg.style, ExerciseStyle::American);
    }

    #[test]
    fn test_multi_leg_strangle() {
        let result = parse_strategy("SPX may26 +1 110%C A / -1 100%P A").unwrap();
        assert_eq!(result.legs.len(), 2);
        assert_eq!(result.strategy_name, "Strangle");

        let call_leg = &result.legs[0];
        assert_eq!(call_leg.option_type, OptionKind::Call);
        assert_eq!(call_leg.direction, Direction::Long);
        assert_eq!(call_leg.quantity, 1);
        assert!((call_leg.strike_pct - 110.0).abs() < 0.01);

        let put_leg = &result.legs[1];
        assert_eq!(put_leg.option_type, OptionKind::Put);
        assert_eq!(put_leg.direction, Direction::Short);
        assert_eq!(put_leg.quantity, 1);
        assert!((put_leg.strike_pct - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_straddle() {
        let result = parse_strategy("SPX may26 +1 110%C A / -1 110%P A").unwrap();
        assert_eq!(result.strategy_name, "Straddle");
    }

    #[test]
    fn test_bull_call_spread() {
        let result = parse_strategy("SPX may26 +1 100%C A / -1 110%C A").unwrap();
        assert_eq!(result.strategy_name, "Bull Call Spread");
    }

    #[test]
    fn test_bear_put_spread() {
        let result = parse_strategy("SPX may26 +1 110%P A / -1 100%P A").unwrap();
        assert_eq!(result.strategy_name, "Bear Put Spread");
    }

    #[test]
    fn test_iron_condor() {
        let result = parse_strategy(
            "SPX may26 -1 105%C A / +1 110%C A / -1 95%P A / +1 90%P A"
        ).unwrap();
        assert_eq!(result.strategy_name, "Iron Condor");
        assert_eq!(result.legs.len(), 4);
    }

    #[test]
    fn test_unknown_symbol() {
        let result = parse_strategy("AAPL may26 110% Call A");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown symbol"));
    }

    #[test]
    fn test_empty_input() {
        let result = parse_strategy("");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Empty input"));
    }

    #[test]
    fn test_missing_strike() {
        let result = parse_strategy("SPX may26 Call A");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Missing strike"));
    }

    #[test]
    fn test_missing_type() {
        let result = parse_strategy("SPX may26 110% A");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Missing option type"));
    }

    #[test]
    fn test_strike_pct_attached_to_type() {
        let result = parse_strategy("SPX may26 110%C A").unwrap();
        let leg = &result.legs[0];
        assert_eq!(leg.option_type, OptionKind::Call);
        assert!((leg.strike_pct - 110.0).abs() < 0.01);
    }

    #[test]
    fn test_default_style_european() {
        let result = parse_strategy("SPX may26 110%C").unwrap();
        assert_eq!(result.legs[0].style, ExerciseStyle::European);
    }

    #[test]
    fn test_third_friday_calc() {
        // April 2026: 1st is Wednesday, so first Friday is Apr 3, third Friday is Apr 17
        let d = third_friday(2026, 4);
        assert_eq!(d.day(), 17);
        assert_eq!(d.month(), 4);

        // March 2026: 1st is Sunday, first Friday is Mar 6, third Friday is Mar 20
        let d = third_friday(2026, 3);
        assert_eq!(d.day(), 20);
    }
}
