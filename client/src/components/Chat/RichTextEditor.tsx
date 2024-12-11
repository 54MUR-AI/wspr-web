import React, { useCallback, useEffect, useState } from 'react';
import { createEditor, BaseEditor, Descendant, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import {
  Bold,
  Italic,
  Underline,
  Code,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
} from 'lucide-react';
import isHotkey from 'is-hotkey';
import { errorService } from '../../services/error.service';

type CustomElement = {
  type: 'paragraph' | 'code' | 'quote' | 'list-item' | 'ordered-list' | 'link';
  url?: string;
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface RichTextEditorProps {
  onChange: (value: string) => void;
  placeholder?: string;
  initialValue?: string;
  onSubmit?: () => void;
}

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['ordered-list', 'list-item'];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onChange,
  placeholder,
  initialValue = '',
  onSubmit,
}) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />;
      case 'quote':
        return <QuoteElement {...props} />;
      case 'list-item':
        return <ListItemElement {...props} />;
      case 'ordered-list':
        return <OrderedListElement {...props} />;
      case 'link':
        return <LinkElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: any) => {
    return <Leaf {...props} />;
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    try {
      for (const hotkey in HOTKEYS) {
        if (isHotkey(hotkey, event as any)) {
          event.preventDefault();
          const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
          toggleMark(editor, mark);
        }
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        onSubmit?.();
      }
    } catch (error) {
      errorService.handleError(error, 'EDITOR_KEYDOWN_FAILED', 'low');
    }
  };

  const toggleBlock = (format: string) => {
    try {
      const isActive = isBlockActive(editor, format);
      const isList = LIST_TYPES.includes(format);

      if (isList) {
        // Handle list conversion
      } else {
        // Handle block conversion
      }
    } catch (error) {
      errorService.handleError(error, 'TOGGLE_BLOCK_FAILED', 'low');
    }
  };

  const toggleMark = (editor: ReactEditor, format: string) => {
    try {
      const isActive = isMarkActive(editor, format);
      if (isActive) {
        editor.removeMark(format);
      } else {
        editor.addMark(format, true);
      }
    } catch (error) {
      errorService.handleError(error, 'TOGGLE_MARK_FAILED', 'low');
    }
  };

  const isBlockActive = (editor: ReactEditor, format: string) => {
    try {
      const [match] = Array.from(
        Editor.nodes(editor, {
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
        })
      );
      return !!match;
    } catch (error) {
      errorService.handleError(error, 'CHECK_BLOCK_ACTIVE_FAILED', 'low');
      return false;
    }
  };

  const isMarkActive = (editor: ReactEditor, format: string) => {
    try {
      const marks = Editor.marks(editor);
      return marks ? marks[format as keyof typeof marks] === true : false;
    } catch (error) {
      errorService.handleError(error, 'CHECK_MARK_ACTIVE_FAILED', 'low');
      return false;
    }
  };

  return (
    <div className="border rounded-lg bg-white">
      <Slate
        editor={editor}
        value={initialValue ? JSON.parse(initialValue) : [{ type: 'paragraph', children: [{ text: '' }] }]}
        onChange={value => {
          const isAstChange = editor.operations.some(op => op.type !== 'set_selection');
          if (isAstChange) {
            onChange(JSON.stringify(value));
          }
        }}
      >
        <div className="flex items-center gap-1 p-2 border-b">
          <ToolbarButton
            format="bold"
            icon={<Bold className="w-4 h-4" />}
            onClick={() => toggleMark(editor, 'bold')}
          />
          <ToolbarButton
            format="italic"
            icon={<Italic className="w-4 h-4" />}
            onClick={() => toggleMark(editor, 'italic')}
          />
          <ToolbarButton
            format="underline"
            icon={<Underline className="w-4 h-4" />}
            onClick={() => toggleMark(editor, 'underline')}
          />
          <ToolbarButton
            format="code"
            icon={<Code className="w-4 h-4" />}
            onClick={() => toggleBlock('code')}
          />
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <ToolbarButton
            format="list-item"
            icon={<List className="w-4 h-4" />}
            onClick={() => toggleBlock('list-item')}
          />
          <ToolbarButton
            format="ordered-list"
            icon={<ListOrdered className="w-4 h-4" />}
            onClick={() => toggleBlock('ordered-list')}
          />
          <ToolbarButton
            format="quote"
            icon={<Quote className="w-4 h-4" />}
            onClick={() => toggleBlock('quote')}
          />
          <ToolbarButton
            format="link"
            icon={<Link className="w-4 h-4" />}
            onClick={() => setShowLinkInput(true)}
          />
        </div>

        {showLinkInput && (
          <div className="p-2 border-b">
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="w-full px-2 py-1 border rounded"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Insert link
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
            />
          </div>
        )}

        <Editable
          className="p-2 min-h-[100px] focus:outline-none"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          spellCheck
        />
      </Slate>
    </div>
  );
};

const ToolbarButton: React.FC<{
  format: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ format, icon, onClick }) => {
  return (
    <button
      className="p-1 hover:bg-gray-100 rounded transition-colors"
      onMouseDown={e => {
        e.preventDefault();
        onClick();
      }}
      title={format.charAt(0).toUpperCase() + format.slice(1)}
    >
      {icon}
    </button>
  );
};

const DefaultElement = (props: any) => <p {...props.attributes}>{props.children}</p>;
const CodeElement = (props: any) => (
  <pre {...props.attributes} className="bg-gray-100 p-2 rounded">
    <code>{props.children}</code>
  </pre>
);
const QuoteElement = (props: any) => (
  <blockquote
    {...props.attributes}
    className="border-l-4 border-gray-200 pl-4 italic"
  >
    {props.children}
  </blockquote>
);
const ListItemElement = (props: any) => (
  <li {...props.attributes}>{props.children}</li>
);
const OrderedListElement = (props: any) => (
  <ol {...props.attributes} className="list-decimal pl-6">
    {props.children}
  </ol>
);
const LinkElement = (props: any) => (
  <a
    {...props.attributes}
    href={props.element.url}
    className="text-blue-500 hover:underline"
  >
    {props.children}
  </a>
);
const Leaf = (props: any) => {
  let { attributes, children, leaf } = props;

  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.code) {
    children = <code className="bg-gray-100 px-1 rounded">{children}</code>;
  }

  return <span {...attributes}>{children}</span>;
};
