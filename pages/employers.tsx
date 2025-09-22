/* eslint-disable @next/next/no-img-element */
import React, { useMemo, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

const SALES_EMAIL = "ypropel@ypropel.com";

function useMailtoForTwoFreeJobs() {
  return useMemo(() => {
    const subject = "Y-Propel: Add 2 More Free Jobs (Month 1)";
    const body = [
      "Hi Y-Propel team,",
      "",
      "Please add these 2 roles to our account as part of the month-1 offer:",
      "",
      "Company name:",
      "Contact name:",
      "Contact email:",
      "ATS / careers page (optional):",
      "",
      "Role 1",
      "• Title:",
      "• Location (Remote/City):",
      "• Employment type (Intern/FT/PT):",
      "• Description (3–6 bullets):",
      "",
      "Role 2",
      "• Title:",
      "• Location (Remote/City):",
      "• Employment type (Intern/FT/PT):",
      "• Description (3–6 bullets):",
      "",
      "Notes (timelines, must-haves, keywords):",
      "",
      "Thanks!",
    ].join("\n");

    const href =
      `mailto:${SALES_EMAIL}?` +
      `subject=${encodeURIComponent(subject)}&` +
      `body=${encodeURIComponent(body)}`;

    return href;
  }, []);
}

function EmailChip({ withLink = false }: { withLink?: boolean }) {
  const mailto = useMailtoForTwoFreeJobs();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SALES_EMAIL);
      alert("Email copied: " + SALES_EMAIL);
    } catch {
      // ignore
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <a href={mailto} className="underline text-emerald-700">
        Email {SALES_EMAIL}
      </a>
      <button
        onClick={copy}
        className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
      >
        Copy
      </button>
      {withLink && (
        <span className="text-gray-600">
          •{" "}
          <a href={mailto} className="underline hover:text-blue-900">
            Add 2 more free jobs →
          </a>
        </span>
      )}
    </div>
  );
}

