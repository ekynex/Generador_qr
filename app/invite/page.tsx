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
  <>
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

      <p className="column-text-2">
        {nombre ? `${nombre} • ` : ""}
        {data.eventId}
        {" • "}
        Válido hasta: {formatDDMMYY(data.exp)}
      </p>
    </div>

    {/* Reset mínimo para asegurar que ocupe toda la pantalla sin márgenes */}
    <style jsx global>{`
      html,
      body {
        margin: 0;
        padding: 0;
        height: 100%;
      }
    `}</style>

    {/* CSS del nuevo layout */}
    <style jsx>{`
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
        .column-image {
          width: 80%;
        }
        .column-text {
          font-size: 1.8rem;
        }
        .column-text-2 {
          font-size: 1.6rem;
        }
      }

      @media (max-width: 480px) {
        .column-image {
          width: 100%;
        }
        .column-text {
          font-size: 1.4rem;
        }
        .column-text-2 {
          font-size: 1.1rem;
        }
      }
    `}</style>
  </>
);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Token inválido";
    return (
  <>
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

    <style jsx global>{`
      html,
      body {
        margin: 0;
        padding: 0;
        height: 100%;
      }
    `}</style>

    <style jsx>{`
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
        .column-image {
          width: 80%;
        }
        .column-text {
          font-size: 1.8rem;
        }
        .column-text-2 {
          font-size: 1.6rem;
        }
      }

      @media (max-width: 480px) {
        .column-image {
          width: 100%;
        }
        .column-text {
          font-size: 1.4rem;
        }
        .column-text-2 {
          font-size: 1.1rem;
        }
      }
    `}</style>
  </>
);
