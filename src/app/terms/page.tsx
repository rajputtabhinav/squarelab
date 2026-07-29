import type { Metadata } from "next";
import Link from "next/link";
import GradientBg from "@/components/GradientBg";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using pensil.io.",
};

const LAST_UPDATED = "March 15, 2025";

export default function TermsPage() {
  return (
    <div className="relative min-h-screen">
      <GradientBg />

      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28">
        <div className="mb-10">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">
            Back to pensil.io
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 mt-6">Terms of Service</h1>
          <p className="text-sm text-zinc-500 mt-2">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-zinc-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Agreement</h2>
            <p>
              By using pensil.io (&quot;the Service&quot;) you agree to these terms. If you do not agree,
              please stop using the Service. These terms are between you and Raptorvoid Private
              Limited, the company behind pensil.io. Contact:{" "}
              <a href="mailto:abhinav@pensil.io" className="underline underline-offset-4 hover:text-zinc-900">abhinav@pensil.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Acceptable use</h2>
            <p className="mb-3">You agree to use pensil.io only for lawful purposes. You must not:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Generate content that is illegal, hateful, threatening, or harassing.</li>
              <li>Generate sexually explicit or adult-only content.</li>
              <li>Generate content that impersonates real people in a misleading or harmful way.</li>
              <li>Attempt to circumvent the rate limits, authentication, or security measures.</li>
              <li>Resell or sublicense access to the Service without written permission.</li>
              <li>Use automated scripts to abuse or flood the generation endpoint.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Ownership of generated images</h2>
            <p>
              Images generated using pensil.io are yours. You retain full ownership and may use them
              for personal or commercial purposes without attribution. We make no claim to any image
              produced through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Intellectual property</h2>
            <p>
              The pensil.io name, logo, website design, and underlying software are the property of
              pensil.io. You may not copy, reproduce, or redistribute them without permission. Your
              prompts and generated outputs remain yours.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Service availability</h2>
            <p>
              We aim to keep pensil.io running reliably, but we do not guarantee 100% uptime. The
              Service is provided &quot;as is&quot; without warranties of any kind. We may update,
              change, or discontinue features at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Billing and credits</h2>
            <p>
              Paid plans are metered through monthly credits. Credits may be reserved before a
              generation starts and reconciled after it completes. When your available credits are
              exhausted, new generations will be blocked until the next billing cycle or until you
              move to another approved plan.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, pensil.io is not liable for any indirect,
              incidental, or consequential damages arising from your use of the Service. Our total
              liability to you shall not exceed the amount you paid us in the past 12 months
              (or $10 if you have not made any payments).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Account termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms,
              abuse the Service, or engage in fraudulent activity. You may also delete your
              account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Changes to these terms</h2>
            <p>
              We may revise these terms as the Service evolves. Continued use after changes
              constitutes acceptance. Material changes will be reflected in the updated date
              at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Contact</h2>
            <p>
              For any questions about these terms, contact{" "}
              <a href="mailto:abhinav@pensil.io" className="underline underline-offset-4 hover:text-zinc-900">
                abhinav@pensil.io
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
