import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLogs,
  assets,
  canvassQuotes,
  disposalItems,
  disposalRequests,
  offices,
  procurementRequests,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/password";

export async function seedUsersIfEmpty() {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) return { seeded: false };

  const defaults = [
    { username: "admin", password: "admin@123", name: "PSMO Admin", role: "admin" },
    { username: "psmo", password: "psmo123", name: "PSMO Staff", role: "staff" },
    { username: "amt", password: "amt123", name: "AMT Officer", role: "amt" },
    { username: "ssmt", password: "ssmt123", name: "SSMT Officer", role: "ssmt" },
    { username: "accounting", password: "acct123", name: "Accounting", role: "accounting" },
  ];

  await db.insert(users).values(
    defaults.map((d) => ({
      username: d.username,
      passwordHash: hashPassword(d.password),
      name: d.name,
      role: d.role,
    })),
  );

  return { seeded: true };
}

export async function seedIfEmpty() {
  await seedUsersIfEmpty();

  const existing = await db.select({ id: offices.id }).from(offices).limit(1);
  if (existing.length > 0) return { seeded: false };

  // Minimal starter data: just enough (2-3 records per module) to show how
  // each workflow behaves without cluttering the ledger with sample noise.
  await db
    .insert(offices)
    .values([
      { name: "Property Supply & Management Office", code: "PSMO", type: "office", head: "Ma'am Mitch", floor: "Ground Floor", contact: "loc. 101" },
      { name: "Administrative Management Team", code: "AMT", type: "office", head: "Mr. Santos", floor: "2nd Floor", contact: "loc. 220" },
      { name: "Computer Laboratory", code: "COMP", type: "laboratory", head: "Engr. Tan", floor: "ICT Bldg 1F", contact: "loc. 501" },
    ])
    ;
  const insertedOffices = await db.select().from(offices);

  const byCode = Object.fromEntries(insertedOffices.map((o) => [o.code, o.id]));

  await db
    .insert(assets)
    .values([
      { taggingNo: "PSMO-2024-0001", description: "Desktop Computer Workstation", brand: "Dell", model: "OptiPlex 7090", serialNo: "DL7090-AA1821", partsNo: "OPT-7090-16", dateOfPurchase: "2024-02-14", officeId: byCode.COMP, locationNote: "Computer Lab Row A", status: "serviceable", category: "IT Equipment", unitCost: "54800.00", source: "laboratory", condition: "Good", recordedBy: "Ma'am Mitch" },
      { taggingNo: "PSMO-2021-0033", description: "Photocopier", brand: "Canon", model: "imageRUNNER 2645i", serialNo: "CN2645-7731", partsNo: "IR-2645I", dateOfPurchase: "2021-08-09", officeId: byCode.AMT, locationNote: "AMT hallway", status: "unserviceable", category: "Office Equipment", unitCost: "96800.00", source: "office", condition: "Beyond economical repair", recordedBy: "PSMO Staff" },
      { taggingNo: "PSMO-2022-0088", description: "Air Conditioning Unit 2.0 HP", brand: "Carrier", model: "Aura Inverter", serialNo: "CR-AURA-22088", partsNo: "38GHA024", dateOfPurchase: "2022-04-11", officeId: byCode.AMT, locationNote: "AMT Conference Room", status: "under-repair", category: "Office Equipment", unitCost: "41200.00", source: "office", condition: "Needs service", recordedBy: "PSMO Staff" },
    ])
    ;
  const insertedAssets = await db.select().from(assets);

  const assetByTag = Object.fromEntries(insertedAssets.map((a) => [a.taggingNo, a.id]));

  await db
    .insert(disposalRequests)
    .values({
      requestNo: "DR-2026-0001",
      officeId: byCode.AMT,
      requestedBy: "Mr. Santos",
      requestDate: "2026-01-14",
      status: "verified",
      endorsementType: "both",
      endorsementRef: "IOM-AMT-2026-04 / DISP-XLS-011",
      endorsedBy: "PSMO Staff",
      endorsedAt: new Date("2026-01-16T09:10:00"),
      verification: "beyond-repair",
      verifiedBy: "Ma'am Mitch",
      verifiedAt: new Date("2026-01-20T14:22:00"),
      reason: "Photocopier no longer economical to repair; spare parts discontinued.",
      remarks: "Ready for approval and hauling.",
    })
    ;
  const [dr1] = await db.select().from(disposalRequests).where(eq(disposalRequests.requestNo, "DR-2026-0001"));

  await db
    .insert(disposalRequests)
    .values({
      requestNo: "DR-2026-0002",
      officeId: byCode.COMP,
      requestedBy: "Engr. Tan",
      requestDate: "2026-02-18",
      status: "requested",
      reason: "Requesting disposal review for aging lab peripherals after warranty check.",
    })
    ;
  const [dr2] = await db.select().from(disposalRequests).where(eq(disposalRequests.requestNo, "DR-2026-0002"));

  await db.insert(disposalItems).values([
    { disposalRequestId: dr1.id, assetId: assetByTag["PSMO-2021-0033"], reason: "Beyond economical repair", condition: "Unserviceable" },
  ]);

  await db
    .insert(procurementRequests)
    .values({
      requestNo: "PR-2026-0001",
      unit: "AMT",
      officeId: byCode.AMT,
      requestedBy: "Mr. Santos",
      requestDate: "2026-01-08",
      itemName: "Split-type Air Conditioner 2.5 HP Inverter",
      specifications: "2.5HP inverter, R32 refrigerant, inclusive of installation and 1-year parts warranty.",
      quantity: 2,
      estimatedCost: "98000.00",
      justification: "Replacement for failing conference room units used for AMT hearings.",
      status: "po-issued",
      comparativeNotes: "Lowest complying: CoolAir Trading at ₱46,800/unit.",
      approvalNotes: "Approved by Ma'am Mitch pending availability of allotment.",
      approvedBy: "Ma'am Mitch",
      approvedAt: new Date("2026-01-22T10:00:00"),
      controlNo: "PO-2026-0007",
      poDate: "2026-01-24",
      supplier: "CoolAir Trading",
      remarks: "Awaiting delivery and check payment clearance.",
    })
    ;
  const [pr1] = await db.select().from(procurementRequests).where(eq(procurementRequests.requestNo, "PR-2026-0001"));

  await db.insert(procurementRequests).values({
    requestNo: "PR-2026-0002",
    unit: "SSMT",
    officeId: byCode.COMP,
    requestedBy: "Engr. Tan",
    requestDate: "2026-02-10",
    itemName: "UPS 1500VA for Computer Laboratory",
    specifications: "1500VA / 900W line-interactive, AVR, 6 outlets.",
    quantity: 4,
    estimatedCost: "36000.00",
    justification: "Brownouts damaged lab PSUs last quarter.",
    status: "requested",
  });

  await db.insert(canvassQuotes).values([
    { procurementRequestId: pr1.id, supplier: "CoolAir Trading", quotedPrice: "93600.00", terms: "30 days, free install", selected: true, notes: "Lowest complying" },
    { procurementRequestId: pr1.id, supplier: "BreezeHome Corp.", quotedPrice: "99800.00", terms: "15 days", selected: false },
  ]);

  await db.insert(activityLogs).values([
    { module: "inventory", action: "recorded", referenceId: insertedAssets[0].id, details: "Recorded Desktop Computer Workstation PSMO-2024-0001", actor: "Ma'am Mitch" },
    { module: "disposal", action: "verified", referenceId: dr1.id, details: "Verified DR-2026-0001 as beyond repair", actor: "Ma'am Mitch" },
    { module: "procurement", action: "po-issued", referenceId: pr1.id, details: "Issued P.O. PO-2026-0007 for PR-2026-0001", actor: "PSMO Staff" },
  ]);

  return { seeded: true };
}
