import assert from "node:assert/strict";
import test from "node:test";
import {
  AiProviderConfigError,
  isPublicIp,
  resolveAiProvider,
  toChatCompletionsUrl,
  type HostResolver,
} from "./ai-provider.ts";

const publicResolver: HostResolver = async () => [{ address: "93.184.216.34", family: 4 }];

test("server key is restricted to the trusted xAI endpoint", async () => {
  const provider = await resolveAiProvider(undefined, "server-secret", publicResolver);
  assert.equal(provider.endpoint, "https://api.x.ai/v1/chat/completions");
  assert.equal(provider.apiKey, "server-secret");
  assert.equal(provider.keySource, "server");
});

test("explicit trusted xAI base may still use the server key", async () => {
  const provider = await resolveAiProvider(
    { baseUrl: "https://api.x.ai/v1/", model: "grok-test" },
    "server-secret",
    publicResolver,
  );
  assert.equal(provider.endpoint, "https://api.x.ai/v1/chat/completions");
  assert.equal(provider.model, "grok-test");
  assert.equal(provider.keySource, "server");
});

test("custom endpoint can never receive the server key", async () => {
  await assert.rejects(
    () => resolveAiProvider({ baseUrl: "https://example.com/v1" }, "server-secret", publicResolver),
    (error: unknown) =>
      error instanceof AiProviderConfigError && error.message.includes("伺服器端 XAI_API_KEY 不會轉送"),
  );
});

test("custom endpoint accepts only its request-scoped key", async () => {
  const provider = await resolveAiProvider(
    { baseUrl: "https://example.com/v1", apiKey: "user-secret" },
    "server-secret",
    publicResolver,
  );
  assert.equal(provider.endpoint, "https://example.com/v1/chat/completions");
  assert.equal(provider.apiKey, "user-secret");
  assert.equal(provider.keySource, "request");
});

test("chat completions path is not duplicated", () => {
  assert.equal(
    toChatCompletionsUrl(new URL("https://example.com/v1/chat/completions/")).toString(),
    "https://example.com/v1/chat/completions",
  );
});

test("private and reserved endpoints are rejected", async () => {
  for (const baseUrl of [
    "http://example.com/v1",
    "https://localhost/v1",
    "https://127.0.0.1/v1",
    "https://169.254.169.254/latest",
    "https://[::1]/v1",
  ]) {
    await assert.rejects(
      () => resolveAiProvider({ baseUrl, apiKey: "user-secret" }, undefined, publicResolver),
      AiProviderConfigError,
      baseUrl,
    );
  }
});

test("hostnames resolving to private addresses are rejected", async () => {
  const privateResolver: HostResolver = async () => [{ address: "10.0.0.4", family: 4 }];
  await assert.rejects(
    () => resolveAiProvider({ baseUrl: "https://example.com/v1", apiKey: "user-secret" }, undefined, privateResolver),
    /解析到私人/,
  );
});

test("IP classification covers common private, mapped and documentation ranges", () => {
  assert.equal(isPublicIp("8.8.8.8"), true);
  assert.equal(isPublicIp("10.0.0.1"), false);
  assert.equal(isPublicIp("::ffff:127.0.0.1"), false);
  assert.equal(isPublicIp("0:0:0:0:0:ffff:7f00:1"), false);
  assert.equal(isPublicIp("64:ff9b::7f00:1"), false);
  assert.equal(isPublicIp("2001:db8::1"), false);
  assert.equal(isPublicIp("2606:4700:4700::1111"), true);
});
