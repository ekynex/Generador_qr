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

// Zona horaria para mostrar la fecha (ajústala si necesitas)
const TZ = process.env.NEXT_PUBLIC_INVITE_TZ || "America/Lima";

// Formato DD/MM/AA respetando la zona horaria elegida
function formatDDMMYY(ms: number, tz: string = TZ) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(ms));
}

export default function InvitePage({
  searchParams,
}: {
  searchParams: { token?: string; logo?: string; bg?: string };
}) {
  try {
    const token = searchParams?.token || "";
    if (!token) throw new Error("Falta token");

    const data = verify<InvitePayload>(token);
    if (!data || typeof data.exp !== "number" || isExpired(data.exp)) {
      throw new Error("Token expirado");
    }

    const m = data.meta ?? {};

    // Capitaliza 1 palabra
    const cap = (s = "") =>
      s
        ? s.charAt(0).toLocaleUpperCase("es-ES") +
        s.slice(1).toLocaleLowerCase("es-ES")
        : "";

    // Capitaliza TODAS las palabras de un string
    const capWords = (s = "") =>
      s.trim().split(/\s+/).map(cap).join(" ");

    // Arma el nombre final (soporta múltiples nombres y apellidos)
    let nombre = "";
    if (m.firstName || m.lastName) {
      const first = capWords(m.firstName ?? "");
      const last = capWords(m.lastName ?? "");
      nombre = [first, last].filter(Boolean).join(" ").trim();
    } else if (m.fullName) {
      nombre = capWords(m.fullName);
    }

    // Rutas de imágenes (ponlas en /public/img/)
    const logoUrl = searchParams.logo || "/img/logo.png";
    const bgUrl = searchParams.bg || "/img/background.png";

    return (
      <div
        style={{
          minHeight: "100dvh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* BACKGROUND: capa fija por detrás */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <Image src={bgUrl} alt="Background" fill priority style={{ objectFit: "cover" }} />
          {/* Oscurecedor MUY suave, por debajo del contenido */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.06)",
            }}
          />
        </div>

        {/* CONTENIDO centrado, por encima del fondo */}
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            position: "relative",
            zIndex: 10,
          }}
        >
          <main
            style={{
              width: "100%",
              maxWidth: 720,
              background: "#ffffff",                 // <— sólido para evitar “lavado”
              color: "#111827",                      // <— texto oscuro consistente
              borderRadius: 16,
              padding: 32,
              boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
            }}
          >
            {/* LOGO */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <Image
                src={logoUrl}
                alt="Logo"
                width={180}
                height={64}
                style={{ objectFit: "contain" }}
                priority
              />
            </div>

            <h1 style={{ fontSize: 28, marginBottom: 12, textAlign: "center" }}>
              ✅ Invitación válida
            </h1>

            <div style={{ margin: "0 auto", maxWidth: 520, lineHeight: 1.6 }}>
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
      </div>
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Token inválido";
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "linear-gradient(135deg,#fff1f1 0%,#fff 100%)",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#ffffff",
            color: "#111827",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
          }}
        >
          <h1 style={{ color: "#b00020", textAlign: "center" }}>❌ Invitación no válida</h1>
          <p style={{ textAlign: "center" }}>{msg}</p>
        </main>
      </div>
    );
  }
}
