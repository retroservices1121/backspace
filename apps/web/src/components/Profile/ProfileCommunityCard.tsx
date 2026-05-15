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
import { ButtonLarge } from 'styles/Buttons';

type CommunityLike = {
  id: bigint;
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
    router.push(APP.COMMUNITY.INDEX);
  };

  const description =
    community.description ||
    (ownerName
      ? `Access ${ownerName}'s exclusive content by visiting their community.`
      : 'Access exclusive content by visiting this community.');

  return (
    <div className="mx-4 mb-3 overflow-hidden rounded-2xl border border-dividerColor bg-backgroundNormal">
      {/* Optional banner strip, mirrors the X 'pinned' look. */}
      <div
        className="h-20 w-full bg-backgroundLight"
        style={banner
          ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined}
      />
      <div className="flex items-center gap-4 px-4 py-3">
        <CommunityIcon size="medium" communityName={community.name} image={avatar} onClick={go} />
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-fontFocus truncate">{community.name}</div>
          <div className="text-sm text-fontTertiary line-clamp-2">{description}</div>
        </div>
        <ButtonLarge color="primary" onClick={go}>
          {isMember ? 'Enter' : 'Join'}
        </ButtonLarge>
      </div>
    </div>
  );
};

export default ProfileCommunityCard;
