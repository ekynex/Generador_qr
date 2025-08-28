import { verify, isExpired } from "@/lib/token";

type InvitePayload = {
  contactId: string;
  eventId: string;
  iat: number;
  exp: number; // seguimos validando expiración aunque no la mostremos
  meta?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

export default function InvitePage({ searchParams }: { searchParams: { token?: string } }) {
  try {
    const token = searchParams?.token || "";
    if (!token) throw new Error("Falta token");

    const data = verify<InvitePayload>(token);

    // Seguridad: mantenemos el control de vigencia aunque no se muestre en UI
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
