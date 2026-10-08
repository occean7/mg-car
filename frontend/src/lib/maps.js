// Validação local: uma configuração inválida desabilita apenas o mapa,
// nunca a inicialização da marca, do WhatsApp ou do estoque.
export function getMapsConfiguration(address) {
  const mapsBaseUrl = process.env.REACT_APP_GOOGLE_MAPS_URL;
  if (!mapsBaseUrl) {
    return { links: null, error: "REACT_APP_GOOGLE_MAPS_URL não configurada" };
  }

  try {
    const base = new URL(mapsBaseUrl);
    if (base.protocol !== "https:") throw new Error("O mapa requer HTTPS");
    const baseUrl = base.href.replace(/\/$/, "");
    const encodedAddress = encodeURIComponent(`${address}, Brasil`);
    return {
      links: {
        embedUrl: `${baseUrl}?q=${encodedAddress}&output=embed&hl=pt-BR`,
        directionsUrl: `${baseUrl}/dir/?api=1&destination=${encodedAddress}`,
      },
      error: null,
    };
  } catch {
    return { links: null, error: "REACT_APP_GOOGLE_MAPS_URL inválida" };
  }
}