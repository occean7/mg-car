import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CarFront,
  MessageCircle,
  Instagram,
  Calendar,
  Gauge,
  Cog,
  Fuel,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { BRAND, waLink, formatPrice, formatKm } from "@/constants/brand";
import { Reveal } from "@/components/Reveal";
import { VehicleGallery } from "@/components/VehicleGallery";

const STATUS_LABELS = { disponivel: "Disponível", reservado: "Reservado" };

function VehicleCard({ vehicle }) {
  const interestMsg = `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year} que vi no site da MG CAR Veículos.`;
  return (
    <motion.article
      data-testid={`vehicle-card-${vehicle.id}`}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-card transition-colors hover:border-brand-lime/60"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-bg">
        <VehicleGallery vehicle={vehicle} />
        <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
          {vehicle.featured && (
            <span className="rounded-full bg-brand-lime px-3 py-1 font-display text-xs font-bold uppercase tracking-wider text-brand-bg">
              Destaque
            </span>
          )}
          {vehicle.status === "reservado" && (
            <span className="rounded-full border border-brand-border bg-black/70 px-3 py-1 font-display text-xs font-bold uppercase tracking-wider text-brand-text backdrop-blur-sm">
              {STATUS_LABELS.reservado}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-faint">
          {vehicle.year}{vehicle.color ? ` · ${vehicle.color}` : ""}
        </p>
        <h3 className="mt-1.5 font-display text-2xl font-extrabold uppercase leading-tight tracking-wide text-brand-text">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="mt-2 font-display text-3xl font-extrabold tracking-wide text-brand-lime" data-testid={`vehicle-price-${vehicle.id}`}>
          {formatPrice(vehicle.price)}
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-brand-muted">
          <li className="inline-flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-brand-lime" /> {formatKm(vehicle.km)}</li>
          <li className="inline-flex items-center gap-1.5"><Cog className="h-3.5 w-3.5 text-brand-lime" /> {vehicle.transmission}</li>
          <li className="inline-flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5 text-brand-lime" /> {vehicle.fuel}</li>
          <li className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-brand-lime" /> {vehicle.year}</li>
        </ul>

        {vehicle.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-brand-faint">{vehicle.description}</p>
        )}

        <a
          data-testid={`vehicle-interest-btn-${vehicle.id}`}
          href={waLink(interestMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-brand-lime/50 px-4 py-3 font-display text-base font-bold uppercase tracking-wider text-brand-lime transition-colors hover:bg-brand-lime hover:text-brand-bg"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.4} /> Tenho interesse
        </a>
      </div>
    </motion.article>
  );
}

export default function Estoque() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get("/vehicles")
      .then((res) => setVehicles(res.data))
      .catch(() => setError("Não foi possível carregar o estoque agora. Tente novamente em instantes."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter((v) =>
    `${v.brand} ${v.model} ${v.year}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36" data-testid="estoque-page">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-lime sm:text-sm">Estoque MG CAR</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-none tracking-tight text-brand-text sm:text-6xl lg:text-7xl">
          Carros <span className="italic text-brand-lime">disponíveis</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-brand-muted sm:text-lg">
          Seleção atualizada da MG CAR em João Pessoa - PB. Também anunciamos no Instagram e na OLX.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="relative mt-9 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-faint" />
          <input
            data-testid="stock-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por marca, modelo ou ano..."
            className="w-full rounded-xl border border-brand-border bg-brand-card py-3.5 pl-11 pr-4 text-sm text-brand-text placeholder:text-brand-faint transition-colors focus:border-brand-lime focus:outline-none"
          />
        </div>
      </Reveal>

      {loading && (
        <div className="mt-16 flex items-center justify-center gap-3 text-brand-muted" data-testid="stock-loading">
          <Loader2 className="h-5 w-5 animate-spin text-brand-lime" /> Carregando estoque...
        </div>
      )}

      {!loading && error && (
        <p className="mt-16 text-center text-sm text-brand-muted" data-testid="stock-error">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Reveal className="mt-14">
          <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-brand-border bg-brand-card px-8 py-14 text-center" data-testid="stock-empty-state">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-border bg-brand-bg">
              <CarFront className="h-8 w-8 text-brand-lime" strokeWidth={1.8} />
            </div>
            <h2 className="mt-6 font-display text-3xl font-extrabold uppercase tracking-wide text-brand-text">
              Estoque sendo abastecido
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">
              Estamos atualizando a seleção de carros da MG CAR. Fale com a gente no WhatsApp
              ou acompanhe o Instagram para ver as novidades em primeira mão.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                data-testid="stock-empty-whatsapp-btn"
                href={waLink("Olá! Quero saber quais carros estão disponíveis no estoque da MG CAR.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-lime px-6 py-3.5 font-display text-base font-bold uppercase tracking-wider text-brand-bg transition-colors hover:bg-brand-limehover"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2.4} /> Chamar no WhatsApp
              </a>
              <a
                data-testid="stock-empty-instagram-btn"
                href={BRAND.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-6 py-3.5 font-display text-base font-bold uppercase tracking-wider text-brand-text transition-colors hover:border-brand-lime hover:text-brand-lime"
              >
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            </div>
          </div>
        </Reveal>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="stock-grid">
          {filtered.map((vehicle, i) => (
            <Reveal key={vehicle.id} delay={Math.min(i * 0.06, 0.3)}>
              <VehicleCard vehicle={vehicle} />
            </Reveal>
          ))}
        </div>
      )}

    </div>
  );
}
