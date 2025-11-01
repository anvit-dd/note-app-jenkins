"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

export default function Register() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password, name }),
			});

			if (response.ok) {
				toast.success("Account created successfully! Please sign in.");
				router.push("/auth/signin");
			} else {
				const error = await response.json();
				toast.error(error.message || "Failed to create account");
			}
		} catch {
			toast.error("An error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Create Account</CardTitle>
					<CardDescription>Sign up to start creating notes</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label htmlFor="name" className="block text-sm font-medium mb-2">
								Name
							</label>
							<Input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Your name"
								required
							/>
						</div>
						<div>
							<label htmlFor="email" className="block text-sm font-medium mb-2">
								Email
							</label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="your@email.com"
								required
							/>
						</div>
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium mb-2">
								Password
							</label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Choose a password"
								required
								minLength={6}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Creating Account..." : "Create Account"}
						</Button>
					</form>
					<div className="mt-4 text-center text-sm">
						Already have an account?{" "}
						<Link href="/auth/signin" className="text-primary hover:underline">
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
