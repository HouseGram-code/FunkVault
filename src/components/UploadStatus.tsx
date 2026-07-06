import type { CSSProperties } from "react"
import { useI18n } from "../i18n"
import { FiUploadCloud, FiCheckCircle } from "./icons"

export interface UploadState {
  title: string
  progress: number
  done: boolean
}

export function UploadStatus({ state }: { state: UploadState }) {
  const { t } = useI18n()
  const pct = Math.max(3, Math.min(100, Math.round(state.progress)))
  const barStyle: CSSProperties = { width: `${pct}%` }
  return (
    <div className="up-status">
      <span className="ups-ic">
        {state.done ? <FiCheckCircle size={22} /> : <FiUploadCloud size={22} />}
      </span>
      <div className="ups-body">
        <p className="ups-title">
          {state.done ? t("up_done") : `${t("up_uploading_chip")} · ${pct}%`}
        </p>
        <p className="ups-name">{state.title}</p>
        <div className="ups-track">
          <div className={"ups-fill" + (state.done ? " done" : "")} style={barStyle} />
        </div>
      </div>
    </div>
  )
}
