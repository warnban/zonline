import type { LandingPage } from "@/lib/seo/landings";

export function SeoLandingProse({ landing }: { landing: LandingPage }) {
  if (!landing.seoBody?.length) return null;

  return (
    <section className="prose-legal card mt-8 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">Как это работает</h2>
      {landing.seoBody.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}
    </section>
  );
}
