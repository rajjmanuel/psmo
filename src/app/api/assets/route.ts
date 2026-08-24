import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, assets, offices } from "@/db/schema";
import { nextTaggingNo } from "@/lib/next-number";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await seedIfEmpty();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const officeId = searchParams.get("officeId");
  const source = searchParams.get("source");

  const filters = [];
  if (q) {
    filters.push(
      or(
        like(assets.taggingNo, `%${q}%`),
        like(assets.description, `%${q}%`),
        like(assets.brand, `%${q}%`),
        like(assets.model, `%${q}%`),
        like(assets.serialNo, `%${q}%`),
      ),
    );
  }
  if (status) filters.push(eq(assets.status, status));
  if (officeId) filters.push(eq(assets.officeId, Number(officeId)));
  if (source) filters.push(eq(assets.source, source));

  const rows = await db
    .select({
      id: assets.id,
      taggingNo: assets.taggingNo,
      description: assets.description,
      brand: assets.brand,
      model: assets.model,
      serialNo: assets.serialNo,
      partsNo: assets.partsNo,
      dateOfPurchase: assets.dateOfPurchase,
      officeId: assets.officeId,
      officeName: offices.name,
      officeCode: offices.code,
      officeType: offices.type,
      locationNote: assets.locationNote,
      status: assets.status,
      category: assets.category,
      unitCost: assets.unitCost,
      source: assets.source,
      condition: assets.condition,
      remarks: assets.remarks,
      recordedBy: assets.recordedBy,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
    })
    .from(assets)
    .leftJoin(offices, eq(assets.officeId, offices.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(assets.createdAt));

  return Response.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string | number | null | undefined>;

    if (!body.description) {
      return Response.json({ error: "Description is required." }, { status: 400 });
    }

    const taggingNo =
      typeof body.taggingNo === "string" && body.taggingNo.trim()
        ? body.taggingNo.trim()
        : await nextTaggingNo();

    const [{ id }] = await db
      .insert(assets)
      .values({
        taggingNo,
        description: String(body.description),
        brand: body.brand ? String(body.brand) : null,
        model: body.model ? String(body.model) : null,
        serialNo: body.serialNo ? String(body.serialNo) : null,
        partsNo: body.partsNo ? String(body.partsNo) : null,
        dateOfPurchase: body.dateOfPurchase ? String(body.dateOfPurchase) : null,
        officeId: body.officeId ? Number(body.officeId) : null,
        locationNote: body.locationNote ? String(body.locationNote) : null,
        status: body.status ? String(body.status) : "serviceable",
        category: body.category ? String(body.category) : null,
        unitCost: body.unitCost != null && body.unitCost !== "" ? String(body.unitCost) : null,
        source: body.source ? String(body.source) : "office",
        condition: body.condition ? String(body.condition) : null,
        remarks: body.remarks ? String(body.remarks) : null,
        recordedBy: body.recordedBy ? String(body.recordedBy) : "PSMO Staff",
      })
      .$returningId();
    const [row] = await db.select().from(assets).where(eq(assets.id, id));

    await db.insert(activityLogs).values({
      module: "inventory",
      action: "recorded",
      referenceId: row.id,
      details: `Recorded ${row.description} (${row.taggingNo})`,
      actor: row.recordedBy ?? "PSMO Staff",
    });

    return Response.json(row, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return Response.json({ error: "That Tagging No. is already in use." }, { status: 400 });
    }
    return Response.json({ error: "An unexpected error occurred while saving." }, { status: 500 });
  }
}
