"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import type { CvFormValues } from "@/lib/schemas"

export function ProjectsStep() {
  const { control } = useFormContext<CvFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "projects",
  })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-3 rounded-xl border border-border/60 p-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Проект {index + 1}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              onClick={() => remove(index)}
            >
              <Trash />
              <span className="sr-only">Удалить проект</span>
            </Button>
          </div>
          <FormField
            control={control}
            name={`projects.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название</FormLabel>
                <FormControl>
                  <Input placeholder="Название проекта" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`projects.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Что за проект, ваша роль"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`projects.${index}.stack`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Стек</FormLabel>
                <FormControl>
                  <Input
                    placeholder="React, Node.js, PostgreSQL…"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`projects.${index}.achievements`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Достижения</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Метрики, результаты"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          append({ name: "", description: "", stack: "", achievements: "" })
        }
      >
        <Plus /> Добавить проект
      </Button>
    </div>
  )
}
