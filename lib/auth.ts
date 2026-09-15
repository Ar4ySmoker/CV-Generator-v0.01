import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { authConfig } from "./auth.config"
import { connectDb } from "./db"
import { User } from "./models/user"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        await connectDb()

        const user = await User.findOne({
          email: parsed.data.email.toLowerCase(),
        })
        if (!user) {
          return null
        }

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!ok) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || null,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
})
