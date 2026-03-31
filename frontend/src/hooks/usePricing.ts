/**
 * Tauri command hooks for communicating with the Rust backend.
 */

import { invoke } from "@tauri-apps/api/core";
import type {
  OptionContract,
  MarketData,
  PricingResult,
  GreeksCurveRequest,
  GreeksCurveResult,
} from "../types";

/**
 * Price an option using Black-Scholes and return full result with Greeks.
 */
export async function priceOption(
  contract: OptionContract,
  market: MarketData,
): Promise<PricingResult> {
  return invoke<PricingResult>("price_option", { contract, market });
}

/**
 * Compute the option price curve over a range of spot prices.
 */
export async function priceCurve(
  contract: OptionContract,
  market: MarketData,
  spotRange: [number, number],
  numPoints: number,
): Promise<Array<{ spot: number; price: number }>> {
  return invoke<Array<{ spot: number; price: number }>>("price_curve", {
    contract,
    market,
    spotRange,
    numPoints,
  });
}

/**
 * Compute Greeks over a range of spot prices for charting.
 */
export async function greeksCurve(
  request: GreeksCurveRequest,
): Promise<GreeksCurveResult> {
  return invoke<GreeksCurveResult>("greeks_curve", { request });
}
