import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";

interface SharedNote {
	id: string;
	title: string;
	content: string;
	author: {
		name: string | null;
		email: string;
	};
	createdAt: string;
	updatedAt: string;
	lastEdited: string;
}

async function getSharedNote(token: string): Promise<SharedNote | null> {
	try {
		const response = await fetch(
			`${process.env.NEXTAUTH_URL}/api/shared/${token}`,
			{
				cache: "no-store", // Don't cache shared content
			}
		);

		if (!response.ok) {
			return null;
		}

		return await response.json();
	} catch (error) {
		console.error("Error fetching shared note:", error);
		return null;
	}
}

export default async function SharedNotePage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;
	const note = await getSharedNote(token);

	if (!note) {
		notFound();
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-2xl mb-2">{note.title}</CardTitle>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<User className="h-4 w-4" />
									{note.author.name || note.author.email}
								</div>
								<div className="flex items-center gap-1">
									<Calendar className="h-4 w-4" />
									Created {new Date(note.createdAt).toLocaleDateString()}
								</div>
								<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
									Shared
								</span>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div
						className="prose prose-sm max-w-none dark:prose-invert"
						dangerouslySetInnerHTML={{ __html: note.content }}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
