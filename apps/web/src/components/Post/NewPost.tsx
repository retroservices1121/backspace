// New design's feed post — desktop chrome from /webui ported around
// the existing data layer. Reuses `usePost` for all engagement
// state (like/repost/bookmark/share/view tracking/edit/delete) and
// `PostMarketCard` / `PostTokenCard` for the tradeable embeds so the
// V1 flows don't change — only the wrapper, header, and actions row
// move to the new look. MediaPost stays in place for profile and
// post-permalink routes until those are migrated separately.
//
// Variants — picked from existing data, not a separate field:
//   - CommunityPost  : post.message.community present
//   - MarketPost     : post.marketId set (2-outcome resolved/active)
//   - MultiMarket    : post.marketId set (>2 outcomes) — handled by
//                      PostMarketCard already; no extra branching here
//   - ResolvedPost   : post.marketId set, market.status === RESOLVED
//                      — same component handles the resolved badge
//   - SocialPost     : nothing else; CTA reads "Spin to market"
//
// The single chrome here handles all five via slots; PostMarketCard
// already renders the inside-the-embed YES/NO ladder / resolved
// stamp, so we don't duplicate it.

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import {
  BookmarkIcon as BookmarkSolid,
  HeartIcon as HeartSolid,
} from '@heroicons/react/solid';
import {
  BookmarkIcon,
  ChatAltIcon,
  HeartIcon,
  RefreshIcon,
  ShareIcon,
} from '@heroicons/react/outline';
import useMedia from '@src/hooks/useMedia';
import usePost from '@src/hooks/usePost';

import { PostTokenCard } from 'components/Dflow/PostTokenCard';
import { PostMarketCard } from 'components/Market/PostMarketCard';
import RichRender from 'components/Rich/RichRender';
import { ShellIcons as I } from 'components/Shell/icons';
import CalibrationChip from 'components/Profile/CalibrationChip';

import { RootState } from 'store/store';
import { Post } from 'types/prisma';
import { getMediaType, timeAgoStringAbbreviation, truncateLargeumbers } from 'utils/common_utils';

type Props = { post: Post };

