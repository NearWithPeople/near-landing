export function GuestLandingPage({ onEnter }) {
  return (
    <section className="guestLanding">
      <div className="guestLanding__inner">
        <div className="guestLanding__badge">Гостевой экран</div>
        <h1 className="guestLanding__title">Веб‑приложение для вакансий и подработки рядом</h1>
        <p className="guestLanding__lead">
          После входа откроется рабочее приложение: роли пользователь/работодатель, onboarding, карта вакансий, каталог и отзывы.
        </p>
        <button className="primaryButton" onClick={onEnter}>
          Войти
        </button>
      </div>
    </section>
  )
}

