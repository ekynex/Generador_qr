import { NextRequest, NextResponse } from "next/server";
import { toDataURL } from "qrcode";
import { sign } from "@/lib/token";

type Body = {
  contactId: string;              // requerido
  eventId: string;                // requerido
  ttlMinutes?: number;            // opcional (fallback si no envías expiresAt)
  expiresAt?: string;             // opcional (ISO 8601, p.ej. "2025-10-01T23:59:59-05:00")

  // meta opcional
  fullName?: string;
  first_name?: string;
  last_name?: string;
  email?: string;

  // campos que quizá mantengas más adelante (opcionales)
  tipo_de_organizacion?: string;
  institucion?: string;
  cargo?: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // --- Parseo de JSON con manejo de error claro ---
    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body. Use Content-Type: application/json." },
        { status: 400 }
      );
    }

    // --- Validaciones mínimas ---
    if (!body?.contactId || !body?.eventId) {
      return NextResponse.json(
        { ok: false, error: "Missing contactId or eventId" },
        { status: 400 }
      );
    }

    // --- Normalización de nombre completo ---
    const fullName =
      (body.fullName && body.fullName.trim()) ||
      [body.first_name, body.last_name].filter(Boolean).join(" ").trim() ||
      undefined;

    // --- Cálculo de expiración: prioridad a expiresAt; fallback a ttlMinutes ---
    const ttl = body.ttlMinutes && body.ttlMinutes > 0 ? body.ttlMinutes : 60 * 24 * 7; // 7 días
    let expMs: number;

    if (body.expiresAt) {
      const parsed = Date.parse(body.expiresAt);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json(
          { ok: false, error: "expiresAt inválido. Usa ISO 8601, ej: 2025-10-01T23:59:59-05:00" },
          { status: 400 }
        );
      }
      if (parsed <= Date.now()) {
        return NextResponse.json(
          { ok: false, error: "expiresAt está en el pasado" },
          { status: 400 }
        );
      }
      expMs = parsed;
    } else {
      expMs = Date.now() + ttl * 60 * 1000;
    }

    // --- Payload que firmamos en el token ---
    const payload = {
      contactId: body.contactId,
      eventId: body.eventId,
      iat: Date.now(),
      exp: expMs,
      meta: {
        fullName,
        firstName: body.first_name,
        lastName: body.last_name,
        email: body.email,
        // si en el futuro reactivas estos campos, aquí quedan:
        tipoOrganizacion: body.tipo_de_organizacion,
        institucion: body.institucion,
        cargo: body.cargo,
      },
    };

    const token = sign(payload);

    // Configura en Vercel: PUBLIC_BASE_URL=https://tu-app.vercel.app (sin slash final)
    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

    const inviteUrl = `${baseUrl}/invite?token=${encodeURIComponent(token)}`;

    // Data URL útil en pruebas locales (la mayoría de ESP no la renderiza)
    const qrDataUrl = await toDataURL(inviteUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    });

    // PNG público para emails
    const qrPngUrl = `${baseUrl}/api/qr.png?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      ok: true,
      inviteUrl,
      qrDataUrl,
      qrPngUrl,
      token,
      ttlMinutes: ttl,
    });
  } catch (e: unknown) {
    console.error("QR route error:", e);
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
