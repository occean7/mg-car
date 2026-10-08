import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BRAND, waLink } from "@/constants/brand";
import { imageSource, vehicleImages } from "@/lib/vehicleImages";

export const VehicleGallery = ({ vehicle }) => {
  const images = vehicleImages(vehicle);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const id = vehicle.id;
  const name = `${vehicle.brand} ${vehicle.model}`;
  const change = (step) => setActive((index) => (index + step + images.length) % images.length);

  useEffect(() => {
    if (!open) return;
    window.__lenis?.stop();
    return () => window.__lenis?.start();
  }, [open]);

  if (!images.length) return (
    <div className="flex h-full w-full items-center justify-center">
      <img src={BRAND.logo} alt="Veículo sem foto" className="h-20 w-20 rounded-2xl opacity-25 grayscale" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button data-testid={`vehicle-gallery-open-${id}`} type="button" onClick={() => { setActive(0); setOpen(true); }} aria-label={`Ver ${images.length} fotos de ${name}`} className="relative h-full w-full cursor-zoom-in overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime">
        <img data-testid={`vehicle-cover-${id}`} src={imageSource(images[0])} alt={`${name} ${vehicle.year} à venda na MG CAR`} loading="lazy" className="h-full w-full object-contain transition-opacity hover:opacity-90" />
        <span data-testid={`vehicle-photo-total-${id}`} className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/80 px-2.5 py-1.5 text-xs font-medium text-white"><Images className="h-3.5 w-3.5" /> {images.length} {images.length === 1 ? "foto" : "fotos"}</span>
      </button>
      <DialogContent data-testid={`vehicle-gallery-modal-${id}`} closeTestId={`vehicle-gallery-close-${id}`} overlayClassName="z-[90]" data-lenis-prevent className="z-[91] max-h-[92vh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-lg border-brand-border bg-brand-card p-4 sm:p-6" onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); change(1); } if (event.key === "ArrowLeft") { event.preventDefault(); change(-1); } }}>
        <DialogTitle data-testid={`vehicle-gallery-title-${id}`} className="pr-8 font-display text-2xl font-bold uppercase text-brand-text">{name} · {vehicle.year}</DialogTitle>
        <DialogDescription className="sr-only">Fotos de {name}</DialogDescription>
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-bg sm:aspect-[16/9]">
          <img key={images[active]} data-testid={`vehicle-gallery-image-${id}`} src={imageSource(images[active])} alt={`${name} — foto ${active + 1} de ${images.length}`} className="h-full w-full object-contain" />
          {images.length > 1 && <>
            <button data-testid={`vehicle-gallery-prev-${id}`} type="button" aria-label="Foto anterior" title="Foto anterior" onClick={() => change(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/80 p-2 text-white transition-colors hover:bg-brand-lime hover:text-black"><ChevronLeft className="h-5 w-5" /></button>
            <button data-testid={`vehicle-gallery-next-${id}`} type="button" aria-label="Próxima foto" title="Próxima foto" onClick={() => change(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/80 p-2 text-white transition-colors hover:bg-brand-lime hover:text-black"><ChevronRight className="h-5 w-5" /></button>
          </>}
          <span data-testid={`vehicle-gallery-counter-${id}`} aria-live="polite" className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/80 px-3 py-1 text-xs tabular-nums text-white">{active + 1} / {images.length}</span>
        </div>
        {images.length > 1 && <div data-testid={`vehicle-gallery-thumbnails-${id}`} className="flex min-w-0 gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => <button key={url} data-testid={`vehicle-gallery-thumbnail-${id}-${index}`} type="button" aria-label={`Ver foto ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)} className={`h-14 w-20 shrink-0 overflow-hidden rounded border-2 transition-colors ${active === index ? "border-brand-lime" : "border-brand-border hover:border-brand-muted"}`}><img src={imageSource(url)} alt="" className="h-full w-full bg-brand-bg object-contain" /></button>)}
        </div>}
        <a data-testid={`vehicle-gallery-whatsapp-${id}`} href={waLink(`Olá! Tenho interesse no ${name} ${vehicle.year} que vi no site da MG CAR.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-lime px-4 py-3 font-display text-base font-bold uppercase text-brand-bg transition-colors hover:bg-brand-limehover"><MessageCircle className="h-4 w-4" /> Tenho interesse</a>
      </DialogContent>
    </Dialog>
  );
};