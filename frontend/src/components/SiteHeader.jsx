import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle } from "lucide-react";
import { BRAND, waLink } from "@/constants/brand";
import { scrollToSection } from "@/lib/scroll";

const NAV = [
  { label: "Serviços", section: "servicos", testid: "nav-link-servicos" },
  { label: "A loja", section: "a-loja", testid: "nav-link-loja" },
  { label: "Estoque", path: "/estoque", testid: "nav-link-estoque" },
  { label: "Localização", section: "localizacao", testid: "nav-link-localizacao" },
  { label: "Contato", section: "contato", testid: "nav-link-contato" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (item) => {
    setOpen(false);
    if (item.path) {
      navigate(item.path);
      return;
    }
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToSection(item.section), 180);
    } else {
      scrollToSection(item.section);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border/80 bg-brand-bg/85 backdrop-blur-xl" data-testid="site-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" className="flex items-center gap-3" data-testid="brand-logo-link" aria-label="MG CAR Veículos - Início">
          <img src={BRAND.logo} alt="Logo MG CAR Veículos" className="h-10 w-10 rounded-lg border border-brand-border object-cover" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-2xl font-extrabold uppercase tracking-wide text-brand-text">MG CAR</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-lime">Veículos</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {NAV.map((item) => (
            <button
              key={item.testid}
              data-testid={item.testid}
              onClick={() => handleNav(item)}
              className="font-display text-base font-bold uppercase tracking-wider text-brand-muted transition-colors hover:text-brand-lime"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <motion.a
            data-testid="header-whatsapp-cta"
            href={waLink("Olá! Vim pelo site da MG CAR e quero saber mais sobre os carros.")}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="hidden items-center gap-2 rounded-xl bg-brand-lime px-5 py-2.5 font-display text-base font-bold uppercase tracking-wider text-brand-bg transition-colors hover:bg-brand-limehover sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
            WhatsApp
          </motion.a>
          <button
            data-testid="mobile-menu-btn"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border text-brand-text lg:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-brand-border bg-brand-bg/95 backdrop-blur-xl lg:hidden"
            aria-label="Menu móvel"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV.map((item) => (
                <button
                  key={item.testid}
                  data-testid={`mobile-${item.testid}`}
                  onClick={() => handleNav(item)}
                  className="rounded-xl px-4 py-3 text-left font-display text-xl font-bold uppercase tracking-wider text-brand-text transition-colors hover:bg-brand-card hover:text-brand-lime"
                >
                  {item.label}
                </button>
              ))}
              <a
                data-testid="mobile-header-whatsapp-cta"
                href={waLink("Olá! Vim pelo site da MG CAR e quero saber mais sobre os carros.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-lime px-5 py-3.5 font-display text-lg font-bold uppercase tracking-wider text-brand-bg"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                Falar no WhatsApp
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
