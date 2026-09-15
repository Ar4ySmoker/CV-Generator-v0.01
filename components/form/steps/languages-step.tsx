"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"

import type { CvFormValues } from "@/lib/schemas"

export function LanguagesStep() {
  const { control } = useFormContext<CvFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "languages",
  })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <FormField
            control={control}
            name={`languages.${index}.language`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Русский, Английский…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`languages.${index}.level`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="B2, свободно…" {...field} />
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
            <span className="sr-only">Удалить язык</span>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ language: "", level: "" })}
      >
        <Plus /> Добавить язык
      </Button>
    </div>
  )
}
