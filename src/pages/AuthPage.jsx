export function AuthPage({ form, error, onChange, onSubmit }) {
  const isEmployer = form.role === 'employer'

  return (
    <section className="authPage">
      <div className="authCard">
        <div className="authCard__header">
          <div className="authCard__eyebrow">Регистрация</div>
          <h1 className="authCard__title">Войти в приложение</h1>
          <p className="authCard__lead">Админ не регистрируется с сайта. Здесь доступны роли пользователь и работодатель.</p>
        </div>

        <div className="roleTabs" role="tablist" aria-label="Роль">
          <button type="button" className={`roleTabs__item ${form.role === 'user' ? 'is-active' : ''}`} onClick={() => onChange('role', 'user')}>
            Пользователь
          </button>
          <button
            type="button"
            className={`roleTabs__item ${form.role === 'employer' ? 'is-active' : ''}`}
            onClick={() => onChange('role', 'employer')}
          >
            Работодатель
          </button>
        </div>

        <form className="authForm" onSubmit={onSubmit} noValidate>
          {isEmployer ? (
            <label className="field">
              <span className="field__label">Название компании</span>
              <input className="input input--dark" value={form.companyName} onChange={(e) => onChange('companyName', e.target.value)} />
            </label>
          ) : null}

          <label className="field">
            <span className="field__label">{isEmployer ? 'Контактное лицо' : 'ФИО'}</span>
            <input className="input input--dark" value={form.fullName} onChange={(e) => onChange('fullName', e.target.value)} />
          </label>

          <div className="authForm__grid">
            <label className="field">
              <span className="field__label">Телефон</span>
              <input className="input input--dark" inputMode="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Email</span>
              <input className="input input--dark" inputMode="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
            </label>
          </div>

          <button className="primaryButton primaryButton--wide" type="submit">
            Продолжить
          </button>
          {error ? <div className="formError">{error}</div> : null}
        </form>
      </div>
    </section>
  )
}

