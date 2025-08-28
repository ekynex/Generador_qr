// app/invite/page.tsx
import { verify } from "@/lib/token";

type Props = { searchParams: { token?: string } };

export default function InvitePage({ searchParams }: Props) {
  try {
    const token = searchParams?.token || "";
    if (!token) throw new Error("Falta token");

    // El verify debe devolverte { sub, evt, exp, meta? }
    const data = verify(token) as {
      sub: string;
      evt: string;
      exp: number;
      meta?: {
        fullName?: string;
        phone?: string;
        email?: string;
        edad?: string;
      };
    };

    if (!data || typeof data.exp !== "number" || Date.now() > data.exp) {
      throw new Error("Token expirado");
    }

    const { fullName, phone, email, edad } = data.meta ?? {};

    return (
      <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>✅ Invitación válida</h1>
        <p><strong>Evento:</strong> {data.evt}</p>
        <p><strong>Nombre:</strong> {fullName ?? "—"}</p>
        <p><strong>Teléfono:</strong> {phone ?? "—"}</p>
        <p><strong>Correo:</strong> {email ?? "—"}</p>
        <p><strong>Edad:</strong> {edad ?? "—"}</p>
        <p><strong>Válido hasta:</strong> {new Date(data.exp).toLocaleString()}</p>
      </main>
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Token inválido";
    return (
      <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
        <h1 style={{ color: "#b00020" }}>❌ Invitación no válida</h1>
        <p>{msg}</p>
      </main>
    );
  }
}
