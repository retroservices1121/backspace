// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { findUsers } from 'api/userAPI';
import UserTile from 'components/UserActionTile';
import { ReactComponent as SearchIcon } from 'graphics/commonicons/search.svg';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';

import { Container, Matches, SearchInput, SearchInputIcon } from './styled';

type Props = {
  /** callback when object is clicked */
  callbackText?: string | null;
  callback?: (user: User) => void;
};

const Search: React.FC<Props> = ({ callbackText, callback }) => {

  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<Array<User>>();
  const { recentUsers } = useSelector((state : RootState) => state.feed);

  const renderOptions = (options : Array<User>) =>  {
    return options.map((value) => (
      <div onClick={() => {
        setText('');
      }}>
      <UserTile
        key={`usertile-${value.id}`}
        user={value}
        callbackText={callbackText}
        clickOverride={callback}
        callback={callback}
      />
      </div>
    ));
  };

  //Search display and usernames on input change
  const textChange = async (newValue : string) => {
    setText(newValue);
    //Search
    if (newValue) {
      setSuggestions(await findUsers(newValue));
    } else { //No user input yet, display recent
      setSuggestions(recentUsers);
    }
  };

  return (
    <Container>
      <SearchInputIcon $solid as={SearchIcon}/>
      <SearchInput
        placeholder="Search"
        autoComplete="on"
        list="suggestions"
        value={text}
        onFocus={() => textChange(text)}
        onChange={({ target }) => textChange(target.value)}
      />
      <Matches >
        {suggestions?.length && renderOptions(suggestions) || 'No Matching User'}
      </Matches>
    </Container>
  );
};

export default Search;
