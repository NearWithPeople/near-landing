import { useState } from 'react'
import { Link } from 'react-router-dom'

import buselMobSing from '../../assets/icons/busel-mob-sing.png'
import { CONTACTS_PATH, FAQ_PATH, PRIVACY_PATH } from '../../constants/legalPages'

import './AuthPage.css'

export function AuthPage({ form, error, isSubmitting, registrationDisabled = false, onChange, onSubmit }) {
  const isLogin = registrationDisabled || form.mode === 'login'
  const isEmployer = form.role === 'employer'
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <section className="authPage">
      <header className="authPage__topbar">
        <Link to="/" className="authPage__back" aria-label="На главную">
          ←
        </Link>
        <Link to="/" className="authPage__logoWrap" aria-label="На главную">
          <span className="authPage__logo" role="img" aria-label="nearby" />
        </Link>
        <div className="authPage__topbarSpacer" aria-hidden="true" />
      </header>

      <div className="authPage__scroll">
        <div className="authPage__layout">
          <div className="authPage__panel">
            <div className="authPage__panelHeader">
              <Link to="/" className="authPage__back authPage__back--panel" aria-label="На главную">
                ←
              </Link>
              <Link to="/" className="authPage__panelBrand" aria-label="На главную">
                <span className="authPage__logo" role="img" aria-label="nearby" />
              </Link>
            </div>

            <div className="authPage__intro">
              <h1 className="authPage__title">{isLogin ? 'Войти в приложение' : 'Создать аккаунт'}</h1>
              <p className="authPage__lead">
                {isLogin
                  ? 'Смены на карте, отклики и чат с работодателем — всё в одном месте.'
                  : 'Подберите роль и заполните данные — начните искать смены или публиковать вакансии.'}
              </p>
            </div>

            <div className="authPage__cardStack">
              <img src={buselMobSing} alt="" className="authPage__mascotMobile" decoding="async" />

              <article className="authPage__card">
                <div className="authPage__roleTabs" role="tablist" aria-label="Роль">
                  <button
                    type="button"
                    className={`authPage__roleTab${form.role === 'seeker' ? ' is-active' : ''}`}
                    onClick={() => onChange('role', 'seeker')}
                  >
                    Соискатель
                  </button>
                  <button
                    type="button"
                    className={`authPage__roleTab${form.role === 'employer' ? ' is-active' : ''}`}
                    onClick={() => onChange('role', 'employer')}
                  >
                    Работодатель
                  </button>
                </div>

                {error ? (
                  <div className="authPage__error" role="alert">
                    {error}
                  </div>
                ) : null}

                <form className="authPage__form" onSubmit={onSubmit} noValidate>
            {!isLogin ? (
              <>
                <div className="authPage__grid">
                  <label className="authPage__field">
                    <span>Фамилия</span>
                    <input className="authPage__input" value={form.lastName} onChange={(event) => onChange('lastName', event.target.value)} />
                  </label>
                  <label className="authPage__field">
                    <span>{isEmployer ? 'Имя контактного лица' : 'Имя'}</span>
                    <input className="authPage__input" value={form.firstName} onChange={(event) => onChange('firstName', event.target.value)} />
                  </label>
                </div>

                <label className="authPage__field">
                  <span>Отчество</span>
                  <input className="authPage__input" value={form.middleName} onChange={(event) => onChange('middleName', event.target.value)} />
                </label>

                {!isEmployer ? (
                  <label className="authPage__field">
                    <span>Возраст</span>
                    <input
                      className="authPage__input"
                      type="number"
                      min="16"
                      max="99"
                      inputMode="numeric"
                      value={form.age}
                      onChange={(event) => onChange('age', event.target.value)}
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            <div className="authPage__grid">
              <label className="authPage__field">
                <span>Телефон</span>
                <input
                  className="authPage__input"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => onChange('phone', event.target.value)}
                  placeholder="+375 29 123 45 67"
                />
              </label>
              <label className="authPage__field">
                <span>Email</span>
                <input
                  className="authPage__input"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => onChange('email', event.target.value)}
                />
              </label>
            </div>

            <label className="authPage__field">
              <span>Пароль</span>
              <div className="authPage__passwordWrap">
                <input
                  className="authPage__input authPage__input--password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={(event) => onChange('password', event.target.value)}
                  placeholder="Минимум 6 символов"
                />
                <button
                  type="button"
                  className="authPage__passwordToggle"
                  aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                >
                  {isPasswordVisible ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </label>

            {!isLogin ? (
              <label className="authPage__field">
                <span>Telegram (необязательно)</span>
                <input
                  className="authPage__input"
                  inputMode="text"
                  value={form.telegramUsername}
                  onChange={(event) => onChange('telegramUsername', event.target.value)}
                  placeholder="@username"
                />
              </label>
            ) : null}

            {!isLogin ? (
              <label className="authPage__legal">
                <input
                  className="authPage__legalCheckbox"
                  type="checkbox"
                  checked={Boolean(form.acceptedLegal)}
                  onChange={(event) => onChange('acceptedLegal', event.target.checked)}
                />
                <span className="authPage__legalText">
                  Подтверждаю ознакомление с <Link to={FAQ_PATH}>FAQ</Link>, <Link to={CONTACTS_PATH}>контактами</Link> и{' '}
                  <Link to={PRIVACY_PATH}>политикой конфиденциальности</Link>.
                </span>
              </label>
            ) : null}

            <button className="authPage__submit" type="submit" disabled={isSubmitting || (!isLogin && !form.acceptedLegal)}>
              {isSubmitting ? 'Подождите…' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>

            {!registrationDisabled ? (
              <div className="authPage__switch">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                <button type="button" className="authPage__switchButton" onClick={() => onChange('mode', isLogin ? 'register' : 'login')}>
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </div>
            ) : null}

                </form>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
