import {
  boolean,
  date,
  datetime,
  int,
  mediumtext,
  decimal,
  mysqlTable,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("staff"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const offices = mysqlTable("offices", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  head: text("head"),
  floor: text("floor"),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  taggingNo: text("tagging_no").notNull().unique(),
  description: text("description").notNull(),
  brand: text("brand"),
  model: text("model"),
  serialNo: text("serial_no"),
  partsNo: text("parts_no"),
  dateOfPurchase: date("date_of_purchase", { mode: "string" }),
  officeId: int("office_id").references(() => offices.id),
  locationNote: text("location_note"),
  status: text("status").notNull().default("serviceable"),
  category: text("category"),
  unitCost: decimal("unit_cost", { precision: 14, scale: 2 }),
  source: text("source").notNull().default("office"),
  condition: text("condition"),
  remarks: text("remarks"),
  recordedBy: text("recorded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const disposalRequests = mysqlTable("disposal_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestNo: text("request_no").notNull().unique(),
  officeId: int("office_id").references(() => offices.id),
  requestedBy: text("requested_by").notNull(),
  requestDate: date("request_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("requested"),
  endorsementType: text("endorsement_type"),
  endorsementRef: text("endorsement_ref"),
  endorsedBy: text("endorsed_by"),
  endorsedAt: datetime("endorsed_at"),
  verification: text("verification"),
  verifiedBy: text("verified_by"),
  verifiedAt: datetime("verified_at"),
  approvedBy: text("approved_by"),
  approvedAt: datetime("approved_at"),
  reason: text("reason"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const disposalItems = mysqlTable("disposal_items", {
  id: int("id").autoincrement().primaryKey(),
  disposalRequestId: int("disposal_request_id")
    .references(() => disposalRequests.id)
    .notNull(),
  assetId: int("asset_id")
    .references(() => assets.id)
    .notNull(),
  reason: text("reason"),
  condition: text("condition"),
});

export const procurementRequests = mysqlTable("procurement_requests", {
  id: int("id").autoincrement().primaryKey(),
  requestNo: text("request_no").notNull().unique(),
  unit: text("unit").notNull(),
  officeId: int("office_id").references(() => offices.id),
  requestedBy: text("requested_by").notNull(),
  requestDate: date("request_date", { mode: "string" }).notNull(),
  itemName: text("item_name").notNull(),
  specifications: text("specifications"),
  quantity: int("quantity").notNull().default(1),
  estimatedCost: decimal("estimated_cost", { precision: 14, scale: 2 }),
  justification: text("justification"),
  status: text("status").notNull().default("requested"),
  comparativeNotes: text("comparative_notes"),
  approvalNotes: text("approval_notes"),
  approvedBy: text("approved_by"),
  approvedAt: datetime("approved_at"),
  controlNo: text("control_no"),
  poDate: date("po_date", { mode: "string" }),
  paymentRef: text("payment_ref"),
  paymentDate: date("payment_date", { mode: "string" }),
  mrrNo: text("mrr_no"),
  mrrDate: date("mrr_date", { mode: "string" }),
  mrrFrom: text("mrr_from"),
  supplier: text("supplier"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const canvassQuotes = mysqlTable("canvass_quotes", {
  id: int("id").autoincrement().primaryKey(),
  procurementRequestId: int("procurement_request_id")
    .references(() => procurementRequests.id)
    .notNull(),
  supplier: text("supplier").notNull(),
  quotedPrice: decimal("quoted_price", { precision: 14, scale: 2 }).notNull(),
  terms: text("terms"),
  selected: boolean("selected").default(false).notNull(),
  notes: text("notes"),
});

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  module: text("module").notNull(),
  action: text("action").notNull(),
  referenceId: int("reference_id"),
  details: text("details"),
  actor: text("actor").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  // Branding text
  orgName: text("org_name").notNull().default("Property Supply and Management Office"),
  systemTitle: text("system_title").notNull().default("Asset Management System"),
  shortName: text("short_name").notNull().default("PSMO"),
  tagline: text("tagline").notNull().default("Property · Supply"),
  focalText: text("focal_text").notNull().default("Focal: Ma'am Mitch & PSMO Staff"),
  heroSubtitle: text("hero_subtitle")
    .notNull()
    .default(
      "Official ledger for recording stock, disposing unserviceable property, and walking AMT / SSMT purchases from canvass to Material Receiving Report.",
    ),
  loginWelcome: text("login_welcome")
    .notNull()
    .default("Use your PSMO credentials. After login you will go straight to dashboard."),
  // Images (URL or data URL)
  logoUrl: mediumtext("logo_url").notNull().default("https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=400&q=80"),
  heroImageUrl: mediumtext("hero_image_url").notNull().default("https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85"),
  inventoryImageUrl: mediumtext("inventory_image_url").notNull().default("https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1000&q=85"),
  disposalImageUrl: mediumtext("disposal_image_url").notNull().default("https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=85"),
  procurementImageUrl: mediumtext("procurement_image_url")
    .notNull()
    .default("https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85"),
  // Theme
  themePreset: text("theme_preset").notNull().default("blue"),
  primaryColor: text("primary_color").notNull().default("#1d4ed8"),
  primaryDeep: text("primary_deep").notNull().default("#172554"),
  accentColor: text("accent_color").notNull().default("#06b6d4"),
  paperColor: text("paper_color").notNull().default("#f6f8fc"),
  inkColor: text("ink_color").notNull().default("#0f172a"),
  // Typography
  fontFamily: text("font_family").notNull().default("Poppins"),
  fontScale: text("font_scale").notNull().default("100"),
  // Meta
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
