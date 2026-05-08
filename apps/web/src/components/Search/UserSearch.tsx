// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useRef } from 'react';
import { useSearch } from '@src/hooks/useSearch';
import Icons from '@src/icons';
import { User } from '@src/types/prisma';
import { useRouter } from 'next/router';

import UserTile from 'components/User/UserTile';

import { Container, Matches, SearchInput, SearchInputIcon } from './styled';

type Props = {
  /** callback when object is clicked */
  callbackText?: string;
  callback?: (user: User) => void; //TODO callback does nothing rn
};

const UserSearch: React.FC<Props> = ({ callbackText = 'Search Users', callback }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const search = useSearch();
  const router = useRouter();

  const clickHandler = (user: User) => {
    if (callback) {
      callback(user);
    } else {
      inputRef.current.value = ''; 
      router.push(user.username);
      search.clear();
    }
  };

  const renderOptions = (options : Array<User>) =>  {
    return options.map((value) => (
      <div>
        <UserTile
          key={`usertile-${value.id}`}
          user={value}
          onClick={() => {
            clickHandler(value);
          }}
          noAction={true}
        />
      </div>
    ));
  };

  return (
    <Container>
      <SearchInputIcon onClick={() => inputRef.current?.focus()}>
        <Icons.Search clickable color="fontSecondary" />
      </SearchInputIcon>
      <SearchInput
        className="leading-[35px] sm:leading-[44px]"
        placeholder={callbackText}
        autoComplete="on"
        list="suggestions"
        value={search.text}
        ref={inputRef}
        onChange={({ target }) => {search.setText(target.value);search.users(target.value);}}
      />
      <Matches>
        {search.results?.length && renderOptions(search.results) || 'No Results'}
      </Matches>
    </Container>
  );
};

export default UserSearch;
