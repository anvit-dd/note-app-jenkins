import { withAuth } from "next-auth/middleware";

export default withAuth(
	function middleware() {
		// Add custom logic here
	},
	{
		callbacks: {
			authorized: ({ token }) => !!token,
		},
	}
);

export const config = { matcher: ["/dashboard/:path*", "/editor/:path*"] };
