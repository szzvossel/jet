# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

All `cargo tauri` commands must be run from the **project root** (`/Users/vossel/workspace/jet`), not from `src-tauri/`. The `tauri.conf.json` uses relative paths (`cd ../frontend`) that require this.

```bash
# Development (hot reload frontend, debug Rust)
cargo tauri dev

# Production build (optimized Rust, bundled frontend → .app + .dmg on macOS, .exe + .msi on Windows)
cargo tauri build

# Windows cross-compile from non-Windows host (requires cargo-xwin)
cargo tauri build --target x86_64-pc-windows-msvc

# Run Rust tests (all crates in workspace)
cargo test

# Run tests for a specific crate
cargo test -p jet-core
cargo test -p jet-server

# Run a single Rust test
cargo test -p jet-core test_hull_example_call

# Run Rust tests with output
cargo test -- --nocapture

# Check Rust compilation (fast, no codegen)
cargo check

# Format Rust code
cargo fmt

# Lint Rust code
cargo clippy

# TypeScript type-check
cd frontend && npx tsc --noEmit

# Build frontend only
cd frontend && npm run build

# Run the HTTP API server only (no desktop app)
cargo run -p jet-server

# Frontend only (pointing at remote server)
cd frontend && npm run dev

# Both server + frontend (dev mode)
cargo run -p jet-server & cd frontend && npm run dev
```

## Architecture

**Cargo Workspace** with 3 crates:

```
jet/
├── crates/core/       ← jet-core: shared business logic (pricing, analytics, parsing)
├── src-tauri/         ← Tauri desktop app (thin IPC shell over jet-core)
├── src-server/        ← Axum HTTP API server (thin REST shell over jet-core)
└── frontend/          ← React/TypeScript SPA (unchanged)
```

### Shared Core Library (`crates/core/`)

All pricing, analytics, and parsing logic lives here. Both `src-tauri` and `src-server` depend on `jet-core` and expose its functionality via their respective transports (IPC vs HTTP).

- `lib.rs` — Re-exports all modules + shared types (`PricePoint`, `GreeksCurveResult`, etc.)
- `math/distributions.rs` — Normal CDF/PDF wrappers over `statrs`
- `pricing/black_scholes.rs` — BSM pricing engine: analytical price + all 5 Greeks
- `pricing/types.rs` — Core domain types: `OptionType`, `OptionContract`, `MarketData`, `PricingResult`
- `analytics/` — Vol surfaces, yield curves, dividends, correlation, P&L attribution
- `parsing/quote_parser.rs` — Option strategy parser (multi-leg spreads)
- `data/` — Market data structures

### Tauri Desktop App (`src-tauri/`)

Thin IPC shell that imports `jet_core` and exposes 12 Tauri commands:

- `lib.rs` — Tauri command handlers (`price_option`, `price_curve`, `greeks_curve`, etc.)
- `main.rs` — Entry point, calls `jet_lib::run()`

### HTTP API Server (`src-server/`)

Axum server exposing the same 12 operations as REST endpoints:

- `main.rs` — Router with 12 routes on port 3000, CORS enabled

**REST API:**

| Method | Path | Maps to |
|--------|------|---------|
| POST | `/api/price-option` | `pricing::black_scholes::price()` |
| POST | `/api/price-curve` | `compute_price_curve()` |
| POST | `/api/greeks-curve` | `compute_greeks_curve()` |
| GET | `/api/vol-surface` | `analytics::sample_vol_surface()` |
| GET | `/api/curves` | `analytics::sample_curves()` |
| GET | `/api/dividend-curve` | `analytics::sample_dividend_curve()` |
| GET | `/api/correlation-matrix` | `analytics::sample_correlation_matrix()` |
| GET | `/api/correlation-entries` | `analytics::sample_correlation_entries()` |
| GET | `/api/risk-summary` | `sample_risk_summary()` |
| GET | `/api/pnl-attribution` | `analytics::sample_pnl_attribution()` |
| POST | `/api/parse-strategy` | `parsing::quote_parser::parse_strategy()` |
| POST | `/api/price-strategy` | `price_strategy()` |

### React Frontend (`frontend/src/`)

