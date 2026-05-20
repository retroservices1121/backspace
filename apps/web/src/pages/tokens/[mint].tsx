// /tokens/[mint] — single-token detail route. Sticky back-arrow
// header, token header (logo + symbol + name + mint), and a
// DflowSwapCard centered on this token. Price/chart sections are
// stubbed for the trending-data follow-up; for now the page is the
// swap experience plus addressing.

import React, { useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import { useRouter } from 'next/router';

import { DflowSwapCard } from '@src/components/Dflow/DflowSwapCard';
import { useToken } from '@src/hooks/useToken';
import { setPageTitle } from '@src/store/appSlice';
import { useAppDispatch } from '@src/store/store';

const TokenDetail: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mint = router.query.mint as string | undefined;
  const token = useToken(mint);

  useEffect(() => {
    if (token.data) dispatch(setPageTitle(token.data.symbol));
  }, [token.data?.symbol]);

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/tokens');
  };

  return (
    <div className="font-display text-ink">
      <div
        className="
          sticky top-0 z-10
          px-5 py-3
          border-b border-line
          bg-canvas/[0.78]
          backdrop-blur-[14px] backdrop-saturate-[160%]
          flex items-center gap-4
        "
      >
        <button
          type="button"
          onClick={goBack}
          className="
            w-9 h-9 rounded-full flex items-center justify-center
            text-ink-2 hover:bg-hover hover:text-ink transition-colors
          "
          aria-label="Back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <span className="text-[18px] font-semibold text-ink truncate">
          {token.data?.symbol ?? 'Token'}
        </span>
      </div>

      {token.isLoading && (
        <div className="px-6 py-10 text-center text-[13px] text-ink-3">
          Loading token…
        </div>
      )}

      {token.isError && (
        <div className="px-6 py-10 text-center text-[13px] text-ink-3">
          Couldn’t load this token. It may have been delisted.
        </div>
      )}

      {token.data && (
        <>
          <div className="px-5 py-5 flex items-center gap-4 border-b border-line">
            {token.data.logoURI ? (
              <img
                src={token.data.logoURI}
                alt=""
                className="w-14 h-14 rounded-full flex-none object-cover bg-surface"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex-none flex items-center justify-center text-[16px] font-bold text-ink/80"
                style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
              >
                {token.data.symbol.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[20px] font-bold text-ink tracking-[-0.01em]">
                {token.data.symbol}
              </div>
              <div className="text-[14px] text-ink-2 truncate">
                {token.data.name}
              </div>
              <div className="mt-0.5 text-[11px] text-ink-3 font-mono truncate">
                {token.data.mint} · Solana
              </div>
            </div>
          </div>

          <div className="px-4 py-5">
            <DflowSwapCard token={token.data} />
          </div>
        </>
      )}
    </div>
  );
};

export default TokenDetail;
