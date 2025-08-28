import type { NextRequest } from "next/server";
import { toBuffer } from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token  = url.searchParams.get("token");
    const invite = url.searchParams.get("invite");

    const baseUrl = process.env.PUBLIC_BASE_URL!;
    const inviteUrl =
      invite ?? (token ? `${baseUrl}/invite?token=${encodeURIComponent(token)}` : "");

    if (!inviteUrl) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing token or invite" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // 1) Genera el PNG como Buffer (Node)
    const buf = await toBuffer(inviteUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    });

    // 2) Convierte a Uint8Array (sin tipos explícitos)
    const bytes = new Uint8Array(buf);

    // 3) Responde como imagen PNG
    return new Response(bytes, {
      headers: {
        "content-type": "image/png",
        "content-length": String(bytes.byteLength),
        "cache-control": "public, max-age=31536000, immutable",
        "content-disposition": 'inline; filename="qr.png"',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "bad request" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }
}
