import { eq } from "drizzle-orm";
import { db } from "@/db";
import { procurementAttachments } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const { id, attachmentId } = await params;
  const [attachment] = await db
    .select()
    .from(procurementAttachments)
    .where(eq(procurementAttachments.id, Number(attachmentId)));
  if (!attachment || attachment.procurementRequestId !== Number(id)) {
    return Response.json({ error: "Attachment not found." }, { status: 404 });
  }

  return new Response(Buffer.from(attachment.data, "base64"), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `attachment; filename="${attachment.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
