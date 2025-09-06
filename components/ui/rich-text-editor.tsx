"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  className,
  editable = true,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          "min-h-[120px] w-full",
          "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground",
          "prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground",
          "prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline",
          className
        ),
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Show loading state during SSR or before editor is ready
  if (!isMounted || !editor) {
    // For read-only mode, show plain text during SSR
    if (!editable && content) {
      return (
        <div
          className={cn("prose prose-sm max-w-none prose-invert", className)}
        >
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );
    }

    // For editable mode, show loading skeleton
    return (
      <div className={cn("w-full", className)}>
        <div className="flex flex-wrap items-center gap-1 border border-input rounded-t-md bg-muted/50 p-2">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        </div>
        <div className="border border-t-0 border-input rounded-b-md bg-background">
          <div className="min-h-[200px] p-4 bg-muted/20 animate-pulse rounded-b-md" />
        </div>
      </div>
    );
  }

  if (!editable) {
    return (
      <div className={cn("prose prose-sm max-w-none prose-invert", className)}>
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border border-input rounded-t-md bg-muted/50 p-2">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("underline")}
            onPressedChange={() =>
              editor.chain().focus().toggleUnderline().run()
            }
            aria-label="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            aria-label="Bullet List"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            aria-label="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
            aria-label="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
            aria-label="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
            aria-label="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Link */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("link") ? "bg-accent" : ""
            )}
            aria-label="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="border border-t-0 border-input rounded-b-md bg-background">
        <EditorContent
          editor={editor}
          className="min-h-[200px] [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-4 [&_.ProseMirror]:text-foreground"
        />
      </div>
    </div>
  );
}

export default RichTextEditor;
