import NextAuth from "next-auth"

import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vacancies/:path*",
    "/telegram/:path*",
    "/applications/:path*",
    "/offers/:path*",
    "/contacts/:path*",
    "/teams/:path*",
    "/settings/:path*",
  ],
}
