import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Backspace — Join the Waitlist</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="The new social layer for markets. Reserve your handle before launch."
        />
        <meta property="og:title" content="Backspace" />
        <meta
          property="og:description"
          content="The new social layer for markets. Reserve your handle before launch."
        />
        <meta name="theme-color" content="#08070d" />
        <link rel="icon" href="/assets/backspace-icon.png" />
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
