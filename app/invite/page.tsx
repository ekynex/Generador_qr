// app/invite/page.tsx
import Image from "next/image";
import { verify, isExpired } from "@/lib/token";

type InvitePayload = {
  contactId: string;
  eventId: string;
  iat: number;
  exp: number;
  meta?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

// Formato DD/MM/AA
function formatDDMMYY(ms: number) {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export default function InvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  try {
    const token = searchParams?.token || "";
    if (!token) throw new Error("Falta token");

    const data = verify<InvitePayload>(token);
    if (!data || typeof data.exp !== "number" || isExpired(data.exp)) {
      throw new Error("Token expirado");
    }

    const m = data.meta ?? {};
    const nombre = m.fullName || [m.firstName, m.lastName].filter(Boolean).join(" ");

    // RUTAS DE IMAGEN (colócalas en /public/img/)
    const logoUrl = "/img/logo.png";
    const bgUrl = "/img/background.png";

    // Contenedor a pantalla completa con background
    const outerStyle: React.CSSProperties = {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      backgroundImage: `url(${bgUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };

    // Tarjeta centrada
    const cardStyle: React.CSSProperties = {
      width: "100%",
      maxWidth: 720,
      background: "rgba(255,255,255,0.92)",
      borderRadius: 16,
      padding: 32,
      boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
    };

    return (
      <div style={outerStyle}>
        <main style={cardStyle}>
          {/* LOGO arriba del texto */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Image
              src={logoUrl}
              alt="Logo"
              width={160}
              height={56}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          <h1 style={{ fontSize: 28, marginBottom: 12, textAlign: "center" }}>
            ✅ Invitación válida
          </h1>

          <div style={{ margin: "0 auto", maxWidth: 520, lineHeight: 1.5 }}>
            <p>
              <strong>Evento:</strong> {data.eventId}
            </p>
            <p>
              <strong>Nombre:</strong> {nombre || "—"}
            </p>
            <p>
              <strong>Correo:</strong> {m.email ?? "—"}
            </p>
            <p style={{ marginTop: 16 }}>
              <strong>Válido hasta:</strong> {formatDDMMYY(data.exp)}
            </p>
          </div>
        </main>
      </div>
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Token inválido";
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(135deg,#fff1f1 0%,#fff 100%)",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: 720,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
          }}
        >
          <h1 style={{ color: "#b00020", textAlign: "center" }}>❌ Invitación no válida</h1>
          <p style={{ textAlign: "center" }}>{msg}</p>
        </main>
      </div>
    );
  }
}
