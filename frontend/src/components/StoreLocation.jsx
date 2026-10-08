import { MapPin, Navigation, MessageCircle } from "lucide-react";
import { BRAND, waLink } from "@/constants/brand";
import { Reveal } from "@/components/Reveal";
import { BusinessHours } from "@/components/BusinessHours";
import { getMapsConfiguration } from "@/lib/maps";

export function StoreLocation() {
  const { links: maps } = getMapsConfiguration(BRAND.address);
  return (
  <section
    id="localizacao"
    aria-labelledby="location-title"
    data-testid="location-section"
    className="scroll-mt-24 border-t border-brand-border py-20 sm:py-28"
  >
    <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-3 lg:gap-12">
      <Reveal>
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-lime sm:text-sm">
          <MapPin className="h-4 w-4" aria-hidden="true" /> Localização
        </p>
        <h2
          id="location-title"
          data-testid="location-title"
          className="mt-3 font-display text-4xl font-extrabold uppercase leading-none text-brand-text sm:text-5xl"
        >
          Seu destino é a <span className="italic text-brand-lime">MG CAR</span>
        </h2>
        <address data-testid="store-address" className="mt-6 text-sm not-italic leading-relaxed text-brand-muted sm:text-base">
          {BRAND.address}
        </address>
        <div className="mt-7 border-t border-brand-border pt-6">
          <BusinessHours testIdPrefix="location" />
        </div>
        {maps && (
        <a
          data-testid="location-directions-link"
          href={maps.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Como chegar à MG CAR — abrir rotas no Google Maps"
          className="mt-7 inline-flex items-center justify-center gap-2.5 rounded-xl bg-brand-lime px-6 py-3.5 font-display text-lg font-bold uppercase text-brand-bg transition-[transform,background-color] hover:-translate-y-1 hover:bg-brand-limehover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-lime active:translate-y-0"
        >
          <Navigation className="h-5 w-5 shrink-0" aria-hidden="true" /> Como chegar
        </a>
        )}
      </Reveal>
      <div className="min-w-0 lg:col-span-2" data-testid="location-map-container">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-brand-border bg-brand-card sm:aspect-[16/9]" data-lenis-prevent>
          {maps ? <iframe
            data-testid="location-google-map"
            title="Google Maps — MG CAR Veículos, R. Pedro Freire de Mendonça, 263, João Pessoa"
            src={maps.embedUrl}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          /> : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-5 text-center">
              <MapPin className="h-7 w-7 text-brand-lime" aria-hidden="true" />
              <p data-testid="location-map-unavailable" role="status" className="text-sm text-brand-muted">Mapa indisponível no momento.</p>
              <a data-testid="location-map-whatsapp-link" href={waLink("Olá! Preciso de ajuda para chegar à MG CAR.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-lime underline underline-offset-4 transition-colors hover:text-brand-text">
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> Falar com a loja
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
  );
}