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

// CSS (sin styled-jsx) para evitar issues en Server Components
const PAGE_CSS = `
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
  }

  .column-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100dvh;
    margin: 0 auto;

    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }

  .column-image {
    width: 60%;
    height: auto;
  }

  .column-text {
    text-align: center;
    font-size: 2rem;
    font-weight: 800;
    color: #333;
    margin: 10px 0;
  }

  .column-text-2 {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 800;
    color: #333;
    margin: 10px 0;
  }

  @media (max-width: 768px) {
    .column-image { width: 80%; }
    .column-text { font-size: 1.8rem; }
    .column-text-2 { font-size: 1.6rem; }
  }

  @media (max-width: 480px) {
    .column-image { width: 100%; }
    .column-text { font-size: 1.4rem; }
    .column-text-2 { font-size: 1.1rem; }
  }
`;

export default async function InvitePage({
  searchParams,
}: {
  // ✅ Next 15 puede entregarlo como Promise
  searchParams:
    | { token?: string; logo?: string; bg?: string }
    | Promise<{ token?: string; logo?: string; bg?: string }>;
}) {
  // ✅ compatible si viene como objeto o como Promise
  const sp = await Promise.resolve(searchParams);

  try {
    const token = sp?.token || "";
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
    const capWords = (s = "") => s.trim().split(/\s+/).map(cap).join(" ");

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
    const logoUrl = sp.logo || "/img/nombre_de_evento.png";
    const bgUrl = sp.bg || "/img/fondo_sin_franja_marron.png";

    return (
      <>
        <style>{PAGE_CSS}</style>

        <div
          className="column-container"
          style={{
            backgroundImage: `url(${bgUrl})`,
          }}
        >
          <Image
            src={logoUrl}
            alt="Logo"
            width={1200}
            height={600}
            className="column-image"
            priority
          />

          <p className="column-text">Registro confirmado</p>

          <p className="column-text-2">{nombre || ""}</p>
        </div>
      </>
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Token inválido";

    // En error uso imágenes locales fijas para evitar depender del query
    // (si prefieres que también sea dinámico con sp.bg/sp.logo, te lo cambio)
    return (
      <>
        <style>{PAGE_CSS}</style>

        <div
          className="column-container"
          style={{
            backgroundImage: `url(/img/background.png)`,
          }}
        >
          <Image
            src={"/img/logo.png"}
            alt="Logo"
            width={1200}
            height={600}
            className="column-image"
            priority
          />

          <p className="column-text">Invitación no válida</p>
          <p className="column-text-2">{msg}</p>
        </div>
      </>
    );
  }
}
