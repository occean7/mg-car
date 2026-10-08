import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { waLink } from "@/constants/brand";

export default function FloatingWhatsApp() {
  return (
    <motion.a
      data-testid="floating-whatsapp-btn"
      href={waLink("Olá! Vim pelo site da MG CAR Veículos e quero falar com um vendedor.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a MG CAR no WhatsApp"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.4, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-brand-lime text-brand-bg shadow-[0_8px_30px_rgba(198,244,50,0.35)]"
    >
      <span className="animate-ping-slow absolute inset-0 rounded-full bg-brand-lime" aria-hidden="true" />
      <MessageCircle className="relative h-6 w-6" strokeWidth={2.4} />
    </motion.a>
  );
}
