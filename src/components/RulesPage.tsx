import { useI18n } from "../i18n"
import { FiShield } from "./icons"

export function RulesPage() {
  const { t } = useI18n()
  const rules = [t("rule_1"), t("rule_2"), t("rule_3"), t("rule_4"), t("rule_5")]
  return (
    <section className="section rules-page">
      <div className="section-head">
        <h3>{t("rules")}</h3>
        <span className="sub">{t("rules_sub")}</span>
      </div>
      <ol className="rules-list">
        {rules.map((r, i) => (
          <li key={i} className="rule-item">
            <span className="rule-num">{i + 1}</span>
            <span className="rule-text">{r}</span>
          </li>
        ))}
      </ol>
      <div className="rules-foot">
        <FiShield size={16} /> {t("rules_foot")}
      </div>
    </section>
  )
}
