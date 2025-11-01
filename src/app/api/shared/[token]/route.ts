import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const { token } = await params;

		// Find the share link
		const shareLink = await prisma.shareLink.findUnique({
			where: { token },
			include: {
				note: {
					include: {
						author: {
							select: {
								name: true,
								email: true,
							},
						},
					},
				},
			},
		});

		if (!shareLink) {
			return NextResponse.json(
				{ message: "Share link not found" },
				{ status: 404 }
			);
		}

		// Check if the link has expired
		if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
			return NextResponse.json(
				{ message: "Share link has expired" },
				{ status: 410 }
			);
		}

		// Return the note data (without sensitive information)
		const { note } = shareLink;

		return NextResponse.json({
			id: note.id,
			title: note.title,
			content: note.content,
			author: note.author,
			createdAt: note.createdAt,
			updatedAt: note.updatedAt,
			lastEdited: note.lastEdited,
		});
	} catch (error) {
		console.error("Error fetching shared note:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
