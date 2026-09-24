"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import type { CvFormValues } from "@/lib/schemas"

import { TagsField } from "@/components/form/fields"

function BulletFields({ nestIndex }: { nestIndex: number }) {
  const { control } = useFormContext<CvFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: `experience.${nestIndex}.bullets`,
  })

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <FormField
            control={control}
            name={`experience.${nestIndex}.bullets.${index}.value`}
            render={({ field }) => (
              <FormItem className="min-w-0 flex-1">
                <FormControl>
                  <Textarea
                    placeholder="Что сделали, какого результата достигли"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-1 text-muted-foreground"
            onClick={() => remove(index)}
          >
            <Trash />
            <span className="sr-only">Удалить пункт</span>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ value: "" })}
      >
        <Plus /> Добавить пункт
      </Button>
    </div>
  )
}

export function ExperienceStep() {
  const { control } = useFormContext<CvFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience",
  })

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Место работы {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                onClick={() => remove(index)}
              >
                <Trash />
                <span className="sr-only">Удалить место работы</span>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={control}
                name={`experience.${index}.period`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Период</FormLabel>
                    <FormControl>
                      <Input placeholder="2023 — наст. время" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`experience.${index}.role`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Должность</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Stack Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`experience.${index}.company`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Компания</FormLabel>
                    <FormControl>
                      <Input placeholder="Компания" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={control}
                name={`experience.${index}.place`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Город</FormLabel>
                    <FormControl>
                      <Input placeholder="Москва" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`experience.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сайт</FormLabel>
                    <FormControl>
                      <Input placeholder="https://…" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FormLabel>Обязанности и достижения</FormLabel>
              <BulletFields nestIndex={index} />
            </div>
            <TagsField name={`experience.${index}.tags`} />
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() =>
          append({
            period: "",
            role: "",
            company: "",
            place: "",
            url: "",
            bullets: [{ value: "" }],
          })
        }
      >
        <Plus /> Добавить место работы
      </Button>
    </div>
  )
}
