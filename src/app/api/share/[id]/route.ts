import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const linkId = params.id;

		// Find the share link and verify ownership
		const shareLink = await prisma.shareLink.findFirst({
			where: {
				id: linkId,
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
			where: { id: linkId },
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
