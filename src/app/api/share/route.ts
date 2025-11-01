import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

		const formattedLinks = shareLinks.map((link) => ({
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
