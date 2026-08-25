import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);
const MAX_BYTES = 2_500_000;
const IMAGE_KEYS = new Set([
  "logoUrl",
  "heroImageUrl",
  "inventoryImageUrl",
  "disposalImageUrl",
  "procurementImageUrl",
]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = new URL(request.url).searchParams.get("key");
  if (!key || !IMAGE_KEYS.has(key)) {
    return NextResponse.json({ error: "Invalid image setting." }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file was uploaded." }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Please upload a PNG, JPG, WEBP, or GIF image." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large. Keep under 2.5 MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const encoded = bytes.toString("base64");
  const value = `data:${file.type};base64,${encoded}`;
  const [settings] = await db.select({ id: appSettings.id }).from(appSettings).limit(1);
  if (!settings) {
    return NextResponse.json({ error: "Unable to initialize settings." }, { status: 500 });
  }

  const updates = {
    logoUrl: key === "logoUrl" ? value : undefined,
    heroImageUrl: key === "heroImageUrl" ? value : undefined,
    inventoryImageUrl: key === "inventoryImageUrl" ? value : undefined,
    disposalImageUrl: key === "disposalImageUrl" ? value : undefined,
    procurementImageUrl: key === "procurementImageUrl" ? value : undefined,
    updatedBy: user.name,
    updatedAt: new Date(),
  };
  await db.update(appSettings).set(updates).where(eq(appSettings.id, settings.id));

  return NextResponse.json({ url: value });
}
