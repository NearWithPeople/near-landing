import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import './authSplit.css'

export function AuthPage({ form, error, isSubmitting, onChange, onSubmit }) {
  const isLogin = form.mode === 'login'
  const isEmployer = form.role === 'employer'

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  return (
    <section className="authSplitPage">
      <div className="authSplitPage__left">
        <div className="authSplitPage__orb authSplitPage__orb--a" aria-hidden />
        <div className="authSplitPage__orb authSplitPage__orb--b" aria-hidden />
        <div className="authSplitPage__orb authSplitPage__orb--c" aria-hidden />

        <div className="authSplitPage__heroWord" aria-hidden>
        <Link to="/" aria-label="На главную NEAR.by">

          <p className="authSplitPage__wordmark">
            <span className="authSplitPage__wordmarkNear">NEAR</span>
            <span className="authSplitPage__wordmarkBy">.by</span>
          </p>
        </Link>

        </div>

      </div>

      <div className="authSplitPage__right">
        <div className="authSplitPage__card">
          <div className="authCard__header">
            <h1 className="authCard__title">{isLogin ? 'Войти в приложение' : 'Создать аккаунт'}</h1>
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
      </div>
    </section>
  )
}
