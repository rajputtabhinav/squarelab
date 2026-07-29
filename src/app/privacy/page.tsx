import type { Metadata } from "next";
import Link from "next/link";
import GradientBg from "@/components/GradientBg";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How pensil.io handles your data.",
};

const LAST_UPDATED = "March 15, 2025";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen">
      <GradientBg />

      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28">
        <div className="mb-10">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">
            Back to pensil.io
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 mt-6">Privacy Policy</h1>
          <p className="text-sm text-zinc-500 mt-2">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose-zinc space-y-8 text-zinc-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Overview</h2>
            <p>
              pensil.io (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a product of Raptorvoid Private Limited. We take
              your privacy seriously. This policy explains what information we collect, how we use it,
              and your rights over it. If you have any questions, contact us at{" "}
              <a href="mailto:abhinav@pensil.io" className="underline underline-offset-4 hover:text-zinc-900">
                abhinav@pensil.io
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">What we collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Account information</strong> - a sign-in is required to use pensil.io. Your name and email address are managed by Clerk (our authentication provider). We do not store your password.
              </li>
              <li>
                <strong>Generation history</strong> - your past prompts and a small image preview
                are stored in your browser&apos;s local storage. This data never leaves your device
                and is not sent to our servers.
              </li>
              <li>
                <strong>Usage and billing data</strong> - we store subscription state, credit
                balances, usage events, burst-rate protection signals, and related billing metadata
                so we can enforce paid plan limits, prevent abuse, and reconcile model costs.
              </li>
              <li>
                <strong>Reference images</strong> - images you upload as references are sent directly
                to the AI model for that generation only. We do not store or retain uploaded images.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">What we do NOT collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>We do not use cookies for tracking.</li>
              <li>We do not sell your data to third parties.</li>
              <li>We do not store your generated images on our servers.</li>
              <li>We do not use analytics tools that track your browsing behavior.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Third-party services</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Clerk</strong> - handles authentication. Your email is stored by Clerk
                under their{" "}
                <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-zinc-900">
                  privacy policy
                </a>.
              </li>
              <li>
                <strong>AI inference</strong> - your prompts and any reference images you upload
                are processed by our AI infrastructure solely to generate your requested images.
                This data is not retained after generation is complete.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Data retention</h2>
            <p>
              Generation history for quick reuse is stored in your browser&apos;s local storage. We
              also maintain a server-side usage ledger for billing, abuse prevention, and plan
              enforcement. Uploaded reference images are not retained after generation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Your rights</h2>
            <p>
              You have the right to access, correct, or delete your account information at any
              time. To delete your pensil.io account, email us at{" "}
              <a href="mailto:abhinav@pensil.io" className="underline underline-offset-4 hover:text-zinc-900">
                abhinav@pensil.io
              </a>{" "}
              and we will process your request within 7 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Children</h2>
            <p>
              pensil.io is not directed at children under 13. We do not knowingly collect information
              from children.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Changes</h2>
            <p>
              We may update this policy as the product evolves. Material changes will be noted by
              updating the date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Contact</h2>
            <p>
              Questions or concerns? Reach us at{" "}
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
