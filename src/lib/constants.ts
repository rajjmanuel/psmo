export const STAFF = [
  "Ma'am Mitch",
  "PSMO Staff",
  "AMT Officer",
  "SSMT Officer",
  "Accounting",
] as const;

export const ASSET_STATUSES = [
  { value: "serviceable", label: "Serviceable" },
  { value: "in-stock", label: "In Stock" },
  { value: "under-repair", label: "Under Repair" },
  { value: "unserviceable", label: "Unserviceable" },
  { value: "for-disposal", label: "For Disposal" },
  { value: "disposed", label: "Disposed" },
] as const;

export const ASSET_CATEGORIES = [
  "IT Equipment",
  "Office Equipment",
  "Laboratory Equipment",
  "Furniture & Fixture",
  "Communication",
  "Tools & Instruments",
  "Vehicle / Mobility",
  "Supplies",
] as const;

export const DISPOSAL_STATUSES = [
  { value: "requested", label: "Requested" },
  { value: "endorsed", label: "Endorsed" },
  { value: "verified", label: "Verified" },
  { value: "approved", label: "Approved" },
  { value: "disposed", label: "Disposed" },
  { value: "rejected", label: "Rejected" },
] as const;

export const PROCUREMENT_STATUSES = [
  { value: "requested", label: "Requested" },
  { value: "canvassing", label: "Canvassing" },
  { value: "comparative", label: "Comparative Report" },
  { value: "for-approval", label: "For Approval" },
  { value: "approved", label: "Approved" },
  { value: "po-issued", label: "P.O. Issued" },
  { value: "payment", label: "After Check Payment" },
  { value: "delivery", label: "Delivery Process" },
  { value: "received", label: "MRR Received" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
] as const;

export const PROCUREMENT_STEPS = [
  "requested",
  "canvassing",
  "comparative",
  "for-approval",
  "approved",
  "po-issued",
  "payment",
  "delivery",
  "received",
  "completed",
] as const;

export const DISPOSAL_STEPS = [
  "requested",
  "endorsed",
  "verified",
  "approved",
  "disposed",
] as const;
