// Connector for inline timeline swap embeds. Mirrors PostMarketCard's
// shape — drops into a feed post when the post is linked to a Token,
// fetches the token, and renders <DflowSwapCard /> in compact mode.

import { useToken } from '@src/hooks/useToken';

import { DflowSwapCard } from './DflowSwapCard';

type Props = {
  tokenId: bigint | string;
};

export function PostTokenCard({ tokenId }: Props) {
  const token = useToken(tokenId);

  if (token.isLoading) {
    return (
      <div className="my-3 h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    );
  }
  if (token.isError || !token.data) {
    return (
      <div className="my-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
        Couldn’t load token. Try refreshing.
      </div>
    );
  }

  return (
    <div className="my-3">
      <DflowSwapCard outputToken={token.data} />
    </div>
  );
}
