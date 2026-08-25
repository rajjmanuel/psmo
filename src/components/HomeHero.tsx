"use client";

import Image from "next/image";
import { ProcurementRequestModal, RecordItemModal } from "@/components/CrudModals";
import { useBranding } from "@/components/BrandingProvider";

type Office = { id: number; name: string; code: string; type: string };

export function HomeHero({ offices }: { offices: Office[] }) {
  const { settings } = useBranding();
  const logoIsData = settings.logoUrl.startsWith("data:");
  const heroIsData = settings.heroImageUrl.startsWith("data:");

  return (
    <section
      className="overflow-hidden rounded-[28px] border text-white"
      style={{
        borderColor: mix(settings.primaryDeep, "#ffffff", 0.2),
        background: settings.primaryDeep,
      }}
    >
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-7 md:p-10">
          <p
            className="text-[11px] uppercase tracking-[0.28em]"
            style={{ color: settings.accentColor }}
          >
            {settings.orgName}
          </p>
          <h1 className="font-display mt-3 max-w-xl text-4xl leading-[0.95] md:text-6xl">
            {settings.systemTitle}
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-200 md:text-base">
            {settings.heroSubtitle}
          </p>
          <p className="mt-5 text-sm" style={{ color: settings.accentColor }}>
            {settings.focalText}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <RecordItemModal offices={offices} label="Record an item" />
            <ProcurementRequestModal offices={offices} units={["AMT", "SSMT"]} label="New procurement" />
          </div>
        </div>
        <div className="relative min-h-[260px]">
          {heroIsData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.heroImageUrl}
              alt="Hero"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Image
              src={settings.heroImageUrl}
              alt="Hero"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${settings.primaryDeep}, ${settings.primaryDeep}33, transparent)`,
            }}
          />
          {logoIsData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt=""
              className="absolute bottom-6 right-6 h-[92px] w-[92px] rounded-full object-cover ring-2"
              style={{ outlineColor: settings.accentColor }}
            />
          ) : (
            <Image
              src={settings.logoUrl}
              alt=""
              width={92}
              height={92}
              className="absolute bottom-6 right-6 h-[92px] w-[92px] rounded-full object-cover ring-2"
              style={{ boxShadow: `0 0 0 2px ${settings.accentColor}` }}
              unoptimized
            />
          )}
        </div>
      </div>
    </section>
  );
}

export function BrandModuleCards() {
  const { settings } = useBranding();
  const cards = [
    {
      href: "/inventory",
      image: settings.inventoryImageUrl,
      kicker: "01 · Inventory for Stock",
      title: "Record item or equipment",
      body: "Tagging No., brand, model, S/N, parts no., date of purchase, location and status from all offices and laboratories.",
    },
    {
      href: "/disposal",
      image: settings.disposalImageUrl,
      kicker: "02 · For Disposal",
      title: "Request, endorse, verify",
      body: "Offices and labs file the request. PSMO endorses through Excel & IOM, then verifies warranty or beyond-repair.",
    },
    {
      href: "/procurement",
      image: settings.procurementImageUrl,
      kicker: "03 · For Procurement",
      title: "Canvass to MRR",
      body: "AMT and SSMT requests move through comparative report, approval, P.O. with control no., payment, and MRR.",
    },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {cards.map((card) => (
        <a
          key={card.href}
          href={card.href}
          className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
        >
          <div className="relative h-40 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-5">
            <p
              className="text-[11px] uppercase tracking-[0.18em]"
              style={{ color: "var(--primary)" }}
            >
              {card.kicker}
            </p>
            <h2 className="font-display mt-1 text-2xl text-[var(--ink)]">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{card.body}</p>
          </div>
        </a>
      ))}
    </section>
  );
}

function mix(a: string, b: string, t: number) {
  return a; // border already handled via style
}
