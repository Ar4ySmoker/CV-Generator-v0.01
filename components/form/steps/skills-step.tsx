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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { CvFormValues } from "@/lib/schemas"

const SKILL_LEVELS = [
  { value: "basic", label: "Базовый" },
  { value: "intermediate", label: "Средний" },
  { value: "advanced", label: "Продвинутый" },
  { value: "expert", label: "Эксперт" },
]

export function SkillsStep() {
  const { control } = useFormContext<CvFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  })

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-2 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-start"
        >
          <FormField
            control={control}
            name={`skills.${index}.name`}
            render={({ field }) => (
              <FormItem className="min-w-0 flex-1">
                <FormControl>
                  <Input placeholder="React, TypeScript, Node.js…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`skills.${index}.level`}
            render={({ field }) => (
              <FormItem className="w-full sm:w-40">
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Уровень" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SKILL_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="self-end text-muted-foreground sm:mt-1 sm:self-start"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
          >
            <Trash />
            <span className="sr-only">Удалить навык</span>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ name: "", level: "intermediate" })}
      >
        <Plus /> Добавить навык
      </Button>
    </div>
  )
}
