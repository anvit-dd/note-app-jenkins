"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { User, LogOut, Settings } from "lucide-react";

export function Header() {
	const { data: session } = useSession();

	return (
		<header className="border-b">
			<div className="container flex h-16 items-center justify-between px-4">
				<div className="flex items-center space-x-4">
					<Link href="/dashboard" className="font-bold text-xl">
						Notes App
					</Link>
				</div>

				<div className="flex items-center space-x-4">
					<ModeToggle />

					{session ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative h-8 w-8 rounded-full">
									<User className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end" forceMount>
								<div className="flex items-center justify-start gap-2 p-2">
									<div className="flex flex-col space-y-1 leading-none">
										<p className="font-medium">
											{session.user?.name || session.user?.email}
										</p>
										<p className="w-[200px] truncate text-sm text-muted-foreground">
											{session.user?.email}
										</p>
									</div>
								</div>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link href="/settings">
										<Settings className="mr-2 h-4 w-4" />
										Settings
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => signOut()}>
									<LogOut className="mr-2 h-4 w-4" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button asChild>
							<Link href="/auth/signin">Sign In</Link>
						</Button>
					)}
				</div>
			</div>
		</header>
	);
}
