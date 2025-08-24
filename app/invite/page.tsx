import { verify, isExpired } from "@/lib/token"

export default function InvitePage({ searchParams }: { searchParams: { token?: string } }) {
  try {
    const token = searchParams?.token || ""
    if (!token) throw new Error("Falta token")
    const data = verify(token)
    if (isExpired(data.exp)) throw new Error("Token expirado")

    return (
      <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>✅ Invitación válida</h1>
        <p><strong>Evento:</strong> {data.eventId}</p>
        <p><strong>Contacto:</strong> {data.contactId}</p>
        <p><strong>Válido hasta:</strong> {new Date(data.exp).toLocaleString()}</p>
      </main>
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Token inválido"
    return (
      <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
        <h1 style={{ color: "#b00020" }}>❌ Invitación no válida</h1>
        <p>{msg}</p>
      </main>
    )
  }
}
