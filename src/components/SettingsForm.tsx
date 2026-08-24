"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useBranding } from "@/components/BrandingProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import {
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  FONT_SCALES,
  THEME_PRESETS,
  type AppSettings,
} from "@/lib/settings";

export function SettingsForm() {
  const { name: actorName } = useAuth();
  const { settings, updateLocal, refresh } = useBranding();
  const toast = useToast();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function setField<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    updateLocal(next);
  }

  function applyPreset(key: string) {
    const preset = THEME_PRESETS[key];
    if (!preset) return;
    const next = {
      ...form,
      themePreset: key,
      primaryColor: preset.primaryColor,
      primaryDeep: preset.primaryDeep,
      accentColor: preset.accentColor,
      paperColor: preset.paperColor,
      inkColor: preset.inkColor,
    };
    setForm(next);
    updateLocal(next);
  }

  async function onFile(
    key: keyof Pick<
      AppSettings,
      | "logoUrl"
      | "heroImageUrl"
      | "inventoryImageUrl"
      | "disposalImageUrl"
      | "procurementImageUrl"
    >,
    file: File | null,
  ) {
    if (!file) return;
    if (file.size > 2_500_000) {
      setError("Image too large. Keep under 2.5 MB.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    const res = await authFetch("/api/settings/upload", {
      method: "POST",
      body,
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      setError(data.error ?? "Unable to upload image.");
      return;
    }
    setField(key, data.url);
  }

  async function save() {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const res = await authFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, actor: actorName }),
      });
      const data = (await res.json()) as AppSettings & { error?: string };
      if (!res.ok) {
        toast.error("Unable to save settings", data.error ?? "Please try again.");
        setError(data.error ?? "Unable to save settings.");
        setSaving(false);
        return;
      }
      updateLocal(data);
      await refresh();
      setMsg("Settings saved. Branding is live across the system.");
      toast.success("Settings saved", "Branding applied across the PSMO system.");
    } catch {
      toast.error("Unable to save settings", "Network error while saving.");
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  function resetDefaults() {
    setForm(DEFAULT_SETTINGS);
    updateLocal(DEFAULT_SETTINGS);
  }

  return (
    <div className="space-y-6">
      {(msg || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || msg}
        </div>
      )}

      {/* Branding text */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-xl text-[var(--ink)]">Branding text</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Titles and labels shown on the sidebar, dashboard, and login.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organization name">
            <input
              className="field"
              value={form.orgName}
              onChange={(e) => setField("orgName", e.target.value)}
            />
          </Field>
          <Field label="System title">
            <input
              className="field"
              value={form.systemTitle}
              onChange={(e) => setField("systemTitle", e.target.value)}
            />
          </Field>
          <Field label="Short name (sidebar)">
            <input
              className="field"
              value={form.shortName}
              onChange={(e) => setField("shortName", e.target.value)}
            />
          </Field>
          <Field label="Tagline">
            <input
              className="field"
              value={form.tagline}
              onChange={(e) => setField("tagline", e.target.value)}
            />
          </Field>
          <Field label="Focal text">
            <input
              className="field"
              value={form.focalText}
              onChange={(e) => setField("focalText", e.target.value)}
            />
          </Field>
          <Field label="Login welcome message">
            <input
              className="field"
              value={form.loginWelcome}
              onChange={(e) => setField("loginWelcome", e.target.value)}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Hero subtitle">
              <textarea
                className="field"
                rows={3}
                value={form.heroSubtitle}
                onChange={(e) => setField("heroSubtitle", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-xl text-[var(--ink)]">Logos & display images</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Upload a new image or paste a URL. Uploaded images are stored with the settings.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <ImageField
            label="Logo / seal"
            value={form.logoUrl}
            onUrl={(v) => setField("logoUrl", v)}
            onFile={(f) => onFile("logoUrl", f)}
          />
          <ImageField
            label="Hero image"
            value={form.heroImageUrl}
            onUrl={(v) => setField("heroImageUrl", v)}
            onFile={(f) => onFile("heroImageUrl", f)}
          />
          <ImageField
            label="Inventory module image"
            value={form.inventoryImageUrl}
            onUrl={(v) => setField("inventoryImageUrl", v)}
            onFile={(f) => onFile("inventoryImageUrl", f)}
          />
          <ImageField
            label="Disposal module image"
            value={form.disposalImageUrl}
            onUrl={(v) => setField("disposalImageUrl", v)}
            onFile={(f) => onFile("disposalImageUrl", f)}
          />
          <ImageField
            label="Procurement module image"
            value={form.procurementImageUrl}
            onUrl={(v) => setField("procurementImageUrl", v)}
            onFile={(f) => onFile("procurementImageUrl", f)}
          />
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-xl text-[var(--ink)]">Theme</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Pick a preset or fine-tune colors. Changes preview live before you save.
        </p>
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(THEME_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={`rounded-xl border p-3 text-left transition ${
                form.themePreset === key
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30"
                  : "border-[var(--line)] hover:border-[var(--primary)]/40"
              }`}
            >
              <div className="mb-2 flex gap-1">
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ background: preset.primaryDeep }}
                />
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ background: preset.primaryColor }}
                />
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ background: preset.accentColor }}
                />
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">{preset.label}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ColorField
            label="Primary"
            value={form.primaryColor}
            onChange={(v) => setField("primaryColor", v)}
          />
          <ColorField
            label="Deep / sidebar"
            value={form.primaryDeep}
            onChange={(v) => setField("primaryDeep", v)}
          />
          <ColorField
            label="Accent"
            value={form.accentColor}
            onChange={(v) => setField("accentColor", v)}
          />
          <ColorField
            label="Paper / background"
            value={form.paperColor}
            onChange={(v) => setField("paperColor", v)}
          />
          <ColorField
            label="Ink / text"
            value={form.inkColor}
            onChange={(v) => setField("inkColor", v)}
          />
        </div>
      </section>

      {/* Typography */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-xl text-[var(--ink)]">Typography</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Change the system font and overall text size.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Font family">
            <select
              className="field"
              value={form.fontFamily}
              onChange={(e) => setField("fontFamily", e.target.value)}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Font size scale">
            <select
              className="field"
              value={form.fontScale}
              onChange={(e) => setField("fontScale", e.target.value)}
            >
              {FONT_SCALES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div
          className="mt-4 rounded-xl border border-dashed border-[var(--line)] p-4"
          style={{ fontFamily: form.fontFamily }}
        >
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Live preview</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: form.inkColor }}>
            {form.systemTitle}
          </p>
          <p className="text-sm" style={{ color: form.primaryColor }}>
            {form.orgName}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">{form.heroSubtitle}</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
        <button type="button" onClick={resetDefaults} className="btn-ghost">
          Reset to defaults (preview)
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[var(--ink)]">{label}</span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[var(--ink)]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-[var(--line)] bg-white p-1"
        />
        <input
          className="field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  );
}

function ImageField({
  label,
  value,
  onUrl,
  onFile,
}: {
  label: string;
  value: string;
  onUrl: (v: string) => void;
  onFile: (f: File | null) => void;
}) {
  const [fileName, setFileName] = useState("");
  const inputId = `image-upload-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="rounded-xl border border-[var(--line)] p-3">
      <p className="mb-2 text-sm font-medium text-[var(--ink)]">{label}</p>
      <div className="mb-3 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt={label} className="h-32 w-full object-cover" />
      </div>
      <input
        className="field mb-2 text-xs"
        value={value.startsWith("data:") ? "(uploaded image)" : value}
        onChange={(e) => {
          if (!e.target.value.startsWith("(uploaded")) onUrl(e.target.value);
        }}
        placeholder="/images/... or https://..."
      />
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--primary)]/50 bg-[var(--primary-soft)] p-3">
        <label
          htmlFor={inputId}
          className="inline-flex shrink-0 cursor-pointer items-center rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Choose file
        </label>
        <span className="min-w-0 truncate text-sm text-[var(--ink)]">
          {fileName || "No file chosen"}
        </span>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setFileName(file?.name ?? "");
            onFile(file);
          }}
        />
      </div>
    </div>
  );
}
