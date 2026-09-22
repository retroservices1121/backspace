import React from 'react';
import Link from 'next/link';

const Portfolio: React.FC = () => (
  <main className="mx-auto w-full max-w-3xl px-4 py-8 text-ink">
    <h1 className="text-3xl font-bold">Portfolio</h1>
    <section className="mt-6 rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-xl font-semibold">Gate trading account</h2>
      <p className="mt-2 text-ink-3">
        Positions, orders, balances, and claims will appear here after Gate enables
        Backspace Builder account provisioning. Market data remains live and is
        never copied into the Backspace database.
      </p>
      <Link href="/markets">
        <a className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 font-semibold text-white">
          Browse live markets
        </a>
      </Link>
    </section>
  </main>
);

export default Portfolio;
