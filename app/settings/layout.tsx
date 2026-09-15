import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <SettingsNav />
      {children}
    </main>
  )
}

export const metadata = { title: "Настройки" }
