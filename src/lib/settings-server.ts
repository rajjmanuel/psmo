import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/settings";

function pick(raw: Record<string, unknown>, camel: string, snake: string, fallback: string) {
  const value = raw[camel] ?? raw[snake];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function normalizeSettings(raw: unknown): AppSettings {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: typeof data.id === "number" ? data.id : undefined,
    orgName: pick(data, "orgName", "org_name", DEFAULT_SETTINGS.orgName),
    systemTitle: pick(data, "systemTitle", "system_title", DEFAULT_SETTINGS.systemTitle),
    shortName: pick(data, "shortName", "short_name", DEFAULT_SETTINGS.shortName),
    tagline: pick(data, "tagline", "tagline", DEFAULT_SETTINGS.tagline),
    focalText: pick(data, "focalText", "focal_text", DEFAULT_SETTINGS.focalText),
    heroSubtitle: pick(data, "heroSubtitle", "hero_subtitle", DEFAULT_SETTINGS.heroSubtitle),
    loginWelcome: pick(data, "loginWelcome", "login_welcome", DEFAULT_SETTINGS.loginWelcome),
    logoUrl: pick(data, "logoUrl", "logo_url", DEFAULT_SETTINGS.logoUrl),
    heroImageUrl: pick(data, "heroImageUrl", "hero_image_url", DEFAULT_SETTINGS.heroImageUrl),
    inventoryImageUrl: pick(
      data,
      "inventoryImageUrl",
      "inventory_image_url",
      DEFAULT_SETTINGS.inventoryImageUrl,
    ),
    disposalImageUrl: pick(
      data,
      "disposalImageUrl",
      "disposal_image_url",
      DEFAULT_SETTINGS.disposalImageUrl,
    ),
    procurementImageUrl: pick(
      data,
      "procurementImageUrl",
      "procurement_image_url",
      DEFAULT_SETTINGS.procurementImageUrl,
    ),
    themePreset: pick(data, "themePreset", "theme_preset", DEFAULT_SETTINGS.themePreset),
    primaryColor: pick(data, "primaryColor", "primary_color", DEFAULT_SETTINGS.primaryColor),
    primaryDeep: pick(data, "primaryDeep", "primary_deep", DEFAULT_SETTINGS.primaryDeep),
    accentColor: pick(data, "accentColor", "accent_color", DEFAULT_SETTINGS.accentColor),
    paperColor: pick(data, "paperColor", "paper_color", DEFAULT_SETTINGS.paperColor),
    inkColor: pick(data, "inkColor", "ink_color", DEFAULT_SETTINGS.inkColor),
    fontFamily: pick(data, "fontFamily", "font_family", DEFAULT_SETTINGS.fontFamily),
    fontScale: pick(data, "fontScale", "font_scale", DEFAULT_SETTINGS.fontScale),
    updatedBy:
      typeof data.updatedBy === "string"
        ? data.updatedBy
        : typeof data.updated_by === "string"
          ? data.updated_by
          : null,
    updatedAt: (data.updatedAt as Date | string | null | undefined) ??
      (data.updated_at as Date | string | null | undefined) ??
      null,
  };
}

export async function getPersistedSettings(): Promise<AppSettings> {
  try {
    const existing = await db.select().from(appSettings).limit(1);
    if (existing[0]) {
      const saved = normalizeSettings(existing[0]);
      const legacyImages: Record<string, keyof AppSettings> = {
        "/images/seal.png": "logoUrl",
        "/images/hero.jpg": "heroImageUrl",
        "/images/inventory.jpg": "inventoryImageUrl",
        "/images/disposal.jpg": "disposalImageUrl",
        "/images/procurement.jpg": "procurementImageUrl",
      };
      for (const [legacy, key] of Object.entries(legacyImages)) {
        if (saved[key] === legacy) saved[key] = DEFAULT_SETTINGS[key] as never;
      }
      return saved;
    }

    const [{ id }] = await db
      .insert(appSettings)
      .values({
        orgName: DEFAULT_SETTINGS.orgName,
        systemTitle: DEFAULT_SETTINGS.systemTitle,
        shortName: DEFAULT_SETTINGS.shortName,
        tagline: DEFAULT_SETTINGS.tagline,
        focalText: DEFAULT_SETTINGS.focalText,
        heroSubtitle: DEFAULT_SETTINGS.heroSubtitle,
        loginWelcome: DEFAULT_SETTINGS.loginWelcome,
        logoUrl: DEFAULT_SETTINGS.logoUrl,
        heroImageUrl: DEFAULT_SETTINGS.heroImageUrl,
        inventoryImageUrl: DEFAULT_SETTINGS.inventoryImageUrl,
        disposalImageUrl: DEFAULT_SETTINGS.disposalImageUrl,
        procurementImageUrl: DEFAULT_SETTINGS.procurementImageUrl,
        themePreset: DEFAULT_SETTINGS.themePreset,
        primaryColor: DEFAULT_SETTINGS.primaryColor,
        primaryDeep: DEFAULT_SETTINGS.primaryDeep,
        accentColor: DEFAULT_SETTINGS.accentColor,
        paperColor: DEFAULT_SETTINGS.paperColor,
        inkColor: DEFAULT_SETTINGS.inkColor,
        fontFamily: DEFAULT_SETTINGS.fontFamily,
        fontScale: DEFAULT_SETTINGS.fontScale,
      })
      .$returningId();
    const [row] = await db.select().from(appSettings).where(eq(appSettings.id, id));

    return normalizeSettings(row);
  } catch (error) {
    console.error("Unable to load persisted settings:", error);
    return DEFAULT_SETTINGS;
  }
}
