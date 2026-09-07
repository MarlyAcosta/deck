import { createHash } from "node:crypto";

export type AdaptiveMemorySha256Hex = string;

export type AdaptiveMemoryContentReceipt = Readonly<{
  byteCount: number;
  sha256: AdaptiveMemorySha256Hex;
}>;

export type AdaptiveMemorySessionFingerprintInput = Readonly<{
  scopeFingerprint: string;
  nativeSessionId: string;
}>;

export type AdaptiveMemoryLogicalTurnFingerprintInput = AdaptiveMemorySessionFingerprintInput & Readonly<{
  logicalTurnId: string;
}>;

export type AdaptiveMemoryCorrelationFingerprints = Readonly<{
  sessionFingerprint: AdaptiveMemorySha256Hex;
  logicalTurnFingerprint: AdaptiveMemorySha256Hex;
}>;

export function createAdaptiveMemoryContentReceipt(value: string): AdaptiveMemoryContentReceipt {
  return Object.freeze({
    byteCount: Buffer.byteLength(value, "utf8"),
    sha256: sha256Hex(value),
  });
}

export function deriveAdaptiveMemorySessionFingerprint(input: AdaptiveMemorySessionFingerprintInput): AdaptiveMemorySha256Hex {
  return sha256Hex(`deck.adaptive-memory.session.v1\0${input.scopeFingerprint}\0${input.nativeSessionId}`);
}

export function deriveAdaptiveMemoryLogicalTurnFingerprint(input: AdaptiveMemoryLogicalTurnFingerprintInput): AdaptiveMemorySha256Hex {
  return sha256Hex(`deck.adaptive-memory.logical-turn.v1\0${input.scopeFingerprint}\0${input.nativeSessionId}\0${input.logicalTurnId}`);
}

export function deriveAdaptiveMemoryCorrelationFingerprints(input: AdaptiveMemoryLogicalTurnFingerprintInput): AdaptiveMemoryCorrelationFingerprints {
  return Object.freeze({
    sessionFingerprint: deriveAdaptiveMemorySessionFingerprint(input),
    logicalTurnFingerprint: deriveAdaptiveMemoryLogicalTurnFingerprint(input),
  });
}

function sha256Hex(value: string | Buffer): AdaptiveMemorySha256Hex {
  return createHash("sha256").update(value).digest("hex");
}
