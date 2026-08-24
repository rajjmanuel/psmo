import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        kicker="System"
        title="Settings & branding"
        description="Edit logos, display images, titles, font size, and color theme. Changes apply across the whole PSMO system after you save."
      />
      <SettingsForm />
    </div>
  );
}
