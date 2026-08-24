import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, appSettings } from "@/db/schema";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/settings";
import { getPersistedSettings, normalizeSettings } from "@/lib/settings-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getPersistedSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<AppSettings> & { actor?: string };
    const current = await getPersistedSettings();
    const id = current.id;

    if (!id) {
      const created = await getPersistedSettings();
      if (!created.id) {
        return NextResponse.json({ error: "Unable to initialize settings." }, { status: 500 });
      }
    }

    const next = normalizeSettings({ ...current, ...body });
    const targetId = current.id ?? 1;

    await db
      .update(appSettings)
      .set({
        orgName: next.orgName,
        systemTitle: next.systemTitle,
        shortName: next.shortName,
        tagline: next.tagline,
        focalText: next.focalText,
        heroSubtitle: next.heroSubtitle,
        loginWelcome: next.loginWelcome,
        logoUrl: next.logoUrl,
        heroImageUrl: next.heroImageUrl,
        inventoryImageUrl: next.inventoryImageUrl,
        disposalImageUrl: next.disposalImageUrl,
        procurementImageUrl: next.procurementImageUrl,
        themePreset: next.themePreset,
        primaryColor: next.primaryColor,
        primaryDeep: next.primaryDeep,
        accentColor: next.accentColor,
        paperColor: next.paperColor,
        inkColor: next.inkColor,
        fontFamily: next.fontFamily,
        fontScale: next.fontScale,
        updatedBy: body.actor ?? "PSMO Staff",
        updatedAt: new Date(),
      })
      .where(eq(appSettings.id, targetId))
      ;
    const [row] = await db.select().from(appSettings).where(eq(appSettings.id, targetId));

    const saved = normalizeSettings(row ?? next);

    await db.insert(activityLogs).values({
      module: "settings",
      action: "updated",
      referenceId: saved.id ?? targetId,
      details: `Updated branding — theme ${saved.themePreset}, font ${saved.fontFamily}`,
      actor: body.actor ?? "PSMO Staff",
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Unable to save settings. Please check the database connection and try again." },
      { status: 500 },
    );
  }
}
