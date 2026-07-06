import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { I18nProvider } from "./i18n"
import { NotificationsProvider } from "./lib/notifications"
import "./styles.css"

const el = document.getElementById("root")
if (!el) throw new Error("Root element #root not found")

createRoot(el).render(
  <StrictMode>
    <I18nProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </I18nProvider>
  </StrictMode>,
)
