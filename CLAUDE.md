# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

All Tauri commands use `npm run tauri` from the **`frontend/`** directory. The `tauri.conf.json` uses relative paths (`cd ../frontend`) that require running from there.

add {"beforeDevCommand": "cd ../frontend && npm run dev","devUrl": "http://localhost:1420"} in tauri.config.json for debugging.

```bash
# Development (hot reload frontend, debug Rust)
cd frontend && npm run tauri dev

# Production build (optimized Rust, bundled frontend → .app + .dmg on macOS, .exe + .msi on Windows)
cd frontend && npm run tauri build

# Windows cross-compile from non-Windows host (requires cargo-xwin)
cd frontend && npm run tauri build -- --target x86_64-pc-windows-msvc

# Run Rust tests (all crates in workspace)
cargo test

# Run tests for a specific crate
cargo test -p jet-core
cargo test -p jet-server
cargo test -p jet-bus
cargo test -p jet-client

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

# Windows: after npm install, also run this to fix missing Rollup native binding
cd frontend && npm install @rollup/rollup-win32-x64-msvc --save-optional

# Run the HTTP API server only (no desktop app)
cargo run -p jet-server

# Frontend only (pointing at remote server)
cd frontend && npm run dev

# Both server + frontend (dev mode)
cargo run -p jet-server & cd frontend && npm run dev

# Run the pub/sub WebSocket bus (standalone, port 3001)
cargo run -p jet-bus

# All services together (server + bus + frontend)
cargo run -p jet-server & cargo run -p jet-bus & cd frontend && npm run dev

# Run the Rust CLI client (connects to jet-bus, live pricing)
cargo run -p jet-bus &
cargo run -p jet-client -- --symbols SPX,QQQ --rate 0.05 --vol 0.20
```

## Architecture

**Cargo Workspace** with 5 crates:

```
jet/
├── crates/core/       ← jet-core: shared business logic (pricing, analytics, parsing)
├── crates/bus/        ← jet-bus: standalone WebSocket pub/sub service (port 3001)
├── crates/client/     ← jet-client: Rust CLI that subscribes to jet-bus, live pricing
├── src-tauri/         ← Tauri desktop app (thin IPC shell over jet-core)
├── src-server/        ← Axum HTTP API server (thin REST shell over jet-core)
└── frontend/          ← React/TypeScript SPA (unchanged)
```

### Shared Core Library (`crates/core/`)

All pricing, analytics, and parsing logic lives here. Both `src-tauri` and `src-server` depend on `jet-core` and expose its functionality via their respective transports (IPC vs HTTP).

- `lib.rs` — Re-exports all modules + shared types (`PricePoint`, `GreeksCurveResult`, etc.)
- `math/distributions.rs` — Normal CDF/PDF wrappers over `statrs`
- `pricing/black_scholes.rs` — BSM pricing engine: analytical price + all 5 Greeks
- `pricing/greeks.rs` — Numerical Greeks via central finite-difference bump-and-revalue
- `pricing/types.rs` — Core domain types: `OptionType`, `OptionContract`, `MarketData`, `PricingResult`
- `pricing/binomial.rs`, `pricing/monte_carlo.rs` — Stubs for future implementation
- `analytics/` — Vol surfaces, yield curves, dividends, correlation, P&L attribution
- `parsing/quote_parser.rs` — Option strategy parser (multi-leg spreads)
- `parsing/types.rs` — Strategy types: `ParsedLeg`, `PricedLeg`, `StrategyParseResult`, `PricedStrategyResult`, `StrategyGreeks`
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

Frontend dev server runs on **port 1420**. The Vite config proxies `/api` requests to `http://localhost:3000` (the Axum server) and `/ws` requests to `ws://localhost:3001` (the jet-bus WebSocket server). Tailwind uses a custom `brand` color palette based on indigo.

### WebSocket Pub/Sub Service (`crates/bus/`)

Standalone binary (`jet-bus`) that distributes simulated equity market events over WebSocket. Independent from `src-server` — shares only `jet-core` types.

- `main.rs` — Standalone binary entry point (own Tokio runtime, port 3001)
- `lib.rs` — Library exports (Broker, types, generator)
- `types.rs` — Event model (`MarketEvent`, `EventKind`, `Channel`), wire protocol (`ClientMessage`, `ServerMessage`)
- `broker.rs` — Central broker: `broadcast::Sender`, per-session subscription registry, publish/subscribe API
- `topic.rs` — Topic matching: does an event match a subscription channel?
- `session.rs` — Per-WebSocket-connection lifecycle (send loop + receive loop)
- `generator.rs` — Simulated market event producer (random-walk price ticks, Greeks, risk alerts)
- `metrics.rs` — Atomic counters for observability (`events_published`, `active_sessions`, `lag_errors`)
- `error.rs` — `BusError` via `thiserror`

