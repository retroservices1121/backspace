import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/globals.css';

// Canonical site URL for absolute meta-tag values (og:image, etc.).
// Overridable per-environment in case the landing moves; default
// matches the prod subdomain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://waitlist.backspace.to';
const OG_IMAGE = `${SITE_URL}/og.png`;
const DESCRIPTION =
  'The new social layer for markets. Reserve your handle before launch.';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Backspace — Join the Waitlist</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={DESCRIPTION} />
        <meta name="theme-color" content="#08070d" />
        <link rel="icon" href="/assets/backspace-icon.png" />

        {/* Open Graph — used by Facebook, LinkedIn, iMessage, and as
            the fallback Twitter/X reads if twitter:* tags are absent. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Backspace" />
        <meta property="og:title" content="Backspace — Join the Waitlist" />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Backspace — the new social layer for markets" />

        {/* Twitter / X Card. summary_large_image renders the OG image
            as a hero card when waitlist.backspace.to/* URLs are shared. */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@backspacehq" />
        <meta name="twitter:creator" content="@backspacehq" />
        <meta name="twitter:title" content="Backspace — Join the Waitlist" />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="twitter:image:alt" content="Backspace — the new social layer for markets" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
