use comfy_table::modifiers::UTF8_ROUND_CORNERS;
use comfy_table::presets::UTF8_FULL;
use comfy_table::{Attribute, Cell, Color, Table};

use crate::pricing::PricingRow;

/// Print a pricing table to stdout.
pub fn print_pricing_table(rows: &[PricingRow]) {
    if rows.is_empty() {
        return;
    }

    let mut table = Table::new();
    table
        .load_preset(UTF8_FULL)
        .apply_modifier(UTF8_ROUND_CORNERS)
        .set_header(vec![
            Cell::new("Contract").add_attribute(Attribute::Bold),
            Cell::new("Spot").add_attribute(Attribute::Bold),
            Cell::new("Price").add_attribute(Attribute::Bold),
            Cell::new("Delta").add_attribute(Attribute::Bold),
            Cell::new("Gamma").add_attribute(Attribute::Bold),
            Cell::new("Vega").add_attribute(Attribute::Bold),
            Cell::new("Theta").add_attribute(Attribute::Bold),
            Cell::new("Rho").add_attribute(Attribute::Bold),
        ]);

    for row in rows {
        let label = format!(
            "{} {:.0}{} {:.0}D",
            row.symbol,
            row.strike,
            match row.option_type {
                jet_core::pricing::types::OptionType::Call => "C",
                jet_core::pricing::types::OptionType::Put => "P",
            },
            row.time_to_expiry * 365.25,
        );

        let price_color = if row.result.price >= 0.0 {
            Color::Green
        } else {
            Color::Red
        };

        table.add_row(vec![
            Cell::new(&label),
            Cell::new(format!("{:.2}", row.spot)),
            Cell::new(format!("{:.4}", row.result.price)).fg(price_color),
            Cell::new(format!("{:.4}", row.result.delta)),
            Cell::new(format!("{:.6}", row.result.gamma)),
            Cell::new(format!("{:.4}", row.result.vega)),
            Cell::new(format!("{:.4}", row.result.theta)).fg(Color::Red),
            Cell::new(format!("{:.4}", row.result.rho)),
        ]);
    }

    println!("{table}");
    println!();
}

/// Print a Greeks update line.
pub fn print_greeks_update(symbol: &str, delta: f64, gamma: f64, vega: f64, theta: f64, rho: f64) {
    println!(
        "  [GREEKS] {:<6} Δ={:+.4}  Γ={:.6}  V={:.4}  Θ={:+.4}  ρ={:+.4}",
        symbol, delta, gamma, vega, theta, rho
    );
}

/// Print a market snapshot line.
pub fn print_market_snapshot(
    symbol: &str,
    spot: f64,
    bid: f64,
    ask: f64,
    volume: u64,
    iv: f64,
) {
    println!(
        "  [SNAP]  {:<6} spot={:.2}  bid={:.2}  ask={:.2}  vol={}  IV={:.2}%",
        symbol, spot, bid, ask, volume, iv * 100.0
    );
}

/// Print a risk alert.
pub fn print_risk_alert(message: &str, severity: &str) {
    let tag = match severity {
        "high" => "[!!! HIGH]",
        "medium" => "[!! MEDIUM]",
        _ => "[! INFO]",
    };
    println!("  {} RISK ALERT: {}", tag, message);
}

/// Print a P&L snapshot.
pub fn print_pnl_snapshot(total: f64, delta: f64, gamma: f64, vega: f64, theta: f64) {
    let color = if total >= 0.0 { "+" } else { "" };
    println!(
        "  [P&L]   total={}{}  Δ={}  Γ={}  V={}  Θ={}",
        color,
        format!("{:.2}", total),
        format!("{:+.2}", delta),
        format!("{:+.2}", gamma),
        format!("{:+.2}", vega),
        format!("{:+.2}", theta),
    );
}
