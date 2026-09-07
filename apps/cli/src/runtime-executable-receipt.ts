import { createHash } from "node:crypto";
import { readFileSync as defaultReadFileSync, realpathSync as defaultRealpathSync } from "node:fs";
import { basename } from "node:path";

export type RuntimeExecutableReceipt = Readonly<{
  hostExecutableSha256: string;
  hostExecutableByteCount: number;
  hostExecutableSource: "proc-self-exe" | "process-exec-path";
  hostExecutableKind: "deck-canary" | "other";
}>;

export type RuntimeExecutableReceiptResult =
  | Readonly<{ ok: true; receipt: RuntimeExecutableReceipt }>
  | Readonly<{ ok: false; diagnostics: readonly string[] }>;

export type RuntimeExecutableReceiptInput = Readonly<{
  platform?: NodeJS.Platform | string;
  execPath?: string;
  procSelfExePath?: string;
  readFileSync?: (path: string) => string | Buffer | Uint8Array;
  realpathSync?: (path: string) => string;
}>;

export type RuntimeExecutableReceiptResolver = () => RuntimeExecutableReceiptResult;

export function createCachedRuntimeExecutableReceiptResolver(resolve: RuntimeExecutableReceiptResolver = resolveRuntimeExecutableReceipt): RuntimeExecutableReceiptResolver {
  let cachedRuntimeExecutableReceipt: RuntimeExecutableReceiptResult | undefined;
  return () => {
    cachedRuntimeExecutableReceipt ??= resolve();
    return cachedRuntimeExecutableReceipt;
  };
}

const resolveCachedProcessRuntimeExecutableReceipt = createCachedRuntimeExecutableReceiptResolver();

export function getCachedRuntimeExecutableReceipt(): RuntimeExecutableReceiptResult {
  return resolveCachedProcessRuntimeExecutableReceipt();
}

export function resolveRuntimeExecutableReceipt(input: RuntimeExecutableReceiptInput = {}): RuntimeExecutableReceiptResult {
  const platform = input.platform ?? process.platform;
  const readFileSync = input.readFileSync ?? ((path: string) => defaultReadFileSync(path));
  const realpathSync = input.realpathSync ?? ((path: string) => defaultRealpathSync(path));
  try {
    if (platform === "linux") {
      const imagePath = input.procSelfExePath ?? "/proc/self/exe";
      const bytes = toBuffer(readFileSync(imagePath));
      const digest = createHash("sha256").update(bytes).digest("hex");
      const resolvedBasename = safeBasename(realpathSync, imagePath);
      return Object.freeze({
        ok: true as const,
        receipt: Object.freeze({
          hostExecutableSha256: digest,
          hostExecutableByteCount: bytes.byteLength,
          hostExecutableSource: "proc-self-exe" as const,
          hostExecutableKind: canaryBasenameMatches(resolvedBasename, digest) ? "deck-canary" as const : "other" as const,
        }),
      });
    }

    const execPath = input.execPath ?? process.execPath;
    const resolved = realpathSync(execPath);
    const bytes = toBuffer(readFileSync(resolved));
    return Object.freeze({
      ok: true as const,
      receipt: Object.freeze({
        hostExecutableSha256: createHash("sha256").update(bytes).digest("hex"),
        hostExecutableByteCount: bytes.byteLength,
        hostExecutableSource: "process-exec-path" as const,
        hostExecutableKind: "other" as const,
      }),
    });
  } catch {
    return Object.freeze({
      ok: false as const,
      diagnostics: Object.freeze(["Runtime executable receipt unavailable; continuing without byte-backed host evidence."]),
    });
  }
}

function toBuffer(value: string | Buffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value);
  return Buffer.from(value);
}

function safeBasename(realpathSync: (path: string) => string, path: string): string | undefined {
  try {
    return basename(realpathSync(path));
  } catch {
    return undefined;
  }
}

function canaryBasenameMatches(value: string | undefined, digest: string): boolean {
  const match = value?.match(/^\.deck-canary\.payload-([a-f0-9]{64})$/);
  return match?.[1] === digest;
}
