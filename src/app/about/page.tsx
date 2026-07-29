import type { Metadata } from "next";
import Link from "next/link";
import GradientBg from "@/components/GradientBg";

export const metadata: Metadata = {
  title: "About",
  description:
    "pensil.io is a reasoning model for image generation. It thinks through composition, lighting, and intent before rendering - delivering 4K images that feel designed, not generated.",
};

const WHY_REASONING = [
  {
    title: "Composition first",
    body: "Before a single pixel is rendered, pensil.io decides where the eye should land, how depth layers should be arranged, and what emotional story the frame needs to tell. This is what separates a great image from a lucky one.",
  },
  {
    title: "Cinematic lighting",
    body: "Lighting is the single biggest quality differentiator in professional photography. pensil.io reasons about the exact lighting setup - direction, quality, shadow depth - the way a cinematographer would before picking up a camera.",
  },
  {
    title: "Color that works",
    body: "pensil.io selects a specific cinematic color grade for every image - not a random palette, but a deliberate grade with named film references that creates a consistent emotional temperature throughout the image.",
  },
  {
    title: "Typography that fits",
    body: "When text is part of the image, pensil.io chooses the font, weight, size, and position based on the archetype - not default sans-serif. The text zone is designed into the image, not pasted on top.",
  },
  {
    title: "4K output every time",
    body: "Because the spec is designed before rendering, the model knows exactly what to produce at full resolution. Every image is delivered at 4K - sharp enough to print, clear enough to dominate any screen.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <GradientBg />

      <div className="max-w-2xl mx-auto px-6 py-20 md:py-28">
        <Link href="/pricing" className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors">
          Back
        </Link>

        <div className="mt-8 mb-14">
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-900/8 border border-zinc-300/50 text-[11px] font-medium text-zinc-600 tracking-wide mb-5">
            Reasoning model for images
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 leading-tight mb-5">
            The first image generation tool that thinks before it creates.
          </h1>
          <p className="text-zinc-600 text-base leading-relaxed">
            Every other AI image tool takes your words and immediately renders. pensil.io stops.
            It reasons about what you actually need - the composition, the lighting, the mood,
            the typography - and then generates an image that was designed to work, not just
            to exist.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">The problem with "just generate"</h2>
          <div className="space-y-4 text-zinc-600 leading-relaxed">
            <p>
              Standard AI image generation is a lottery. You describe what you want, it renders
              something, and you hope it&apos;s close. When it isn&apos;t - and it usually isn&apos;t - you tweak
              the prompt and roll again. You&apos;re not creating. You&apos;re gambling.
            </p>
            <p>
              The reason is simple: these tools have no concept of <em>intent</em>. They don&apos;t know
              whether you need a thumbnail that converts at thumbnail scale, a banner that works
              with an avatar overlapping the left side, or a story image that needs clear space
              in the top and bottom 20%. They just render and move on.
            </p>
            <p>
              pensil.io&apos;s reasoning engine bridges that gap. It understands purpose - and designs
              every image around it.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 mb-6">
            Why reasoning produces better images
          </h2>
          <div className="space-y-5">
            {WHY_REASONING.map(({ title, body }) => (
              <div key={title} className="bg-white/50 backdrop-blur-sm border border-zinc-200/50 rounded-xl p-5">
                <p className="text-sm font-semibold text-zinc-900 mb-1.5">{title}</p>
                <p className="text-sm text-zinc-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-zinc-900 mb-4">What you can create</h2>
          <div className="space-y-3 text-zinc-600 leading-relaxed">
            <p>
              pensil.io is a reasoning model for any image you need - not a thumbnail-only tool.
              It adapts its reasoning strategy to the specific format, understanding that a
              YouTube thumbnail needs to work at 160x90px on mobile while a Twitter banner
              needs to account for an avatar covering the lower-left.
            </p>
            <div className="grid grid-cols-2 gap-2 my-4">
              {[
                "YouTube Thumbnails",
                "Instagram Posts",
                "Instagram Stories",
                "Twitter / X Banners",
                "Blog Headers",
                "Custom Formats",
              ].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 bg-white/40 border border-zinc-200/50 rounded-lg px-3 py-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                  <span className="text-sm text-zinc-700">{f}</span>
                </div>
              ))}
            </div>
            <p>
              Upload a reference image and pensil.io studies its composition, color temperature,
              and mood - incorporating those qualities into original output that matches your
              visual direction without copying it.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-zinc-900 rounded-2xl p-7 text-center">
            <p className="text-4xl font-bold text-zinc-100 mb-2">4K</p>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
              Every image is rendered at full 4K resolution. Sharp enough to print.
              Crisp at any screen size. No compression, no quality loss on download.
            </p>
          </div>
        </section>

        <div className="pt-10 border-t border-zinc-200/60">
          <p className="text-sm text-zinc-500 mb-1">Built by</p>
          <p className="text-zinc-900 font-semibold text-lg">Abhinav</p>
          <p className="text-sm text-zinc-500 mt-0.5">Founder & CEO, pensil.io | Raptorvoid Private Limited</p>
          <a
            href="mailto:abhinav@pensil.io"
            className="inline-block mt-3 text-sm text-zinc-600 hover:text-zinc-900 underline underline-offset-4 transition-colors"
          >
            abhinav@pensil.io
          </a>
          <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-lg">
            I built pensil.io because I was tired of spending hours in Canva trying to make
            AI-generated images look like they were designed with purpose. The reasoning
            layer is the product. Everything else is just delivery.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-zinc-50 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            View plans
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 border border-zinc-200/60 text-zinc-700 rounded-xl text-sm font-medium hover:bg-white/80 transition-colors"
          >
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
