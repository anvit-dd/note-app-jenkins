"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { common, createLowlight } from "lowlight";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Bold,
	Italic,
	Strikethrough,
	Code,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	CheckSquare,
	ImageIcon,
	LinkIcon,
	Quote,
	Undo,
	Redo,
} from "lucide-react";
import { useEffect, useState } from "react";

interface TipTapEditorProps {
	content: string;
	onChange: (content: string) => void;
	placeholder?: string;
}

export function TipTapEditor({
	content,
	onChange,
	placeholder = "Start writing...",
}: TipTapEditorProps) {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		setIsMounted(true);
	}, []);

	const lowlight = createLowlight(common);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				codeBlock: false,
			}),
			Placeholder.configure({
				placeholder,
			}),
			CharacterCount,
			Image.configure({
				HTMLAttributes: {
					class: "rounded-lg max-w-full h-auto",
				},
			}),
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
			CodeBlockLowlight.configure({
				lowlight,
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-blue-500 underline",
				},
			}),
			TextStyle,
			Color,
			Highlight.configure({
				multicolor: true,
			}),
		],
		content,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class:
					"prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4",
			},
		},
		immediatelyRender: false,
	});

	if (!isMounted || !editor) {
		return (
			<div className="border rounded-lg p-4 min-h-[200px] bg-gray-50 dark:bg-gray-800">
				<div className="animate-pulse">
					<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
					<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
					<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
				</div>
			</div>
		);
	}

	const addImage = () => {
		const url = window.prompt("Image URL");
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	};

	const setLink = () => {
		const previousUrl = editor.getAttributes("link").href;
		const url = window.prompt("URL", previousUrl);

		if (url === null) {
			return;
		}

		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	};

	return (
		<div className="border rounded-lg">
			<div className="border-b p-2 flex flex-wrap gap-1">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={editor.isActive("bold") ? "bg-accent" : ""}>
					<Bold className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={editor.isActive("italic") ? "bg-accent" : ""}>
					<Italic className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleStrike().run()}
					className={editor.isActive("strike") ? "bg-accent" : ""}>
					<Strikethrough className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleCode().run()}
					className={editor.isActive("code") ? "bg-accent" : ""}>
					<Code className="h-4 w-4" />
				</Button>
				<Separator orientation="vertical" className="mx-1 h-6" />
				<Button
					variant="ghost"
					size="sm"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 1 }).run()
					}
					className={
						editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""
					}>
					<Heading1 className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					className={
						editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""
					}>
					<Heading2 className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
					className={
						editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""
					}>
					<Heading3 className="h-4 w-4" />
				</Button>
				<Separator orientation="vertical" className="mx-1 h-6" />
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					className={editor.isActive("bulletList") ? "bg-accent" : ""}>
					<List className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					className={editor.isActive("orderedList") ? "bg-accent" : ""}>
					<ListOrdered className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleTaskList().run()}
					className={editor.isActive("taskList") ? "bg-accent" : ""}>
					<CheckSquare className="h-4 w-4" />
				</Button>
				<Separator orientation="vertical" className="mx-1 h-6" />
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					className={editor.isActive("blockquote") ? "bg-accent" : ""}>
					<Quote className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleCodeBlock().run()}
					className={editor.isActive("codeBlock") ? "bg-accent" : ""}>
					<Code className="h-4 w-4" />
				</Button>
				<Separator orientation="vertical" className="mx-1 h-6" />
				<Button
					variant="ghost"
					size="sm"
					onClick={setLink}
					className={editor.isActive("link") ? "bg-accent" : ""}>
					<LinkIcon className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="sm" onClick={addImage}>
					<ImageIcon className="h-4 w-4" />
				</Button>
				<Separator orientation="vertical" className="mx-1 h-6" />
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}>
					<Undo className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}>
					<Redo className="h-4 w-4" />
				</Button>
			</div>
			<EditorContent editor={editor} className="min-h-[300px]" />
			<div className="border-t p-2 text-sm text-muted-foreground">
				{editor.storage.characterCount.characters()} characters
			</div>
		</div>
	);
}
