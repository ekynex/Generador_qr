import { verify, isExpired } from "@/lib/token";

type InvitePayload = {
  contactId: string;
  eventId: string;
  iat: number;
  exp: number; // seguimos validando expiración aunque no siempre la mostremos
  meta?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    tipoOrganizacion?: string;
    institucion?: string;
    cargo?: string;
  };
};

// Formateador DD/MM/AA (sin hora)
function formatDDMMYY(dateMs: number): string {
  const d = new Date(dateMs);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export default function InvitePage({ searchParams }: { searchParams: { token?: string } }) {
  try {
    const token = searchParams?.token || "";
    if (!token) throw new Error("Falta token");

    const data = verify<InvitePayload>(token);

    // Seguridad: validamos vigencia (aunque no muestres la fecha puedes mantener el control)
    if (!data || typeof data.exp !== "number" || isExpired(data.exp)) {
      throw new Error("Token expirado");
    }

    const m = data.meta ?? {};
    const nombre = m.fullName || [m.firstName, m.lastName].filter(Boolean).join(" ");

    return (
      <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>✅ Invitación válida</h1>

        <p><strong>Evento:</strong> {data.eventId}</p>
        <p><strong>Nombre:</strong> {nombre || "—"}</p>
        <p><strong>Correo:</strong> {m.email ?? "—"}</p>

        {/* Si deseas mostrar la vigencia, queda en DD/MM/AA */}
        <p style={{ marginTop: 16 }}>
          <strong>Válido hasta:</strong> {formatDDMMYY(data.exp)}
        </p>

        {/* Si prefieres ocultarla, elimina el bloque anterior */}
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
