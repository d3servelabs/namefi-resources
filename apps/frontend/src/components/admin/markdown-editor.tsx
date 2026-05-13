'use client';

import { useEffect, useRef } from 'react';
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  tablePlugin,
  codeBlockPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  BlockTypeSelect,
  CodeToggle,
  InsertCodeBlock,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';

interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({
  markdown,
  onChange,
  placeholder = 'Enter your email content in Markdown...',
}: MarkdownEditorProps) {
  // MDXEditor's `markdown` prop is read-only after mount; treat it like a
  // textarea's `defaultValue`. When the parent updates the markdown
  // (e.g. the user edits in the Raw tab and switches back), push the new
  // value into the editor via the imperative `setMarkdown` method.
  const editorRef = useRef<MDXEditorMethods>(null);
  useEffect(() => {
    if (editorRef.current && editorRef.current.getMarkdown() !== markdown) {
      editorRef.current.setMarkdown(markdown);
    }
  }, [markdown]);

  return (
    <Tabs defaultValue="rich" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="rich">Rich Text Editor</TabsTrigger>
        <TabsTrigger value="raw">Raw Markdown</TabsTrigger>
      </TabsList>

      <TabsContent value="rich" className="mt-2">
        <div className="border rounded-lg overflow-hidden bg-white">
          <style jsx global>{`
            .mdxeditor {
              background-color: white !important;
              color: #1f2937 !important;
            }
            .mdxeditor .mdxeditor-toolbar {
              background-color: #f9fafb !important;
              border-bottom: 1px solid #e5e7eb !important;
            }
            .mdxeditor .mdxeditor-root-contenteditable {
              background-color: white !important;
              color: #1f2937 !important;
            }
            .mdxeditor [data-lexical-editor] {
              background-color: white !important;
              color: #1f2937 !important;
            }
          `}</style>
          <MDXEditor
            ref={editorRef}
            markdown={markdown}
            onChange={onChange}
            placeholder={placeholder}
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
              linkPlugin(),
              tablePlugin(),
              codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
              toolbarPlugin({
                toolbarContents: () => (
                  <>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <BlockTypeSelect />
                    <CreateLink />
                    <ListsToggle />
                    <InsertTable />
                    <InsertThematicBreak />
                    <CodeToggle />
                    <InsertCodeBlock />
                  </>
                ),
              }),
            ]}
            contentEditableClassName="prose max-w-none p-4 min-h-[200px] focus:outline-none bg-white text-gray-900"
          />
        </div>
      </TabsContent>

      <TabsContent value="raw" className="mt-2">
        <div className="border rounded-lg overflow-hidden bg-white">
          <Textarea
            value={markdown}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange(e.target.value)
            }
            placeholder={placeholder}
            rows={12}
            className="font-mono text-sm bg-white text-gray-900 border-0 focus:ring-0 focus:outline-none resize-none w-full p-4"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
