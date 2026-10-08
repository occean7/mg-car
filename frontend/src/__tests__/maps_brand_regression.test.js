import { BRAND } from "@/constants/brand";

describe("brand.js regression (waLink/formatters independent from maps env)", () => {
  const originalMapsEnv = process.env.REACT_APP_GOOGLE_MAPS_URL;

  afterEach(() => {
    jest.resetModules();
    if (originalMapsEnv === undefined) {
      delete process.env.REACT_APP_GOOGLE_MAPS_URL;
    } else {
      process.env.REACT_APP_GOOGLE_MAPS_URL = originalMapsEnv;
    }
  });

  it("imports brand.js without throwing when REACT_APP_GOOGLE_MAPS_URL is missing", () => {
    delete process.env.REACT_APP_GOOGLE_MAPS_URL;

    expect(() => {
      jest.isolateModules(() => {
        const brand = require("@/constants/brand");
        expect(typeof brand.waLink).toBe("function");
        expect(typeof brand.formatPrice).toBe("function");
        expect(typeof brand.formatKm).toBe("function");
      });
    }).not.toThrow();
  });

  it("keeps waLink/formatPrice/formatKm working with empty and invalid env values", () => {
    process.env.REACT_APP_GOOGLE_MAPS_URL = "";

    jest.isolateModules(() => {
      const { waLink, formatPrice, formatKm } = require("@/constants/brand");

      expect(waLink("Olá MG CAR")).toBe(
        "https://wa.me/5583996876250?text=Ol%C3%A1%20MG%20CAR",
      );
      expect(formatPrice(129900)).toBe("R$ 129.900");
      expect(formatKm(45000)).toBe("45.000 km");
    });

    process.env.REACT_APP_GOOGLE_MAPS_URL = "not-a-valid-url";

    jest.isolateModules(() => {
      const { waLink, formatPrice, formatKm } = require("@/constants/brand");

      expect(waLink("Teste")).toContain("wa.me/5583996876250");
      expect(formatPrice(0)).toBe("R$ 0");
      expect(formatKm(0)).toBe("0 km");
    });
  });
});

describe("getMapsConfiguration", () => {
  const originalMapsEnv = process.env.REACT_APP_GOOGLE_MAPS_URL;

  afterEach(() => {
    jest.resetModules();
    if (originalMapsEnv === undefined) {
      delete process.env.REACT_APP_GOOGLE_MAPS_URL;
    } else {
      process.env.REACT_APP_GOOGLE_MAPS_URL = originalMapsEnv;
    }
  });

  it("returns links:null and explicit error when env is missing", () => {
    delete process.env.REACT_APP_GOOGLE_MAPS_URL;

    jest.isolateModules(() => {
      const { getMapsConfiguration } = require("@/lib/maps");
      const result = getMapsConfiguration(BRAND.address);

      expect(result).toEqual({
        links: null,
        error: "REACT_APP_GOOGLE_MAPS_URL não configurada",
      });
    });
  });

  it("returns links:null and explicit error when env is invalid", () => {
    process.env.REACT_APP_GOOGLE_MAPS_URL = "invalid-url";

    jest.isolateModules(() => {
      const { getMapsConfiguration } = require("@/lib/maps");
      const result = getMapsConfiguration(BRAND.address);

      expect(result).toEqual({
        links: null,
        error: "REACT_APP_GOOGLE_MAPS_URL inválida",
      });
    });
  });

  it("returns links:null for non-https URL and does not throw", () => {
    process.env.REACT_APP_GOOGLE_MAPS_URL = "http://www.google.com/maps";

    jest.isolateModules(() => {
      const { getMapsConfiguration } = require("@/lib/maps");
      expect(() => getMapsConfiguration(BRAND.address)).not.toThrow();
      expect(getMapsConfiguration(BRAND.address)).toEqual({
        links: null,
        error: "REACT_APP_GOOGLE_MAPS_URL inválida",
      });
    });
  });

  it("generates encoded links correctly when env is valid", () => {
    process.env.REACT_APP_GOOGLE_MAPS_URL = "https://www.google.com/maps";

    jest.isolateModules(() => {
      const { getMapsConfiguration } = require("@/lib/maps");
      const result = getMapsConfiguration(BRAND.address);
      const encodedAddress = encodeURIComponent(`${BRAND.address}, Brasil`);

      expect(result.error).toBeNull();
      expect(result.links).toEqual({
        embedUrl: `https://www.google.com/maps?q=${encodedAddress}&output=embed&hl=pt-BR`,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
      });
    });
  });
});
