import { auth } from "@/lib/auth"

export default auth((req) => {
  const isAuth = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/dashboard")

  if (isAuthPage && !isAuth) {
    return Response.redirect(new URL("/api/auth/signin", req.url))
  }
})

export const config = {
  matcher: ["/dashboard/:path*"],
}
