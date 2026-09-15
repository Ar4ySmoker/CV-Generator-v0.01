"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { CircleAlert, Link2, Clipboard } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import type { CvFormValues } from "@/lib/schemas"

export function VacancyStep() {
  const { control } = useFormContext<CvFormValues>()
  const source = useWatch({ control, name: "vacancy.source" })

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={control}
        name="vacancy.source"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Как добавить вакансию?</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="gap-2"
              >
                <Label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 p-3 text-sm font-normal has-[[data-checked]]:border-primary">
                  <RadioGroupItem value="text" />
                  <Clipboard className="size-4 text-muted-foreground" />
                  Вставить текст вакансии
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 p-3 text-sm font-normal has-[[data-checked]]:border-primary">
                  <RadioGroupItem value="url" />
                  <Link2 className="size-4 text-muted-foreground" />
                  Указать ссылку
                </Label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {source === "text" ? (
        <FormField
          control={control}
          name="vacancy.text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Текст вакансии</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-40"
                  placeholder="Вставьте описание вакансии: обязанности, требования, стек…"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Необязательно. Если оставить пустым — CV будет без адаптации под
                вакансию.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="vacancy.url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ссылка на вакансию</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://hh.ru/vacancy/…"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Попробуем получить текст автоматически.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {source === "url" ? (
        <Alert>
          <CircleAlert />
          <AlertDescription>
            Некоторые сайты (hh.ru, Avito, Gold Apple) блокируют автоматический
            доступ. Если загрузка не удастся — мы попросим вставить текст
            вакансии вручную.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
