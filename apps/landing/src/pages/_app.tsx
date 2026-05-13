import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Backspace — the prediction-market social layer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="The prediction-market social layer. Reserve your handle before launch."
        />
        <meta property="og:title" content="Backspace" />
        <meta
          property="og:description"
          content="The prediction-market social layer. Reserve your handle before launch."
        />
        <meta name="theme-color" content="#0a0a0a" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
