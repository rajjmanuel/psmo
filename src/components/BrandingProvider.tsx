"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applySettingsToDocument,
  DEFAULT_SETTINGS,
  type AppSettings,
} from "@/lib/settings";

const BrandingContext = createContext<{
  settings: AppSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  updateLocal: (patch: Partial<AppSettings>) => void;
}>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: async () => {},
  updateLocal: () => {},
});

function cacheSettings(next: AppSettings) {
  try {
    // Keep large image values out of localStorage; the server remains the source of truth.
    const safe: AppSettings = {
      ...next,
      logoUrl: next.logoUrl.startsWith("data:") ? DEFAULT_SETTINGS.logoUrl : next.logoUrl,
      heroImageUrl: next.heroImageUrl.startsWith("data:")
        ? DEFAULT_SETTINGS.heroImageUrl
        : next.heroImageUrl,
      inventoryImageUrl: next.inventoryImageUrl.startsWith("data:")
        ? DEFAULT_SETTINGS.inventoryImageUrl
        : next.inventoryImageUrl,
      disposalImageUrl: next.disposalImageUrl.startsWith("data:")
        ? DEFAULT_SETTINGS.disposalImageUrl
        : next.disposalImageUrl,
      procurementImageUrl: next.procurementImageUrl.startsWith("data:")
        ? DEFAULT_SETTINGS.procurementImageUrl
        : next.procurementImageUrl,
    };
    localStorage.setItem("psmo_settings_cache", JSON.stringify(safe));
  } catch {
    /* quota / private mode */
  }
}

function readCache(): AppSettings | null {
  try {
    const cached = localStorage.getItem("psmo_settings_cache");
    if (!cached) return null;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(cached) as AppSettings) };
  } catch {
    return null;
  }
}

export function BrandingProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: AppSettings;
}) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (initial && initial.themePreset) return initial;
    if (typeof window === "undefined") return initial ?? DEFAULT_SETTINGS;
    return readCache() ?? initial ?? DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as AppSettings;
      if (!data || !data.themePreset) return;
      const next = { ...DEFAULT_SETTINGS, ...data };
      setSettings(next);
      applySettingsToDocument(next);
      cacheSettings(next);
    } catch {
      /* keep whatever is already on screen / cached */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    applySettingsToDocument(settings);
    cacheSettings(settings);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applySettingsToDocument(settings);
    cacheSettings(settings);
  }, [settings]);

  const updateLocal = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({ settings, loading, refresh, updateLocal }),
    [settings, loading, refresh, updateLocal],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
