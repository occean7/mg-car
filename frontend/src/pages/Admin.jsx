import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, CarFront, Star, X, Loader2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { BRAND, formatPrice, formatKm } from "@/constants/brand";
import { PhotoUploader } from "@/components/PhotoUploader";
import { imageSource, vehicleImages } from "@/lib/vehicleImages";

const EMPTY_FORM = {
  brand: "",
  model: "",
  year: "",
  price: "",
  km: "",
  transmission: "Manual",
  fuel: "Flex",
  color: "",
  description: "",
  image_url: "",
  images: [],
  featured: false,
  status: "disponivel",
};

const inputCls =
  "w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text placeholder:text-brand-faint transition-colors focus:border-brand-lime focus:outline-none";

const STATUS_OPTIONS = [
  { value: "disponivel", label: "Disponível" },
  { value: "reservado", label: "Reservado" },
  { value: "vendido", label: "Vendido" },
];

const STATUS_DOT = {
  disponivel: "bg-brand-lime",
  reservado: "bg-yellow-400",
  vendido: "bg-red-400",
};

function LoginPanel({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      toast.success("Bem-vindo ao painel MG CAR");
      onSuccess(data);
    } catch (err) {
      setError(formatApiError(err, "Não foi possível entrar. Verifique os dados."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 pb-20 pt-32 sm:px-0" data-testid="admin-login-panel">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-brand-border bg-brand-card p-8"
      >
        <img src={BRAND.logo} alt="Logo MG CAR Veículos" className="h-14 w-14 rounded-xl border border-brand-border object-cover" />
        <h1 className="mt-5 font-display text-4xl font-extrabold uppercase tracking-tight text-brand-text">Painel MG CAR</h1>
        <p className="mt-1.5 text-sm text-brand-muted">Acesso restrito. Entre para gerenciar o estoque.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <input
            data-testid="admin-login-key-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail do administrador"
            className={inputCls}
            autoComplete="username"
          />
          <input
            data-testid="admin-login-password-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className={inputCls}
            autoComplete="current-password"
          />
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300" data-testid="admin-login-error">
              {error}
            </p>
          )}
          <button
            data-testid="admin-login-submit-btn"
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-lime px-5 py-3.5 font-display text-lg font-bold uppercase tracking-wider text-brand-bg transition-colors hover:bg-brand-limehover disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar no painel
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function VehicleForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...initial, images: initial ? vehicleImages(initial) : [] }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploaded = useRef(new Set());
  const saved = useRef(false);
  const currentImages = useRef(form.images);
  currentImages.current = form.images;
  const isEdit = Boolean(initial?.id);
  const busy = saving || uploading;
  const close = () => { if (!busy) onClose(); };
  const setImages = (update) => setForm((current) => ({ ...current, images: update(current.images) }));

  useEffect(() => {
    const uploads = uploaded.current;
    return () => {
      for (const url of uploads) {
        if (!saved.current || !currentImages.current.includes(url)) api.delete(url.replace(/^\/api/, "")).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    window.__lenis?.stop();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; window.__lenis?.start(); };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setSaving(true);
    const payload = {
      ...form,
      price: parseInt(String(form.price).replace(/\D/g, ""), 10) || 0,
      km: parseInt(String(form.km).replace(/\D/g, ""), 10) || 0,
      image_url: form.images[0] || "",
    };
    delete payload.id;
    delete payload.created_at;
    try {
      if (isEdit) await api.put(`/vehicles/${initial.id}`, payload);
      else await api.post("/vehicles", payload);
      saved.current = true;
      toast.success(isEdit ? "Veículo atualizado" : "Veículo adicionado ao estoque");
      onSaved();
    } catch (err) {
      toast.error(formatApiError(err, "Não foi possível salvar o veículo."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-brand-border bg-brand-card p-7"
        data-testid="vehicle-form-modal"
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Editar veículo" : "Novo veículo"}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-brand-text">
            {isEdit ? "Editar veículo" : "Novo veículo"}
          </h2>
          <button onClick={close} disabled={busy} data-testid="vehicle-form-close-btn" aria-label="Fechar" className="rounded-xl border border-brand-border p-2 text-brand-muted transition-colors hover:text-brand-text disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input data-testid="vehicle-field-brand" required value={form.brand} onChange={set("brand")} placeholder="Marca (ex.: Toyota)" className={inputCls} />
          <input data-testid="vehicle-field-model" required value={form.model} onChange={set("model")} placeholder="Modelo (ex.: Corolla XEi)" className={inputCls} />
          <input data-testid="vehicle-field-year" required value={form.year} onChange={set("year")} placeholder="Ano (ex.: 2022/2023)" className={inputCls} />
          <input data-testid="vehicle-field-price" required inputMode="numeric" value={form.price} onChange={set("price")} placeholder="Preço (ex.: 129900)" className={inputCls} />
          <input data-testid="vehicle-field-km" inputMode="numeric" value={form.km} onChange={set("km")} placeholder="Quilometragem (ex.: 45000)" className={inputCls} />
          <input data-testid="vehicle-field-color" value={form.color} onChange={set("color")} placeholder="Cor" className={inputCls} />
          <select data-testid="vehicle-field-transmission" value={form.transmission} onChange={set("transmission")} className={inputCls}>
            <option>Manual</option>
            <option>Automático</option>
            <option>CVT</option>
            <option>Automatizado</option>
          </select>
          <select data-testid="vehicle-field-fuel" value={form.fuel} onChange={set("fuel")} className={inputCls}>
            <option>Flex</option>
            <option>Gasolina</option>
            <option>Diesel</option>
            <option>Híbrido</option>
            <option>Elétrico</option>
          </select>
          <PhotoUploader images={form.images} onChange={setImages} onUploaded={(url) => uploaded.current.add(url)} onBusyChange={setUploading} disabled={saving} />
          <textarea data-testid="vehicle-field-description" value={form.description} onChange={set("description")} placeholder="Descrição curta (opcionais, estado, observações)" rows={3} className={`${inputCls} sm:col-span-2`} />

          <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
            <select data-testid="vehicle-field-status" value={form.status} onChange={set("status")} className={`${inputCls} w-auto`}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-brand-muted">
              <input data-testid="vehicle-field-featured" type="checkbox" checked={form.featured} onChange={set("featured")} className="h-4 w-4 accent-[#C6F432]" />
              Destacar no topo do estoque
            </label>
          </div>

          <button
            data-testid="vehicle-form-save-btn"
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-lime px-5 py-3.5 font-display text-lg font-bold uppercase tracking-wider text-brand-bg transition-colors hover:bg-brand-limehover disabled:opacity-60 sm:col-span-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Aguarde o envio das fotos" : isEdit ? "Salvar alterações" : "Adicionar ao estoque"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Admin() {
  const [auth, setAuth] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    api.get("/auth/me").then((res) => setAuth(res.data && res.data.email ? res.data : false)).catch(() => setAuth(false));
  }, []);

  const loadVehicles = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get("/vehicles/manage");
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Não foi possível carregar o estoque.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (auth) loadVehicles();
  }, [auth, loadVehicles]);

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setAuth(false);
    toast.success("Sessão encerrada");
  };

  const changeStatus = async (vehicle, status) => {
    try {
      await api.put(`/vehicles/${vehicle.id}`, { status });
      toast.success("Status atualizado");
      loadVehicles();
    } catch {
      toast.error("Não foi possível atualizar o status.");
    }
  };

  const toggleFeatured = async (vehicle) => {
    try {
      await api.put(`/vehicles/${vehicle.id}`, { featured: !vehicle.featured });
      loadVehicles();
    } catch {
      toast.error("Não foi possível atualizar o destaque.");
    }
  };

  const remove = async (vehicle) => {
    if (!window.confirm(`Remover ${vehicle.brand} ${vehicle.model} do estoque?`)) return;
    try {
      await api.delete(`/vehicles/${vehicle.id}`);
      toast.success("Veículo removido");
      loadVehicles();
    } catch {
      toast.error("Não foi possível remover o veículo.");
    }
  };

  if (auth === null) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center pt-24 text-brand-muted" data-testid="admin-loading">
        <Loader2 className="h-6 w-6 animate-spin text-brand-lime" />
      </div>
    );
  }

  if (auth === false) return <LoginPanel onSuccess={setAuth} />;

  const counts = {
    total: vehicles.length,
    disponivel: vehicles.filter((v) => v.status === "disponivel").length,
    reservado: vehicles.filter((v) => v.status === "reservado").length,
    vendido: vehicles.filter((v) => v.status === "vendido").length,
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32" data-testid="admin-dashboard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-lime">Painel do lojista</p>
          <h1 className="mt-2 font-display text-5xl font-extrabold uppercase leading-none tracking-tight text-brand-text">Estoque MG CAR</h1>
          <p className="mt-2 text-sm text-brand-muted">Logado como {auth.email}</p>
        </div>
        <div className="flex gap-3">
          <button
            data-testid="admin-add-vehicle-btn"
            onClick={() => setModal({ mode: "create" })}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-lime px-5 py-3 font-display text-base font-bold uppercase tracking-wider text-brand-bg transition-colors hover:bg-brand-limehover"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} /> Adicionar veículo
          </button>
          <button
            data-testid="admin-logout-btn"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-5 py-3 font-display text-base font-bold uppercase tracking-wider text-brand-muted transition-colors hover:border-red-400/50 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="admin-stats">
        {[
          { label: "Total", value: counts.total },
          { label: "Disponíveis", value: counts.disponivel },
          { label: "Reservados", value: counts.reservado },
          { label: "Vendidos", value: counts.vendido },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-brand-border bg-brand-card px-5 py-4">
            <p className="font-display text-3xl font-extrabold text-brand-text">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-faint">{s.label}</p>
          </div>
        ))}
      </div>

      {loadingList ? (
        <div className="mt-14 flex items-center justify-center gap-3 text-brand-muted">
          <Loader2 className="h-5 w-5 animate-spin text-brand-lime" /> Carregando...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="mt-14 rounded-3xl border border-dashed border-brand-border bg-brand-card px-8 py-14 text-center" data-testid="admin-empty-state">
          <CarFront className="mx-auto h-9 w-9 text-brand-lime" strokeWidth={1.8} />
          <p className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-brand-text">Nenhum veículo cadastrado</p>
          <p className="mt-2 text-sm text-brand-muted">Clique em "Adicionar veículo" para cadastrar o primeiro carro da MG CAR.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3" data-testid="admin-vehicle-list">
          {vehicles.map((v) => (
            <li
              key={v.id}
              data-testid={`admin-vehicle-row-${v.id}`}
              className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-card p-4 sm:flex-row sm:items-center"
            >
              <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl bg-brand-bg sm:w-28">
                {v.image_url ? (
                  <img src={imageSource(v.image_url)} alt={`${v.brand} ${v.model}`} loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <CarFront className="h-6 w-6 text-brand-faint" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-bold uppercase tracking-wide text-brand-text">
                  {v.brand} {v.model}
                </p>
                <p className="mt-0.5 text-xs text-brand-muted">
                  {v.year} · {formatKm(v.km)} · {v.transmission} · {v.fuel}
                </p>
                <p className="mt-1 font-display text-lg font-extrabold text-brand-lime">{formatPrice(v.price)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[v.status] || "bg-brand-faint"}`} aria-hidden="true" />
                <select
                  data-testid={`admin-status-select-${v.id}`}
                  value={v.status}
                  onChange={(e) => changeStatus(v, e.target.value)}
                  className="rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text focus:border-brand-lime focus:outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  data-testid={`admin-featured-btn-${v.id}`}
                  onClick={() => toggleFeatured(v)}
                  aria-label={v.featured ? "Remover destaque" : "Destacar"}
                  className={`rounded-xl border p-2.5 transition-colors ${v.featured ? "border-brand-lime/60 text-brand-lime" : "border-brand-border text-brand-faint hover:text-brand-lime"}`}
                >
                  <Star className="h-4 w-4" fill={v.featured ? "currentColor" : "none"} />
                </button>
                <button
                  data-testid={`admin-edit-btn-${v.id}`}
                  onClick={() => setModal({ mode: "edit", vehicle: v })}
                  aria-label="Editar veículo"
                  className="rounded-xl border border-brand-border p-2.5 text-brand-muted transition-colors hover:border-brand-lime/60 hover:text-brand-lime"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  data-testid={`admin-delete-btn-${v.id}`}
                  onClick={() => remove(v)}
                  aria-label="Excluir veículo"
                  className="rounded-xl border border-brand-border p-2.5 text-brand-muted transition-colors hover:border-red-400/50 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {modal && (
          <VehicleForm
            initial={modal.mode === "edit" ? modal.vehicle : null}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              loadVehicles();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
