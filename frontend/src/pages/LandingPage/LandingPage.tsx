import { Helmet } from "react-helmet";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Check,
  CreditCard,
  Gauge,
  KeyRound,
  Lock,
  PlugZap,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star
} from "lucide-react";

import { BrandLogo } from "@app/components/branding/BrandLogo";

import {
  BentoCard,
  BentoGrid,
  BorderBeam,
  cn,
  LampHeader,
  LandingKeyframes,
  MagicBadge,
  MagicCard,
  MaxWidth,
  Reveal,
  TextHoverEffect
} from "./components/primitives";

/* Companies / "trusted by" strip — APIHarbor validates keys for these providers */
const TRUSTED = ["OpenAI", "Anthropic", "Stripe", "GitHub", "Any HTTP API"];

/* Features — asymmetric bento grid (linkify layout: 1 · 2 / 2 · 1) */
const BENTO_CARDS = [
  {
    Icon: KeyRound,
    name: "Encrypted Key Vault",
    description: "Every provider key sealed with AES-256-GCM under a per-project data key.",
    className: "lg:col-span-1",
    background: (
      <div className="absolute inset-x-0 top-0 space-y-2 p-5 opacity-80 [mask-image:linear-gradient(to_top,transparent_15%,#000_90%)]">
        {["sk-live-••••••7f3a", "sk-ant-••••••b21c", "whsec_••••••9e0d"].map((k) => (
          <div
            key={k}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <Lock className="h-3.5 w-3.5 shrink-0 text-violet-300/70" />
            <span className="truncate font-mono text-xs text-zinc-400">{k}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    Icon: Activity,
    name: "Real-time Health Monitoring",
    description:
      "Scheduled re-validation flags dead, revoked, or rotated keys before they break your app.",
    className: "lg:col-span-2",
    background: (
      <div className="absolute inset-x-0 top-0 grid grid-cols-1 gap-2 p-5 opacity-80 [mask-image:linear-gradient(to_top,transparent_15%,#000_90%)] sm:grid-cols-2">
        {[
          ["Production OpenAI", "Healthy", true],
          ["Old GitHub PAT", "Invalid", false],
          ["Claude Prod", "Healthy", true],
          ["Billing Stripe", "Healthy", true]
        ].map(([n, s, ok]) => (
          <div
            key={n as string}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <span className="truncate text-xs text-zinc-300">{n}</span>
            <span
              className={cn(
                "ml-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                ok
                  ? "border-green-400/20 bg-green-400/10 text-green-300"
                  : "border-red-400/20 bg-red-400/10 text-red-300"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-green-400" : "bg-red-400")} />
              {s}
            </span>
          </div>
        ))}
      </div>
    )
  },
  {
    Icon: ShieldCheck,
    name: "Provider Validation Adapters",
    description:
      "Native checks for OpenAI, Anthropic, Stripe, GitHub — and any custom HTTP API you point us at.",
    className: "lg:col-span-2",
    background: (
      <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-5 opacity-80 [mask-image:linear-gradient(to_top,transparent_15%,#000_90%)]">
        {["OpenAI", "Anthropic", "Stripe", "GitHub", "Cohere", "Any HTTP API"].map((p) => (
          <span
            key={p}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300"
          >
            {p}
          </span>
        ))}
      </div>
    )
  },
  {
    Icon: Gauge,
    name: "Quota & Usage Tracking",
    description: "See remaining rate-limit quota, latency, and last-checked times at a glance.",
    className: "lg:col-span-1",
    background: (
      <div className="absolute inset-x-0 top-0 space-y-3 p-5 opacity-80 [mask-image:linear-gradient(to_top,transparent_15%,#000_90%)]">
        {[
          ["OpenAI", 82],
          ["Stripe", 41],
          ["Anthropic", 63]
        ].map(([label, pct]) => (
          <div key={label as string}>
            <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
              <span>{label}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }
];

const PROCESS = [
  {
    icon: PlugZap,
    title: "Add a key",
    body: "Drop in an API key and pick its provider adapter. It's encrypted the moment it lands."
  },
  {
    icon: ScanLine,
    title: "We validate & encrypt",
    body: "APIHarbor calls the provider to confirm the key is live, then seals it with AES-256-GCM."
  },
  {
    icon: Activity,
    title: "Monitor health",
    body: "Every key is re-checked on a schedule. Quota, latency, and status stay one dashboard away."
  }
];

const FREE_FEATURES = [
  "Up to 30 API Keys",
  "Real-time Health Monitoring",
  "Quota & Usage Tracking",
  "Provider Validation Adapters",
  "AES-256-GCM Encryption",
  "Organization Workspaces",
  "MFA & Google Sign-In",
  "Private Server Hosting",
  "Custom Security Review"
];

const ENTERPRISE_FEATURES = [
  "More than 30 API Keys",
  "Private Server Hosted for Your Team",
  "Dedicated Tenant & Data Isolation",
  "Custom VPN / Network Configuration",
  "Security Hardening & Access Review",
  "Priority Support with the Founding Team"
];

const REVIEWS = [
  {
    name: "Priya Nair",
    handle: "@priya_builds",
    body: "A dead OpenAI key used to take down our nightly jobs. APIHarbor flags it hours before anyone notices now.",
    rating: 5
  },
  {
    name: "Marcus Lee",
    handle: "@marcusships",
    body: "Every provider key in one encrypted vault with live health checks. This is the tool I kept meaning to build.",
    rating: 5
  },
  {
    name: "Sofia Alvarez",
    handle: "@sofia_dev",
    body: "The quota tracking alone paid for itself — we caught a Stripe key burning through its rate limit early.",
    rating: 5
  },
  {
    name: "Devon Carter",
    handle: "@devncarter",
    body: "Set it up in five minutes, added our keys, and the invalid GitHub PAT lit up red instantly. Chef's kiss.",
    rating: 5
  },
  {
    name: "Aisha Khan",
    handle: "@aisha.k",
    body: "AES-256-GCM at rest, MFA, org workspaces — security review passed without a single follow-up.",
    rating: 5
  },
  {
    name: "Tom Becker",
    handle: "@tbecker",
    body: "We self-host the private deployment. Keys never leave our network and the team still gets health alerts.",
    rating: 5
  }
];

const Logo = ({ className }: { className?: string }) => (
  <BrandLogo className={className} iconClassName="h-7 w-7" />
);

const GradientText = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
    {children}
  </span>
);

export const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>APIHarbor — Store, validate & monitor your API keys</title>
        <meta
          name="description"
          content="APIHarbor keeps every provider API key encrypted, continuously validated, and monitored for health — so a dead or leaked key never breaks your app."
        />
      </Helmet>
      <LandingKeyframes />
      <div className="ah-landing h-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-[#0a0a0f] font-sans text-zinc-300 antialiased [color-scheme:dark]">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/70 backdrop-blur-xl">
          <MaxWidth className="flex items-center justify-between py-4">
            <Logo />
            <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#process" className="transition hover:text-white">
                How it works
              </a>
              <a href="#pricing" className="transition hover:text-white">
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </MaxWidth>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(139,92,246,0.18),transparent_70%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(60% 50% at 50% 0%,#000,transparent)"
            }}
          />
          <MaxWidth className="relative py-24 text-center lg:py-32">
            <Reveal className="flex flex-col items-center">
              <MagicBadge>
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-fuchsia-300" /> API key health, on autopilot
              </MagicBadge>
              <h1 className="mx-auto mt-7 max-w-4xl text-balance text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Store, validate & monitor <GradientText>your API keys</GradientText>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-400">
                APIHarbor keeps every provider key encrypted, continuously validated against its
                provider, and monitored for health — so a dead or leaked key never breaks your app.
              </p>
              <div className="mt-9">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
                >
                  Get started for free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <p className="mt-4 text-xs text-zinc-500">
                No credit card required · Free forever for up to 30 keys
              </p>
            </Reveal>

            {/* Product preview (dashboard image, like linkify) */}
            <Reveal delay={0.15} className="relative mx-auto mt-16 max-w-5xl px-2">
              <div className="pointer-events-none absolute left-1/2 top-[10%] h-1/3 w-3/4 -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(139,92,246,0.25),transparent_70%)] blur-[5rem]" />
              <div className="relative -m-2 rounded-xl p-2 ring-1 ring-inset ring-white/10 backdrop-blur-3xl lg:-m-4 lg:rounded-2xl">
                <BorderBeam size={250} duration={12} delay={9} />
                <img
                  src="/assets/dashboard-dark.svg"
                  alt="APIHarbor dashboard"
                  className="w-full rounded-md bg-white/5 ring-1 ring-white/10 lg:rounded-xl"
                />
                <div className="pointer-events-none absolute inset-x-0 -bottom-4 z-40 h-1/2 w-full bg-gradient-to-t from-[#0a0a0f]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-1/4 w-full bg-gradient-to-t from-[#0a0a0f] md:-bottom-8" />
              </div>
            </Reveal>
          </MaxWidth>
        </section>

        {/* Companies / trusted-by strip */}
        <section className="border-y border-white/5 bg-[#0c0c13]">
          <MaxWidth className="py-14">
            <Reveal>
              <h2 className="text-center text-sm font-medium uppercase tracking-wide text-zinc-500">
                Validates keys for the providers you already ship with
              </h2>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                {TRUSTED.map((name) => (
                  <span key={name} className="text-lg font-semibold text-zinc-400/80">
                    {name}
                  </span>
                ))}
              </div>
            </Reveal>
          </MaxWidth>
        </section>

        {/* Features — bento grid */}
        <section id="features" className="py-24">
          <MaxWidth>
            <Reveal className="mb-14 flex flex-col items-center text-center">
              <MagicBadge>Features</MagicBadge>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                The all-in-one vault for API keys
              </h2>
              <p className="mt-4 max-w-lg text-zinc-400">
                Everything you need to store, validate, and continuously monitor the keys your product
                depends on.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <BentoGrid>
                {BENTO_CARDS.map((card) => (
                  <BentoCard key={card.name} {...card} />
                ))}
              </BentoGrid>
            </Reveal>
          </MaxWidth>
        </section>

        {/* Process */}
        <section id="process" className="py-24">
          <MaxWidth>
            <Reveal className="mb-14 flex flex-col items-center text-center">
              <MagicBadge>How it works</MagicBadge>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Key health in three steps
              </h2>
              <p className="mt-4 max-w-lg text-zinc-400">
                From paste to peace of mind — APIHarbor takes it from here.
              </p>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {PROCESS.map(({ icon: Icon, title, body }, i) => (
                <Reveal key={title} delay={i * 0.1}>
                  <MagicCard className="h-full p-8">
                    <span className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-lg font-semibold text-zinc-300">
                      {i + 1}
                    </span>
                    <Icon className="h-9 w-9 text-violet-300" strokeWidth={1.5} />
                    <h3 className="mt-6 font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
                  </MagicCard>
                </Reveal>
              ))}
            </div>
          </MaxWidth>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-white/5 py-24">
          <MaxWidth className="max-w-5xl">
            <Reveal className="mb-14 flex flex-col items-center text-center">
              <MagicBadge>Simple Pricing</MagicBadge>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Free to start. Private when you need it.
              </h2>
              <p className="mt-4 max-w-lg text-zinc-400">
                Track the health of up to 30 keys for free — upgrade to a private, isolated deployment
                when your team grows.
              </p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Free */}
              <Reveal>
                <div className="relative flex h-full flex-col rounded-3xl border border-violet-400/30 bg-gradient-to-b from-violet-500/[0.07] to-transparent p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Free</h3>
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
                      Most popular
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Open access for developers, makers, and small teams trying API key health tracking.
                  </p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-5xl font-bold text-white">$0</span>
                    <span className="mb-1.5 text-sm text-zinc-400">/ forever</span>
                  </div>
                  <Link
                    to="/signup"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
                  >
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    What&apos;s included
                  </p>
                  <ul className="mt-4 space-y-3">
                    {FREE_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" /> {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs italic text-zinc-500">Private deployment available</p>
                </div>
              </Reveal>

              {/* Enterprise */}
              <Reveal delay={0.1}>
                <div className="relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-8">
                  <h3 className="text-xl font-semibold text-white">Enterprise</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    For organizations that need private hosting, stronger isolation, and hands-on
                    security support.
                  </p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-5xl font-bold text-white">Custom</span>
                  </div>
                  <a
                    href="mailto:support@apiharbor.com?subject=APIHarbor%20Enterprise"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                  >
                    Contact the Team
                  </a>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Everything in Free, plus:
                  </p>
                  <ul className="mt-4 space-y-3">
                    {ENTERPRISE_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-400" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.15} className="mt-10 flex items-center justify-center gap-2 text-sm text-zinc-500">
              <CreditCard className="h-4 w-4" /> No credit card required
            </Reveal>
          </MaxWidth>
        </section>

        {/* Reviews */}
        <section className="border-t border-white/5 py-24">
          <MaxWidth>
            <Reveal className="mb-14 flex flex-col items-center text-center">
              <MagicBadge>Loved by builders</MagicBadge>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                What teams say about APIHarbor
              </h2>
              <p className="mt-4 max-w-lg text-zinc-400">
                From solo makers to security teams — here&apos;s what keeps their keys healthy.
              </p>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {REVIEWS.map((r, i) => (
                <Reveal key={r.handle} delay={(i % 3) * 0.08}>
                  <MagicCard className="h-full p-6">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, s) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Star key={s} className="h-4 w-4 fill-fuchsia-400 text-fuchsia-400" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-300">{r.body}</p>
                    <div className="mt-5">
                      <div className="text-sm font-semibold text-white">{r.name}</div>
                      <div className="text-xs text-zinc-500">{r.handle}</div>
                    </div>
                  </MagicCard>
                </Reveal>
              ))}
            </div>
          </MaxWidth>
        </section>

        {/* CTA with lamp */}
        <section className="relative overflow-hidden">
          <LampHeader>
            <Reveal className="flex flex-col items-center">
              <h2 className="max-w-2xl bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                Step into effortless API key management
              </h2>
              <p className="mx-auto mt-6 max-w-md text-zinc-400">
                Getting started with APIHarbor is simple, fast, and free. Your keys stay encrypted,
                validated, and healthy.
              </p>
              <div className="mt-8">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40"
                >
                  Get started for free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </Reveal>
          </LampHeader>
        </section>

        {/* Footer (linkify structure) */}
        <footer className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center border-t border-white/10 bg-[radial-gradient(35%_128px_at_50%_0%,rgba(255,255,255,0.06),transparent)] px-6 pt-16 pb-8 md:pb-0 lg:px-8 lg:pt-32">
          <div className="absolute left-1/2 right-1/2 top-0 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />

          <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
            <Reveal delay={0.1}>
              <div className="flex flex-col items-start justify-start md:max-w-[200px]">
                <Logo />
                <p className="mt-4 text-start text-sm text-zinc-400">
                  Encrypted, validated, monitored API keys.
                </p>
                <span className="mt-4 flex items-center text-sm text-zinc-200">
                  Self-hosted &amp; secure by design.
                </span>
              </div>
            </Reveal>

            <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <Reveal delay={0.2}>
                  <div>
                    <h3 className="text-base font-medium text-white">Product</h3>
                    <ul className="mt-4 text-sm text-zinc-400">
                      <li className="mt-2">
                        <a href="#features" className="transition-all duration-300 hover:text-white">
                          Features
                        </a>
                      </li>
                      <li className="mt-2">
                        <a href="#process" className="transition-all duration-300 hover:text-white">
                          How it works
                        </a>
                      </li>
                      <li className="mt-2">
                        <a href="#pricing" className="transition-all duration-300 hover:text-white">
                          Pricing
                        </a>
                      </li>
                      <li className="mt-2">
                        <Link to="/signup" className="transition-all duration-300 hover:text-white">
                          Get started
                        </Link>
                      </li>
                    </ul>
                  </div>
                </Reveal>
                <Reveal delay={0.3}>
                  <div className="mt-10 flex flex-col md:mt-0">
                    <h3 className="text-base font-medium text-white">Providers</h3>
                    <ul className="mt-4 text-sm text-zinc-400">
                      <li>
                        <a href="#features" className="transition-all duration-300 hover:text-white">
                          OpenAI
                        </a>
                      </li>
                      <li className="mt-2">
                        <a href="#features" className="transition-all duration-300 hover:text-white">
                          Anthropic
                        </a>
                      </li>
                      <li className="mt-2">
                        <a href="#features" className="transition-all duration-300 hover:text-white">
                          Stripe
                        </a>
                      </li>
                      <li className="mt-2">
                        <a href="#features" className="transition-all duration-300 hover:text-white">
                          GitHub
                        </a>
                      </li>
                    </ul>
                  </div>
                </Reveal>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <Reveal delay={0.4}>
                  <div>
                    <h3 className="text-base font-medium text-white">Resources</h3>
                    <ul className="mt-4 text-sm text-zinc-400">
                      <li className="mt-2">
                        <a
                          href="https://apiharbor.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-all duration-300 hover:text-white"
                        >
                          Docs
                        </a>
                      </li>
                      <li className="mt-2">
                        <a
                          href="mailto:support@apiharbor.com"
                          className="transition-all duration-300 hover:text-white"
                        >
                          Support
                        </a>
                      </li>
                    </ul>
                  </div>
                </Reveal>
                <Reveal delay={0.5}>
                  <div className="mt-10 flex flex-col md:mt-0">
                    <h3 className="text-base font-medium text-white">Company</h3>
                    <ul className="mt-4 text-sm text-zinc-400">
                      <li>
                        <a
                          href="https://apiharbor.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-all duration-300 hover:text-white"
                        >
                          About Us
                        </a>
                      </li>
                      <li className="mt-2">
                        <a
                          href="https://apiharbor.com/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-all duration-300 hover:text-white"
                        >
                          Privacy Policy
                        </a>
                      </li>
                      <li className="mt-2">
                        <a
                          href="https://apiharbor.com/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-all duration-300 hover:text-white"
                        >
                          Terms &amp; Conditions
                        </a>
                      </li>
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>

          <div className="mt-8 w-full border-t border-white/10 pt-4 md:flex md:items-center md:justify-between md:pt-8">
            <Reveal delay={0.6}>
              <p className="mt-8 text-sm text-zinc-400 md:mt-0">
                &copy; {new Date().getFullYear()} APIHarbor. All rights reserved.
              </p>
            </Reveal>
          </div>

          <div className="hidden h-[20rem] items-center justify-center md:flex lg:h-[20rem]">
            <TextHoverEffect text="APIHARBOR" />
          </div>
        </footer>
      </div>
    </>
  );
};
