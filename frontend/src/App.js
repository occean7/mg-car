import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Home from "@/pages/Home";
import Estoque from "@/pages/Estoque";
import Admin from "@/pages/Admin";

function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollManager />
      <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
        <SiteHeader />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <SiteFooter />
        <FloatingWhatsApp />
      </div>
      <div className="grain-overlay" aria-hidden="true" />
      <Toaster theme="dark" position="top-center" richColors />
    </BrowserRouter>
  );
}
