import { NextRequest, NextResponse } from "next/server"
import { toDataURL } from "qrcode"
import { sign } from "@/lib/token"

type Body = {
  contactId: string
  firstName?: string
  lastName?: string
  eventId: string
  ttlMinutes?: number
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    if (!body?.contactId || !body?.eventId) {
      return NextResponse.json(
        { ok: false, error: "Missing contactId or eventId" },
        { status: 400 }
      )
    }

    const ttlMinutes =
      body.ttlMinutes && body.ttlMinutes > 0 ? body.ttlMinutes : 60 * 24 * 7
    const now = Date.now()
    const payload = {
      contactId: body.contactId,
      eventId: body.eventId,
      iat: now,
      exp: now + ttlMinutes * 60 * 1000,
    }

    const token = sign(payload)
    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000"
    const inviteUrl = `${baseUrl}/invite?token=${encodeURIComponent(token)}`
    const qrDataUrl = await toDataURL(inviteUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    })

    // 👇 NUEVO: URL directa del PNG servido por /api/qr.png
    const qrPngUrl = `${baseUrl}/api/qr.png?token=${encodeURIComponent(token)}`

    return NextResponse.json({ ok: true, inviteUrl, qrDataUrl, qrPngUrl, token })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unexpected error"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
