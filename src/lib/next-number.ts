import { desc, like } from "drizzle-orm";
import { db } from "@/db";
import { assets, disposalRequests, procurementRequests } from "@/db/schema";
import { padSeq, yearNow } from "@/lib/format";

function nextFromLast(last: string | undefined, prefix: string) {
  const year = yearNow();
  if (!last) return `${prefix}-${year}-0001`;
  const parts = last.split("-");
  const seq = Number(parts[2] ?? 0) + 1;
  return `${prefix}-${year}-${padSeq(Number.isNaN(seq) ? 1 : seq)}`;
}

export async function nextTaggingNo() {
  const year = yearNow();
  const [row] = await db
    .select({ taggingNo: assets.taggingNo })
    .from(assets)
    .where(like(assets.taggingNo, `PSMO-${year}-%`))
    .orderBy(desc(assets.taggingNo))
    .limit(1);
  return nextFromLast(row?.taggingNo, "PSMO");
}

export async function nextDisposalNo() {
  const year = yearNow();
  const [row] = await db
    .select({ requestNo: disposalRequests.requestNo })
    .from(disposalRequests)
    .where(like(disposalRequests.requestNo, `DR-${year}-%`))
    .orderBy(desc(disposalRequests.requestNo))
    .limit(1);
  return nextFromLast(row?.requestNo, "DR");
}

export async function nextProcurementNo() {
  const year = yearNow();
  const [row] = await db
    .select({ requestNo: procurementRequests.requestNo })
    .from(procurementRequests)
    .where(like(procurementRequests.requestNo, `PR-${year}-%`))
    .orderBy(desc(procurementRequests.requestNo))
    .limit(1);
  return nextFromLast(row?.requestNo, "PR");
}

export async function nextControlNo() {
  const year = yearNow();
  const [row] = await db
    .select({ controlNo: procurementRequests.controlNo })
    .from(procurementRequests)
    .where(like(procurementRequests.controlNo, `PO-${year}-%`))
    .orderBy(desc(procurementRequests.controlNo))
    .limit(1);
  return nextFromLast(row?.controlNo ?? undefined, "PO");
}

export async function nextMrrNo() {
  const year = yearNow();
  const [row] = await db
    .select({ mrrNo: procurementRequests.mrrNo })
    .from(procurementRequests)
    .where(like(procurementRequests.mrrNo, `MRR-${year}-%`))
    .orderBy(desc(procurementRequests.mrrNo))
    .limit(1);
  return nextFromLast(row?.mrrNo ?? undefined, "MRR");
}