- `App.tsx` — Main component, state management, layout grid
- `hooks/usePricing.ts` — API adapter layer (routes to local or remote backend)
- `hooks/localBackend.ts` — Tauri `invoke()` wrapper
- `hooks/remoteBackend.ts` — `fetch()` wrapper for HTTP API
- `types/index.ts` — TypeScript interfaces mirroring Rust types
- `components/strategy/StrategyTab.tsx` — Backend selector UI (Local/Remote toggle)

## Frontend Backend Selector

The Strategy tab includes a backend toggle:

- **Local** — Uses Tauri IPC (`invoke()`) to communicate with the embedded Rust backend
- **Remote** — Uses HTTP `fetch()` to communicate with the Axum server

The selection persists to `localStorage` and applies to all pricing calls.

## Tauri IPC Commands

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `price_option` | OptionContract, MarketData | PricingResult | Price + all 5 analytical Greeks |
| `price_curve` | OptionContract, MarketData, spot_range: [f64; 2], num_points: usize | Vec<{spot, price}> | BSM value across spot range |
| `greeks_curve` | GreeksCurveRequest (contract, market, spot_range, num_points) | GreeksCurveResult (spots, prices, deltas, gammas, vegas, thetas) | All Greeks across spot range |

## Key Dependencies

### Rust (workspace)
- `tauri` v2, `tauri-plugin-shell` v2, `tauri-build` v2 — Desktop framework
- `axum` v0.8, `tokio` (full), `tower-http` (cors) — HTTP server
- `statrs` — Normal distribution functions
- `serde` + `serde_json` — JSON serialization
- `chrono` — Date/time for expiry parsing
- `thiserror` — Domain error types

### Frontend (`frontend/package.json`)
- `@tauri-apps/api` v2, `@tauri-apps/plugin-shell` v2 — Tauri JS API
- `react` + `react-dom` v18 — UI framework
- `typescript` v5 — Type checking
- `vite` v5 — Build tool and dev server
- `tailwindcss` v3 — Utility CSS

## CI/CD (GitHub Actions)

The project uses a GitHub Actions workflow (`.github/workflows/build.yml`) that builds native artifacts for Windows and macOS in parallel.

### Windows Build
- Runner: `windows-latest`
- Target: `x86_64-pc-windows-msvc`
- Uses `cargo-xwin` for cross-compilation toolchain
- Frontend is built separately via `working-directory: frontend` + `npm install && npm run build`
- Environment variable `TAURI_BROWSER=none` is set to prevent browser-dependent build steps from failing on headless runners
- Artifacts: `jet.exe`, `.msi` installer, `.exe` (NSIS) installer

### macOS Build
- Runner: `macos-latest`
- Native target (no cross-compilation)
- Same frontend build pattern: separate `npm install` and `npm run build` steps
- Artifacts: `JET.app`, `.dmg` installer

### Notes
- The workflow uses `npm install` (not `npm ci`) to avoid lockfile synchronization issues across platforms
- Frontend is built **before** `cargo tauri build` runs. The `beforeBuildCommand` in `tauri.conf.json` also runs `npm run build`, but since `dist/` already exists it completes quickly
- Rust compilation is cached via `swatinem/rust-cache@v2`

## Conventions

- **Error handling:** `Result<T, String>` for Tauri commands. `Result<T, E>` with `thiserror` for internal code. No unwrap in library code.
- **Numerics:** `f64` throughout. Rates are annualized decimal (e.g., 0.08 for 8%). Time is year-fraction (e.g., 0.25 for 3 months).
- **Type sync:** Frontend types in `frontend/src/types/index.ts` must mirror Rust types in `crates/core/src/pricing/types.rs`. `OptionType` serializes as string `"Call"` | `"Put"`.
- **Testing:** Inline `#[cfg(test)] mod tests` in each Rust file. Tests validate BSM against Hull textbook examples, put-call parity, delta bounds, and numerical vs analytical Greeks agreement.
- **Chart colors:** BSM value `#818cf8`, payoff `#64748b`, delta `#3b82f6`, gamma `#a855f7`, vega `#eab308`, theta `#f97316`.
