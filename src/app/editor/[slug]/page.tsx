"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import {
	Save,
	Eye,
	ArrowLeft,
	Loader2,
	Share2,
	Copy,
	Check,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Note {
	id: string;
	title: string;
	content: string;
	slug: string;
	published: boolean;
}

export default function EditorPage() {
	const params = useParams();
	const router = useRouter();
	const slug = params.slug as string;

	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [isPublished, setIsPublished] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [noteId, setNoteId] = useState<string | null>(null);
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [shareLink, setShareLink] = useState<string | null>(null);
	const [isCreatingShare, setIsCreatingShare] = useState(false);
	const [copied, setCopied] = useState(false);

	const loadNote = useCallback(
		async (noteSlug: string) => {
			try {
				setIsLoading(true);
				const response = await fetch(`/api/notes/${noteSlug}`);

				if (response.ok) {
					const note: Note = await response.json();
					setTitle(note.title);
					setContent(note.content);
					setIsPublished(note.published);
					setNoteId(note.id);
				} else {
					toast.error("Failed to load note");
					router.push("/dashboard");
				}
			} catch (error) {
				console.error("Error loading note:", error);
				toast.error("Failed to load note");
				router.push("/dashboard");
			} finally {
				setIsLoading(false);
			}
		},
		[router]
	);

	// Load existing note if editing
	useEffect(() => {
		if (slug !== "new") {
			loadNote(slug);
		}
	}, [slug, loadNote]);

	const handleSave = async () => {
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}

		try {
			setIsSaving(true);

			const noteData = {
				title: title.trim(),
				content,
				published: isPublished,
			};

			let response;
			if (noteId) {
				// Update existing note
				response = await fetch(`/api/notes/${noteId}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(noteData),
				});
			} else {
				// Create new note
				response = await fetch("/api/notes", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(noteData),
				});
			}

			if (response.ok) {
				const savedNote: Note = await response.json();
				toast.success("Note saved successfully!");
				setNoteId(savedNote.id);

				// Redirect to dashboard for new notes
				if (!noteId) {
					router.push("/dashboard");
				}
			} else {
				const error = await response.json();
				toast.error(error.message || "Failed to save note");
			}
		} catch (error) {
			console.error("Error saving note:", error);
			toast.error("Failed to save note");
		} finally {
			setIsSaving(false);
		}
	};

	const handlePublish = async () => {
		setIsPublished(true);
		await handleSave();
	};

	const handleCreateShareLink = async () => {
		if (!noteId) {
			toast.error("Please save the note first");
			return;
		}

		try {
			setIsCreatingShare(true);
			const response = await fetch(`/api/notes/${noteId}/share`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ noteId }),
			});

			if (response.ok) {
				const data = await response.json();
				setShareLink(data.shareUrl);
				setShareDialogOpen(true);
				toast.success("Share link created!");
			} else {
				const error = await response.json();
				toast.error(error.message || "Failed to create share link");
			}
		} catch (error) {
			console.error("Error creating share link:", error);
			toast.error("Failed to create share link");
		} finally {
			setIsCreatingShare(false);
		}
	};

	const handleCopyLink = async () => {
		if (!shareLink) return;

		try {
			await navigator.clipboard.writeText(shareLink);
			setCopied(true);
			toast.success("Link copied to clipboard!");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy link");
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="flex items-center justify-center min-h-[400px]">
					<Loader2 className="h-8 w-8 animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<div className="flex items-center gap-4 mb-8">
				<Button variant="ghost" size="sm" asChild>
					<Link href="/dashboard">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Dashboard
					</Link>
				</Button>
				<div className="flex-1" />
				<Button variant="outline" size="sm" asChild>
					<Link href={noteId ? `/notes/${noteId}` : "#"}>
						<Eye className="mr-2 h-4 w-4" />
						Preview
					</Link>
				</Button>
				<Button onClick={handleSave} disabled={isSaving}>
					{isSaving ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					{isSaving ? "Saving..." : "Save"}
				</Button>
				<Button onClick={handlePublish} disabled={isSaving || isPublished}>
					{isPublished ? "Published" : "Publish"}
				</Button>
				<Button
					variant="outline"
					onClick={handleCreateShareLink}
					disabled={isCreatingShare || !noteId}>
					{isCreatingShare ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Share2 className="mr-2 h-4 w-4" />
					)}
					{isCreatingShare ? "Creating..." : "Share"}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Note Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label htmlFor="title" className="block text-sm font-medium mb-2">
							Title
						</label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter note title..."
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">Content</label>
						<TipTapEditor
							content={content}
							onChange={setContent}
							placeholder="Start writing your note..."
						/>
					</div>
				</CardContent>
			</Card>

			<Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Share Note</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Anyone with this link can view your note. Share it carefully.
						</p>
						{shareLink && (
							<div className="flex gap-2">
								<Input value={shareLink} readOnly className="flex-1" />
								<Button onClick={handleCopyLink} variant="outline">
									{copied ? (
										<Check className="h-4 w-4" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
