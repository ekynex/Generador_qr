import { NextRequest, NextResponse } from "next/server"
import { toBuffer } from "qrcode"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")
    const invite = searchParams.get("invite") // opcional: URL directa

    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000"
    const inviteUrl =
      invite ??
      (token ? `${baseUrl}/invite?token=${encodeURIComponent(token)}` : null)

    if (!inviteUrl) {
      return NextResponse.json({ error: "Missing token or invite" }, { status: 400 })
    }

    // Buffer -> Uint8Array para que TS lo acepte como BodyInit
    const buf: Buffer = await toBuffer(inviteUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    })
    const bytes = new Uint8Array(buf)

    return new Response(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Error generating QR" }, { status: 500 })
  }
}
