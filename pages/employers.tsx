/* eslint-disable @next/next/no-img-element */
import React, { useRef } from "react";
import Head from "next/head";

export default function EmployersLandingPage() {
  const startRef = useRef<HTMLDivElement | null>(null);
  const pricingRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (el: HTMLElement | null) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Head>
        <title>Hire Early-Career Talent | Y-Propel for Employers</title>
        <meta
          name="description"
          content="Y-Propel is a curated marketplace for students & early-career hires. Post roles free, get your first applicants at no cost, and pay only for qualified applicants."
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
            <button onClick={() => scrollTo(startRef.current)} className="hover:text-blue-900">
              How it works
            </button>
            <button onClick={() => scrollTo(pricingRef.current)} className="hover:text-blue-900">
              Pricing
            </button>
            <button onClick={() => scrollTo(faqRef.current)} className="hover:text-blue-900">
              FAQ
            </button>
            <a href="/contact?type=sales" className="hover:text-blue-900">
              Contact Sales
            </a>
          </nav>
          <a
            href="#start"
            onClick={(e) => {
              e.preventDefault();
              scrollTo(startRef.current);
            }}
            className="hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-white font-semibold bg-emerald-600 hover:bg-emerald-700 transition"
          >
            Post Up To 3 Jobs Free
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-900">
              Hire early-career talent. <span className="text-emerald-600">Pay only for applicants.</span>
            </h1>
            <p className="mt-4 text-gray-700 text-lg leading-relaxed">
              Y-Propel is a curated marketplace for students and early-career hires. Post your roles free, get your
              first applicants at no cost, then pay only for qualified applicants. No monthly fees. No wasted spend.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => scrollTo(startRef.current)}
                className="w-full sm:w-auto rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3"
              >
                Post Up To 3 Jobs Free
              </button>
              <button
                onClick={() => scrollTo(pricingRef.current)}
                className="w-full sm:w-auto rounded-lg border border-gray-300 hover:border-blue-900 text-blue-900 font-semibold px-6 py-3 bg-white"
              >
                See Pricing
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500">Low risk launch offer included.</p>
          </div>
          <div className="aspect-video bg-white border rounded-xl grid place-items-center text-gray-400">
            <span className="text-sm">Employer dashboard preview</span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="start" ref={startRef} className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-3xl font-bold text-blue-900 text-center">How it works</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { icon: "🏢", title: "Create your company profile" },
              { icon: "📌", title: "Post up to 3 priority roles for free (month 1)" },
              { icon: "🎯", title: "Get your first applicants on us" },
              { icon: "✅", title: "Only pay when qualified candidates apply" },
              { icon: "⚡", title: "Hire faster with less noise via pre-screening" },
            ].map((s) => (
              <div key={s.title} className="p-5 border rounded-xl bg-gray-50 text-center">
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
          <h2 className="text-3xl font-bold text-blue-900 text-center">Why Y-Propel</h2>
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
          <h2 className="text-3xl font-bold text-blue-900 text-center">Pricing (simple & transparent)</h2>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Free to start */}
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="text-xl font-semibold text-blue-900">Free to start</h3>
              <ul className="mt-3 space-y-2 text-gray-700 list-disc list-inside">
                <li>Post up to 3 roles in month 1</li>
                <li>First 30 applicants free (10 per role)</li>
                <li>Basic company profile & job board placement</li>
              </ul>
            </div>

            {/* Pay per applicant */}
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="text-xl font-semibold text-blue-900">Then, pay per qualified applicant</h3>
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
                <li>Post 3 roles free</li>
                <li>Guaranteed 30 qualified applicants in month 1</li>
                <li>
                  Continue only if quality meets your bar. After the free pool, pay per applicant.
                </li>
              </ul>
            </div>
            <div className="text-right md:text-left">
              <button
                onClick={() => scrollTo(startRef.current)}
                className="inline-flex items-center justify-center rounded-lg bg-white text-emerald-700 font-semibold px-6 py-3 hover:bg-emerald-50"
              >
                Start Free
              </button>
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
                  {item.q} <span className="text-gray-400 group-open:rotate-180 transition">⌄</span>
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
          <h2 className="text-3xl font-extrabold">Hire early-career talent without subscriptions.</h2>
          <p className="mt-2 text-blue-100">
            Start with 3 free postings and your first 30 applicants on us. After that, pay only for what matters:
            qualified applicants.
          </p>
          <button
            onClick={() => scrollTo(startRef.current)}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 px-6 py-3 font-semibold"
          >
            Start Free
          </button>
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
            <a className="hover:text-blue-900" href="/contact">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
