import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Car,
  Repeat,
  Banknote,
  ShieldCheck,
  MessageCircle,
  Instagram,
  MapPin,
  ArrowUpRight,
  BadgeCheck,
  Store,
} from "lucide-react";
import { BRAND, waLink } from "@/constants/brand";
import Marquee from "@/components/Marquee";
import { Reveal } from "@/components/Reveal";
import { StoreLocation } from "@/components/StoreLocation";

const EASE = [0.22, 1, 0.36, 1];

const HEADLINE = [
  { text: "SEU PRÓXIMO", cls: "text-brand-text" },
  { text: "CARRO", cls: "italic text-brand-lime" },
  { text: "COMEÇA AQUI.", cls: "text-outline" },
];

const SERVICES = [
  {
    id: "vende",
    num: "01",
    title: "VENDE",
    icon: Car,
    desc: "Carros selecionados, com documentação em dia e prontos para rodar por João Pessoa.",
    perk: "Procedência garantida",
  },
  {
    id: "troca",
    num: "02",
    title: "TROCA",
    icon: Repeat,
    desc: "Seu usado vale entrada: avaliação justa e transparente, feita na hora.",
    perk: "Avaliação na hora",
  },
  {
    id: "compra",
    num: "03",
    title: "COMPRA",
    icon: Banknote,
    desc: "Quer vender seu carro? A gente avalia e paga à vista, sem burocracia.",
    perk: "Pagamento à vista",
  },
  {
    id: "financia",
    num: "04",
    title: "FINANCIA",
    icon: ShieldCheck,
    desc: "Financiamento com os principais bancos e parcelas que cabem no seu bolso.",
    perk: "Aprovação ágil",
  },
];

const STORE_POINTS = [
  "Atendimento direto com a equipe MG CAR",
  "Carros selecionados para você rodar tranquilo",
  "Negociação transparente, sem burocracia",
];