**WebSocket endpoints:**

| Path | Description |
|------|-------------|
| `ws://localhost:3001/ws` | WebSocket pub/sub — subscribe/unsubscribe channels, receive live events |
| `GET /api/bus/metrics` | JSON snapshot of bus metrics |

**Wire protocol (JSON over WebSocket):**

Client → Server: `{ "action": "subscribe", "channels": [{"type":"symbol","value":"SPX"}] }`

Server → Client: `{ "type": "event", "event": { "id": 42, "kind": "price_update", ... } }`

**Frontend hook:** `hooks/useMarketEvents.ts` — auto-reconnecting WebSocket hook with ring buffer (500 events).

### Rust CLI Client (`crates/client/`)

Standalone binary that connects to `jet-bus` over WebSocket, subscribes to symbol channels, and runs live pricing via `jet-core`.

- `main.rs` — CLI entry point with `clap` args (`--symbols`, `--bus-url`, `--rate`, `--vol`, `--risk-alerts`)
- `connector.rs` — WebSocket client with auto-reconnect, sends `ClientMessage::Subscribe` on connect
- `router.rs` — Receives `ServerMessage`, dispatches events by `EventKind` to handlers
- `pricing.rs` — `PricingPipeline`: maintains an options book per symbol (ATM + 5% OTM calls/puts), re-prices on every spot tick via `jet-core::black_scholes::price()`
- `output.rs` — Console output using `comfy-table` for pricing tables, formatted Greeks/snapshot/alert lines
- `error.rs` — `ClientError` via `thiserror`

**Usage:** `cargo run -p jet-client -- --symbols SPX,QQQ`

## Strategy Quote Parser

The parser in `parsing/quote_parser.rs` converts quote strings into structured multi-leg strategies. Input format:

```
SPX apr26 +1 110%C A / -1 100%P A
```

- **Symbol** (e.g., `SPX`, `SPY`) — Hardcoded spot prices for 6 underlyings: SPX(5500), SPY(500), QQQ(400), IWM(200), DIA(400), EEM(40)
- **Expiry** — `monYY` (resolves to 3rd Friday), ISO date (`2026-04-17`), or `DDMonYY`
- **Quantity + sign** — `+1` (long), `-1` (short)
- **Strike** — Percentage (`110%C` = 110% of spot) or absolute (`5500C`)
- **Option type** — `C`/`Call` or `P`/`Put`
- **Style** — `A` (American, default) or `E` (European)
- Legs separated by `/`
- Auto-infers strategy: Single Option, Bull/Bear Spread, Straddle, Strangle, Iron Condor

## Frontend Backend Selector

The Strategy tab includes a backend toggle:

- **Local** — Uses Tauri IPC (`invoke()`) to communicate with the embedded Rust backend
- **Remote** — Uses HTTP `fetch()` to communicate with the Axum server

The selection persists to `localStorage` and applies to all pricing calls.

## Tauri IPC Commands

The 12 commands mirror the REST API 1:1. All accept JSON-serialized Rust structs and return JSON:

| Command | Input | Output |
|---------|-------|--------|
| `price_option` | OptionContract, MarketData | PricingResult |
| `price_curve` | OptionContract, MarketData, spot_range: [f64; 2], num_points: usize | Vec<{spot, price}> |
| `greeks_curve` | GreeksCurveRequest | GreeksCurveResult |
| `get_vol_surface` | — | VolSurface |
| `get_curves` | — | Vec<CurveData> |
| `get_dividend_curve` | — | DividendCurve |
| `get_correlation_matrix` | — | CorrelationMatrix |
| `get_correlation_entries` | — | Vec<CorrelationEntry> |
| `get_risk_summary` | — | RiskSummary |
| `get_pnl_attribution` | — | PnlExplain |
| `parse_strategy` | input: String | StrategyParseResult |
| `price_strategy` | input: String, assumptions? | PricedStrategyResult |

## Key Dependencies

### Rust (workspace)
- `tauri` v2, `tauri-plugin-shell` v2, `tauri-build` v2 — Desktop framework
- `axum` v0.8, `tokio` (full), `tower-http` (cors) — HTTP server
- `axum` v0.8 (ws feature), `tokio` (full), `tower-http` (cors), `futures-util`, `uuid` — WebSocket bus
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
