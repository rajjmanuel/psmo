export type AppSettings = {
  id?: number;
  orgName: string;
  systemTitle: string;
  shortName: string;
  tagline: string;
  focalText: string;
  heroSubtitle: string;
  loginWelcome: string;
  logoUrl: string;
  heroImageUrl: string;
  inventoryImageUrl: string;
  disposalImageUrl: string;
  procurementImageUrl: string;
  themePreset: string;
  primaryColor: string;
  primaryDeep: string;
  accentColor: string;
  paperColor: string;
  inkColor: string;
  fontFamily: string;
  fontScale: string;
  updatedBy?: string | null;
  updatedAt?: string | Date | null;
};

export const DEFAULT_SETTINGS: AppSettings = {
  orgName: "Property Supply and Management Office",
  systemTitle: "Asset Management System",
  shortName: "PSMO",
  tagline: "Property · Supply",
  focalText: "Focal: Ma'am Mitch & PSMO Staff",
  heroSubtitle:
    "Official ledger for recording stock, disposing unserviceable property, and walking AMT / SSMT purchases from canvass to Material Receiving Report.",
  loginWelcome: "Use your PSMO credentials. After login you will go straight to dashboard.",
  logoUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=400&q=80",
  heroImageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85",
  inventoryImageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1000&q=85",
  disposalImageUrl: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=85",
  procurementImageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85",
  themePreset: "blue",
  primaryColor: "#1d4ed8",
  primaryDeep: "#172554",
  accentColor: "#06b6d4",
  paperColor: "#f6f8fc",
  inkColor: "#0f172a",
  fontFamily: "Poppins",
  fontScale: "100",
};

export const THEME_PRESETS: Record<
  string,
  {
    label: string;
    primaryColor: string;
    primaryDeep: string;
    accentColor: string;
    paperColor: string;
    inkColor: string;
  }
> = {
  blue: {
    label: "Ocean Blue",
    primaryColor: "#1d4ed8",
    primaryDeep: "#172554",
    accentColor: "#06b6d4",
    paperColor: "#f6f8fc",
    inkColor: "#0f172a",
  },
  green: {
    label: "Forest Green",
    primaryColor: "#15803d",
    primaryDeep: "#10231c",
    accentColor: "#c4a35a",
    paperColor: "#f3eee4",
    inkColor: "#14201b",
  },
  purple: {
    label: "Royal Purple",
    primaryColor: "#7c3aed",
    primaryDeep: "#2e1065",
    accentColor: "#f472b6",
    paperColor: "#faf5ff",
    inkColor: "#1e1b4b",
  },
  slate: {
    label: "Modern Slate",
    primaryColor: "#334155",
    primaryDeep: "#0f172a",
    accentColor: "#38bdf8",
    paperColor: "#f8fafc",
    inkColor: "#0f172a",
  },
  rose: {
    label: "Rose Gold",
    primaryColor: "#e11d48",
    primaryDeep: "#4c0519",
    accentColor: "#f59e0b",
    paperColor: "#fff1f2",
    inkColor: "#1c1917",
  },
  teal: {
    label: "Teal Institutional",
    primaryColor: "#0f766e",
    primaryDeep: "#042f2e",
    accentColor: "#2dd4bf",
    paperColor: "#f0fdfa",
    inkColor: "#042f2e",
  },
};

export const FONT_OPTIONS = [
  { value: "Poppins", label: "Poppins (default)" },
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Nunito", label: "Nunito" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "system-ui", label: "System UI" },
];

export const FONT_SCALES = [
  { value: "90", label: "Small (90%)" },
  { value: "100", label: "Normal (100%)" },
  { value: "110", label: "Large (110%)" },
  { value: "120", label: "Extra large (120%)" },
];

export function applySettingsToDocument(settings: AppSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const scale = Number(settings.fontScale || 100) / 100;

  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--primary-deep", settings.primaryDeep);
  root.style.setProperty("--accent", settings.accentColor);
  root.style.setProperty("--paper", settings.paperColor);
  root.style.setProperty("--ink", settings.inkColor);
  root.style.setProperty("--surface-soft", mixHex(settings.primaryColor, "#ffffff", 0.9));
  root.style.setProperty("--primary-soft", mixHex(settings.primaryColor, "#ffffff", 0.85));
  root.style.setProperty("--accent-soft", mixHex(settings.accentColor, "#ffffff", 0.85));
  root.style.setProperty("--line", mixHex(settings.primaryColor, "#e2e8f0", 0.7));
  root.style.setProperty("--muted", mixHex(settings.inkColor, "#94a3b8", 0.55));

  root.style.setProperty("--font-scale", String(scale));
  document.body.style.fontSize = `${16 * scale}px`;
  document.body.style.background = settings.paperColor;
  document.body.style.color = settings.inkColor;

  // Load Google font dynamically if not system
  if (settings.fontFamily && settings.fontFamily !== "system-ui") {
    const id = "psmo-dynamic-font";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.fontFamily).replace(/%20/g, "+")}:wght@300;400;500;600;700;800&display=swap`;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
    document.body.style.fontFamily = `"${settings.fontFamily}", "Segoe UI", sans-serif`;
    root.style.setProperty("--font-poppins", `"${settings.fontFamily}", "Segoe UI", sans-serif`);
  } else {
    document.body.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  }
}

function mixHex(a: string, b: string, t: number) {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa.r * (1 - t) + pb.r * t);
  const g = Math.round(pa.g * (1 - t) + pb.g * t);
  const bl = Math.round(pa.b * (1 - t) + pb.b * t);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
