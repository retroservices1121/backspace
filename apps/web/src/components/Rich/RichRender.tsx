// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createEditor, Descendant } from 'slate';
import { Editable, Slate, withReact } from 'slate-react';

import SmartContent from 'components/SmartContent';

import { Element, Leaf } from './CustomElements';
import { CustomEditor } from './CustomTypes';

type Props = {
  value: string;
};

const RichRender: React.FC<Props> = ({ value }) => {
  const renderElement = useCallback(props => <Element {...props} />, []);
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);
  const [renderValue, setRenderValue] = useState<Descendant[]>();
  
  // Singleton behavior internally
  const editorRef = useRef<CustomEditor>();
  if (!editorRef.current) editorRef.current = withReact(createEditor());
  //Double do to resolve ts error
  const editor = editorRef.current || withReact(createEditor());

  //Could be a stringify JSON or a heritage string
  useEffect(() => {
    try {
      const attemptJSON = JSON.parse(value);
      if (attemptJSON) {
        setRenderValue(attemptJSON);
      } else {
        setRenderValue(undefined);
      }
    } catch (error) {
      setRenderValue(undefined);
    }
  }, [value]);

  if (renderValue && Array.isArray(renderValue)) {
    return (
      <Slate
        editor={editor}
        value={renderValue}
      >
        <Editable
          readOnly
          style={{ width: '100%' }}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
        />
      </Slate>
    ); 
  } else {
    return (<SmartContent><span>{value}</span></SmartContent>);
  }
  
};

export default RichRender;