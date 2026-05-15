// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect } from 'react';
import ReactLoading from 'react-loading';
import { useDispatch, useSelector } from 'react-redux';
import { MenuAlt2Icon } from '@heroicons/react/outline';
import useConstructor from '@src/hooks/useConstructor';
import Head from 'next/head';
import { useRouter } from 'next/router';

import ChannelFeed from 'components/Channel';
import CommunityDrawer from 'components/Community/CommunityDrawer';
import CreateChannelModal from 'components/Community/CreateChannel';
import MemberList from 'components/Community/MemberList';
import { Container } from 'components/Community/styledAgain';
import CommunitySettings from 'components/modals/CommunitySettings';
import PurchaseSubscription from 'components/modals/PurchaseSubscription';
import useCommunity from 'hooks/entities/useCommunities';
import { Screens, useScreen } from 'hooks/useAnalytics';
import useBilling from 'hooks/useBilling';
import { toggleDrawer } from 'store/appSlice';
import { RootState } from 'store/store';

type Props = {};

const Community: React.FC<Props> = ({ }) => {
  useScreen(Screens.Community);
  const router = useRouter();
  const dispatch = useDispatch();
  // Note: useCommunity bootstraps this feature.
  const { current: { community, channel }, run, noFriends } = useCommunity();
  const { purchaseSubscription } = useBilling();
  // Communities map — used to detect "the requested community is loaded"
  // so we can switch to it once getCommunities() resolves.
  const communities = useSelector((s: RootState) => s.community.communities);

  useConstructor(run.init);

  // If /community?c=<uuid> was set (e.g. from a profile's Enter button),
  // switch to that community as soon as it's available in state and
  // explicitly select its first channel. The default upsertCommunities
  // path picks payload[0], which is usually not the one the user
  // clicked from a profile. We do the channel select ourselves so the
  // user never sees the "Pick a room" empty state in the happy path.
  const requestedUuid = (router.query.c as string | undefined) ?? undefined;
  useEffect(() => {
    if (!requestedUuid) return;
    const target = communities[requestedUuid];
    if (!target) return; // not loaded yet
    if (community?.uuid !== requestedUuid) {
      run.changeCommunity(requestedUuid);
    }
    // Force-pick a channel. Prefer channelOrder (matches sidebar
    // visual order) and fall back to whatever ends up first in the
    // map. The reducer already tries, but if it ever ends up with a
    // stale or wrong channel id we override it here.
    const firstChannelUuid =
      target.channelOrder?.[0]
      ?? Object.values(target.channels ?? {})[0]?.uuid;
    if (firstChannelUuid && channel?.uuid !== firstChannelUuid) {
      run.changeChannel(firstChannelUuid);
    }
  }, [requestedUuid, communities, community?.uuid, channel?.uuid]);

  if (!community) {
    return <ReactLoading type='bubbles' />;
  }

  if (noFriends) {
    return (
      <div className='col full'>
        <h4>You are not part of any communities</h4>
      </div>
    );
  }

  return (
    <Container>
      <Head>
        <title>{community?.name || 'My Spaces' }</title>
      </Head>
      <CreateChannelModal edit={false} />
      {/* <EditChannelModal /> */}
      <CommunitySettings />

      {/* Left side */}

      <PurchaseSubscription onSubmit={purchaseSubscription}/>
      <CommunityDrawer />

      {/* Main section */}

      {!channel ? (
        // No channel selected — typically because the community has no
        // channels yet, or mobile users landed before auto-select kicked
        // in. Surface a Browse rooms CTA that opens the drawer rather
        // than a dead-end message.
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <h4 className="text-fontFocus">Pick a room to get started</h4>
          <p className="text-sm text-fontTertiary max-w-xs">
            Rooms are where the conversation happens. Open the room list to
            jump in.
          </p>
          <button
            type="button"
            onClick={() => dispatch(toggleDrawer())}
            className="mt-2 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <MenuAlt2Icon className="w-5 h-5" />
            Browse rooms
          </button>
        </div>
      ) : (
        <ChannelFeed id={channel.uuid}/>
      )}


      {/* Right side */}

      <MemberList />
    </Container>
  );
};

export default Community;
