"use client"

import { useRef, useState } from "react"
import { FileUp, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function CvImport({
  applicationId,
  onImported,
}: {
  applicationId?: string
  onImported?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(file: File) {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      if (applicationId) {
        formData.append("applicationId", applicationId)
      }

      const res = await fetch("/api/cv-import", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(d?.error ?? "Не удалось импортировать CV")
      }

      toast.success("CV импортирован")
      onImported?.()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Не удалось импортировать CV"
      )
    } finally {
      setLoading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleFile(file)
          }
        }}
      />
      <Button
        variant="outline"
        className="w-fit"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <FileUp />
        )}
        {loading ? "Импортируем…" : "Загрузить готовое CV"}
      </Button>
    </>
  )
}
