import './App.css'

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
  return (
    <div className="landing">
      <header className="nav">
        <a href="#" className="nav__brand">
          <span className="nav__brand-mark">
            <BrandLogo className="nav__brand-img" size={40} />
          </span>
          Рядом
        </a>
        <nav className="nav__links" aria-label="Основное меню">
          <a href="#features">Возможности</a>
          <a href="#how">Как это работает</a>
        </nav>
        <button type="button" className="nav__cta" onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}>
          Узнать больше
        </button>
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
                <button type="button" className="btn btn--primary" onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}>
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
              Мобильное приложение для пользователей и волонтёров, веб-панель для администраторов — единая экосистема «Рядом».
            </p>
          </div>
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
            <p className="section__subtitle">Три простых шага от заявки до помощи.</p>
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
            <h2 id="cta-title">Готовы подключиться?</h2>
            <p>
              Установите мобильное приложение «Рядом» или откройте админ-панель для организаций. Всё в одной экосистеме проекта.
            </p>
            <button type="button" className="btn btn--primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Наверх
            </button>
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
          <p className="footer__meta">React Native · Next.js · Node.js · PostgreSQL</p>
        </div>
      </footer>
    </div>
  )
}
