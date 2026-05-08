// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import ReactLoading from 'react-loading';
import { useRouter } from 'next/router';

import axios from 'lib/axios';

type Props = {};

const dev: React.FC<Props> = ({}) => {
  const router = useRouter();

  function syncUsers() {
    const callAPI = async () => {
      try {
        const response = await fetch('/api/port/clone_users');
        // const data = await response.json(); 
      } catch (err) {
        console.error(err);
      }
    };
    callAPI();
  }

  function syncCommunities() {
    const callAPI = async () => {
      try {
        const response = await fetch('/api/port/clone_communities');
        // const data = await response.json(); 
      } catch (err) {
        console.error(err);
      }
    };
    callAPI();
  }

  function syncSubscriptions() {
    const callAPI = async () => {
      try {
        const response = await fetch('/api/billing/sync');
        // const data = await response.json(); 
      } catch (err) {
        console.error(err);
      }
    };
    callAPI();
  }

  function syncPosts() {
    const callAPI = async () => {
      try {
        const response = await fetch('/api/port/clone_posts');
        // const data = await response.json(); 
      } catch (err) {
        console.error(err);
      }
    };
    callAPI();
  }

  function syncMedia() {
    const callAPI = async () => {
      try {
        const response = await fetch('/api/port/media');
        const data = await response.json(); 
      } catch (err) {
        console.error(err);
      }
    };
    callAPI();
  }

  function doThing() {
    const callAPI = async () => {
      try {
        const response = await fetch('/api/dothing');
        const data = await response.json(); 
        console.log(data);
      } catch (err) {
        console.error(err);
      }
    };
    callAPI();
  }

  function changeURL() {
    router.push({
      pathname: router.pathname,
      query: { post: 'somepostid' },
    }, 
    undefined, { shallow: true },
    );
  }

  return (
    <div>
      {/* <p>Media fetch test</p> */}
      {/* {avatar === undefined && profile_image
        ? <ReactLoading width={50} height={50} type='spinningBubbles' /> 
        : <img width={100} height={100} src={avatar} alt="No Profile Image" />}
      {banner === undefined && banner_image
        ? <ReactLoading width={50} height={50} type='spinningBubbles' /> 
        : <img width={100} height={100} src={banner} alt="No Banner Image" />} */}
      <h3>Migrations</h3>
      <button onClick={() => syncUsers()}>Clone Firebase Users</button>
      <br/><br/>
      <button onClick={() => syncCommunities()}>Clone Communities</button>
      <br/><br/>
      <button onClick={() => syncSubscriptions()}>Clone Subscriptions</button>
      <br/><br/>
      <button onClick={() => syncPosts()}>Clone Posts</button>
      <br/><br/>
      <button disabled onClick={() => syncMedia()}>Clne Firebase Media</button>
      <br/><br/><br/><br/>
      <h3>Try Dev things</h3>
      <button onClick={() => doThing()}>Do some One off things</button>
      <br/><br/>
      <button onClick={() => changeURL()}>Change URL</button>
    </div>
  );
};

export default dev;
