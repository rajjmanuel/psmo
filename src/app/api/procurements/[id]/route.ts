import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, canvassQuotes, offices, procurementRequests } from "@/db/schema";
import { nextControlNo, nextMrrNo } from "@/lib/next-number";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .select({
      id: procurementRequests.id,
      requestNo: procurementRequests.requestNo,
      unit: procurementRequests.unit,
      officeId: procurementRequests.officeId,
      officeName: offices.name,
      officeCode: offices.code,
      requestedBy: procurementRequests.requestedBy,
      requestDate: procurementRequests.requestDate,
      itemName: procurementRequests.itemName,
      specifications: procurementRequests.specifications,
      quantity: procurementRequests.quantity,
      estimatedCost: procurementRequests.estimatedCost,
      justification: procurementRequests.justification,
      status: procurementRequests.status,
      comparativeNotes: procurementRequests.comparativeNotes,
      approvalNotes: procurementRequests.approvalNotes,
      approvedBy: procurementRequests.approvedBy,
      approvedAt: procurementRequests.approvedAt,
      controlNo: procurementRequests.controlNo,
      poDate: procurementRequests.poDate,
      paymentRef: procurementRequests.paymentRef,
      paymentDate: procurementRequests.paymentDate,
      mrrNo: procurementRequests.mrrNo,
      mrrDate: procurementRequests.mrrDate,
      mrrFrom: procurementRequests.mrrFrom,
      supplier: procurementRequests.supplier,
      remarks: procurementRequests.remarks,
      createdAt: procurementRequests.createdAt,
      updatedAt: procurementRequests.updatedAt,
    })
    .from(procurementRequests)
    .leftJoin(offices, eq(procurementRequests.officeId, offices.id))
    .where(eq(procurementRequests.id, Number(id)))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const quotes = await db
    .select()
    .from(canvassQuotes)
    .where(eq(canvassQuotes.procurementRequestId, row.id));

  return Response.json({ ...row, quotes });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const actor = String(body.actor ?? "PSMO Staff");
  const action = typeof body.action === "string" ? body.action : null;

  const existing = await db
    .select()
    .from(procurementRequests)
    .where(eq(procurementRequests.id, Number(id)))
    .limit(1);
  if (!existing[0]) return Response.json({ error: "Not found" }, { status: 404 });

  const patch: Partial<typeof procurementRequests.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (action === "start-canvass") {
    patch.status = "canvassing";
  } else if (action === "add-quote") {
    patch.status = existing[0].status === "requested" ? "canvassing" : existing[0].status;
    await db.insert(canvassQuotes).values({
      procurementRequestId: existing[0].id,
      supplier: String(body.supplier ?? ""),
      quotedPrice: String(body.quotedPrice ?? "0"),
      terms: body.terms ? String(body.terms) : null,
      notes: body.notes ? String(body.notes) : null,
    });
  } else if (action === "select-quote") {
    const quoteId = Number(body.quoteId);
    const quotes = await db
      .select()
      .from(canvassQuotes)
      .where(eq(canvassQuotes.procurementRequestId, existing[0].id));
    for (const q of quotes) {
      await db
        .update(canvassQuotes)
        .set({ selected: q.id === quoteId })
        .where(eq(canvassQuotes.id, q.id));
    }
    const chosen = quotes.find((q) => q.id === quoteId);
    if (chosen) patch.supplier = chosen.supplier;
    patch.status = "comparative";
    patch.comparativeNotes = body.comparativeNotes
      ? String(body.comparativeNotes)
      : `Selected ${chosen?.supplier ?? "supplier"} as lowest complying.`;
  } else if (action === "submit-approval") {
    patch.status = "for-approval";
    if (body.comparativeNotes) patch.comparativeNotes = String(body.comparativeNotes);
  } else if (action === "approve") {
    patch.status = "approved";
    patch.approvedBy = actor;
    patch.approvedAt = new Date();
    patch.approvalNotes = body.approvalNotes ? String(body.approvalNotes) : "Approved.";
  } else if (action === "issue-po") {
    patch.status = "po-issued";
    patch.controlNo = existing[0].controlNo ?? (await nextControlNo());
    patch.poDate = body.poDate ? String(body.poDate) : todayISO();
    if (body.supplier) patch.supplier = String(body.supplier);
  } else if (action === "record-payment") {
    patch.status = "payment";
    patch.paymentRef = body.paymentRef ? String(body.paymentRef) : null;
    patch.paymentDate = body.paymentDate ? String(body.paymentDate) : todayISO();
  } else if (action === "start-delivery") {
    patch.status = "delivery";
  } else if (action === "receive-mrr") {
    patch.status = "received";
    patch.mrrNo = existing[0].mrrNo ?? (await nextMrrNo());
    patch.mrrDate = body.mrrDate ? String(body.mrrDate) : todayISO();
    patch.mrrFrom = body.mrrFrom ? String(body.mrrFrom) : "Accounting";
  } else if (action === "complete") {
    patch.status = "completed";
  } else if (action === "reject") {
    patch.status = "rejected";
    patch.remarks = body.remarks ? String(body.remarks) : existing[0].remarks;
  } else {
    if (body.remarks !== undefined) patch.remarks = body.remarks ? String(body.remarks) : null;
  }

  await db
    .update(procurementRequests)
    .set(patch)
    .where(eq(procurementRequests.id, Number(id)))
    ;
  const [row] = await db.select().from(procurementRequests).where(eq(procurementRequests.id, Number(id)));

  await db.insert(activityLogs).values({
    module: "procurement",
    action: action ?? "updated",
    referenceId: row.id,
    details: `${action ?? "updated"} ${row.requestNo}`,
    actor,
  });

  return Response.json(row);
}
