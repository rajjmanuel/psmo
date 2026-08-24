"use client";

import { AssetForm } from "@/components/AssetForm";
import { DisposalForm } from "@/components/DisposalForm";
import { ModalTrigger } from "@/components/Modal";
import { ProcurementForm } from "@/components/ProcurementForm";
import { UserForm, type EditableUser } from "@/components/UserForm";

type Office = { id: number; name: string; code: string; type: string };
type Asset = {
  id: number;
  taggingNo: string;
  description: string;
  status: string;
  officeName: string | null;
};

type EditableAsset = {
  id: number;
  taggingNo: string;
  description: string;
  brand?: string | null;
  model?: string | null;
  serialNo?: string | null;
  partsNo?: string | null;
  dateOfPurchase?: string | null;
  officeId?: number | null;
  locationNote?: string | null;
  status?: string;
  category?: string | null;
  unitCost?: string | null;
  source?: string;
  condition?: string | null;
  remarks?: string | null;
};

export function RecordItemModal({
  offices,
  label = "Record item",
}: {
  offices: Office[];
  label?: string;
}) {
  return (
    <ModalTrigger
      label={label}
      title="Record item or equipment"
      description="Create a new PSMO inventory record from any office or laboratory."
    >
      {({ close }) => <AssetForm offices={offices} onSuccess={() => close()} />}
    </ModalTrigger>
  );
}

export function EditItemModal({
  offices,
  asset,
  label = "Edit",
}: {
  offices: Office[];
  asset: EditableAsset;
  label?: string;
}) {
  return (
    <ModalTrigger
      label={label}
      title={`Edit ${asset.taggingNo}`}
      description="Update the official inventory details while keeping the same audit record."
      variant="ghost"
      buttonClassName="!px-3 !py-1.5 !text-xs"
    >
      {({ close }) => <AssetForm offices={offices} initial={asset} onSuccess={() => close()} />}
    </ModalTrigger>
  );
}

export function DisposalRequestModal({
  offices,
  assets,
  label = "File request",
}: {
  offices: Office[];
  assets: Asset[];
  label?: string;
}) {
  return (
    <ModalTrigger
      label={label}
      title="File a disposal request"
      description="Request disposal for unserviceable office or laboratory property."
    >
      {({ close }) => (
        <DisposalForm offices={offices} assets={assets} onSuccess={() => close()} />
      )}
    </ModalTrigger>
  );
}

export function ProcurementRequestModal({
  offices,
  label = "New request",
}: {
  offices: Office[];
  label?: string;
}) {
  return (
    <ModalTrigger
      label={label}
      title="AMT / SSMT procurement request"
      description="Start a procurement request and continue through canvassing, P.O., and MRR."
    >
      {({ close }) => <ProcurementForm offices={offices} onSuccess={() => close()} />}
    </ModalTrigger>
  );
}

export function AddUserModal({ label = "Add account" }: { label?: string }) {
  return (
    <ModalTrigger
      label={label}
      title="Create staff account"
      description="Register a PSMO staff member so they can sign in and be traceable in the audit trail."
    >
      {({ close }) => <UserForm onSuccess={close} />}
    </ModalTrigger>
  );
}

export function EditUserModal({
  user,
  label = "Edit",
}: {
  user: EditableUser;
  label?: string;
}) {
  return (
    <ModalTrigger
      label={label}
      title={`Edit ${user.name}`}
      description="Update role, reset password, or activate/deactivate this staff account."
      variant="ghost"
      buttonClassName="!px-3 !py-1.5 !text-xs"
    >
      {({ close }) => <UserForm initial={user} onSuccess={close} />}
    </ModalTrigger>
  );
}
