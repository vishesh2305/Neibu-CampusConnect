import {withAuth} from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: '/login',
    },
});

export const config = {
    matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/groups/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/search/:path*",
    "/admin/:path*",
    "/global-chat/:path*",
    "/post/:path*",
    ],
};