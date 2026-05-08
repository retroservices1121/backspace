// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { Descendant } from 'slate';

import { Input } from 'types/forms';

import RichInput from './RichInput';

type Props = {
  name: string; 
  value: string;
};

export const FormikInput:Input<Props> = ({
  field: { name, value },
  form: { setFieldValue },
}) => {
  let jsonValue = undefined;
  try {
    if (value) {
      // conversion to unknown is needed here since value is some bizarre type
      jsonValue = JSON.parse(value as unknown as string);
    }
  } catch (error) {
    // Do nothing
  }
  

  return (
    <>
      <div id={name}>
        <RichInput 
          initialValue={jsonValue}
          onSubmit={() => false} 
          onChange={function (changeValue: Descendant[]): void {
            setFieldValue(name, JSON.stringify(changeValue));
          } }  />
      </div>
    </>
  );
};

export default FormikInput;


// export type RestyledInput<T extends string = 'input'> = StyledComponentProps<T, any, {}, never> & {
//   label: string;
// };

// const MakeMentionTextArea = <T extends string>(singleLine: boolean): React.FC<RestyledInput<T>> => ({
//   name, label, value, ...props
// }) => {
//   const [{}, {}, { setValue }] = useField(name);
//   const theme = useTheme();
//   const { followedUsers } = useSelector((state: RootState) => state.feed);
//   const [ suggestions, setSuggestions ] = useState<SuggestionDataItem[]>([]);
  

//   useEffect(() => {
//     setSuggestions(() => {
//       return followedUsers.map((user) => {
//         return { id: user.username, display: user.username };
//       });
//     });
//   }, [followedUsers]);

//   const MentionTextarea = {
//     marginTop: '-20px',
//     control: {
//       backgroundColor: 'inherit',
//       borderRadius: '8px',
//       fontSize: 16,
//       resize: 'both',
//     },

//     '&multiLine': {
//       control: {
//         minHeight: 63,
//       },
//       highlighter: {
//         padding: 9,
//         border: '1px solid transparent',
//       },
//       input: {
//         padding: 9,
//         border: '1px solid transparent',
//         backgroundColor: 'inherit',
//       },
//     },

//     '&singleLine': {
//       display: 'inline-block',
//       width: '100%',
//       height: '47px',
//       fontSize: '14px',
//       lineHeight: '47px',
//       highlighter: {
//         paddingLeft: '60px',
//         border: 'none',
//       },
//       input: {
//         paddingLeft: '60px',
//         border: 'none',
//         backgroundColor: 'inherit',
//       },
//     },

//     suggestions: {
//       list: {
//         backgroundColor: theme.backgroundLight,
//         borderRadius: '8px',
//       },
//       item: {
//         padding: '5px 15px',
//         borderBottom: `1px solid ${theme.backgroundDark}`,
//         '&focused': {
//           backgroundColor: theme.primary,
//         },
//       },
//     },
//   };

//   const getMatches = (query: string, callback: (data: SuggestionDataItem[]) => void) => {
//     const matches = suggestions.filter((sug) => sug.display?.includes(query));
//     callback(matches);
//   };

//   return (
//     <>
//       <label htmlFor={name}>{label}</label>
//       <MentionsInput
//         {...props}
//         id={name}
//         name={name}
//         value={value}
//         onChange={(e: any) => setValue(e.target.value)}
//         allowSuggestionsAboveCursor
//         style={MentionTextarea}
//         singleLine={singleLine}
//       >
//           <MentionMatch
//             trigger='@'
//             appendSpaceOnAdd
//             data={getMatches}
//             displayTransform={(id, display) => `${display}`}
//             markup='@{__id__}'
//           />
//       </MentionsInput>
//     </>
//   );
// };

// export const FormMentionTextArea = MakeMentionTextArea<'textarea'>(false);
// export const FormMentionInput = MakeMentionTextArea<'input'>(true);

// export default FormMentionInput;
