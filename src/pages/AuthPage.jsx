export function AuthPage({ form, error, isSubmitting, onChange, onSubmit }) {
  const isLogin = form.mode === 'login'
  const isEmployer = form.role === 'employer'

  return (
    <section className="authPage">
      <div className="authCard">
        <div className="authCard__header">
          <div className="authCard__eyebrow">{isLogin ? 'Вход' : 'Регистрация'}</div>
          <h1 className="authCard__title">{isLogin ? 'Войти в приложение' : 'Создать аккаунт'}</h1>
          <p className="authCard__lead">Админ не регистрируется с сайта. Здесь доступны роли пользователь и работодатель.</p>
        </div>

        <div className="roleTabs" role="tablist" aria-label="Роль">
          <button type="button" className={`roleTabs__item ${form.role === 'seeker' ? 'is-active' : ''}`} onClick={() => onChange('role', 'seeker')}>
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
          {!isLogin ? (
            <>
              <div className="authForm__grid">
                <label className="field">
                  <span className="field__label">Фамилия</span>
                  <input className="input input--dark" value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)} />
                </label>
                <label className="field">
                  <span className="field__label">{isEmployer ? 'Имя контактного лица' : 'Имя'}</span>
                  <input className="input input--dark" value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)} />
                </label>
              </div>

              <label className="field">
                <span className="field__label">Отчество</span>
                <input className="input input--dark" value={form.middleName} onChange={(e) => onChange('middleName', e.target.value)} />
              </label>

              {!isEmployer ? (
                <label className="field">
                  <span className="field__label">Возраст</span>
                  <input className="input input--dark" type="number" min="16" max="99" inputMode="numeric" value={form.age} onChange={(e) => onChange('age', e.target.value)} />
                </label>
              ) : null}
            </>
          ) : null}

          <div className="authForm__grid">
            <label className="field">
              <span className="field__label">Телефон</span>
              <input className="input input--dark" type="tel" inputMode="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="+375 29 123 45 67" />
            </label>
            <label className="field">
              <span className="field__label">Email</span>
              <input className="input input--dark" inputMode="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Пароль</span>
            <input className="input input--dark" type="password" value={form.password} onChange={(e) => onChange('password', e.target.value)} placeholder="Минимум 6 символов" />
          </label>

          {!isLogin ? (
            <label className="field">
              <span className="field__label">Telegram username (необязательно)</span>
              <input
                className="input input--dark"
                inputMode="text"
                value={form.telegramUsername}
                onChange={(e) => onChange('telegramUsername', e.target.value)}
                placeholder="@username"
              />
            </label>
          ) : null}

          <button className="primaryButton primaryButton--wide" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Подождите...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
          <div className="authCard__switch">
            {isLogin ? 'Нет аккаунта?' : 'У вас уже есть аккаунт?'}{' '}
            <button type="button" className="authCard__switchButton" onClick={() => onChange('mode', isLogin ? 'register' : 'login')}>
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </div>
          {error ? <div className="formError">{error}</div> : null}
        </form>
      </div>
    </section>
  )
}

