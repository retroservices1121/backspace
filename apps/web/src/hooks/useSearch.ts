// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';

import { useAxios } from './useAxios';

enum SearchType {
  USERS,
  COMMUNITY,
  ALL,
}

export const useSearch = () => {
  const axios = useAxios();
  const [searchText, setSearchText] = useState<string>();
  const [searchResults, setSearchResults] = useState<any[]>();
  
  const searchUsers = async (search: string) => {
    setSearchText(search);
    const { data } = await axios.get(`search/users/${search}`);
    setSearchResults(data);
    return data;
  };

  return {
    users: searchUsers,
    clear: () => {setSearchResults(undefined); setSearchText(undefined);},
    
    text: searchText,
    setText: setSearchText,

    results: searchResults,
  };

};