import React from 'react';
import Link from 'next/link';
import { MARKETS_LOGIN } from '@src/lib/markets/entry';

export default function MarketsWelcome() {
  return (
    <main className="min-h-screen bg-canvas text-ink font-display">
      <header className="max-w-[1120px] mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 border-b border-line">
        <Link href="/markets"><a className="text-lg font-bold text-ink">backspace <span className="text-brand-2">markets</span></a></Link>
        <nav aria-label="Backspace" className="flex items-center gap-5 text-sm">
          <Link href="/"><a className="text-ink-2 hover:text-ink">Social</a></Link>
          <Link href={MARKETS_LOGIN}><a className="text-ink hover:text-brand-2">Sign in</a></Link>
        </nav>
      </header>
      <section className="max-w-[1120px] mx-auto px-6 py-16 sm:py-24" aria-labelledby="markets-heading">
        <p className="text-brand-2 text-xs font-mono uppercase tracking-widest">Part of Backspace</p>
        <h1 id="markets-heading" className="max-w-3xl mt-5 text-4xl sm:text-6xl font-bold tracking-tight leading-tight">A place for your take.<br />And what comes next.</h1>
        <p className="max-w-xl mt-6 text-lg text-ink-2 leading-relaxed">Explore prediction markets, follow the conversation, and keep your community close. Markets and social, with one Backspace account.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={MARKETS_LOGIN}><a className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Continue to Markets</a></Link>
          <a href="#inside-markets" className="inline-flex items-center justify-center rounded-xl border border-line px-6 py-3 text-ink hover:bg-hover">Explore the experience</a>
        </div>
        <p className="mt-4 text-sm text-ink-3">Sign in to access the current catalog. New accounts follow Backspace’s existing access and setup requirements.</p>
      </section>
      <section id="inside-markets" className="max-w-[1120px] mx-auto px-6 pb-16 scroll-mt-6" aria-labelledby="inside-heading">
        <h2 id="inside-heading" className="text-2xl font-bold mb-6">Start with a market. Stay for the conversation.</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['01', 'Discover', 'Find markets by topic, see what’s trending, and explore the questions catching people’s attention.'],
            ['02', 'Discuss', 'Share a market in a post and bring your perspective into the Backspace conversation.'],
            ['03', 'Keep track', 'Return to your portfolio and the people you follow, all within the same platform.'],
          ].map(([number, title, description]) => (
            <article key={title} className="rounded-2xl border border-line bg-surface p-6">
              <span className="text-brand-2 text-xs font-mono">{number}</span>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm text-ink-2 leading-relaxed">{description}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="max-w-[1120px] mx-auto px-6 py-6 border-t border-line text-sm text-ink-3">Backspace Markets · One account. A shared community.</footer>
    </main>
  );
}

