import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Instagram, Store, MapPin } from "lucide-react";
import { BRAND } from "@/constants/brand";
import { scrollToSection } from "@/lib/scroll";
import { getMapsConfiguration } from "@/lib/maps";
import { BusinessHours } from "@/components/BusinessHours";

export default function SiteFooter() {
  const location = useLocation();
  const navigate = useNavigate();
  const { links: maps } = getMapsConfiguration(BRAND.address);

  const goSection = (id) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(id), 180);
    } else {
      scrollToSection(id);
    }
  };

  return (
    <footer className="border-t border-brand-border bg-brand-pure" data-testid="site-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={BRAND.logo} alt="Logo MG CAR Veículos" className="h-11 w-11 rounded-lg border border-brand-border object-cover" loading="lazy" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-2xl font-extrabold uppercase tracking-wide text-brand-text">MG CAR</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-lime">Veículos</span>
            </span>
          </div>
          <p className="mt-4 font-display text-lg font-bold uppercase tracking-wider text-brand-muted">{BRAND.slogan}</p>
          <address className="mt-3 text-sm not-italic leading-relaxed text-brand-muted">
            {maps ? <a data-testid="footer-address-link" href={maps.directionsUrl} target="_blank" rel="noopener noreferrer" aria-label="Endereço da MG CAR — abrir rotas no Google Maps" className="inline-flex items-start gap-2 transition-colors hover:text-brand-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-lime" aria-hidden="true" />
              {BRAND.address}
            </a> : <span data-testid="footer-address-text">{BRAND.address}</span>}
          </address>
        </div>

        <div>
          <h3 className="font-display text-base font-bold uppercase tracking-[0.2em] text-brand-faint">Navegação</h3>
          <ul className="mt-4 space-y-2.5">
            <li><button data-testid="footer-link-servicos" onClick={() => goSection("servicos")} className="text-sm text-brand-muted transition-colors hover:text-brand-lime">Serviços</button></li>
            <li><button data-testid="footer-link-loja" onClick={() => goSection("a-loja")} className="text-sm text-brand-muted transition-colors hover:text-brand-lime">A loja</button></li>
            <li><Link data-testid="footer-link-estoque" to="/estoque" className="text-sm text-brand-muted transition-colors hover:text-brand-lime">Estoque</Link></li>
            <li><button data-testid="footer-link-localizacao" onClick={() => goSection("localizacao")} className="text-sm text-brand-muted transition-colors hover:text-brand-lime">Localização</button></li>
            <li><button data-testid="footer-link-contato" onClick={() => goSection("contato")} className="text-sm text-brand-muted transition-colors hover:text-brand-lime">Contato</button></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-base font-bold uppercase tracking-[0.2em] text-brand-faint">Contato</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-brand-muted">
            <li>
              <a data-testid="footer-whatsapp-link" href={BRAND.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-brand-lime">
                <MessageCircle className="h-4 w-4 text-brand-lime" /> {BRAND.whatsappDisplay}
              </a>
            </li>
            <li>
              <a data-testid="footer-instagram-link" href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-brand-lime">
                <Instagram className="h-4 w-4 text-brand-lime" /> {BRAND.instagramHandle}
              </a>
            </li>
            <li className="inline-flex items-center gap-2">
              <Store className="h-4 w-4 text-brand-lime" /> Também anunciamos na OLX
            </li>
          </ul>
        </div>
        <BusinessHours testIdPrefix="footer" />
      </div>

      <div className="border-t border-brand-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-5 py-5 sm:flex-row sm:items-center sm:px-8">
          <p className="text-xs text-brand-faint" data-testid="footer-copyright">© {new Date().getFullYear()} MG CAR Veículos · João Pessoa - PB</p>
          <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-brand-faint">Vende · Troca · Compra · Financia</p>
        </div>
      </div>
    </footer>
  );
}
