"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Globe, Mail, Pencil, Phone, Plus, Send, Trash } from "lucide-react"

import {
  type ApplicationItem,
  type ContactItem,
} from "@/components/applications/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { CompanyLogo } from "@/components/applications/company-logo"
import { linkedinUrl, phoneHref, telegramUrl } from "@/lib/format"

interface FormState {
  name: string
  email: string
  phone: string
  telegram: string
  linkedin: string
  company: string
  role: string
  notes: string
}

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  telegram: "",
  linkedin: "",
  company: "",
  role: "",
  notes: "",
}

export function ContactsManager() {
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [apps, setApps] = useState<ApplicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<ContactItem | null>(null)

  const load = useCallback(async () => {
    const [contactsRes, appsRes] = await Promise.all([
      fetch("/api/contacts"),
      fetch("/api/applications"),
    ])
    if (contactsRes.ok) {
      const d = (await contactsRes.json()) as { contacts: ContactItem[] }
      setContacts(d.contacts)
    }
    if (appsRes.ok) {
      const d = (await appsRes.json()) as { applications: ApplicationItem[] }
      setApps(d.applications)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(contact: ContactItem) {
    setEditingId(contact.id)
    setForm({
      name: contact.name,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      telegram: contact.telegram ?? "",
      linkedin: contact.linkedin ?? "",
      company: contact.company ?? "",
      role: contact.role ?? "",
      notes: contact.notes ?? "",
    })
    setOpen(true)
  }

  function editFromDetail() {
    if (!detail) return
    const contact = detail
    setDetail(null)
    openEdit(contact)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        telegram: form.telegram.trim() || null,
        linkedin: form.linkedin.trim() || null,
        company: form.company.trim() || null,
        role: form.role.trim() || null,
        notes: form.notes.trim() || null,
      }
      const res = await fetch(
        editingId ? `/api/contacts/${editingId}` : "/api/contacts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (res.ok) {
        setOpen(false)
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" })
    await load()
  }

  async function removeFromDetail() {
    if (!detail) return
    const id = detail.id
    setDetail(null)
    await remove(id)
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {contacts.length} контактов
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus /> Контакт
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Адресная книга пуста. Добавьте рекрутеров и нанимающих менеджеров.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((c) => {
            const linkedApps = (c.applicationCount ?? 0) > 0
              ? apps.filter((a) => a.contactIds.includes(c.id))
              : []
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
              >
                <button
                  type="button"
                  onClick={() => setDetail(c)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <CompanyLogo domain={null} name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.role, c.company].filter(Boolean).join(" · ") ||
                        c.email ||
                        c.phone ||
                        "—"}
                    </p>
                  </div>
                </button>
                {linkedApps.length > 0 ? (
                  <div className="hidden max-w-64 flex-col items-end gap-0.5 md:flex">
                    {linkedApps.slice(0, 2).map((a) => (
                      <Link
                        key={a.id}
                        href={`/applications/${a.id}`}
                        className="max-w-full truncate text-xs text-muted-foreground hover:text-foreground"
                      >
                        {a.role} · {a.company}
                      </Link>
                    ))}
                    {linkedApps.length > 2 ? (
                      <span className="text-xs text-muted-foreground">
                        +{linkedApps.length - 2}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <Badge variant="secondary" className="hidden md:inline-flex">
                    {c.applicationCount ?? 0} откликов
                  </Badge>
                )}
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-muted-foreground hover:text-foreground"
                    title={c.email}
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
                    title={c.telegram}
                  >
                    <Send className="size-4" />
                  </a>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(c)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={() => remove(c.id)}
                >
                  <Trash />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <CompanyLogo
                domain={null}
                name={detail?.name ?? ""}
                size="lg"
              />
              <div className="min-w-0">
                <DialogTitle className="truncate">{detail?.name}</DialogTitle>
                <DialogDescription>
                  {[detail?.role, detail?.company].filter(Boolean).join(" · ") ||
                    "Контакт"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {detail?.email ? (
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:${detail.email}`}>
                  <Mail /> Email
                </a>
              </Button>
            ) : null}
            {detail?.phone ? (
              <Button asChild variant="outline" size="sm">
                <a href={phoneHref(detail.phone)}>
                  <Phone /> Позвонить
                </a>
              </Button>
            ) : null}
            {detail?.telegram ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={telegramUrl(detail.telegram)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send /> Telegram
                </a>
              </Button>
            ) : null}
            {detail?.linkedin ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={linkedinUrl(detail.linkedin)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe /> LinkedIn
                </a>
              </Button>
            ) : null}
          </div>

          {(detail?.email ||
            detail?.phone ||
            detail?.telegram ||
            detail?.linkedin) ? (
            <div className="flex flex-col gap-1.5 text-sm">
              {detail.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="truncate">{detail.email}</span>
                </div>
              ) : null}
              {detail.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span className="truncate">{detail.phone}</span>
                </div>
              ) : null}
              {detail.telegram ? (
                <div className="flex items-center gap-2">
                  <Send className="size-4 text-muted-foreground" />
                  <span className="truncate">{detail.telegram}</span>
                </div>
              ) : null}
              {detail.linkedin ? (
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="truncate">{detail.linkedin}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {detail?.notes ? (
            <>
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Заметки
                </p>
                <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
              </div>
            </>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              Закрыть
            </Button>
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={removeFromDetail}
            >
              Удалить
            </Button>
            <Button onClick={editFromDetail}>
              <Pencil /> Редактировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Редактировать контакт" : "Новый контакт"}
            </DialogTitle>
            <DialogDescription>
              Рекрутер, нанимающий менеджер или другой человек из процесса найма.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Имя *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Иван Петров"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="hr@company.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Телефон</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+7 900 000-00-00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Telegram</Label>
              <Input
                value={form.telegram}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telegram: e.target.value }))
                }
                placeholder="@username или ссылка"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>LinkedIn</Label>
              <Input
                value={form.linkedin}
                onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                placeholder="linkedin.com/in/…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Роль</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Tech Recruiter"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Компания</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Заметки</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Контекст, где познакомились…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? "Сохраняем…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
