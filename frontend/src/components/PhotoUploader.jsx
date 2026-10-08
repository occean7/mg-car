import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { imageSource, MAX_PHOTO_BYTES, MAX_VEHICLE_PHOTOS } from "@/lib/vehicleImages";

export const PhotoUploader = ({ images, onChange, onUploaded, onBusyChange, disabled }) => {
  const input = useRef(null);
  const abort = useRef(null);
  const objectUrls = useRef(new Set());
  const [pending, setPending] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      abort.current?.abort();
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const selectFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setError("");
    if (files.length + images.length > MAX_VEHICLE_PHOTOS) {
      setError("Selecione até 12 fotos por veículo.");
      return;
    }
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
      setError("Cada foto deve ter no máximo 10 MB.");
      return;
    }
    if (files.some((file) => !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))) {
      setError("Selecione fotos JPG, PNG, WEBP ou HEIC.");
      return;
    }
    const previews = files.map((file, index) => ({ file, id: index, preview: URL.createObjectURL(file) }));
    previews.forEach(({ preview }) => objectUrls.current.add(preview));
    const controller = new AbortController();
    abort.current = controller;
    setPending(previews);
    setBusy(true);
    onBusyChange(true);
    const failures = [];
    try {
      for (const item of previews) {
        if (controller.signal.aborted) break;
        setProgress(0);
        try {
          const body = new FormData();
          body.append("file", item.file);
          const { data } = await api.post("/media", body, {
            signal: controller.signal,
            onUploadProgress: ({ loaded, total }) => setProgress(total ? Math.round(loaded * 100 / total) : 0),
          });
          onUploaded(data.url);
          onChange((current) => [...current, data.url]);
        } catch (err) {
          if (controller.signal.aborted) break;
          failures.push(`${item.file.name}: ${formatApiError(err, "Não foi possível enviar. Tente novamente.")}`);
        } finally {
          URL.revokeObjectURL(item.preview);
          objectUrls.current.delete(item.preview);
          setPending((current) => current.filter((photo) => photo.id !== item.id));
        }
      }
      if (failures.length) setError(failures.join(" "));
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  };

  return (
    <section data-testid="vehicle-photo-uploader" className="min-w-0 sm:col-span-2" aria-labelledby="vehicle-photos-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="vehicle-photos-title" data-testid="vehicle-photo-count" className="font-display text-lg font-bold uppercase text-brand-text">Fotos do veículo <span className="text-brand-muted">{images.length}/12</span></h3>
        <button data-testid="vehicle-photos-select-btn" type="button" disabled={disabled || busy || images.length >= MAX_VEHICLE_PHOTOS} onClick={() => input.current.click()} className="inline-flex items-center gap-2 rounded-lg border border-brand-lime/50 px-4 py-2 text-sm font-semibold text-brand-lime transition-colors hover:bg-brand-lime/10 disabled:opacity-50">
          <ImagePlus className="h-4 w-4" /> Adicionar fotos
        </button>
        <input ref={input} data-testid="vehicle-photos-input" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.heic,.heif" onChange={selectFiles} disabled={disabled || busy} className="sr-only" aria-label="Selecionar fotos do veículo" />
      </div>
      <p data-testid="vehicle-photo-limits" className="mt-2 text-xs text-brand-muted">JPG, PNG, WEBP ou HEIC · Até 10 MB por foto</p>
      {error && <p data-testid="vehicle-photo-error" role="alert" className="mt-3 break-words rounded-lg border border-red-400/40 p-3 text-sm text-red-300">{error}</p>}
      {busy && <p data-testid="vehicle-photo-progress" role="status" className="mt-3 flex items-center gap-2 text-sm text-brand-lime"><Loader2 className="h-4 w-4 animate-spin" /> Enviando fotos… {progress}%</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((url, index) => (
          <div key={url} data-testid={`vehicle-photo-${index}`} className="min-w-0 overflow-hidden rounded-lg border border-brand-border">
            <img data-testid={`vehicle-photo-preview-${index}`} src={imageSource(url)} alt={`Foto ${index + 1} do veículo`} className="aspect-[4/3] w-full bg-brand-bg object-contain" />
            <div className="flex items-center justify-between gap-1 px-2 py-2">
              <button data-testid={`vehicle-photo-cover-${index}`} type="button" title={index === 0 ? "Foto de capa" : "Definir como capa"} aria-label={index === 0 ? "Foto de capa" : `Definir foto ${index + 1} como capa`} aria-pressed={index === 0} disabled={disabled || busy || index === 0} onClick={() => onChange((current) => [url, ...current.filter((photo) => photo !== url)])} className={`inline-flex items-center gap-1.5 rounded p-1 text-xs transition-colors hover:bg-brand-border ${index === 0 ? "text-brand-lime" : "text-brand-muted"}`}>
                <Star className="h-4 w-4" fill={index === 0 ? "currentColor" : "none"} /> {index === 0 ? "Capa" : null}
              </button>
              <button data-testid={`vehicle-photo-remove-${index}`} type="button" title="Remover foto" aria-label={`Remover foto ${index + 1}`} disabled={disabled || busy} onClick={() => onChange((current) => current.filter((photo) => photo !== url))} className="rounded p-1.5 text-brand-muted transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {pending.map((photo) => (
          <div key={photo.id} data-testid={`vehicle-photo-pending-${photo.id}`} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-brand-border bg-brand-bg">
            <img src={photo.preview} alt="Foto aguardando envio" className="h-full w-full object-contain opacity-40" />
            <Loader2 className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin text-brand-lime" />
          </div>
        ))}
      </div>
    </section>
  );
};