import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateNoteSchema = z.object({
	title: z.string().min(1, "Title is required").optional(),
	content: z.string().optional(),
	published: z.boolean().optional(),
});

// GET /api/notes/[id] - Get a specific note
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		const note = await prisma.note.findFirst({
			where: {
				id: id,
				authorId: session.user.id,
			},
			select: {
				id: true,
				title: true,
				content: true,
				slug: true,
				published: true,
				createdAt: true,
				updatedAt: true,
				lastEdited: true,
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!note) {
			return NextResponse.json({ message: "Note not found" }, { status: 404 });
		}

		return NextResponse.json(note);
	} catch (error) {
		console.error("Error fetching note:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

// PUT /api/notes/[id] - Update a note
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const updateData = updateNoteSchema.parse(body);

		const { id } = await params;

		// Check if note exists and belongs to user
		const existingNote = await prisma.note.findFirst({
			where: {
				id: id,
				authorId: session.user.id,
			},
		});

		if (!existingNote) {
			return NextResponse.json({ message: "Note not found" }, { status: 404 });
		}

		// If title is being updated, regenerate slug if needed
		let slug = existingNote.slug;
		if (updateData.title && updateData.title !== existingNote.title) {
			const baseSlug = updateData.title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");

			let newSlug = baseSlug;
			let counter = 1;

			while (
				await prisma.note.findFirst({
					where: {
						slug: newSlug,
						id: { not: id }, // Exclude current note
					},
				})
			) {
				newSlug = `${baseSlug}-${counter}`;
				counter++;
			}
			slug = newSlug;
		}

		const note = await prisma.note.update({
			where: {
				id: id,
			},
			data: {
				...updateData,
				slug,
				lastEdited: new Date(),
			},
			select: {
				id: true,
				title: true,
				content: true,
				slug: true,
				published: true,
				createdAt: true,
				updatedAt: true,
				lastEdited: true,
			},
		});

		return NextResponse.json(note);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ message: "Validation error", errors: error.issues },
				{ status: 400 }
			);
		}

		console.error("Error updating note:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}

// DELETE /api/notes/[id] - Delete a note
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

		// Check if note exists and belongs to user
		const existingNote = await prisma.note.findFirst({
			where: {
				id: id,
				authorId: session.user.id,
			},
		});

		if (!existingNote) {
			return NextResponse.json({ message: "Note not found" }, { status: 404 });
		}

		await prisma.note.delete({
			where: {
				id: id,
			},
		});

		return NextResponse.json({ message: "Note deleted successfully" });
	} catch (error) {
		console.error("Error deleting note:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
