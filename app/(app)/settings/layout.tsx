import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <SettingsNav />
      {children}
    </div>
  )
}

export const metadata = { title: "Настройки" }
