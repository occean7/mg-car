// Dados oficiais da MG CAR Veículos — edite aqui para atualizar o site inteiro.
export const BRAND = {
  name: "MG CAR Veículos",
  shortName: "MG CAR",
  slogan: "Vende, Troca, Compra e Financia",
  city: "João Pessoa - PB",
  address: "R. Pedro Freire de Mendonça, 263 - Ernesto Geisel, João Pessoa - PB, 58075-350",
  businessHours: [
    { id: "weekdays", label: "Segunda a sexta", hours: "08:00–18:00" },
    { id: "saturday", label: "Sábado", hours: "08:00–13:00" },
    { id: "sunday", label: "Domingo", hours: "Fechado" },
    { id: "holidays", label: "Feriados", hours: "08:00–18:00" },
  ],
  whatsappDisplay: "(83) 99687-6250",
  whatsappUrl: "https://wa.me/5583996876250",
  instagramHandle: "@mgcarveiculos.of",
  instagramUrl: "https://www.instagram.com/mgcarveiculos.of/",
  // EDITE AQUI quando tiver o link do perfil da loja na OLX:
  olxUrl: "",
  logo: "/logo-mg-car.png",
  facadePhoto: "/fachada-mg-car.png",
};

// Funções independentes da configuração do mapa, inclusive durante o Fast Refresh.
export function waLink(message) {
  return `${BRAND.whatsappUrl}?text=${encodeURIComponent(message)}`;
}

export function formatPrice(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
}

export function formatKm(value) {
  return `${new Intl.NumberFormat("pt-BR").format(value || 0)} km`;
}
