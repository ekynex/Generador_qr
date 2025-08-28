import { verify } from "@/lib/token";

type InvitePayload = {
  contactId: string;
  eventId: string;
  iat: number;
  exp: number;
  meta?: {
    tipoOrganizacion?: string;
    institucion?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    cargo?: string;
    email?: string;
  };
};

export default function InvitePage({ searchParams }: { searchParams: { token?: string } }) {
  try {
    const token = searchParams?.token || "";
    if (!token) throw new Error("Falta token");

    const data = verify<InvitePayload>(token);
    if (!data || typeof data.exp !== "number" || Date.now() > data.exp) {
      throw new Error("Token expirado");
    }

    const m = data.meta ?? {};
    const nombreParaMostrar = m.fullName || [m.firstName, m.lastName].filter(Boolean).join(" ");

    return (
      <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>✅ Invitación válida</h1>

        <p><strong>Evento:</strong> {data.eventId}</p>
        <p><strong>Tipo de organización:</strong> {m.tipoOrganizacion ?? "—"}</p>
        <p><strong>Institución:</strong> {m.institucion ?? "—"}</p>
        <p><strong>Nombre:</strong> {nombreParaMostrar || "—"}</p>
        <p><strong>Cargo:</strong> {m.cargo ?? "—"}</p>
        <p><strong>Correo:</strong> {m.email ?? "—"}</p>

        <p style={{ marginTop: 16 }}>
          <strong>Válido hasta:</strong> {new Date(data.exp).toLocaleString()}
        </p>
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
