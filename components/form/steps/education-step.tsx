"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import type { CvFormValues } from "@/lib/schemas"

export function EducationStep() {
  const { control } = useFormContext<CvFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
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
              Образование {index + 1}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              onClick={() => remove(index)}
            >
              <Trash />
              <span className="sr-only">Удалить</span>
            </Button>
          </div>
          <FormField
            control={control}
            name={`education.${index}.institution`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Учебное заведение</FormLabel>
                <FormControl>
                  <Input placeholder="Название вуза / курса" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={control}
              name={`education.${index}.faculty`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Факультет / направление</FormLabel>
                  <FormControl>
                    <Input placeholder="Направление" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`education.${index}.degree`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Степень</FormLabel>
                  <FormControl>
                    <Input placeholder="Бакалавр / магистр / курс" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ institution: "", faculty: "", degree: "" })}
      >
        <Plus /> Добавить образование
      </Button>
    </div>
  )
}
