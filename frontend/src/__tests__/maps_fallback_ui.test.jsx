import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/pages/Home";
import { StoreLocation } from "@/components/StoreLocation";
import SiteFooter from "@/components/SiteFooter";

jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    Link: ({ to, children, ...props }) => React.createElement("a", { href: to, ...props }, children),
    useLocation: () => ({ pathname: "/" }),
    useNavigate: () => jest.fn(),
  };
});

describe("Maps unavailable fallback UI", () => {
  const originalMapsEnv = process.env.REACT_APP_GOOGLE_MAPS_URL;

  beforeEach(() => {
    process.env.REACT_APP_GOOGLE_MAPS_URL = "invalid-url";
  });

  afterEach(() => {
    if (originalMapsEnv === undefined) {
      delete process.env.REACT_APP_GOOGLE_MAPS_URL;
    } else {
      process.env.REACT_APP_GOOGLE_MAPS_URL = originalMapsEnv;
    }
  });

  const renderHtml = (node) => renderToStaticMarkup(node);

  it("renders Home without crashing and keeps address/hours/WhatsApp fallback visible", () => {
    const html = renderHtml(
      <Home />,
    );

    expect(html).toContain('data-testid="store-address"');
    expect(html).toContain("R. Pedro Freire de Mendonça, 263");
    expect(html).toContain('data-testid="location-map-unavailable"');
    expect(html).toContain("Mapa indisponível no momento.");
    expect(html).toContain('data-testid="location-map-whatsapp-link"');
    expect(html).toContain("https://wa.me/5583996876250?text=");
    expect(html).not.toContain('data-testid="location-google-map"');
    expect(html).not.toContain('data-testid="location-directions-link"');
  });

  it("renders SiteFooter without invalid route URL when map config is unavailable", () => {
    const html = renderHtml(
      <SiteFooter />,
    );

    expect(html).toContain('data-testid="footer-address-text"');
    expect(html).toContain("R. Pedro Freire de Mendonça, 263");
    expect(html).not.toContain('data-testid="footer-address-link"');
    expect(html).toContain('data-testid="footer-whatsapp-link"');
    expect(html).toContain('href="https://wa.me/5583996876250"');
  });

  it("shows the exact four BusinessHours lines in location and footer with unique testids", () => {
    const html = renderHtml(
      <>
        <StoreLocation />
        <SiteFooter />
      </>,
    );

    expect(html).toContain('data-testid="location-hours-weekdays-value"');
    expect(html).toContain('data-testid="location-hours-saturday-value"');
    expect(html).toContain('data-testid="location-hours-sunday-value"');
    expect(html).toContain('data-testid="location-hours-holidays-value"');
    expect(html).toContain('data-testid="footer-hours-weekdays-value"');
    expect(html).toContain('data-testid="footer-hours-saturday-value"');
    expect(html).toContain('data-testid="footer-hours-sunday-value"');
    expect(html).toContain('data-testid="footer-hours-holidays-value"');
    expect((html.match(/08:00–18:00/g) || []).length).toBeGreaterThanOrEqual(4);
    expect(html).toContain("08:00–13:00");
    expect(html).toContain("Fechado");

    const testIds = [...html.matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(testIds).size).toBe(testIds.length);
  });
});
