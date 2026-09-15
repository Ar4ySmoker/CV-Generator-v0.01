import {
  ClipboardList,
  FileDown,
  FileText,
  ListChecks,
  Target,
  UsersRound,
} from "lucide-react"

import { Generator } from "@/components/generator"
import { RegistrationCta } from "@/components/registration-cta"
import { Badge } from "@/components/ui/badge"

const FEATURES = [
  {
    icon: Target,
    title: "Адаптация под вакансию",
    text: "Вставьте текст или ссылку на вакансию — нейросеть перестроит ваш опыт под требования работодателя.",
  },
  {
    icon: FileDown,
    title: "Готовый DOCX · ATS-friendly",
    text: "Чистый документ Word без лишней вёрстки — корректно читается роботами-скринерами резюме.",
  },
  {
    icon: ClipboardList,
    title: "Трекер откликов",
    text: "Воронка этапов от отправки CV до офера: таймлайн, собеседования, заметки и сравнение оферов.",
  },
  {
    icon: UsersRound,
    title: "Ищите работу командой",
    text: "Делитесь вакансиями и опытом собеседований с друзьями — десятый из вас пройдёт туда, куда не прошёл первый.",
  },
]

const STEPS = [
  {
    icon: ListChecks,
    title: "Заполните данные",
    text: "Навыки, опыт, образование и проекты — один раз, либо из готового профиля.",
  },
  {
    icon: Target,
    title: "Добавьте вакансию",
    text: "Текст или ссылка. LLM подсветит релевантное и сформулирует сильные буллеты.",
  },
  {
    icon: FileText,
    title: "Скачайте CV и трекайте",
    text: "Готовый DOCX + воронка откликов, чтобы не потерять ни один этап найма.",
  },
]

export default function Page() {
  return (
    <main className="flex min-h-svh w-full flex-col">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-6 pt-12 pb-8 text-center sm:pt-16">
        <div className="flex items-center gap-2">
          <FileText className="size-6 text-primary" />
          <Badge variant="secondary">DOCX · ATS-friendly</Badge>
        </div>
        <h1 className="max-w-3xl font-heading text-3xl font-medium leading-tight sm:text-5xl">
          CV, заточенное под вакансию, и трекер откликов — в одном месте
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Нейросеть адаптирует ваш опыт под конкретную вакансию и соберёт готовый
          DOCX. А личный кабинет проведёт вас по всей воронке — от отправки до
          офера, и поможет делиться опытом с друзьями.
        </p>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-6 pb-12 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-5"
          >
            <f.icon className="size-5 text-primary" />
            <h3 className="font-heading text-lg font-medium">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {f.text}
            </p>
          </div>
        ))}
      </section>

      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
          <div className="flex flex-col gap-1 text-center">
            <h2 className="font-heading text-2xl font-medium">Как это работает</h2>
            <p className="text-sm text-muted-foreground">
              Три шага от пустого листа до офера.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-5"
              >
                <span className="text-xs font-medium text-primary">
                  Шаг {i + 1}
                </span>
                <s.icon className="size-5" />
                <h3 className="font-medium">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
        <RegistrationCta />

        <div id="generator" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 text-center">
            <h2 className="font-heading text-2xl font-medium">
              Соберите своё CV
            </h2>
            <p className="text-sm text-muted-foreground">
              Можно без регистрации — всё генерируется на лету.
            </p>
          </div>
          <Generator />
        </div>
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        CV генерируется нейросетью. Проверяйте факты перед отправкой.
      </footer>
    </main>
  )
}
