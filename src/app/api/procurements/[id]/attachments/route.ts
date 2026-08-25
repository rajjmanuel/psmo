import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, procurementAttachments, procurementRequests } from "@/db/schema";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const requestId = Number(id);
    const [procurement] = await db
      .select({ id: procurementRequests.id })
      .from(procurementRequests)
      .where(eq(procurementRequests.id, requestId));
    if (!procurement) return Response.json({ error: "Procurement request not found." }, { status: 404 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "No file was uploaded." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "Upload a PDF, Excel, or Word file up to 10 MB." }, { status: 400 });
    }

    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const [{ id: attachmentId }] = await db
      .insert(procurementAttachments)
      .values({ procurementRequestId: requestId, fileName: file.name, mimeType: file.type, data })
      .$returningId();
    await db.insert(activityLogs).values({
      module: "procurement",
      action: "attachment-added",
      referenceId: requestId,
      details: `Attached ${file.name}`,
      actor: "PSMO Staff",
    });
    return Response.json({ id: attachmentId, fileName: file.name }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to upload attachment." }, { status: 500 });
  }
}
