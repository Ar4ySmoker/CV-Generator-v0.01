"use client"

import { useEffect, useState } from "react"
import { TriangleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function DisclaimerDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (open) {
      setAccepted(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтверждение рисков</DialogTitle>
          <DialogDescription>
            Режим «Сгенерировать опыт» создаёт вымышленный стаж работы.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Важно</AlertTitle>
          <AlertDescription>
            Сгенерированный опыт не соответствует вашему реальному стажу.
            Работодатели проводят background-check — несоответствие может
            привести к отказу и репутационным рискам.
          </AlertDescription>
        </Alert>

        <div className="flex items-start gap-2">
          <Checkbox
            id="disclaimer"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
          />
          <Label htmlFor="disclaimer" className="leading-snug">
            Я понимаю риски и осознанно выбираю генерацию вымышленного опыта
          </Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={onConfirm} disabled={!accepted}>
            Продолжить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
