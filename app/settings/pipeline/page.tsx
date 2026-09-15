import { redirect } from "next/navigation"

import { PipelineEditor } from "@/components/settings/pipeline-editor"
import { auth } from "@/lib/auth"

export default async function PipelinePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium">Воронка</h1>
      <p className="text-sm text-muted-foreground">
        Настройте этапы трудоустройства под свой процесс.
      </p>
      <div className="mt-4">
        <PipelineEditor />
      </div>
    </div>
  )
}
