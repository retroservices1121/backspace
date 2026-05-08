import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Icons from 'icons';
import isHotkey from 'is-hotkey';
import { createEditor, Descendant, Editor, Element as SlateElement, Range, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import {
  ReactEditor,
  Slate,
  withReact,
} from 'slate-react';
import { useTheme } from 'styled-components';

import { RootState } from 'store/store';

import { Element, Leaf } from './CustomElements';
import { CustomEditor } from './CustomTypes';
import { withLinks } from './Links';
import { insertMention, Portal, withMentions } from './Mentions';
import { withShortcuts } from './Shortcuts';
import { Counter, SlateInput } from './styled';
const MARK_HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
};
const BLOCK_HOTKEYS = {
  'mod+\'': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];


type RichProps = {
  onSubmit: (value: Descendant[]) => boolean;
  onChange: (value: Descendant[]) => void;
  send?: boolean;
  maxMessageLength?: number;
  initialValue?: Descendant[];
  placeholder?: string;
  maxHeight?: number;
  placeholderText?: string;
};

const blankInitial: Descendant[] = [
  { type: 'paragraph', children: [{ text: '' }] },
];


const RichInput = ({ onSubmit, onChange, initialValue = blankInitial, maxHeight, placeholderText = 'Type a message...', maxMessageLength = 12_000, send = false }: RichProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState<Range | undefined>();
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [messageLength, setMessageLength] = useState(0);
  const { followedUsers } = useSelector((state: RootState) => state.feed);
  const { members } = useSelector((state: RootState) => state.community);
  const [ suggestions, setSuggestions ] = useState<string[]>(followedUsers.map((user) => user.username));
  const theme = useTheme();
  const renderElement = useCallback(props => <Element {...props} />, []);
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);
  

  // Singleton behavior internally
  const editorRef = useRef<CustomEditor>();
  if (!editorRef.current) editorRef.current = withShortcuts(withLinks(withMentions(withReact(withHistory(createEditor())))));
  //Double do to resolve ts error
  const editor = editorRef.current || withShortcuts(withLinks(withMentions(withReact(withHistory(createEditor())))));
    
  //** ##### FORMATTING #### */

  const isMarkActive = (myEditor : CustomEditor, format: string) => {
    const marks = Editor.marks(myEditor);
    //@ts-ignore
    return marks ? marks[format] === true : false;
  };

  const toggleMark = (myEditor : CustomEditor, format: string) => {
    const isActive = isMarkActive(myEditor, format);

    if (isActive) {
      Editor.removeMark(myEditor, format);
    } else {
      Editor.addMark(myEditor, format, true);
    }
  };
  const isBlockActive = (myEditor : CustomEditor, format: string, blockType = 'type') => {
    const { selection } = myEditor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(myEditor, {
        at: Editor.unhangRange(myEditor, selection),
        match: n =>
          !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        //@ts-ignore
        n[blockType] === format,
      }),
    );

    return !!match;
  };

  const toggleBlock = (myEditor : CustomEditor, format: string) => {
    const isActive = isBlockActive(
      myEditor,
      format,
      TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type',
    );
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(myEditor, {
      match: n =>
        !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
      split: true,
    });
    let newProperties: Partial<SlateElement>;
    if (TEXT_ALIGN_TYPES.includes(format)) {
      newProperties = {
        align: isActive ? undefined : format,
      };
    } else {
      newProperties = {
      //@ts-ignore
        type: isActive ? 'paragraph' : isList ? 'list-item' : format,
      };
    }
    Transforms.setNodes<SlateElement>(myEditor, newProperties);

    if (!isActive && isList) {
      const block = { type: format, children: [{ text: '' }] };
      //@ts-ignore
      Transforms.wrapNodes(myEditor, block);
    }
  };
  //** ##### END FORMATTING #### */
  const handleSubmit = () => {
    if (!send) return null;
    const stringLength = (Editor.string(editor, []).trim()).length;
    const currentValue = editor.children;
    const isInitial = JSON.stringify(blankInitial) === JSON.stringify(currentValue); 
    console.log(currentValue);
    let submitted = false;
    if (stringLength === 0 && isInitial) {
      submitted = onSubmit([]);
    } else {
      submitted = onSubmit(editor.children);
    }
    if (submitted) { //If parent accepted the submission
      // Clear Editor
      Transforms.delete(editor, {
        at: {
          anchor: Editor.start(editor, []),
          focus: Editor.end(editor, []),
        },
      });
    } else {
      return null;
    }
  };

  //TODO have this search the db for more usernames
  useEffect(() => {
    setSuggestions(() => {
      const temp = members?.map((user) => {
        return user.user.username;
      }) || [];
      const followTemp = followedUsers.map((user) => {
        return user.username;
      });
      return [...temp, ...followTemp];
    });
  }, [followedUsers, members]);



  const focusInput = () => {
    Transforms.select(editor, Editor.end(editor, []));
  };

  const chars = suggestions.filter(c =>
    c.toLowerCase().startsWith(search.toLowerCase()),
  ).slice(0, 10);

  const onKeyDown = useCallback(
    event => {
      if (target) { // if in the middle of an @mention
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            const prevIndex = index >= chars.length - 1 ? 0 : index + 1;
            setIndex(prevIndex);
            break;
          case 'ArrowUp':
            event.preventDefault();
            const nextIndex = index <= 0 ? chars.length - 1 : index - 1;
            setIndex(nextIndex);
            break;
          // Insert Mention
          case ' ':
          case 'Tab':
          case 'Enter':
            event.preventDefault();
            Transforms.select(editor, target);
            insertMention(editor, chars[index] || search);
            setTarget(undefined);
            focusInput();
            break;
          case 'Escape':
            event.preventDefault();
            setTarget(undefined);
            break;
        }
      } else { // not in an @mention
        //Handle styling (bold, italics, etc.)
        for (const hotkey in MARK_HOTKEYS) {
          if (isHotkey(hotkey, event as any)) {
            event.preventDefault();
            //@ts-ignore
            const mark = MARK_HOTKEYS[hotkey];
            toggleMark(editor, mark);
          }
        }
        for (const hotkey in BLOCK_HOTKEYS) {
          if (isHotkey(hotkey, event as any)) {
            event.preventDefault();
            //@ts-ignore
            const block = BLOCK_HOTKEYS[hotkey];
            toggleBlock(editor, block);
          }
        }
        switch (event.key) {
          case 'Enter':
            if (event.shiftKey === false) {
              event.preventDefault();
              handleSubmit();
            // Prevent newline from trigging new paragraph when in code
            } else if (event.shiftKey && isMarkActive(editor, 'code')) {
              event.preventDefault();
              editor.insertText('\n');
            }
            break;
        }
      }
    },
    [index, search, target],
  );

  useEffect(() => {
    if (target && chars.length > 0) {
      const el = ref.current;
      const domRange = ReactEditor.toDOMRange(editor, target);
      const rect = domRange.getBoundingClientRect();
      if (el?.style) {
        el.style.top = `${rect.top + window.pageYOffset + 24}px`;
        el.style.left = `${rect.left + window.pageXOffset}px`;
      }
    }
  }, [chars.length, editor, index, search, target]);

  return (
    <>
      <Slate
        editor={editor}
        value={initialValue}
        onChange={(value) => {
          const { selection } = editor;
          //Setting message length in here so we don't query it before editor is up
          setMessageLength(Editor.string(editor, []).length);
          if (selection && Range.isCollapsed(selection)) {
            /**Mentions */
            const [start] = Range.edges(selection);
            const wordBefore = Editor.before(editor, start, { unit: 'word' });
            const before = wordBefore && Editor.before(editor, wordBefore);
            const beforeRange = before && Editor.range(editor, before, start);
            const beforeText = beforeRange && Editor.string(editor, beforeRange).trim();
            const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/);
            const after = Editor.after(editor, start);
            const afterRange = Editor.range(editor, start, after);
            const afterText = Editor.string(editor, afterRange).trim();
            const afterMatch = afterText.match(/^(\s|$)/);

            if (beforeMatch && afterMatch) {
              setTarget(beforeRange);
              setSearch(beforeMatch[1]);
              setIndex(0);
              return;
            }
          }
          onChange(value);
          setTarget(undefined);
        }}
      >
        <SlateInput
          $maxHeight={maxHeight}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
          placeholder={placeholderText}
        />
        {target && chars.length > 0 && (
          <Portal>
            <div
              ref={ref}
              style={{
                top: '-9999px',
                left: '-9999px',
                marginTop: `${-25 * (chars.length + 1)}px`,
                position: 'absolute',
                zIndex: 1,
                padding: '3px',
                background: theme.backgroundLight,
                borderRadius: '4px',
                boxShadow: '0 1px 5px rgba(0,0,0,.2)',
              }}
              data-cy="mentions-portal"
            >
              {chars.map((char, i) => (
                <div
                  key={char}
                  style={{
                    padding: '1px 3px',
                    borderRadius: '3px',
                    background: i === index ? theme.primary : 'transparent',
                  }}
                >
                  <span 
                    onClick={() => {
                      Transforms.select(editor, target); 
                      insertMention(editor, char);
                    }}
                  >{char}</span>
                </div>
              ))}
            </div>
          </Portal>
        )}
      </Slate>
      {messageLength > maxMessageLength &&
      <Counter>- {messageLength - maxMessageLength}</Counter>
      }
      {send && (
        <Icons.Send 
          clickable
          margin='8px'
          allowFill={false}
          active={ messageLength > 0 } 
          onClick={() => handleSubmit()}
        />
      )}
      
    </>
  );
};

export default RichInput;