// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

type Props = {
  /** callback when object is clicked */
  callbackText?: string;
  callback?: () => void;
};

const Search: React.FC<Props> = ({ callbackText = 'Search Users', callback }) => {
  return <div>NOT IMPLEMENTED</div>;
  // const inputRef = useRef(null);
  // const [text, setText] = useState('');
  // const [suggestions, setSuggestions] = useState<Array<OldUser>>();
  // const { recentUsers } = useSelector((state : RootState) => state.feed);

  // const renderOptions = (options : Array<OldUser>) =>  {
  //   return options.map((value) => (
  //     <div onClick={() => {
  //       setText('');
  //     }}>
  //     <UserTile
  //       key={`usertile-${value.id}`}
  //       user={value}
  //       callbackText={callbackText}
  //       // clickOverride={callback}
  //       // callback={callback}
  //     />
  //     </div>
  //   ));
  // };

  // //Search display and usernames on input change
  // const textChange = async (newValue : string) => {
  //   setText(newValue);
  //   //Search
  //   if (newValue) {
  //     setSuggestions(await findUsers(newValue));
  //   } else { //No user input yet, display recent
  //     setSuggestions(recentUsers);
  //   }
  // };

  // return (
  //   <Container>
  //     <SearchInputIcon onClick={() => inputRef.current?.focus()}>
  //       <Icons.Search clickable color="fontSecondary" />
  //     </SearchInputIcon>
  //     <SearchInput
  //       className="leading-[35px] sm:leading-[44px]"
  //       placeholder={callbackText}
  //       autoComplete="on"
  //       list="suggestions"
  //       value={text}
  //       ref={inputRef}
  //       onFocus={() => textChange(text)}
  //       onChange={({ target }) => textChange(target.value)}
  //     />
  //     <Matches >
  //       {suggestions?.length && renderOptions(suggestions) || 'No Matching User'}
  //     </Matches>
  //   </Container>
  // );
};

export default Search;
