"use client"

import { useState } from "react"
import { Mail, Plus, Send, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { CompanyLogo } from "./company-logo"
import type { ContactItem } from "./types"
import { telegramUrl } from "@/lib/format"

export function ContactPicker({
  contacts,
  selectedIds,
  onToggle,
  onCreate,
}: {
  contacts: ContactItem[]
  selectedIds: string[]
  onToggle: (contactId: string) => void
  onCreate: (data: {
    name: string
    email?: string
    phone?: string
    telegram?: string
    linkedin?: string
    company?: string
    role?: string
  }) => Promise<ContactItem | null>
}) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    telegram: "",
    linkedin: "",
    company: "",
    role: "",
  })

  const linked = contacts.filter((c) => selectedIds.includes(c.id))
  const unlinked = contacts.filter((c) => !selectedIds.includes(c.id))

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function create() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const contact = await onCreate({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        telegram: form.telegram.trim() || undefined,
        linkedin: form.linkedin.trim() || undefined,
        company: form.company.trim() || undefined,
        role: form.role.trim() || undefined,
      })
      if (contact) {
        onToggle(contact.id)
        setForm({ name: "", email: "", phone: "", telegram: "", linkedin: "", company: "", role: "" })
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {linked.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Контактов пока нет. Добавьте рекрутера или нанимающего менеджера.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {linked.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
            >
              <CompanyLogo domain={null} name={c.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[c.role, c.company].filter(Boolean).join(" · ") || c.email || "—"}
                </p>
              </div>
              {c.email ? (
                <a
                  href={`mailto:${c.email}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Mail className="size-4" />
                </a>
              ) : null}
              {c.telegram ? (
                <a
                  href={telegramUrl(c.telegram)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Send className="size-4" />
                </a>
              ) : null}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onToggle(c.id)}
                className="text-muted-foreground"
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit">
            <Plus /> Добавить контакт
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить контакт</DialogTitle>
            <DialogDescription>
              Свяжите существующий контакт из адресной книги или создайте новый.
            </DialogDescription>
          </DialogHeader>

          {unlinked.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">
                Адресная книга
              </p>
              {unlinked.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onToggle(c.id)}
                  className="flex items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"
                >
                  <CompanyLogo domain={null} name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.role, c.company].filter(Boolean).join(" · ") || c.email || "—"}
                    </p>
                  </div>
                  <Plus className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : null}

          {unlinked.length > 0 ? <Separator /> : null}

          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              Новый контакт
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Имя *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Иван Петров"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="hr@company.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Телефон</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Telegram</Label>
                <Input
                  value={form.telegram}
                  onChange={(e) => set("telegram", e.target.value)}
                  placeholder="@username или ссылка"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>LinkedIn</Label>
                <Input
                  value={form.linkedin}
                  onChange={(e) => set("linkedin", e.target.value)}
                  placeholder="linkedin.com/in/…"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Компания</Label>
                <Input
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Роль</Label>
                <Input
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  placeholder="Tech Recruiter"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Закрыть
            </Button>
            <Button onClick={create} disabled={creating || !form.name.trim()}>
              {creating ? "Создаём…" : "Создать и связать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
