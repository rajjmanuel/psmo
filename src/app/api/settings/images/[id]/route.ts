import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { settingImages } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const [image] = await db.select().from(settingImages).where(eq(settingImages.id, id)).limit(1);
  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const data = Buffer.from(image.data, "base64");
  return new NextResponse(data, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
