"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Users, Zap } from "lucide-react";

export default function Home() {
	const { status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "authenticated") {
			router.push("/dashboard");
		}
	}, [status, router]);

	if (status === "loading") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}

	if (status === "authenticated") {
		return null; // Will redirect
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="container mx-auto px-4 py-16">
				<div className="text-center mb-16">
					<h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
						Markdown Notes Platform
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
						Create, edit, and share beautiful Markdown notes with Notion-like
						UX. Collaborate, organize, and publish with ease.
					</p>
					<div className="flex gap-4 justify-center">
						<Button size="lg" asChild>
							<Link href="/auth/register">Get Started</Link>
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link href="/auth/signin">Sign In</Link>
						</Button>
					</div>
				</div>

				<div className="grid md:grid-cols-3 gap-8 mb-16">
					<div className="text-center">
						<FileText className="mx-auto h-12 w-12 text-blue-500 mb-4" />
						<h3 className="text-xl font-semibold mb-2">Rich Editor</h3>
						<p className="text-gray-600 dark:text-gray-300">
							Powerful Markdown editor with live preview, syntax highlighting,
							and embeds.
						</p>
					</div>
					<div className="text-center">
						<Users className="mx-auto h-12 w-12 text-green-500 mb-4" />
						<h3 className="text-xl font-semibold mb-2">Collaboration</h3>
						<p className="text-gray-600 dark:text-gray-300">
							Share notes with read-only links and collaborate with your team.
						</p>
					</div>
					<div className="text-center">
						<Zap className="mx-auto h-12 w-12 text-purple-500 mb-4" />
						<h3 className="text-xl font-semibold mb-2">Fast & Secure</h3>
						<p className="text-gray-600 dark:text-gray-300">
							Built with Next.js 16, secure authentication, and optimized
							performance.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
