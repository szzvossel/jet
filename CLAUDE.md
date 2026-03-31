# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

All `cargo tauri` commands must be run from the **project root** (`/Users/vossel/workspace/jet`), not from `src-tauri/`. The `tauri.conf.json` uses relative paths (`cd ../frontend`) that require this.

```bash
# Development (hot reload frontend, debug Rust)
cargo tauri dev

# Production build (optimized Rust, bundled frontend → .app + .dmg)
cargo tauri build

# Run Rust tests (all)
cd src-tauri && cargo test

# Run a single Rust test
cd src-tauri && cargo test test_hull_example_call

# Run Rust tests with output
cd src-tauri && cargo test -- --nocapture

# Check Rust compilation (fast, no codegen)
cd src-tauri && cargo check

# Format Rust code
cd src-tauri && cargo fmt

# Lint Rust code
cd src-tauri && cargo clippy

# TypeScript type-check
cd frontend && npx tsc --noEmit

# Build frontend only
cd frontend && npm run build
```

## Architecture

Tauri v2 desktop app: **Rust backend** for quantitative computation, **React/TypeScript frontend** for visualization. Communication via Tauri IPC (`invoke()` calls serialized as JSON).

### Rust Backend (`src-tauri/src/`)

- `lib.rs` — Tauri command handlers (`price_option`, `price_curve`, `greeks_curve`) and app setup
- `main.rs` — Entry point, calls `jet_lib::run()`
- `math/distributions.rs` — Normal CDF/PDF wrappers over `statrs`
- `pricing/black_scholes.rs` — BSM pricing engine: analytical price + all 5 Greeks (delta, gamma, vega, theta, rho), continuous dividend yield support, `price_curve()` for spot-range charting
- `pricing/greeks.rs` — Numerical Greeks via central finite differences (bump-and-revalue)
- `pricing/types.rs` — Core domain types: `OptionType`, `OptionContract`, `MarketData`, `PricingResult`
- `pricing/binomial.rs`, `pricing/monte_carlo.rs` — Stubs for future implementation
- `data/market.rs` — `MarketSnapshot` struct; `data/portfolio.rs` — Stub

### React Frontend (`frontend/src/`)

- `App.tsx` — Main component, state management, layout grid
- `hooks/usePricing.ts` — Tauri `invoke()` wrappers for IPC commands
- `types/index.ts` — TypeScript interfaces mirroring Rust types (must stay in sync with `pricing/types.rs`)
- `components/OptionInput.tsx` — Parameter sliders + call/put toggle
- `components/ResultPanel.tsx` — Formatted price and Greeks display
- `components/PayoffChart.tsx` — Canvas BSM value curve + intrinsic payoff at expiry
- `components/GreeksChart.tsx` — Canvas Greeks profile (delta, gamma, vega, theta vs spot)

## Tauri IPC Commands

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `price_option` | OptionContract, MarketData | PricingResult | Price + all 5 analytical Greeks |
| `price_curve` | OptionContract, MarketData, spot_range: [f64; 2], num_points: usize | Vec<{spot, price}> | BSM value across spot range |
| `greeks_curve` | GreeksCurveRequest (contract, market, spot_range, num_points) | GreeksCurveResult (spots, prices, deltas, gammas, vegas, thetas) | All Greeks across spot range |

## Key Dependencies

### Rust (`src-tauri/Cargo.toml`)
- `tauri` v2, `tauri-plugin-shell` v2, `tauri-build` v2 — Desktop framework
- `statrs` — Normal distribution functions
- `serde` + `serde_json` — JSON serialization for IPC
- `thiserror` — Domain error types

### Frontend (`frontend/package.json`)
- `@tauri-apps/api` v2, `@tauri-apps/plugin-shell` v2 — Tauri JS API
- `react` + `react-dom` v18 — UI framework
- `vite` v5 — Build tool and dev server
- `tailwindcss` v3 — Utility CSS
- `lightweight-charts` v4 — TradingView charting (installed but not yet integrated)
- `@tauri-apps/cli` v2 — Tauri CLI (dev dependency)

## Conventions

- **Error handling:** `Result<T, String>` for Tauri commands. `Result<T, E>` with `thiserror` for internal code. No unwrap in library code.
- **Numerics:** `f64` throughout. Rates are annualized decimal (e.g., 0.08 for 8%). Time is year-fraction (e.g., 0.25 for 3 months).
- **Type sync:** Frontend types in `frontend/src/types/index.ts` must mirror Rust types in `src-tauri/src/pricing/types.rs`. `OptionType` serializes as string `"Call"` | `"Put"`.
- **Testing:** Inline `#[cfg(test)] mod tests` in each Rust file. Tests validate BSM against Hull textbook examples, put-call parity, delta bounds, and numerical vs analytical Greeks agreement.
- **Chart colors:** BSM value `#818cf8`, payoff `#64748b`, delta `#3b82f6`, gamma `#a855f7`, vega `#eab308`, theta `#f97316`.

## MVP Scope

1. Black-Scholes pricing with all five first-order Greeks (European calls/puts, continuous dividend yield)
2. Interactive parameter input (S, K, T, r, sigma, q sliders + call/put toggle)
3. Results display (formatted price + Greeks)
4. Payoff diagram (BSM value curve + intrinsic payoff at expiry)
5. Greeks profile chart (delta, gamma, vega, theta across spot prices)

## Future Roadmap

- [ ] Binomial tree pricer for American options
- [ ] Monte Carlo engine for exotic payoffs
- [ ] Volatility surface visualization
- [ ] Strategy builder (multi-leg spreads)
- [ ] P&L heatmap (spot x time)
- [ ] Market data import (CSV/JSON)
- [ ] Portfolio-level risk aggregation
- [ ] TradingView lightweight-charts integration
- [ ] Real-time data feed integration
- [ ] Export to PDF/image