export default function NewPost({ post }: Props) {
  const thisPost = usePost(post);
  const router = useRouter();
  const me = useSelector((s: RootState) => s.user);
  const author = post.author;
  const authorAvatar = useMedia(author.avatar);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAuthor = author?.id === me?.id;
  // Community variant — show the breadcrumb strip above the header
  // when the post lives in a community channel.
  const community = (post as any).message?.community;
  // Trade label on the actions row: posts with no embed get the
  // 'Spin to market' CTA from the design (currently a stub — wires
  // to the existing CreatePost market picker in a follow-up).
  const hasEmbed = !!post.marketId || !!(post as any).tokenId;

  useEffect(() => { thisPost.trackView(); }, [post.id]);

  // Close the overflow menu on outside click.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const goToProfile = () => router.push(`/${author.username}`);
  const goToThread = () => router.push(`/post/${post.uuid}`);

  return (
    <div
      className="
        flex gap-3 px-5 py-4
        border-b border-line
        bg-canvas
        font-display text-ink
      "
    >
      {/* Avatar with optional conviction badge — gradient fallback
          if the user has no avatar uploaded yet. */}
      <button
        type="button"
        onClick={goToProfile}
        className="relative flex-none w-[42px] h-[42px] rounded-full overflow-hidden ring-2 ring-brand-2/30"
        aria-label={`${author.name || author.username} profile`}
      >
        {authorAvatar
          ? <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
          : (
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
            />
          )}
      </button>

      <div className="flex-1 min-w-0">
        {community && (
          <CommunityStrip
            name={community.name}
            colorHex={community.color || '#7B4CFF'}
          />
        )}

        <PostHead
          name={author.name || author.username}
          username={author.username}
          verified={!!author.verified}
          publicAccuracy={(author as any).publicAccuracy}
          accuracy={(author as any).accuracy}
          createdAt={post.createdAt}
          onName={goToProfile}
          onTime={goToThread}
          menuRef={menuRef}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
          isAuthor={isAuthor}
          onEdit={() => { setMenuOpen(false); thisPost.edit(); }}
          onDelete={() => {
            setMenuOpen(false);
            if (window.confirm('Delete this post? This cannot be undone.')) {
              thisPost.delete();
            }
          }}
        />

        {/* Body — title (optional) + Slate rich text. line-clamp
            keeps the feed tight; the full post lives at /post/[uuid]
            for now (no inline "show more" here — the design treats
            posts as previews and the thread page as the deep view). */}
        {post.title && <h3 className="mt-1 text-[15px] font-semibold">{post.title}</h3>}
        {post.text && (
          <div className="mt-0.5 text-[15px] leading-snug text-ink line-clamp-6">
            <RichRender value={post.text} />
          </div>
        )}

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <PostMedia post={post} />
        )}

        {/* Tradeable embeds — existing components, just spaced for
            the new chrome. PostMarketCard handles binary, multi-
            outcome, and the resolved-market badge internally. */}
        {post.marketId && (
          <div className="mt-3">
            <PostMarketCard marketId={post.marketId} />
          </div>
        )}
        {(post as any).tokenId && (
          <div className="mt-3">
            <PostTokenCard tokenId={(post as any).tokenId} />
          </div>
        )}

        <PostActions
          comments={post._count?.comments ?? 0}
          reposts={thisPost.repostCount}
          likes={post._count?.likes ?? 0}
          views={thisPost.viewCount}
          isLiked={thisPost.isLiked}
          isReposted={thisPost.isReposted}
          isBookmarked={thisPost.isBookmarked}
          bookmarkCount={thisPost.bookmarkCount}
          tradeLabel={hasEmbed ? 'Trade' : 'Spin to market'}
          onReply={thisPost.open}
          onRepost={thisPost.setRepost}
          onLike={() => thisPost.setLike(!thisPost.isLiked)}
          onBookmark={thisPost.setBookmark}
          onShare={thisPost.share}
        />
      </div>
    </div>
  );
}

function CommunityStrip({ name, colorHex }: { name: string; colorHex: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-2 text-[11px] text-ink-3 font-mono">
      <span
        className="
          inline-flex items-center gap-1.5 px-2 py-0.5 rounded
          text-[11px] font-semibold text-ink bg-white/[0.04]
          border border-line
        "
      >
        <span
          className="w-2 h-2 rounded-sm"
          style={{ background: colorHex }}
        />
        {name}
      </span>
      <span>·</span>
      <span>Posted in community</span>
    </div>
  );
}

