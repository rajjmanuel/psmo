import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);
const MAX_BYTES = 2_500_000;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  return NextResponse.json({ url: `data:${file.type};base64,${encoded}` });
}
