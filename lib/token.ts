import crypto from "crypto"

const HMAC_SECRET = process.env.HMAC_SECRET || "dev_secret"

export function sign(payload: Record<string, unknown>) {
  const data = JSON.stringify(payload)
  const sig = crypto.createHmac("sha256", HMAC_SECRET).update(data).digest("base64url")
  const body = Buffer.from(data).toString("base64url")
  return `${body}.${sig}`
}

export function verify(token: string) {
  const [body, sig] = token.split(".")
  if (!body || !sig) throw new Error("Malformed token")
  const data = Buffer.from(body, "base64url").toString()
  const expected = crypto.createHmac("sha256", HMAC_SECRET).update(data).digest("base64url")
  if (sig !== expected) throw new Error("Invalid signature")
  return JSON.parse(data)
}

export function isExpired(expMs: number) {
  return Date.now() > expMs
}
