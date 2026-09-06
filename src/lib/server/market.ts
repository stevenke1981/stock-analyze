import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  loadActions,
  loadHistory,
  loadInstitution,
  loadMargin,
  loadMonthlyRevenue,
  loadOverview,
  loadUniverse,
  searchInstruments,
  testConnections,
} from "@/lib/providers/market-service";
import type { Market } from "@/lib/domain/types";

const marketSchema = z.enum(["TWSE", "TPEX"]);

export const getOverview = createServerFn({ method: "GET" }).handler(async () => {
  return loadOverview();
});

export const getUniverse = createServerFn({ method: "GET" }).handler(async () => {
  return loadUniverse();
});

export const searchStocks = createServerFn({ method: "GET" })
  .validator(z.object({ q: z.string() }))
  .handler(async ({ data }) => searchInstruments(data.q));

export const getHistory = createServerFn({ method: "GET" })
  .validator(
    z.object({
      market: marketSchema,
      symbol: z.string().min(1).max(12),
      months: z.number().min(1).max(36).optional(),
    }),
  )
  .handler(async ({ data }) => loadHistory(data.market as Market, data.symbol, data.months ?? 18));

export const getMonthlyRevenue = createServerFn({ method: "GET" })
  .validator(z.object({ symbol: z.string().min(1).max(12) }))
  .handler(async ({ data }) => loadMonthlyRevenue(data.symbol));

export const getInstitution = createServerFn({ method: "GET" })
  .validator(z.object({ symbol: z.string().min(1).max(12), date: z.string().optional() }))
  .handler(async ({ data }) => loadInstitution(data.symbol, data.date));

export const getMargin = createServerFn({ method: "GET" })
  .validator(z.object({ symbol: z.string().min(1).max(12), date: z.string().optional() }))
  .handler(async ({ data }) => loadMargin(data.symbol, data.date));

export const getActions = createServerFn({ method: "GET" }).handler(async () => loadActions());

export const pingSources = createServerFn({ method: "GET" }).handler(async () => testConnections());
