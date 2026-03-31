# JET -- Equity Derivatives Quant Desktop Application

A next-generation Rust desktop application for running, executing, and visualizing
quantitative analysis on equity derivatives. Built with Tauri v2 (Rust backend +
React/TypeScript frontend).

## Architecture

### Framework: Tauri v2

**Rust backend** handles all quantitative computation:
- Black-Scholes-Merton pricing engine with analytical Greeks
- Numerical Greeks via bump-and-revalue (central finite differences)
- Data models for option contracts and market data

**React + TypeScript frontend** handles visualization:
- Parameter input forms with interactive sliders
- Canvas-based payoff diagrams and Greeks profile charts
- Responsive layout with TailwindCSS

**Communication:** Tauri IPC commands bridge the frontend and backend.
The frontend calls `invoke()` to execute Rust functions; results are serialized
as JSON and returned as typed TypeScript objects.

### Project Structure

```
jet/
├── src-tauri/                    # Rust backend (Tauri v2 application)
│   ├── Cargo.toml                # Rust dependencies
│   ├── build.rs                  # Tauri build script
│   ├── tauri.conf.json           # Tauri configuration (window, build, bundle)
│   ├── capabilities/
│   │   └── default.json          # Tauri security capabilities
│   ├── icons/                    # App icons
│   └── src/
│       ├── main.rs               # Application entry point
│       ├── lib.rs                # Tauri command handlers and app setup
│       ├── math/
│       │   ├── mod.rs            # Math utilities re-exports
│       │   └── distributions.rs  # Normal CDF/PDF wrappers (statrs)
│       ├── pricing/
│       │   ├── mod.rs            # Pricing module re-exports
│       │   ├── types.rs          # OptionType, OptionContract, MarketData, PricingResult
│       │   ├── black_scholes.rs  # BSM pricing + analytical Greeks + price_curve
│       │   ├── greeks.rs         # Numerical Greeks (finite-difference bump-and-revalue)
│       │   ├── binomial.rs       # Binomial tree pricer (stub, future)
│       │   └── monte_carlo.rs    # MC simulation engine (stub, future)
│       └── data/
│           ├── mod.rs            # Data module re-exports
│           ├── market.rs         # MarketSnapshot struct
│           └── portfolio.rs      # Portfolio/position definitions (stub, future)
├── frontend/                     # React + TypeScript frontend
│   ├── package.json              # Node.js dependencies
│   ├── vite.config.ts            # Vite bundler config
│   ├── tailwind.config.js        # TailwindCSS theme
│   ├── tsconfig.json             # TypeScript config
│   ├── index.html                # HTML entry point
│   └── src/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Main application component (state, layout)
│       ├── styles.css            # Global styles (TailwindCSS)
│       ├── types/
│       │   └── index.ts          # TypeScript types mirroring Rust backend
│       ├── hooks/
│       │   └── usePricing.ts     # Tauri IPC command wrappers (invoke)
│       └── components/
│           ├── OptionInput.tsx    # Option parameter input form
│           ├── ResultPanel.tsx    # Pricing result display
│           ├── PayoffChart.tsx    # Canvas payoff diagram
│           └── GreeksChart.tsx    # Canvas Greeks profile chart
└── CLAUDE.md                     # This file
```

## Build and Run Commands

```bash
# Development mode (hot reload for frontend, debug Rust)
cargo tauri dev

# Production build (optimized Rust, bundled frontend)
cargo tauri build

# Run Rust tests
cd src-tauri && cargo test

# Check Rust compilation (fast)
cd src-tauri && cargo check

# TypeScript type-check
cd frontend && npx tsc --noEmit

# Build frontend only
cd frontend && npm run build

# Format Rust code
cd src-tauri && cargo fmt

# Lint Rust code
cd src-tauri && cargo clippy

# Run the release binary directly
./src-tauri/target/release/jet
```

## Key Dependencies

### Rust (src-tauri/Cargo.toml)

| Crate | Purpose |
|-------|---------|
| `tauri` v2 | Desktop application framework (WebView shell) |
| `tauri-plugin-shell` v2 | Shell access plugin for Tauri |
| `tauri-build` v2 | Build-time Tauri code generation |
| `statrs` | Statistical distributions (Normal CDF/PDF) |
| `serde` + `serde_json` | JSON serialization for IPC |
| `thiserror` | Domain error types |

### Frontend (frontend/package.json)

| Package | Purpose |
|---------|---------|
| `@tauri-apps/api` v2 | Tauri JS/TS API (invoke commands) |
| `react` + `react-dom` v18 | UI framework |
| `typescript` v5 | Type safety |
| `vite` v5 | Build tool and dev server |
| `tailwindcss` v3 | Utility-first CSS |
| `lightweight-charts` v4 | TradingView charting (available for future use) |

## Tauri IPC Commands

| Command | Input | Output | Description |
|---------|-------|--------|-------------|
| `price_option` | OptionContract, MarketData | PricingResult | Price + all 5 Greeks |
| `price_curve` | OptionContract, MarketData, spot_range, num_points | Vec<{spot, price}> | Price vs spot curve |
| `greeks_curve` | GreeksCurveRequest | GreeksCurveResult | All Greeks vs spot |

## Conventions

- **Error handling:** Use `Result<T, String>` for Tauri commands (Tauri serializes
  Err as an error to the frontend). Use `Result<T, E>` with `thiserror` for internal
  library code. Never unwrap in library code.
- **Numerics:** `f64` throughout. Rates are annualized decimal. Time is year-fraction.
- **Types:** Frontend TypeScript types in `frontend/src/types/index.ts` must stay in
  sync with Rust types in `src-tauri/src/pricing/types.rs`. The `OptionType` is
  serialized as a string ("Call" | "Put") via serde.
- **Testing:** Rust unit tests in `#[cfg(test)] mod tests` within each file.
- **Naming:** Rust snake_case functions, PascalCase types. Domain terms keep
  conventional names (delta, vega, black_scholes_price).

## MVP Scope

The initial working application includes:

1. **Black-Scholes pricing engine** -- price and all five first-order Greeks
   for European calls and puts, with continuous dividend yield support.
2. **Interactive parameter input** -- sliders for S, K, T, r, sigma, q and
   call/put toggle.
3. **Results display** -- formatted price and Greeks output.
4. **Payoff diagram** -- canvas chart showing BSM value curve and intrinsic
   payoff at expiry.
5. **Greeks profile chart** -- delta, gamma, vega, theta across spot prices.

## Future Roadmap

- [ ] Binomial tree pricer for American options
- [ ] Monte Carlo engine for exotic payoffs
- [ ] Volatility surface visualization
- [ ] Strategy builder (multi-leg spreads)
- [ ] P&L heatmap (spot x time)
- [ ] Market data import (CSV/JSON)
- [ ] Portfolio-level risk aggregation
- [ ] TradingView lightweight-charts integration for interactive charts
- [ ] Real-time data feed integration
- [ ] Export to PDF/image