function PostHead({
  name, username, verified, publicAccuracy, accuracy,
  createdAt, onName, onTime,
  menuRef, menuOpen, onMenuToggle, isAuthor, onEdit, onDelete,
}: {
  name: string;
  username: string;
  verified: boolean;
  publicAccuracy?: boolean;
  accuracy?: any;
  createdAt: Date | string;
  onName: () => void;
  onTime: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
  menuOpen: boolean;
  onMenuToggle: () => void;
  isAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[14px]">
      <button
        type="button"
        onClick={onName}
        className="font-semibold text-ink hover:underline truncate"
      >
        {name}
      </button>
      {verified && (
        <span className="text-brand-2 inline-flex" aria-label="Verified">
          <I.conv className="w-3.5 h-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={onName}
        className="text-ink-3 font-mono text-[13px] hover:underline truncate"
      >
        @{username}
      </button>
      <CalibrationChip publicAccuracy={publicAccuracy} accuracy={accuracy} />
      <span className="text-ink-4">·</span>
      <button
        type="button"
        onClick={onTime}
        className="text-ink-3 font-mono text-[12px] hover:underline"
      >
        {timeAgoStringAbbreviation(new Date(createdAt))}
      </button>

      <div className="ml-auto relative" ref={menuRef}>
        <button
          type="button"
          onClick={onMenuToggle}
          className="w-7 h-7 rounded-full text-ink-3 hover:bg-hover hover:text-ink flex items-center justify-center"
          aria-label="Post options"
        >
          <I.dots className="w-4 h-4" />
        </button>
        {menuOpen && isAuthor && (
          <div className="absolute right-0 top-8 z-20 min-w-[10rem] overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            <button
              type="button"
              onClick={onEdit}
              className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-hover"
            >
              Edit post
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="block w-full px-4 py-2 text-left text-sm text-pink-2 hover:bg-pink-vivid/20"
            >
              Delete post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PostMedia({ post }: { post: Post }) {
  const thisPost = usePost(post, true);
  return (
    <div className="mt-3 flex flex-col gap-2">
      {thisPost.mediaURL?.map((url, index) => {
        if (!url || !post.media?.[index]) return null;
        const isVideo = getMediaType(post.media[index]) === 'video';
        return (
          <div
            key={url}
            className="rounded-2xl overflow-hidden border border-line bg-surface"
          >
            {isVideo
              ? (
                <video src={url} controls className="w-full" />
              )
              : (
                <img src={url} alt="" className="w-full object-cover" />
              )}
          </div>
        );
      })}
    </div>
  );
}

function PostActions({
  comments, reposts, likes, views,
  isLiked, isReposted, isBookmarked, bookmarkCount,
  tradeLabel,
  onReply, onRepost, onLike, onBookmark, onShare,
}: {
  comments: number;
  reposts: number;
  likes: number;
  views: number;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  bookmarkCount: number;
  tradeLabel: string;
  onReply: () => void;
  onRepost: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between max-w-md text-ink-3">
      <ActionButton
        label="Reply"
        count={comments}
        hoverClass="hover:text-brand-2"
        onClick={onReply}
      >
        <ChatAltIcon className="w-[18px] h-[18px]" />
      </ActionButton>

      <ActionButton
        label={isReposted ? 'Undo repost' : 'Repost'}
        count={reposts}
        active={isReposted}
        activeClass="text-green-2"
        hoverClass="hover:text-green-2"
        onClick={onRepost}
      >
        <RefreshIcon className="w-[18px] h-[18px]" />
      </ActionButton>

      <ActionButton
        label={isLiked ? 'Unlike' : 'Like'}
        count={likes}
        active={isLiked}
        activeClass="text-pink-vivid"
        hoverClass="hover:text-pink-vivid"
        onClick={onLike}
      >
        {isLiked
          ? <HeartSolid className="w-[18px] h-[18px]" />
          : <HeartIcon className="w-[18px] h-[18px]" />}
      </ActionButton>

      <ActionButton
        label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        count={bookmarkCount}
        active={isBookmarked}
        activeClass="text-brand-2"
        hoverClass="hover:text-brand-2"
        onClick={onBookmark}
      >
        {isBookmarked
          ? <BookmarkSolid className="w-[18px] h-[18px]" />
          : <BookmarkIcon className="w-[18px] h-[18px]" />}
      </ActionButton>

      <span className="text-[11px] font-mono flex items-center gap-1">
        <span>{views > 0 ? truncateLargeumbers(views) : '0'}</span>
        <span>views</span>
      </span>

      <button
        type="button"
        onClick={onShare}
        className="
          inline-flex items-center gap-1 px-2 py-1 rounded-full
          text-brand-2 hover:bg-brand-soft transition-colors duration-150
        "
        aria-label={tradeLabel}
      >
        <ShareIcon className="w-[18px] h-[18px]" />
        <span className="text-[12px] font-semibold">{tradeLabel}</span>
      </button>
    </div>
  );
}

function ActionButton({
  children, label, count, onClick, active, activeClass, hoverClass,
}: {
  children: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  hoverClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        'group inline-flex items-center gap-1 px-1 py-1 rounded-full',
        'transition-colors duration-150',
        active && activeClass ? activeClass : '',
        hoverClass,
      ].join(' ')}
    >
      {children}
      <span className="text-[12px] font-mono min-w-[1ch]">
        {count > 0 ? truncateLargeumbers(count) : ''}
      </span>
    </button>
  );
}
