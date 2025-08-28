import { NextRequest, NextResponse } from "next/server";
import { toDataURL } from "qrcode";
import { sign } from "@/lib/token";

type Body = {
  contactId: string;          // {{1.contact_id}}
  eventId: string;            // "Reto20K", u otro
  ttlMinutes?: number;        // ej. 10080 (7 días)

  // Nuevos campos del formulario (valores crudos)
  // Aceptamos ambas variantes con/sin tilde por robustez:
  "tipo_de_organización"?: string;
  "tipo_de_organizacion"?: string;

  institucion?: string;       // {{1.institucion}}
  first_name?: string;        // {{1.first_name}}
  last_name?: string;         // {{1.last_name}}
  cargo?: string;             // {{1.cargo}}
  email?: string;             // {{1.email}}
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

    const ttlMinutes = body.ttlMinutes && body.ttlMinutes > 0 ? body.ttlMinutes : 60 * 24 * 7;

    // Normalizamos nombre completo
    const fullName = [body.first_name, body.last_name].filter(Boolean).join(" ").trim() || undefined;

    // Normalizamos "tipo de organización"
    const tipoOrganizacion =
      (body["tipo_de_organización"] && body["tipo_de_organización"]!.trim()) ||
      (body["tipo_de_organizacion"] && body["tipo_de_organizacion"]!.trim()) ||
      undefined;

    const now = Date.now();
    const payload = {
      // mantenemos las mismas claves base que ya usabas
      contactId: body.contactId,
      eventId: body.eventId,
      iat: now,
      exp: now + ttlMinutes * 60 * 1000,

      // los datos del formulario van en meta
      meta: {
        tipoOrganizacion,
        institucion: body.institucion,
        firstName: body.first_name,
        lastName: body.last_name,
        fullName,
        cargo: body.cargo,
        email: body.email,
      },
    };

    const token = sign(payload);

    // Configura en Vercel: PUBLIC_BASE_URL=https://tu-app.vercel.app (sin slash final)
    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

    const inviteUrl = `${baseUrl}/invite?token=${encodeURIComponent(token)}`;
    const qrDataUrl = await toDataURL(inviteUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    });
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
