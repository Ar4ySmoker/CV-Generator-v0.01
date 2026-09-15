"use client"

import { TextField } from "@/components/form/fields"

export function PersonalStep() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        name="personal.name"
        label="Имя и фамилия"
        placeholder="Иван Иванов"
      />
      <TextField
        name="personal.email"
        label="Email"
        placeholder="you@example.com"
        type="email"
      />
      <TextField
        name="personal.phone"
        label="Телефон"
        placeholder="+7 900 000 00 00"
        type="tel"
      />
      <TextField
        name="personal.location"
        label="Город"
        placeholder="Москва"
      />
      <TextField
        name="personal.telegram"
        label="Telegram"
        placeholder="@username"
      />
      <TextField
        name="personal.github"
        label="GitHub"
        placeholder="https://github.com/username"
        type="url"
      />
      <TextField
        name="personal.site"
        label="Сайт / портфолио"
        placeholder="https://example.com"
        type="url"
      />
    </div>
  )
}
