import { FileText } from "lucide-react"

import { AuthNav } from "@/components/auth/auth-nav"
import { Generator } from "@/components/generator"
import { Badge } from "@/components/ui/badge"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex justify-end">
        <AuthNav />
      </div>
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <FileText className="size-6 text-primary" />
          <Badge variant="secondary">DOCX · ATS-friendly</Badge>
        </div>
        <h1 className="font-heading text-3xl font-medium sm:text-4xl">
          Онлайн-генератор CV
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Заполните данные — получите готовое CV в формате DOCX, адаптированное
          под вакансию. Без регистрации, всё на лету.
        </p>
      </header>

      <Generator />

      <footer className="text-center text-xs text-muted-foreground">
        CV генерируется нейросетью. Проверяйте факты перед отправкой.
      </footer>
    </main>
  )
}
