export function GuestLandingPage({ onLogin, onRegister }) {
  return (
    <section className="guestLanding">
      <div className="guestLanding__inner">
        <div className="guestLanding__badge">Гостевой экран</div>
        <h1 className="guestLanding__title">Веб‑приложение для вакансий и подработки рядом</h1>
        <p className="guestLanding__lead">
          После входа откроется рабочее приложение: роли пользователь/работодатель, onboarding, карта вакансий, каталог и отзывы.
        </p>
        <div className="appActions">
          <button className="ghostButton" onClick={onLogin}>
            Войти
          </button>
          <button className="primaryButton" onClick={onRegister}>
            Зарегистрироваться
          </button>
        </div>
      </div>
    </section>
  )
}

