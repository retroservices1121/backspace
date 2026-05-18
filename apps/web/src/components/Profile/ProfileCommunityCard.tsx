// Featured community card for the profile. Backspace's communities
// are core to the product, so we surface the user's pinned community
// (or their first owned one) between the header and the tab bar —
// roughly the same slot X uses for a pinned tweet, but for a place
// rather than a post.

import React from 'react';
import { Permissions } from '@prisma/client';
import { useRouter } from 'next/router';

import CommunityIcon from 'components/CommunityIcon/CommunityIcon';
import useMedia from 'hooks/useMedia';
import { APP } from 'pages';
import { selectMembership } from 'store/post/selectors';
import { actions as communityActions } from 'store/community/slice';
import { useAppDispatch } from 'store/store';

type CommunityLike = {
  id: bigint;
  uuid?: string;
  name: string;
  description?: string;
  avatar?: any;
  banner?: any;
};

type Props = {
  community: CommunityLike;
  /** Whose profile this card sits on (used in the description fallback). */
  ownerName?: string;
};

const ProfileCommunityCard: React.FC<Props> = ({ community, ownerName }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const avatar = useMedia(community.avatar);
  const banner = useMedia(community.banner);
  const membership = selectMembership(community.id);
  const isMember = (membership?.role ?? 0) >= Permissions.MEMBER;

  const go = async () => {
    if (!isMember) {
      await dispatch(communityActions.joinCommunity(community.id));
    }
    // Pass the community uuid so /community can select it directly
    // instead of defaulting to whichever ends up first in the user's
    // membership list. Without this, mobile users land on the wrong
    // community (or a "no channel selected" empty state).
    const query = community.uuid ? { c: community.uuid } : undefined;
    router.push({ pathname: APP.COMMUNITY.INDEX, query });
  };

  const description =
    community.description ||
    (ownerName
      ? `Access ${ownerName}'s exclusive content by visiting their community.`
      : 'Access exclusive content by visiting this community.');

  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-surface font-display text-ink">
      {/* Optional banner strip, mirrors the X 'pinned' look. The
          fallback paints a soft brand-tinted gradient so the card
          looks intentional even when no banner is uploaded. */}
      <div
        className="h-20 w-full"
        style={banner
          ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {
            background:
              'linear-gradient(135deg, rgba(88,34,251,0.35) 0%, rgba(255,136,0,0.18) 100%)',
          }
        }
      />
      <div className="flex items-center gap-3 px-4 py-3">
        <CommunityIcon size="medium" communityName={community.name} image={avatar} onClick={go} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-ink truncate">{community.name}</div>
          <div className="mt-0.5 text-[13px] text-ink-3 line-clamp-2 leading-snug">
            {description}
          </div>
        </div>
        <button
          type="button"
          onClick={go}
          className={
            isMember
              ? 'rounded-full border border-line-2 px-4 h-9 text-[13px] font-semibold text-ink hover:bg-hover transition-colors'
              : 'rounded-full bg-brand hover:bg-brand-2 px-4 h-9 text-[13px] font-semibold text-ink transition-colors shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]'
          }
        >
          {isMember ? 'Enter' : 'Join'}
        </button>
      </div>
    </div>
  );
};

export default ProfileCommunityCard;
