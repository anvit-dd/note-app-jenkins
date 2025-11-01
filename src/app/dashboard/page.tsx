"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Plus,
	Search,
	FileText,
	Loader2,
	ExternalLink,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Note {
	id: string;
	title: string;
	content: string;
	slug: string;
	published: boolean;
	updatedAt: string;
}

interface ShareLink {
	id: string;
	token: string;
	expiresAt: string | null;
	shareUrl: string;
	note: {
		id: string;
		title: string;
		slug: string;
		published: boolean;
	};
	createdAt: string;
}

export default function Dashboard() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
	const [showShares, setShowShares] = useState(false);

	useEffect(() => {
		fetchNotes();
	}, []);

	const fetchNotes = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/notes");

			if (response.ok) {
				const notesData = await response.json();
				setNotes(notesData);
			} else {
				toast.error("Failed to load notes");
			}
		} catch (error) {
			console.error("Error fetching notes:", error);
			toast.error("Failed to load notes");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchShareLinks = async () => {
		try {
			const response = await fetch("/api/share");

			if (response.ok) {
				const linksData = await response.json();
				setShareLinks(Array.isArray(linksData) ? linksData : []);
			} else {
				toast.error("Failed to load share links");
				setShareLinks([]);
			}
		} catch (error) {
			console.error("Error fetching share links:", error);
			toast.error("Failed to load share links");
			setShareLinks([]);
		}
	};

	const handleDeleteShareLink = async (linkId: string) => {
		try {
			const response = await fetch(`/api/share/${linkId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Share link deleted");
				fetchShareLinks(); // Refresh the list
			} else {
				toast.error("Failed to delete share link");
			}
		} catch (error) {
			console.error("Error deleting share link:", error);
			toast.error("Failed to delete share link");
		}
	};

	const filteredNotes = notes.filter(
		(note) =>
			note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			note.content.toLowerCase().includes(searchQuery.toLowerCase())
	);

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-center min-h-[400px]">
					<Loader2 className="h-8 w-8 animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-3xl font-bold">My Notes</h1>
				<Button asChild>
					<Link href="/editor/new">
						<Plus className="mr-2 h-4 w-4" />
						New Note
					</Link>
				</Button>
			</div>

			<div className="mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
					<Input
						placeholder="Search notes..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filteredNotes.map((note) => (
					<Card key={note.id} className="hover:shadow-md transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								{note.title}
							</CardTitle>
							<CardDescription>
								{note.published ? "Published" : "Draft"} • Updated{" "}
								{new Date(note.updatedAt).toLocaleDateString()}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground line-clamp-3">
								{note.content.replace(/<[^>]*>/g, "")}
							</p>
							<div className="mt-4 flex gap-2">
								<Button variant="outline" size="sm" asChild>
									<Link href={`/editor/${note.slug}`}>Edit</Link>
								</Button>
								{note.published && (
									<Button variant="outline" size="sm" asChild>
										<Link href={`/notes/${note.slug}`}>View</Link>
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Share Links Section */}
			<div className="mt-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">Share Links</h2>
					<Button
						variant="outline"
						onClick={() => {
							setShowShares(!showShares);
							if (!showShares && shareLinks.length === 0) {
								fetchShareLinks();
							}
						}}>
						{showShares ? "Hide" : "Show"} Share Links
					</Button>
				</div>

				{showShares && (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{Array.isArray(shareLinks) &&
							shareLinks.map((link) => (
								<Card
									key={link.id}
									className="hover:shadow-md transition-shadow">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<ExternalLink className="h-5 w-5" />
											{link.note.title}
										</CardTitle>
										<CardDescription>
											Created {new Date(link.createdAt).toLocaleDateString()}
											{link.expiresAt && (
												<span className="ml-2">
													• Expires{" "}
													{new Date(link.expiresAt).toLocaleDateString()}
												</span>
											)}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => window.open(link.shareUrl, "_blank")}>
												<ExternalLink className="mr-2 h-4 w-4" />
												Open
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													navigator.clipboard.writeText(link.shareUrl);
													toast.success("Link copied!");
												}}>
												Copy
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDeleteShareLink(link.id)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						{(!Array.isArray(shareLinks) || shareLinks.length === 0) && (
							<div className="col-span-full text-center py-8">
								<p className="text-muted-foreground">
									No share links created yet.
								</p>
							</div>
						)}
					</div>
				)}
			</div>

			{filteredNotes.length === 0 && (
				<div className="text-center py-12">
					<FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium mb-2">No notes found</h3>
					<p className="text-muted-foreground mb-4">
						{searchQuery
							? "Try adjusting your search terms."
							: "Create your first note to get started."}
					</p>
					<Button asChild>
						<Link href="/editor/new">
							<Plus className="mr-2 h-4 w-4" />
							Create Note
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