function HeroImage() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.55, ease: EASE }}
      className="relative"
      data-testid="hero-facade-photo"
    >
      <div className="absolute -right-3 -top-3 h-24 w-24 rounded-tr-3xl border-r-2 border-t-2 border-brand-lime/70" aria-hidden="true" />
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-brand-border lg:aspect-[4/5]">
        <motion.img
          src={BRAND.facadePhoto}
          alt="Fachada da loja MG CAR Veículos com carros no pátio, em João Pessoa - PB"
          style={{ y }}
          className="absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent" aria-hidden="true" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-brand-lime/30 bg-black/60 px-4 py-2 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-brand-lime" aria-hidden="true" />
          <span data-testid="hero-store-label" className="font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-text">Loja em João Pessoa</span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div>
            <p className="font-display text-xl font-extrabold uppercase leading-none text-brand-text">Showroom MG CAR</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-brand-muted">
              <MapPin className="h-3.5 w-3.5 text-brand-lime" /> {BRAND.city}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <div data-testid="home-page">
      <section id="inicio" className="hero-glow relative overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24 lg:pt-40">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="flex items-center gap-3"
            >
              <span className="h-px w-10 bg-brand-lime" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-lime sm:text-sm">
                Vende · Troca · Compra · Financia
              </span>
            </motion.div>

            <h1 className="mt-6 font-display text-6xl font-extrabold uppercase leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl" data-testid="hero-title">
              {HEADLINE.map((line, i) => (
                <span key={line.text} className="block overflow-hidden pb-1">
                  <motion.span
                    className={`block ${line.cls}`}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.13, ease: EASE }}
                  >
                    {line.text}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
              className="mt-6 max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg"
            >
              Na MG CAR você vende, troca, compra e financia seu carro com atendimento
              direto e transparente em João Pessoa - PB.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <motion.a
                data-testid="hero-whatsapp-primary-btn"
                href={waLink("Olá! Vim pelo site da MG CAR e quero saber mais sobre os carros.")}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 rounded-xl bg-brand-lime px-7 py-4 font-display text-lg font-bold uppercase tracking-wider text-brand-bg shadow-[0_0_35px_rgba(198,244,50,0.25)] transition-colors hover:bg-brand-limehover"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                Falar no WhatsApp
              </motion.a>
              <motion.a
                data-testid="hero-instagram-secondary-btn"
                href={BRAND.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 rounded-xl border border-brand-border bg-brand-card/70 px-7 py-4 font-display text-lg font-bold uppercase tracking-wider text-brand-text transition-colors hover:border-brand-lime hover:text-brand-lime"
              >
                <Instagram className="h-5 w-5" strokeWidth={2.2} />
                Ver estoque no Instagram
              </motion.a>
              <Link
                data-testid="hero-catalog-btn"
                to="/estoque"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-muted underline decoration-brand-border underline-offset-4 transition-colors hover:text-brand-lime"
              >
                Ver estoque online <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-brand-faint"
            >
              <li className="inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-brand-lime" /> Atendimento direto no WhatsApp</li>
              <li className="inline-flex items-center gap-2"><Store className="h-3.5 w-3.5 text-brand-lime" /> Anúncios no Instagram e na OLX</li>
              <li className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand-lime" /> {BRAND.city}</li>
            </motion.ul>
          </div>

          <div className="lg:col-span-5">
            <HeroImage />
          </div>
        </div>
      </section>

      <Marquee />

      <section id="servicos" className="py-20 sm:py-28" data-testid="services-section">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-lime sm:text-sm">O que fazemos</p>
                <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-brand-text sm:text-5xl lg:text-6xl">
                  Tudo para você sair <span className="italic text-brand-lime">de carro novo</span>
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-brand-muted sm:text-base">
                Quatro frentes, um só time: a MG CAR resolve toda a parte do seu carro, do primeiro contato à entrega das chaves.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service, i) => {
              const Icon = service.icon;
              return (
                <Reveal key={service.id} delay={i * 0.08}>
                  <motion.div
                    data-testid={`service-card-${service.id}`}
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="group relative h-full overflow-hidden rounded-2xl border border-brand-border bg-brand-card p-6 transition-colors hover:border-brand-lime/60"
                  >
                    <span className="pointer-events-none absolute -right-2 -top-4 font-display text-7xl font-black text-brand-border/60 transition-colors group-hover:text-brand-lime/15" aria-hidden="true">
                      {service.num}
                    </span>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-lime text-brand-bg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                      <Icon className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-wide text-brand-text">{service.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-brand-muted">{service.desc}</p>
                    <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-lime">
                      <BadgeCheck className="h-4 w-4" /> {service.perk}
                    </p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="a-loja" className="border-t border-brand-border py-20 sm:py-28" data-testid="store-section">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <Reveal>
            <div className="relative" data-testid="store-facade-photo">
              <div className="absolute -bottom-3 -left-3 h-24 w-24 rounded-bl-3xl border-b-2 border-l-2 border-brand-lime/70" aria-hidden="true" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-brand-border">
                <img
                  src={BRAND.facadePhoto}
                  alt="Pátio da MG CAR Veículos com os carros à venda em João Pessoa - PB"
                  loading="lazy"
                  className="h-full w-full object-cover object-bottom"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" aria-hidden="true" />
                <p className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-black/60 px-4 py-2 text-xs text-brand-text backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5 text-brand-lime" /> {BRAND.city}
                </p>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-lime sm:text-sm">A nossa loja</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-brand-text sm:text-5xl lg:text-6xl">
                Conheça a <span className="italic text-brand-lime">MG CAR</span> de perto
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-muted sm:text-lg">
                Nosso pátio em João Pessoa é o lugar para você ver de perto
                cada carro, conversar sem compromisso e fechar negócio com total transparência.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <ul className="mt-7 space-y-3.5">
                {STORE_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-brand-text sm:text-base">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-lime" />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.2}>
              <motion.a
                data-testid="store-agendar-visita-btn"
                href={waLink("Olá! Quero agendar uma visita para conhecer a loja MG CAR em João Pessoa.")}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="mt-9 inline-flex items-center gap-2.5 rounded-xl bg-brand-lime px-7 py-4 font-display text-lg font-bold uppercase tracking-wider text-brand-bg shadow-[0_0_35px_rgba(198,244,50,0.2)] transition-colors hover:bg-brand-limehover"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                Agendar visita
              </motion.a>
            </Reveal>
          </div>
        </div>
      </section>

      <StoreLocation />

      <section id="contato" className="border-t border-brand-border py-20 sm:py-28" data-testid="contact-section">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-lime sm:text-sm">Contato</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-brand-text sm:text-5xl lg:text-6xl">
              Fale com a gente
            </h2>
            <p className="mt-4 max-w-xl text-base text-brand-muted sm:text-lg">
              Resposta rápida nos nossos canais oficiais. Chama que a gente resolve.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Reveal>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex h-full flex-col rounded-2xl border border-brand-lime/50 bg-brand-card p-7 shadow-[0_0_45px_rgba(198,244,50,0.08)]"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-lime text-brand-bg">
                  <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold uppercase tracking-wider text-brand-muted">WhatsApp direto</h3>
                <p className="mt-2 font-display text-3xl font-extrabold tracking-wide text-brand-text" data-testid="contact-whatsapp-number">
                  {BRAND.whatsappDisplay}
                </p>
                <p className="mt-2 text-sm text-brand-muted">Venda, troca, compra e financiamento em uma conversa só.</p>
                <a
                  data-testid="contact-whatsapp-btn"
                  href={waLink("Olá! Vim pelo site da MG CAR e quero falar com um vendedor.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-lime px-5 py-3.5 font-display text-base font-bold uppercase tracking-wider text-brand-bg transition-colors hover:bg-brand-limehover"
                >
                  Conversar no WhatsApp <ArrowUpRight className="h-4 w-4" />
                </a>
              </motion.div>
            </Reveal>

            <Reveal delay={0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex h-full flex-col rounded-2xl border border-brand-border bg-brand-card p-7 transition-colors hover:border-brand-lime/50"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-brand-lime">
                  <Instagram className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold uppercase tracking-wider text-brand-muted">Instagram oficial</h3>
                <p className="mt-2 font-display text-3xl font-extrabold tracking-wide text-brand-text" data-testid="contact-instagram-handle">
                  {BRAND.instagramHandle}
                </p>
                <p className="mt-2 text-sm text-brand-muted">Chegadas de carros, novidades e bastidores da loja.</p>
                <a
                  data-testid="contact-instagram-btn"
                  href={BRAND.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border px-5 py-3.5 font-display text-base font-bold uppercase tracking-wider text-brand-text transition-colors hover:border-brand-lime hover:text-brand-lime"
                >
                  Seguir no Instagram <ArrowUpRight className="h-4 w-4" />
                </a>
              </motion.div>
            </Reveal>

            <Reveal delay={0.16}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex h-full flex-col rounded-2xl border border-brand-border bg-brand-card p-7 transition-colors hover:border-brand-lime/50"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-brand-border bg-brand-bg text-brand-lime">
                  <Store className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold uppercase tracking-wider text-brand-muted">Anúncios na OLX</h3>
                <p className="mt-2 font-display text-3xl font-extrabold uppercase tracking-wide text-brand-text">OLX</p>
                <p className="mt-2 text-sm text-brand-muted">A MG CAR também anuncia os carros na OLX.</p>
                {BRAND.olxUrl ? (
                  <a
                    data-testid="contact-olx-btn"
                    href={BRAND.olxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border px-5 py-3.5 font-display text-base font-bold uppercase tracking-wider text-brand-text transition-colors hover:border-brand-lime hover:text-brand-lime"
                  >
                    Ver perfil na OLX <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="mt-6 rounded-xl border border-dashed border-brand-border px-5 py-3.5 text-center text-xs text-brand-faint" data-testid="contact-olx-note">
                    Peça o link dos anúncios ativos pelo WhatsApp
                  </p>
                )}
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
