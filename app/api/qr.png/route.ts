// app/api/qr.png/route.ts
import { NextRequest } from "next/server"
import { toBuffer } from "qrcode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")
    const invite = searchParams.get("invite") // opcional (URL ya armada)

    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000"
    const inviteUrl =
      invite ??
      (token ? `${baseUrl}/invite?token=${encodeURIComponent(token)}` : null)

    if (!inviteUrl) {
      return new Response("Missing token or invite", { status: 400 })
    }

    // Generamos PNG y lo convertimos a Uint8Array (BodyInit válido)
    const buf = await toBuffer(inviteUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    })
    const bytes = new Uint8Array(buf)

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": 'inline; filename="qr.png"',
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new Response("bad request", { status: 400 })
  }
}
