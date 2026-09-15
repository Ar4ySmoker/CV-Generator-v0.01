import type { NextAuthConfig } from "next-auth"

const protectedPrefixes = [
  "/dashboard",
  "/applications",
  "/offers",
  "/settings",
]

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = protectedPrefixes.some((p) =>
        nextUrl.pathname.startsWith(p)
      )
      if (isProtected) {
        return isLoggedIn
      }
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
