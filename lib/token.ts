import crypto from "crypto";

const HMAC_SECRET = process.env.HMAC_SECRET || "dev_secret";

/** Firma un payload arbitrario y devuelve un token <body>.<sig> */
export function sign(payload: Record<string, unknown>): string {
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", HMAC_SECRET).update(data).digest("base64url");
  const body = Buffer.from(data).toString("base64url");
  return `${body}.${sig}`;
}

/**
 * Verifica integridad y devuelve el payload parseado.
 * Usa un genérico con default SEGURO (no `any`) para evitar el lint error.
 */
export function verify<T = Record<string, unknown>>(token: string): T {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Malformed token");

  const data = Buffer.from(body, "base64url").toString("utf8");
  const expected = crypto.createHmac("sha256", HMAC_SECRET).update(data).digest("base64url");
  if (sig !== expected) throw new Error("Invalid signature");

  return JSON.parse(data) as T;
}

/** `expMs` debe ser un timestamp en ms (Date.now() compatible) */
export function isExpired(expMs: number): boolean {
  return Date.now() > expMs;
}
