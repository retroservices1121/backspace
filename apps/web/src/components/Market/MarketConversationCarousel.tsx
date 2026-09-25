import Link from 'next/link';
import { useQuery } from 'react-query';

import axios from '@src/lib/axios';

type Conversation = {
  uuid: string;
  text: string;
  createdAt: string;
  author: { username: string; name: string; verified: boolean };
  engagement: { likes: number; comments: number; reposts: number };
  marketId: string | null;
  market: { question: string; imageUrl: string | null; status: string } | null;
};

async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await axios().get<Conversation[]>('/markets/conversations');
  return data || [];
}

export function MarketConversationCarousel() {
  const conversations = useQuery(['market-conversations'], fetchConversations, {
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  const posts = conversations.data || [];

  return (
    <section className="px-4 pt-5 sm:px-6" aria-labelledby="market-conversations-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="market-conversations-title" className="m-0 text-[15px] font-bold tracking-[-0.01em] text-ink">
            Market conversations
          </h2>
          <p className="mt-1 text-xs text-ink-3">What Backspace is saying right now</p>
        </div>
        <Link href="/auth/login?next=%2Fmarkets">
          <a className="text-xs font-semibold text-brand-2">Join the conversation</a>
        </Link>
      </div>

      {conversations.isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map((item) => <div key={item} className="h-36 w-[300px] flex-none animate-pulse rounded-2xl border border-line bg-surface" />)}
        </div>
      ) : conversations.isError ? (
        <div className="rounded-2xl border border-line bg-surface px-5 py-5 text-sm text-ink-2">
          Market conversations are temporarily unavailable.
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-2/30 bg-brand-soft px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div>
            <h3 className="m-0 text-sm font-semibold text-ink">The first market take could be yours.</h3>
            <p className="mt-1 text-sm text-ink-2">Attach a live Gate market to a Backspace post and it will appear here.</p>
          </div>
          <Link href="/auth/login?next=%2Fmarkets">
            <a className="mt-4 inline-flex rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white sm:mt-0">Post a take</a>
          </Link>
        </div>
      ) : (
        <div className="conversation-viewport overflow-hidden" aria-live="polite">
          <div className="conversation-track flex w-max gap-3 py-1">
            {[...posts, ...posts].map((post, index) => (
              <ConversationCard key={`${post.uuid}-${index}`} post={post} duplicate={index >= posts.length} />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .conversation-track { animation: marketConversationScroll ${Math.max(28, posts.length * 8)}s linear infinite; }
        .conversation-viewport:hover .conversation-track,
        .conversation-viewport:focus-within .conversation-track { animation-play-state: paused; }
        @keyframes marketConversationScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .conversation-track { animation: none; } .conversation-viewport { overflow-x: auto; } }
      `}</style>
    </section>
  );
}

function ConversationCard({ post, duplicate }: { post: Conversation; duplicate: boolean }) {
  return (
    <article className="w-[300px] flex-none rounded-2xl border border-line bg-surface p-4 sm:w-[340px]" aria-hidden={duplicate || undefined}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-2">
          {(post.author.name || post.author.username).slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{post.author.name}</div>
          <div className="truncate text-xs text-ink-3">@{post.author.username}</div>
        </div>
      </div>
      <Link href={`/post/${post.uuid}`}>
        <a tabIndex={duplicate ? -1 : 0} className="mt-3 block line-clamp-3 text-sm leading-relaxed text-ink-2 hover:text-ink">{post.text}</a>
      </Link>
      {post.marketId ? <Link href={`/m/${post.marketId}`}>
        <a tabIndex={duplicate ? -1 : 0} className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs font-medium text-brand-2">
          {post.market?.imageUrl && <img src={post.market.imageUrl} alt="" className="h-6 w-6 rounded-md object-cover" />}
          <span className="truncate">{post.market?.question || 'View live market'}</span>
        </a>
      </Link> : <div className="mt-3 border-t border-line pt-3 text-xs font-medium text-ink-3">Market conversation</div>}
    </article>
  );
}