export default function EmployersLandingPage() {
  const router = useRouter();
  const pricingRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);
  const mailto = useMailtoForTwoFreeJobs();

  const scrollTo = (el: HTMLElement | null) =>
    el?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <Head>
        <title>Hire Early-Career Talent | Y-Propel for Employers</title>
        <meta
          name="description"
          content="Create your company profile and post your first job for free. Limited-time: email us and we’ll add 2 more jobs free in your first month. Pay only for qualified applicants."
        />
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/ypropel-logo.png" alt="YPropel" className="h-9 w-9" />
            <span className="font-semibold text-blue-900">YPropel</span>
            <span className="ml-3 text-xs rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
              Employers
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
            <a
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hover:text-blue-900"
            >
              How it works
            </a>
            <button
              onClick={() => scrollTo(pricingRef.current)}
              className="hover:text-blue-900"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo(faqRef.current)}
              className="hover:text-blue-900"
            >
              FAQ
            </button>
            <a href={mailto} className="hover:text-blue-900">
              Contact Sales
            </a>
          </nav>
          <a
            href="/employers/create-company"
            className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 transition"
          >
            Create Company Profile
          </a>
        </div>
      </header>

      {/* Promo ribbon */}
      <div className="bg-emerald-600/10 border-y border-emerald-600/20">
        <div className="mx-auto max-w-6xl px-4 py-2 text-center text-sm text-emerald-800">
          Limited-time offer: Post your first job free — then{" "}
          <a className="underline font-semibold" href={mailto}>
            email us and we’ll add 2 more jobs free
          </a>{" "}
          within your first month.
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-900">
              Hire early-career talent.{" "}
              <span className="text-emerald-600">Pay only for applicants.</span>
            </h1>
            <p className="mt-4 text-gray-700 text-lg leading-relaxed">
              Create your company profile and post your first job for free. As a
              special limited-time offer, email us and we’ll add 2 more jobs
              for you at no cost during your first month. After that, pay only
              for qualified applicants. No monthly fees. No wasted spend.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/employers/create-company")}
                className="w-full sm:w-auto rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3"
              >
                Create Company Profile
              </button>
              <button
                onClick={() => scrollTo(pricingRef.current)}
                className="w-full sm:w-auto rounded-lg border border-gray-300 hover:border-blue-900 text-blue-900 font-semibold px-6 py-3 bg-white"
              >
                See Pricing
              </button>
            </div>

            {/* Inline email + copy with subtle link */}
            <div className="mt-3">
              <EmailChip withLink />
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Already set up?{" "}
              <a href="/employers/post" className="text-blue-900 underline">
                Post your first job free →
              </a>
            </p>
          </div>
          <div className="aspect-video bg-white border rounded-xl grid place-items-center text-gray-400">
            <span className="text-sm">Employer dashboard preview</span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-3xl font-bold text-blue-900 text-center">
            How it works
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { icon: "🏢", title: "Create your company profile" },
              { icon: "🆓", title: "Post your first job for free" },
              { icon: "🎁", title: "We deliver your first applicants on us" },
              {
                icon: "📧",
                title: `Email ${SALES_EMAIL} and we’ll add 2 more jobs free (month 1)`,
              },
              { icon: "✅", title: "Only pay when qualified candidates apply" },
            ].map((s) => (
              <div
                key={s.title}
                className="p-5 border rounded-xl bg-gray-50 text-center"
              >
                <div className="text-3xl">{s.icon}</div>
                <p className="mt-3 text-sm text-gray-800">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Y-Propel */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-3xl font-bold text-blue-900 text-center">
            Why Y-Propel
          </h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: "Pay-per-applicant, not per month.", d: "Cost maps directly to real pipeline." },
              { t: "Curated, early-career audience.", d: "Students and new grads only." },
              { t: "Fewer unqualified resumes.", d: "Filtering and keyword matching reduce noise." },
              { t: "Faster time-to-interview.", d: "Guaranteed minimum applicant delivery in month 1." },
              { t: "Flexible scale.", d: "Turn volume up or down by applicant count, not seat licenses." },
            ].map((f) => (
              <div key={f.t} className="p-6 bg-white border rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900">{f.t}</h3>
                <p className="mt-2 text-gray-700">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" ref={pricingRef} className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-3xl font-bold text-blue-900 text-center">
            Pricing (simple & transparent)
          </h2>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Free to start */}
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="text-xl font-semibold text-blue-900">Free to start</h3>
              <ul className="mt-3 space-y-2 text-gray-700 list-disc list-inside">
                <li>Create your company profile</li>
                <li>Post your first job free (month 1)</li>
                <li>
                  Limited-time:{" "}
                  <a className="underline" href={mailto}>
                    email us to add 2 more jobs free
                  </a>
                </li>
                <li>Basic company profile & job board placement</li>
              </ul>
              <div className="mt-2">
                <EmailChip />
              </div>
            </div>

            {/* Pay per applicant */}
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="text-xl font-semibold text-blue-900">
                Then, pay per qualified applicant
              </h3>
              <ul className="mt-3 space-y-2 text-gray-700 list-disc list-inside">
                <li>$20/applicant list price</li>
                <li>Volume discounts: $16 (50+/mo), $12 (200+/mo)</li>
                <li>Billed weekly based on delivered applicants</li>
              </ul>
            </div>

            {/* Add-ons */}
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="text-xl font-semibold text-blue-900">Optional add-ons</h3>
              <ul className="mt-3 space-y-2 text-gray-700 list-disc list-inside">
                <li>Resume Access + Search: $99/month</li>
                <li>Boosted Distribution (newsletter + featured): from $149/role</li>
                <li>Priority Screening (human review): $6/applicant</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            <strong>Note:</strong> “qualified applicant” = meets your must-have criteria set in the posting (location,
            availability, skills/keywords).
          </p>
        </div>
      </section>

      {/* Launch Offer */}
      <section className="bg-emerald-600">
        <div className="mx-auto max-w-6xl px-4 py-10 text-white">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold">Launch Offer (low risk)</h3>
              <ul className="mt-3 space-y-1 list-disc list-inside text-emerald-50">
                <li>Create your company profile + post 1 job free</li>
                <li>Email us and we’ll add 2 more jobs free in month 1</li>
                <li>Guaranteed 30 qualified applicants in month 1</li>
                <li>Continue only if quality meets your bar. After the free pool, pay per applicant.</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end md:justify-start">
              <a
                href="/employers/create-company"
                className="inline-flex items-center justify-center rounded-lg bg-white text-emerald-700 font-semibold px-6 py-3 hover:bg-emerald-50"
              >
                Create Company Profile
              </a>
              {/* removed the separate button; keep subtle inline link under */}
            </div>
            <div className="md:col-span-2 mt-2">
              <EmailChip withLink />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" ref={faqRef} className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-3xl font-bold text-blue-900 text-center">FAQ</h2>
          <div className="mt-6 divide-y divide-gray-200 border rounded-xl bg-white">
            {[
              {
                q: "How do you verify ‘qualified’?",
                a: "Keyword and rules-based screening against your must-haves. Optional human review.",
              },
              {
                q: "What if quality isn’t there in month 1?",
                a: "You can stop after your free applicants. No monthly fee, no lock-in.",
              },
              {
                q: "Can we scale up quickly?",
                a: "Yes. Choose your target applicant count per role. Volume tiers lower the per-applicant price.",
              },
              {
                q: "What about unlimited postings?",
                a: "You can post as many roles as you like. Billing is based on delivered qualified applicants, not number of postings.",
              },
              {
                q: "Do you integrate with our ATS?",
                a: "CSV export and webhook options at launch; ATS integrations prioritized by demand.",
              },
            ].map((item) => (
              <details key={item.q} className="p-5 group">
                <summary className="cursor-pointer font-semibold text-blue-900 flex justify-between items-center">
                  {item.q}{" "}
                  <span className="text-gray-400 group-open:rotate-180 transition">⌄</span>
                </summary>
                <p className="mt-2 text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-900">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center text-white">
          <h2 className="text-3xl font-extrabold">
            Hire early-career talent without subscriptions.
          </h2>
          <p className="mt-2 text-blue-100">
            Start with a free company profile and your first job on us. Limited-time: email us and we’ll add 2 more free
            postings in your first month. After that, pay only for qualified applicants.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href="/employers/create-company"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-3 font-semibold"
            >
              Create Company Profile
            </a>
          </div>
          <div className="mt-3">
            <EmailChip withLink />
          </div>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-500 flex flex-col sm:flex-row gap-2 sm:gap-6 justify-between">
          <p>© {new Date().getFullYear()} YPropel. All rights reserved.</p>
          <div className="flex gap-4">
            <a className="hover:text-blue-900" href="/terms">
              Terms
            </a>
            <a className="hover:text-blue-900" href="/privacy">
              Privacy
            </a>
            <a className="hover:text-blue-900" href={mailto}>
              Contact
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
