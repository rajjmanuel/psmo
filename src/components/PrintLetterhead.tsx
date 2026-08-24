"use client";

import { useBranding } from "@/components/BrandingProvider";

/**
 * Shown only on printed output (hidden on screen via the .print-only class).
 * Gives the paper copy a proper PSMO letterhead since the app header is hidden.
 */
export function PrintLetterhead({ title }: { title: string }) {
  const { settings } = useBranding();
  const printedOn = new Date().toLocaleString("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="print-only" style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "2px solid #0f172a",
          paddingBottom: "8px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.logoUrl}
          alt=""
          style={{ height: "52px", width: "52px", objectFit: "contain" }}
        />
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: "13pt", fontWeight: 700 }}>{settings.orgName}</div>
          <div style={{ fontSize: "10pt" }}>{settings.systemTitle}</div>
          <div style={{ fontSize: "9pt" }}>{settings.focalText}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "8px",
        }}
      >
        <div style={{ fontSize: "14pt", fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: "8.5pt" }}>Printed: {printedOn}</div>
      </div>
    </div>
  );
}
