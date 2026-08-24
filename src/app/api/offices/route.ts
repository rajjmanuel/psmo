import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, offices } from "@/db/schema";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await seedIfEmpty();
  const rows = await db.select().from(offices).orderBy(offices.type, offices.name);
  return Response.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      code?: string;
      type?: string;
      head?: string;
      floor?: string;
      contact?: string;
      actor?: string;
    };

    if (!body.name || !body.code || !body.type) {
      return Response.json({ error: "Name, code, and type are required." }, { status: 400 });
    }

    const [{ id }] = await db
      .insert(offices)
      .values({
        name: body.name,
        code: body.code.toUpperCase(),
        type: body.type,
        head: body.head ?? null,
        floor: body.floor ?? null,
        contact: body.contact ?? null,
      })
      .$returningId();
    const [row] = await db.select().from(offices).where(eq(offices.id, id));

    await db.insert(activityLogs).values({
      module: "offices",
      action: "created",
      referenceId: row.id,
      details: `Added ${body.type} ${body.name}`,
      actor: body.actor ?? "PSMO Staff",
    });

    return Response.json(row, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return Response.json({ error: "An office or laboratory with this code already exists." }, { status: 400 });
    }
    return Response.json({ error: "An unexpected error occurred while saving." }, { status: 500 });
  }
}
