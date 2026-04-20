const USER_STEPS = [
  { key: 'goal', title: 'Зачем вам подработка?', options: ['доп. доход', 'гибкий график', 'на время'] },
  { key: 'categories', title: 'Какие вакансии интересны?', options: ['курьер', 'склад', 'промо', 'horeca', 'подсобные'] },
  { key: 'availability', title: 'Когда вы свободны?', options: ['утро', 'день', 'вечер', 'выходные'] },
  { key: 'payMin', title: 'Минимальная ставка BYN', options: ['0', '40', '60', '80'] },
  { key: 'contactPreference', title: 'Как удобнее связываться?', options: ['телефон', 'почта'] },
]

const EMPLOYER_STEPS = [
  { key: 'companyType', title: 'Кто вы как работодатель?', options: ['кафе', 'склад', 'ритейл', 'сервис'] },
  { key: 'categories', title: 'Какие вакансии публикуете?', options: ['курьер', 'склад', 'промо', 'horeca', 'подсобные'] },
  { key: 'availability', title: 'Какие смены чаще нужны?', options: ['утро', 'день', 'вечер', 'выходные'] },
  { key: 'payMin', title: 'Обычно ставка от BYN', options: ['40', '60', '80', '100'] },
  { key: 'contactPreference', title: 'Основной канал связи', options: ['телефон', 'почта'] },
]

export function OnboardingPage({ role, step, onStepChange, values, onChange, onFinish }) {
  const steps = role === 'employer' ? EMPLOYER_STEPS : USER_STEPS
  const current = steps[step]

  return (
    <section className="onboardingPage">
      <div className="onboardingCard">
        <div className="onboardingCard__head">
          <div className="authCard__eyebrow">Onboarding</div>
          <div className="onboardingCard__step">
            Шаг {step + 1} из {steps.length}
          </div>
        </div>
        <h2 className="authCard__title">{current.title}</h2>

        <div className="choiceGrid">
          {current.options.map((option) => {
            const normalized = /^\d+$/.test(option) ? Number(option) : option
            const value = values[current.key]
            const isMultiple = current.key === 'categories'
            const active = isMultiple ? (value || []).includes(normalized) : value === normalized

            return (
              <button
                key={option}
                type="button"
                className={`choiceCard ${active ? 'is-active' : ''}`}
                onClick={() => {
                  if (isMultiple) {
                    const currentValues = value || []
                    onChange(
                      current.key,
                      active ? currentValues.filter((item) => item !== normalized) : [...currentValues, normalized]
                    )
                  } else {
                    onChange(current.key, normalized)
                  }
                }}
              >
                {option}
              </button>
            )
          })}
        </div>

        <div className="onboardingCard__actions">
          <button className="ghostButton" onClick={() => onStepChange(Math.max(step - 1, 0))} disabled={step === 0}>
            Назад
          </button>
          {step < steps.length - 1 ? (
            <button className="primaryButton" onClick={() => onStepChange(step + 1)}>
              Далее
            </button>
          ) : (
            <button className="primaryButton" onClick={onFinish}>
              Открыть приложение
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

