import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";

const createShareSchema = z.object({
	noteId: z.string(),
	expiresAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { noteId, expiresAt } = createShareSchema.parse(body);

		// Verify the user owns the note
		const note = await prisma.note.findFirst({
			where: {
				id: noteId,
				authorId: session.user.id,
			},
		});

		if (!note) {
			return NextResponse.json(
				{ message: "Note not found or access denied" },
				{ status: 404 }
			);
		}

		// Generate a unique token
		const token = randomBytes(32).toString("hex");

		// Create the share link
		const shareLink = await prisma.shareLink.create({
			data: {
				noteId,
				token,
				expiresAt: expiresAt ? new Date(expiresAt) : null,
				createdBy: session.user.id,
			},
			include: {
				note: {
					select: {
						title: true,
						slug: true,
					},
				},
			},
		});

		return NextResponse.json({
			id: shareLink.id,
			token: shareLink.token,
			expiresAt: shareLink.expiresAt,
			note: shareLink.note,
			shareUrl: `${process.env.NEXTAUTH_URL}/shared/${shareLink.token}`,
		});
	} catch (error) {
		console.error("Error creating share link:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ message: "Invalid input", errors: error.issues },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		// Get all share links created by the user
		const shareLinks = await prisma.shareLink.findMany({
			where: {
				createdBy: session.user.id,
			},
			include: {
				note: {
					select: {
						id: true,
						title: true,
						slug: true,
						published: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		const formattedLinks = shareLinks.map((link: typeof shareLinks[number]) => ({
			id: link.id,
			token: link.token,
			expiresAt: link.expiresAt,
			shareUrl: `${process.env.NEXTAUTH_URL}/shared/${link.token}`,
			note: link.note,
			createdAt: link.createdAt,
		}));

		return NextResponse.json(formattedLinks);
	} catch (error) {
		console.error("Error fetching share links:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Find and verify ownership of the share link
		const shareLink = await prisma.shareLink.findFirst({
			where: {
				id: id,
				createdBy: session.user.id,
			},
		});

		if (!shareLink) {
			return NextResponse.json(
				{ message: "Share link not found or access denied" },
				{ status: 404 }
			);
		}

		// Delete the share link
		await prisma.shareLink.delete({
			where: { id: id },
		});

		return NextResponse.json({ message: "Share link deleted successfully" });
	} catch (error) {
		console.error("Error deleting share link:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
