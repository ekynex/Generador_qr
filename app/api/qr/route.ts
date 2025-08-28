import { NextRequest, NextResponse } from "next/server";
import { toDataURL } from "qrcode";
import { sign } from "@/lib/token";

type Body = {
  contactId: string;     // {{1.contact_id}}
  eventId: string;       // "Reto20K" u otro
  // Campos del formulario (valores crudos desde Make)
  fullName?: string;     // {{1.full_name}}
  firstName?: string;    // opcional
  lastName?: string;     // opcional
  phone?: string;        // {{1.phone}}
  email?: string;        // {{1.email}}
  edad?: string;         // {{1.edad}}
  ttlMinutes?: number;   // por defecto 7 días
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.contactId || !body?.eventId) {
      return NextResponse.json(
        { ok: false, error: "Missing contactId or eventId" },
        { status: 400 }
      );
    }

    // TTL por defecto: 7 días
    const ttlMinutes = body.ttlMinutes && body.ttlMinutes > 0 ? body.ttlMinutes : 60 * 24 * 7;

    // Normaliza nombre completo si solo llegan first/last
    const name =
      (body.fullName && body.fullName.trim()) ||
      [body.firstName, body.lastName].filter(Boolean).join(" ").trim() ||
      undefined;

    const now = Date.now();
    const payload = {
      // Mantengo las mismas claves que usabas antes + meta
      contactId: body.contactId,
      eventId: body.eventId,
      iat: now,
      exp: now + ttlMinutes * 60 * 1000,
      meta: {
        fullName: name,
        phone: body.phone,
        email: body.email,
        edad: body.edad,
      },
    };

    const token = sign(payload);

    // Debe estar configurada en Vercel sin slash final, ej:
    // PUBLIC_BASE_URL=https://generadorqr-beta.vercel.app
    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

    const inviteUrl = `${baseUrl}/invite?token=${encodeURIComponent(token)}`;

    // Útil para pruebas locales (la mayoría de ESP no renderiza data URLs)
    const qrDataUrl = await toDataURL(inviteUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    });

    // URL pública del PNG para plantillas de email
    const qrPngUrl = `${baseUrl}/api/qr.png?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      ok: true,
      inviteUrl,
      qrDataUrl,
      qrPngUrl,
      token,
      ttlMinutes,
    });
  } catch (e: unknown) {
    console.error("QR route error:", e);
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
