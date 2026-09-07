import { describe, expect, test } from "bun:test";

import { evaluateAdaptiveMemoryCaptureEligibility } from "./capture-eligibility";

const REACT_SURVEY_LIVE_PROMPT = `Esta es una decisión arquitectónica duradera y vigente de este proyecto:

- El nombre interno de la arquitectura es Vega.
- La convención que define la frontera entre política de dominio y traducción
  técnica se llama Pulsar Boundary.
- La política de dominio pertenece al core.
- Los adapters pueden implementar la traducción técnica necesaria.
- Los adapters no pueden redefinir la política de dominio.

Usa únicamente la Skill deck-lead si Deck la exige. No uses recall explícito,
Context Mode, herramientas de memoria, inspección del repositorio, búsqueda web
ni ninguna otra herramienta.

Confirma la decisión brevemente, sin añadir nuevas reglas.`;

describe("adaptive-memory capture eligibility", () => {
  test("accepts high-signal user and assistant content", () => {
    expect(evaluateAdaptiveMemoryCaptureEligibility({
      source: "trusted-user-prompt",
      content: "Remember that Deck runtime credentials are stored only in the owner-only secret store.",
    })).toMatchObject({ eligible: true });
    expect(evaluateAdaptiveMemoryCaptureEligibility({
      source: "trusted-final-assistant",
      content: "Implemented bounded Codex final-message capture and verified it with production-path tests.",
    })).toMatchObject({ eligible: true });
  });

  test("accepts Spanish durable architecture decisions as high-signal trusted user content", () => {
    expect(evaluateAdaptiveMemoryCaptureEligibility({
      source: "trusted-user-prompt",
      content: "Decisión arquitectónica duradera: Orion deberá respetar Nebula Boundary como convención y política de dominio; esta preferencia deberá respetarse en futuras implementaciones.",
    })).toMatchObject({ eligible: true });
  });

  test("accepts the exact react-survey durable Markdown-list prompt", () => {
    expect(evaluateAdaptiveMemoryCaptureEligibility({
      source: "trusted-user-prompt",
      content: REACT_SURVEY_LIVE_PROMPT,
    })).toMatchObject({ eligible: true, reason: "eligible" });
  });

  test.each([
    ["dash bullets", "Decisión arquitectónica duradera:\n- El core define la política.\n- Los adapters traducen detalles.\n- Esta convención debe mantenerse."],
    ["numbered list", "Convención arquitectónica duradera:\n1. El core define la política.\n2. Los adapters traducen detalles.\n3. Esta decisión debe mantenerse."],
    ["nested bullets", "Decisión arquitectónica duradera:\n- El core define la política.\n  - Nunca delega esa política.\n- Los adapters traducen detalles.\n  - Deben respetar la frontera."],
    ["durable prose mixed with a list", "Esta convención arquitectónica es duradera y debe mantenerse.\n\n- El core conserva la política de dominio.\n- Los adapters implementan traducción técnica.\n\nNunca deben redefinir esa política."],
  ])("accepts ordinary Markdown knowledge in a %s", (_shape, content) => {
    expect(evaluateAdaptiveMemoryCaptureEligibility({ source: "trusted-user-prompt", content })).toMatchObject({ eligible: true });
  });

  test.each([
    ["diff --git marker", "diff --git a/policy.ts b/policy.ts\nDecisión arquitectónica: esta convención debe permanecer y nunca cambiar."],
    ["unified diff headers", "Proposed policy update\n--- a/policy.ts\n+++ b/policy.ts\nThe surrounding explanation is long enough to resemble a durable project decision."],
    ["hunk marker", "Proposed policy update\n@@ -10,2 +10,2 @@\nThe surrounding explanation is long enough to resemble a durable project decision."],
    ["bare Index marker line", "Durable architecture decision for future repairs:\nIndex:\nThe policy boundary remains owned by core and adapters may only translate implementation details."],
    ["path Index marker line", "Durable architecture decision for future repairs:\nIndex: policy.ts\nThe policy boundary remains owned by core and adapters may only translate implementation details."],
    ["paired removed and added lines", "Decisión arquitectónica duradera\n-contexto anterior\n-política anterior\n+contexto nuevo\n+política nueva\nEsta convención debe mantenerse y nunca omitirse."],
    ["durable vocabulary inside a real diff", "diff --git a/policy.md b/policy.md\n--- a/policy.md\n+++ b/policy.md\n@@ -1 +1 @@\n-La decisión de arquitectura nunca debe cambiar.\n+La convención de arquitectura debe permanecer siempre."],
  ])("rejects structural patch evidence from a %s", (_shape, content) => {
    expect(evaluateAdaptiveMemoryCaptureEligibility({ source: "trusted-user-prompt", content })).toMatchObject({
      eligible: false,
      reason: "diff_or_patch",
    });
  });

  test.each([
    ["raw_log_or_test_output", "$ bun test\nFAIL runtime.test.ts\nExpected: 1\nReceived: 2"],
    ["stack_trace", "Error: boom\n    at run (/tmp/app.ts:1:1)\n    at main (/tmp/main.ts:2:1)"],
    ["diff_or_patch", "diff --git a/a.ts b/a.ts\n@@ -1 +1 @@\n-old\n+new\n"],
    ["source_dump", "```ts\nimport x from 'x';\nexport function run() {\n  const value = 1;\n  if (value) {\n    return value;\n  }\n}\n```"],
    ["tool_chatter", "<function=functions.bash>\nstdout: ok\nstderr: warning"],
    ["secret_detected", "PATH=/bin\nHOME=/home/dev\nSUPERMEMORY_API_KEY=fake-secret-value"],
    ["external_or_official_artifact", "OFFICIAL CONTEXT\n## ADDED Requirements\n- The system SHALL do something."],
    ["external_or_official_artifact", "Provider response\nretrieved from Supermemory search results\nDecision: keep this incidental payload out of automatic capture."],
    ["trivial_operational_text", "continue"],
    ["no_high_signal_category", "Please implement the dashboard updates and run the relevant tests."],
    ["no_high_signal_category", "Write a short poem about reliable software systems."],
  ])("rejects %s even when captured from trusted text", (reason, content) => {
    expect(evaluateAdaptiveMemoryCaptureEligibility({ source: "trusted-user-prompt", content })).toMatchObject({ eligible: false, reason });
  });

  test.each([
    "password: fake-password-value",
    "{ \"apiKey\": \"fake-api-key-value\" }",
    "token = \"fake-token-value\"",
    "secret: fake-secret-value",
    "--password fake-password-value",
    "https://fake-user:fake-password@example.invalid/path",
    "DATABASE_URL=postgres://user:pass@host/db",
    "DATABASE_URI=postgres://user:pass@host/db",
    "Implemented a database fix. DATABASE_URL=postgres://user:pass@host/db",
    "APP_URI=https://user:pass@example.invalid/private",
    "SQLITE_DSN=file:///home/dev/private/customer.sqlite",
    "DATABASE_URI=/home/dev/private/prod.db",
    "REDIS_URL=redis://default:pass@cache.example.invalid:6379/0",
    "SENTRY_DSN=https://public:secret@sentry.example.invalid/1",
    "MONGODB_URL=mongodb+srv://user:pass@cluster.example.invalid/app",
    "postgres://user:pass@host/db",
    "mysql://user:pass@host/db",
    "Authorization: Bearer fake-token-value",
    "Set-Cookie: session=fake-session-value; HttpOnly",
    "AWS_SECRET_ACCESS_KEY=fake-cloud-secret-value",
    "PRIVATE_KEY=-----BEGIN PRIVATE KEY-----fake",
    "Cookie: session=fake-session-value",
    "SESSION_ID=fake-session-value",
  ])("rejects high-confidence secret form before transport: %s", (content) => {
    expect(evaluateAdaptiveMemoryCaptureEligibility({
      source: "trusted-final-assistant",
      content: `Implemented a credential handling fix. ${content}`,
    })).toMatchObject({ eligible: false, reason: "secret_detected" });
  });
});
