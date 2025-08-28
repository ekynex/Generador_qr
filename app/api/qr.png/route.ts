import { NextRequest } from "next/server";
import { toBuffer } from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Opción A: texto libre ya armado (si lo recibimos como ?invite=...)
    const inviteText = url.searchParams.get("invite");

    // Opción B: campos sueltos (del formulario) para componer el texto
    const eventId   = url.searchParams.get("event")      || url.searchParams.get("eventId") || "";
    const fullName  = url.searchParams.get("full_name")  || url.searchParams.get("name")    || "";
    const phone     = url.searchParams.get("phone")      || "";
    const email     = url.searchParams.get("email")      || "";
    const edad      = url.searchParams.get("edad")       || "";

    // Opción C: si no hay nada de lo anterior, caemos al token -> link de invitación
    const token     = url.searchParams.get("token")      || "";

    let content = "";

    if (inviteText) {
      // Si viene ?invite=..., ese texto se vuelve el contenido del QR
      content = inviteText;
    } else if (fullName || phone || email || edad || eventId) {
      // Si vienen campos sueltos, armamos un bloque de texto bonito
      const lines = [
        eventId && `Evento: ${eventId}`,
        fullName && `Nombre: ${fullName}`,
        phone && `Teléfono: ${phone}`,
        email && `Correo: ${email}`,
        edad && `Edad: ${edad}`,
      ].filter(Boolean);
      content = lines.join("\n");
    } else if (token) {
      // Fallback: QR con el link de invitación (como estaba antes)
      const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
      content = `${baseUrl}/invite?token=${encodeURIComponent(token)}`;
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing data" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Generamos PNG
    const buf = await toBuffer(content, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    });

    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "bad request" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }
}
