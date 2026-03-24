import { useState, useEffect } from 'react'
import './App.css'

const TG_URL = 'https://t.me/nearbelapp'
const IG_URL = 'https://www.instagram.com/nearapp.by/'

/** Forminit: POST только email — см. https://forminit.com/docs/submit-form-api/ */
const FORMINIT_FORM_ID = 'ojgrfc489yu'
const FORMINIT_SUBMIT_URL = `https://forminit.com/f/${FORMINIT_FORM_ID}`

function IconMap() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconHeart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function IconTelegramNav() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function IconInstagramNav() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function SocialFollowStrip({ label, className = '' }) {
  return (
    <div className={`social-follow ${className}`.trim()}>
      <p className="social-follow__label">{label}</p>
      <div className="social-follow__links">
        <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="social-follow__chip">
          Telegram
        </a>
        <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="social-follow__chip social-follow__chip--ig">
          Instagram
        </a>
      </div>
    </div>
  )
}

/** Логотип из near-frontend/screens/ assets/logo.svg */
function BrandLogo({ className = '', size = 40 }) {
  return (
    <img
      src="/logo.svg"
      alt="Рядом"
      width={size}
      height={size}
      className={className}
      decoding="async"
    />
  )
}

export default function App() {
  const [downloadToast, setDownloadToast] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [contactStatus, setContactStatus] = useState('idle')
  const [contactError, setContactError] = useState('')

  useEffect(() => {
    if (!downloadToast) return
    const id = setTimeout(() => setDownloadToast(false), 3000)
    return () => clearTimeout(id)
  }, [downloadToast])

  async function handleContactSubmit(e) {
    e.preventDefault()
    const email = contactEmail.trim()
    if (!email) {
      setContactError('Введите email')
      setContactStatus('error')
      return
    }
    setContactError('')
    setContactStatus('loading')
    const headers = { 'Content-Type': 'application/json' }
    const apiKey = import.meta.env.VITE_FORMINIT_API_KEY
    if (apiKey) headers['X-API-KEY'] = apiKey
    try {
      const res = await fetch(FORMINIT_SUBMIT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          blocks: [{ type: 'sender', properties: { email } }],
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setContactStatus('success')
        setContactEmail('')
        return
      }
      const msg =
        data.message ||
        (res.status === 429 ? 'Слишком часто. Подождите несколько секунд и попробуйте снова.' : null) ||
        'Не удалось отправить. Попробуйте позже.'
      setContactError(msg)
      setContactStatus('error')
    } catch {
      setContactError('Нет соединения. Проверьте интернет и попробуйте снова.')
      setContactStatus('error')
    }
  }

  return (
    <div className="landing" id="top">
      {downloadToast && (
        <div className="toast-top" role="status" aria-live="polite">
          Всё будет, немного терпения
        </div>
      )}
      <header className="nav">
        <a href="#top" className="nav__brand">
          <span className="nav__brand-mark">
            <BrandLogo className="nav__brand-img" size={40} />
          </span>
          Рядом
        </a>
        <nav className="nav__links" aria-label="Основное меню">
          <a href="#features">Возможности</a>
          <a href="#how">Как это работает</a>
          <a href="#cta">Связаться</a>
        </nav>
        <div className="nav__actions">
          <div className="nav__social" aria-label="Соцсети проекта">
            <a
              href={TG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav__social-btn"
              aria-label="Telegram @nearbelapp"
              title="Telegram @nearbelapp"
            >
              <IconTelegramNav />
            </a>
            <a
              href={IG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav__social-btn nav__social-btn--ig"
              aria-label="Instagram nearapp.by"
              title="Instagram"
            >
              <IconInstagramNav />
            </a>
          </div>
          <button
            type="button"
            className="nav__cta"
            onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Оставить почту
          </button>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__bg" aria-hidden />
          <div className="hero__inner">
            <div>
              <p className="hero__badge">
                <span aria-hidden>✦</span> Волонтёрская помощь рядом с вами
              </p>
              <h1 id="hero-title" className="hero__title">
                Помощь <span>рядом</span> — когда она нужна
              </h1>
              <p className="hero__lead">
                «Рядом» — платформа для координации волонтёрской помощи в Беларуси: заявки на помощь (продукты, лекарства, бытовые дела),
                карта с маршрутами и чат между пользователями и волонтёрами.
              </p>
              <div className="hero__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--inactive"
                  onClick={() => setDownloadToast(true)}
                  aria-label="Скачать приложение — скоро в магазинах"
                >
                  Скачать приложение
                </button>
                <a href="#features" className="btn btn--ghost">
                  Возможности
                </a>
              </div>
            </div>
            <div className="hero__visual">
              <div className="hero__card">
                <div className="hero__card-row">
                  <span className="hero__dot hero__dot--pending" aria-hidden />
                  <div className="hero__card-text">
                    <strong>Заявка на помощь</strong>
                    Покупки в аптеке · ожидает волонтёра
                  </div>
                </div>
                <div className="hero__card-row">
                  <span className="hero__dot hero__dot--vol" aria-hidden />
                  <div className="hero__card-text">
                    <strong>Волонтёр в пути</strong>
                    Маршрут на карте · чат с заявителем
                  </div>
                </div>
                <div className="hero__card-row">
                  <span className="hero__dot" style={{ background: '#3b82f6' }} aria-hidden />
                  <div className="hero__card-text">
                    <strong>Заявка на карте</strong>
                    Админ-панель и координация в реальном времени
                  </div>
                </div>
              </div>
              <div className="hero__floating">Волонтёр принял заявку</div>
            </div>
          </div>
        </section>

        <section id="features" className="section" aria-labelledby="features-title">
          <div className="section__head">
            <p className="section__label">Возможности</p>
            <h2 id="features-title" className="section__title">
              Всё для координации помощи в одном приложении
            </h2>
            <p className="section__subtitle">
              В приложении — создание и отслеживание заявок, карта и маршруты, чат по заявке. В админ‑панели — карта заявок, смена
              статусов, аналитика и чат поддержки. Всё связано в одной экосистеме «Рядом».
            </p>
          </div>
          <SocialFollowStrip
            className="section__social"
            label="Следите за обновлениями функционала — подпишитесь на канал в Telegram или на Instagram."
          />
          <div className="features__grid">
            <article className="feature">
              <div className="feature__icon">
                <IconClipboard />
              </div>
              <h3>Заявки на помощь</h3>
              <p>Создавайте заявки с категориями, описанием и точкой на карте — аптеки, магазины, домашние дела.</p>
            </article>
            <article className="feature">
              <div className="feature__icon feature__icon--green">
                <IconHeart />
              </div>
              <h3>Волонтёры</h3>
              <p>Просматривайте доступные заявки, принимайте одну активную и ведите её до завершения.</p>
            </article>
            <article className="feature">
              <div className="feature__icon feature__icon--blue">
                <IconMap />
              </div>
              <h3>Карта и маршруты</h3>
              <p>Яндекс.Карты: POI, маршруты на пешеходе или на машине, чтобы не теряться в городе.</p>
            </article>
            <article className="feature">
              <div className="feature__icon feature__icon--muted">
                <IconChat />
              </div>
              <h3>Чат и поддержка</h3>
              <p>Общение по заявке и админ-панель с аналитикой и чатом поддержки.</p>
            </article>
          </div>
        </section>

        <section id="how" className="section how" aria-labelledby="how-title">
          <div className="section__head">
            <p className="section__label">Процесс</p>
            <h2 id="how-title" className="section__title">
              Как это работает
            </h2>
            <p className="section__subtitle">
              Один цикл: заявка создаётся в приложении, волонтёр берёт её в работу с картой и чатом, по завершении статус виден и
              пользователю, и в панели администратора.
            </p>
          </div>
          <div className="how__steps">
            <div className="step">
              <div className="step__num">1</div>
              <h3>Заявка</h3>
              <p>Пользователь описывает задачу и при необходимости указывает место на карте.</p>
            </div>
            <div className="step">
              <div className="step__num">2</div>
              <h3>Волонтёр</h3>
              <p>Волонтёр принимает заявку, строит маршрут и связывается в чате.</p>
            </div>
            <div className="step">
              <div className="step__num">3</div>
              <h3>Результат</h3>
              <p>Заявка завершается, администраторы видят статус на карте и в аналитике.</p>
            </div>
          </div>
        </section>

        <section id="cta" className="cta" aria-labelledby="cta-title">
          <div className="cta__box">
            <h2 id="cta-title">Оставьте почту для связи</h2>
            <p className="cta__lead">
              Напишем, когда приложение появится в магазинах, или ответим на вопросы о «Рядом». Только email — без рассылки спама.
            </p>
            <form className="cta__form" onSubmit={handleContactSubmit} noValidate>
              <label className="cta__label" htmlFor="contact-email">
                Email
              </label>
              <div className="cta__row">
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  className="cta__input"
                  value={contactEmail}
                  onChange={(ev) => {
                    setContactEmail(ev.target.value)
                    if (contactStatus === 'error' || contactStatus === 'success') {
                      setContactStatus('idle')
                      setContactError('')
                    }
                  }}
                  disabled={contactStatus === 'loading'}
                  aria-invalid={contactStatus === 'error' && !!contactError}
                  aria-describedby={contactError ? 'contact-feedback' : contactStatus === 'success' ? 'contact-success' : undefined}
                />
                <button type="submit" className="btn btn--primary cta__submit" disabled={contactStatus === 'loading'}>
                  {contactStatus === 'loading' ? 'Отправка…' : 'Отправить'}
                </button>
              </div>
              {contactStatus === 'success' && (
                <p id="contact-success" className="cta__feedback cta__feedback--ok" role="status">
                  Спасибо! Мы свяжемся с вами на указанную почту.
                </p>
              )}
              {contactStatus === 'error' && contactError && (
                <p id="contact-feedback" className="cta__feedback cta__feedback--err" role="alert">
                  {contactError}
                </p>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="nav__brand-mark nav__brand-mark--sm">
              <BrandLogo className="nav__brand-img" size={36} />
            </span>
            Рядом
          </div>
          <p className="footer__copy">Платформа координации волонтёрской помощи</p>
          <div className="footer__social">
            <a href={TG_URL} target="_blank" rel="noopener noreferrer" className="footer__link">
              Tg @nearbelapp
            </a>
            <span className="footer__sep" aria-hidden>
              ·
            </span>
            <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="footer__link">
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
