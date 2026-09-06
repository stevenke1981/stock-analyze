import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const DEFAULT_AI_BASE_URL = "https://api.x.ai/v1";
export const DEFAULT_AI_MODEL = "grok-4.5";

export interface AiProviderInput {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

export interface ResolvedAddress {
  address: string;
  family: number;
}

export type HostResolver = (hostname: string) => Promise<readonly ResolvedAddress[]>;

export interface ResolvedAiProvider {
  endpoint: string;
  apiKey: string;
  model: string;
  keySource: "server" | "request";
}

export class AiProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderConfigError";
  }
}

const defaultResolver: HostResolver = async (hostname) => lookup(hostname, { all: true, verbatim: true });

export async function resolveAiProvider(
  input: AiProviderInput | undefined,
  serverApiKey: string | undefined,
  resolver: HostResolver = defaultResolver,
): Promise<ResolvedAiProvider> {
  const requestedBaseUrl = input?.baseUrl?.trim();
  const requestApiKey = input?.apiKey?.trim();
  const model = input?.model?.trim() || DEFAULT_AI_MODEL;

  if (requestedBaseUrl) {
    const baseUrl = parseAiBaseUrl(requestedBaseUrl);
    if (isTrustedXaiBaseUrl(baseUrl)) {
      const apiKey = requestApiKey || serverApiKey?.trim();
      if (!apiKey) throw new AiProviderConfigError("尚未設定 AI 金鑰。行情、圖表、指標、持股與回測仍可使用。");
      return {
        endpoint: toChatCompletionsUrl(baseUrl).toString(),
        apiKey,
        model,
        keySource: requestApiKey ? "request" : "server",
      };
    }

    if (!requestApiKey) {
      throw new AiProviderConfigError(
        "自訂 AI 端點必須同時提供自備金鑰；伺服器端 XAI_API_KEY 不會轉送到第三方網址。",
      );
    }
    await assertPublicEndpoint(baseUrl, resolver);
    return {
      endpoint: toChatCompletionsUrl(baseUrl).toString(),
      apiKey: requestApiKey,
      model,
      keySource: "request",
    };
  }

  const apiKey = requestApiKey || serverApiKey?.trim();
  if (!apiKey) throw new AiProviderConfigError("尚未設定 AI 金鑰。行情、圖表、指標、持股與回測仍可使用。");
  return {
    endpoint: `${DEFAULT_AI_BASE_URL}/chat/completions`,
    apiKey,
    model,
    keySource: requestApiKey ? "request" : "server",
  };
}

export function parseAiBaseUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AiProviderConfigError("AI Base URL 格式不正確。");
  }
  if (url.protocol !== "https:") {
    throw new AiProviderConfigError("自訂 AI 端點只允許 HTTPS。");
  }
  if (url.username || url.password) {
    throw new AiProviderConfigError("AI Base URL 不可包含帳號或密碼。");
  }
  if (url.search || url.hash) {
    throw new AiProviderConfigError("AI Base URL 不可包含 query string 或 fragment。");
  }
  return url;
}

export function toChatCompletionsUrl(baseUrl: URL): URL {
  const endpoint = new URL(baseUrl.toString());
  const path = endpoint.pathname.replace(/\/+$/, "");
  endpoint.pathname = path.endsWith("/chat/completions")
    ? path
    : `${path || ""}/chat/completions`;
  endpoint.search = "";
  endpoint.hash = "";
  return endpoint;
}

export function isTrustedXaiBaseUrl(url: URL): boolean {
  const path = url.pathname.replace(/\/+$/, "");
  return url.origin === "https://api.x.ai" && (path === "/v1" || path === "/v1/chat/completions");
}

export async function assertPublicEndpoint(url: URL, resolver: HostResolver = defaultResolver): Promise<void> {
  const hostname = normalizeHostname(url.hostname);
  if (isBlockedHostname(hostname)) {
    throw new AiProviderConfigError("自訂 AI 端點不可使用 localhost、內部網域或保留位址。");
  }

  if (isIP(hostname)) {
    if (!isPublicIp(hostname)) {
      throw new AiProviderConfigError("自訂 AI 端點不可使用私人、回環、鏈路本地或保留 IP。");
    }
    return;
  }

  let addresses: readonly ResolvedAddress[];
  try {
    addresses = await resolver(hostname);
  } catch {
    throw new AiProviderConfigError("無法解析自訂 AI 端點的網域名稱。");
  }
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new AiProviderConfigError("自訂 AI 端點解析到私人、回環、鏈路本地或保留 IP，已拒絕連線。");
  }
}

export function isPublicIp(rawAddress: string): boolean {
  const address = normalizeHostname(rawAddress).toLowerCase();
  const version = isIP(address);
  if (version === 4) return isPublicIpv4(address);
  if (version === 6) return isPublicIpv6(address);
  return false;
}

function normalizeHostname(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

function isBlockedHostname(hostname: string): boolean {
  const value = hostname.toLowerCase().replace(/\.$/, "");
  if (!value || value === "localhost") return true;
  if (value.endsWith(".localhost") || value.endsWith(".local") || value.endsWith(".internal")) return true;
  if (value.endsWith(".lan") || value.endsWith(".home") || value.endsWith(".test")) return true;
  return false;
}

function isPublicIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    return false;
  }
  const [a, b, c] = octets;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 192 && b === 168) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  return true;
}

function isPublicIpv6(address: string): boolean {
  const value = ipv6ToBigInt(address);
  if (value == null) return false;
  const blockedCidrs: Array<[string, number]> = [
    ["::", 96],
    ["::ffff:0:0", 96],
    ["64:ff9b::", 96],
    ["64:ff9b:1::", 48],
    ["100::", 64],
    ["2001::", 32],
    ["2001:2::", 48],
    ["2001:10::", 28],
    ["2001:20::", 28],
    ["2001:db8::", 32],
    ["2002::", 16],
    ["fc00::", 7],
    ["fe80::", 10],
    ["ff00::", 8],
  ];
  return !blockedCidrs.some(([prefix, bits]) => isInIpv6Cidr(value, prefix, bits));
}

function isInIpv6Cidr(value: bigint, prefix: string, bits: number): boolean {
  const prefixValue = ipv6ToBigInt(prefix);
  if (prefixValue == null) return false;
  const shift = BigInt(128 - bits);
  return value >> shift === prefixValue >> shift;
}

function ipv6ToBigInt(rawAddress: string): bigint | null {
  let address = rawAddress.toLowerCase().split("%", 1)[0];
  if (address.includes(".")) {
    const lastColon = address.lastIndexOf(":");
    const octets = address.slice(lastColon + 1).split(".").map(Number);
    if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
      return null;
    }
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    address = `${address.slice(0, lastColon)}:${high}:${low}`;
  }

  const halves = address.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const parts = halves.length === 2 ? [...left, ...Array(missing).fill("0"), ...right] : left;
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;

  let value = 0n;
  for (const part of parts) value = (value << 16n) | BigInt(`0x${part}`);
  return value;
}
