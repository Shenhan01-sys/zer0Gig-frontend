/**
 * ECIES helpers for skill-config encryption.
 *
 * The platform's ECIES public key (secp256k1, compressed sec1) is exposed to
 * the browser via NEXT_PUBLIC_PLATFORM_ENCRYPTION_PUBKEY. The matching
 * private key lives only in the runtime container.
 *
 * `encryptSecret` returns a `0x`-prefixed hex blob safe to round-trip through
 * Supabase. `isEncrypted` lets callers detect already-encrypted values so
 * we don't double-encrypt on edit-and-save.
 *
 * SENSITIVE_FIELD_PATTERN matches anything that looks like a credential — this
 * is the same heuristic used by SkillConfigModal to render `<input type="password">`
 * so the two stay aligned.
 */

import { encrypt } from "eciesjs";

const SENSITIVE_FIELD_PATTERN = /(key|token|secret|password|auth)/i;

function getPubKey(): string | null {
  const key = process.env.NEXT_PUBLIC_PLATFORM_ENCRYPTION_PUBKEY;
  if (!key) return null;
  return key.startsWith("0x") ? key.slice(2) : key;
}

export function isEncrypted(value: string): boolean {
  // ECIES output: 65-byte ephemeral pubkey + 16-byte IV + 16-byte tag + ciphertext
  // Always > 100 hex chars after `0x` prefix.
  return typeof value === "string" && value.startsWith("0x") && value.length > 200;
}

export function isSensitiveField(fieldKey: string): boolean {
  return SENSITIVE_FIELD_PATTERN.test(fieldKey);
}

/**
 * Encrypt a single string value with the platform public key. Returns a hex
 * blob prefixed with `0x`. Throws if no key is configured — callers should
 * decide whether to fall back to plaintext (warned) or hard-fail.
 */
export function encryptSecret(plaintext: string): string {
  const pkHex = getPubKey();
  if (!pkHex) throw new Error("NEXT_PUBLIC_PLATFORM_ENCRYPTION_PUBKEY not set");
  if (!plaintext) return "";

  const cipher = encrypt(pkHex, Buffer.from(plaintext, "utf8"));
  return "0x" + Buffer.from(cipher).toString("hex");
}

/**
 * Walk a flat skill-config object and encrypt every sensitive field that is
 * not already encrypted. Non-sensitive fields and empty values pass through.
 *
 * If the public key isn't configured we log a warning and return the config
 * untouched. Hackathon trade-off: we'd rather degrade to plaintext than block
 * the registration flow on an env-var typo.
 */
export function encryptSkillConfig(config: Record<string, string>): Record<string, string> {
  const pkHex = getPubKey();
  if (!pkHex) {
    console.warn("[cryptoSecret] NEXT_PUBLIC_PLATFORM_ENCRYPTION_PUBKEY not set — skill config saved as plaintext");
    return config;
  }

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(config)) {
    if (!v) { out[k] = v; continue; }
    if (isSensitiveField(k) && !isEncrypted(v)) {
      try {
        out[k] = encryptSecret(v);
      } catch (err) {
        console.error(`[cryptoSecret] Failed to encrypt field "${k}":`, err);
        out[k] = v;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}
