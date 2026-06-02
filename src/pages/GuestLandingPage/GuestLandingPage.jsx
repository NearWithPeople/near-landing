import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { CONTACTS_PATH, FAQ_PATH, PRIVACY_PATH } from '../../constants/legalPages'

import './GuestLandingPage.css'

const PROCESS_STEPS = [
  {
    iconKind: 'map',
    title: 'Карта рядом',
    text: 'Смотрите смены на карте и по расстоянию — быстро понимаете, до чего реально доехать.',
  },
  {
    iconKind: 'filters',
    title: 'Фильтры',
    text: 'Город, категория, ставка и дата смены — отсекаем лишнее и находите формат под себя.',
  },
  {
    iconKind: 'bolt',
    title: 'Отклик',
    text: 'Откликаетесь в пару действий: условия и адрес уже на карточке вакансии.',
  },
  {
    iconKind: 'clipboard',
    title: 'Профиль и история',
    text: 'Отклики и выполненные задачи хранятся в одном месте — удобно возвращаться к договорённостям.',
  },
]

const CATEGORY_SLIDES = [
  { title: 'Курьер', subtitle: 'доставка и перемещения' },
  { title: 'Склад', subtitle: 'комплектация и логистика' },
  { title: 'Промо', subtitle: 'акции и представительство' },
  { title: 'HoReCa', subtitle: 'кухня и зал' },
]

const SCENARIOS = [
  {
    tier: 'Соискатель',
    items: ['Каталог и карта вакансий по городу', 'Отклики без лишних шагов', 'Профиль и история откликов', 'Подбор по ставке и дате смены'],
  },
  {
    tier: 'Работодатель',
    items: ['Публикация смен и управление карточками', 'Просмотр откликов по вакансиям', 'Быстрое создание из текста (парсер)', 'Роли и доступ в одном аккаунте'],
  },
]

function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function telHref(raw) {
  const cleaned = String(raw).replace(/[^\d+]/g, '')
  if (!cleaned) return '#'
  return `tel:${cleaned}`
}

function formatVacancyStat(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('ru-RU').format(n)
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

function CarouselChevron({ dir }) {
  const common = { className: 'landingPromo__carouselArrowSvg', width: 22, height: 22, viewBox: '0 0 24 24', 'aria-hidden': true }
  if (dir === 'left') {
    return (
      <svg {...common}>
        <path fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" d="M14 7l-5 5 5 5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" d="M10 7l5 5-5 5" />
    </svg>
  )
}

function ProcessStepIcon({ kind }) {
  const svgProps = {
    className: 'landingPromo__stepIconSvg',
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }

  switch (kind) {
    case 'map':
      return (
        <svg {...svgProps}>
          <path {...stroke} d="M12 21s-6.4-4.6-6.4-10a6.6 6.6 0 1113.2 0c0 5.4-6.8 10-6.8 10z" />
          <circle {...stroke} cx="12" cy="11" r="2.25" />
        </svg>
      )
    case 'filters':
      return (
        <svg {...svgProps}>
          <circle {...stroke} cx="11" cy="11" r="6.25" />
          <path {...stroke} d="M16 16l4 4" />
        </svg>
      )
    case 'bolt':
      return (
        <svg {...svgProps}>
          <path fill="currentColor" stroke="none" d="M13 2L4 14h6.5l-1 8L20 8h-7z" />
        </svg>
      )
    case 'clipboard':
      return (
        <svg {...svgProps}>
          <path {...stroke} d="M9 4h6l1 2h3v13a2 2 0 01-2 2H7a2 2 0 01-2-2V6h3l1-2z" />
          <path {...stroke} d="M9 4v2h6V4" />
          <path {...stroke} d="M9 12h6M9 16h4" />
        </svg>
      )
    default:
      return null
  }
}

export function GuestLandingPage({ content, onLogin, onRegister }) {
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [carouselDir, setCarouselDir] = useState('next')
  const [carouselUsed, setCarouselUsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const compactHeader = useMediaQuery('(max-width: 767px)')
  const phone = content?.settings?.supportPhone?.trim() || '+375 (29) 000-00-00'
  const email = content?.settings?.supportEmail?.trim() || 'hello@near.app'
  const openVacancies = typeof content?.stats?.openVacancies === 'number' ? content.stats.openVacancies : null

  const slideLen = CATEGORY_SLIDES.length
  const prevSlideIdx = (carouselIndex - 1 + slideLen) % slideLen
  const nextSlideIdx = (carouselIndex + 1) % slideLen

  const prevSlide = () => {
    setCarouselUsed(true)
    setCarouselDir('prev')
    setCarouselIndex((i) => (i - 1 + slideLen) % slideLen)
  }
  const nextSlide = () => {
    setCarouselUsed(true)
    setCarouselDir('next')
    setCarouselIndex((i) => (i + 1) % slideLen)
  }

  function handleLeadSubmit(e) {
    e.preventDefault()
  }

  useEffect(() => {
    const nodes = document.querySelectorAll('.landingPromo__reveal')
    if (!nodes.length || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((el) => el.classList.add('landingPromo__visible'))
      return undefined
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('landingPromo__visible')
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    )

    nodes.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    if (!compactHeader) setMenuOpen(false)
  }, [compactHeader])

  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen((v) => !v)

  return (
    <section className="landingPromo" id="guest-landing">
      <div className="landingPromo__headerStrip">
        <header className="landingPromo__header landingPromo__reveal landingPromo__visible">
          <div className="landingPromo__headerBrand">
            <a
              href="#guest-landing"
              className="landingPromo__wordmarkLink"
              aria-label="NEAR.by — наверх страницы"
              onClick={(e) => {
                e.preventDefault()
                closeMenu()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <span className="landingPromo__wordmark">
                <span className="landingPromo__wordmarkNear">NEAR</span>
                <span className="landingPromo__wordmarkBy">.by</span>
              </span>
            </a>
          </div>

          <nav
            id="landing-site-nav"
            className={`landingPromo__siteNav ${menuOpen ? 'is-open' : ''}`}
            aria-label="По странице"
            aria-hidden={compactHeader && !menuOpen ? true : undefined}
          >
            <div className="landingPromo__siteNavLinks">
              <a href="#about-app" onClick={closeMenu}>
                О сервисе
              </a>
              <a href="#process-title" onClick={closeMenu}>
                Как работает
              </a>
              <a href="#portfolio-title" onClick={closeMenu}>
                Направления
              </a>
              <a href="#scenarios" onClick={closeMenu}>
                Для кого
              </a>
              <a href="#lead-form" onClick={closeMenu}>
                Контакты
              </a>
            </div>
            <div className="landingPromo__siteNavActions" aria-label="Вход и регистрация">
              <button
                type="button"
                className="landingPromo__ghost landingPromo__ghost--compact landingPromo__ghost--navDrawer"
                onClick={() => {
                  closeMenu()
                  onLogin?.()
                }}
              >
                {content?.landingPage?.loginLabel || 'Войти'}
              </button>
              <button
                type="button"
                className="landingPromo__btnPrimary landingPromo__btnPrimary--header landingPromo__btnPrimary--navDrawer"
                onClick={() => {
                  closeMenu()
                  onRegister?.()
                }}
              >
                {content?.landingPage?.registerLabel || 'Регистрация'}
              </button>
            </div>
          </nav>

          <div className="landingPromo__headerActions landingPromo__headerActions--strip">
            <button
              type="button"
              className="landingPromo__ghost landingPromo__ghost--compact"
              onClick={() => {
                closeMenu()
                onLogin?.()
              }}
            >
              {content?.landingPage?.loginLabel || 'Войти'}
            </button>
            <button
              type="button"
              className="landingPromo__btnPrimary landingPromo__btnPrimary--header"
              onClick={() => {
                closeMenu()
                onRegister?.()
              }}
            >
              {content?.landingPage?.registerLabel || 'Регистрация'}
            </button>
          </div>

          <button
            type="button"
            className={`landingPromo__menuToggle ${menuOpen ? 'is-open' : ''}`}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            aria-controls="landing-site-nav"
            onClick={toggleMenu}
          >
            <span className="landingPromo__menuToggleBars">
              <span className="landingPromo__menuToggleBar" aria-hidden />
              <span className="landingPromo__menuToggleBar" aria-hidden />
              <span className="landingPromo__menuToggleBar" aria-hidden />
            </span>
          </button>
        </header>

        {compactHeader && menuOpen ? (
          <button type="button" className="landingPromo__navBackdrop" tabIndex={-1} aria-hidden onClick={closeMenu} />
        ) : null}
      </div>

      <div className="landingPromo__wrap">
        <div className="landingPromo__hero">
          <div className="landingPromo__heroText">
            <h1 className="landingPromo__heroTitle landingPromo__heroStagger landingPromo__heroStagger--1">
              Подработка и вакансии рядом с вами
            </h1>
            <p className="landingPromo__heroLead landingPromo__heroStagger landingPromo__heroStagger--2">
              Near объединяет соискателей и работодателей: каталог и карта смен, понятные фильтры и отклики в пару нажатий — без лишней бюрократии на старте.
            </p>
            <div className="landingPromo__heroRow landingPromo__heroStagger landingPromo__heroStagger--3">
              <button type="button" className="landingPromo__btnPrimary" onClick={onRegister}>
                Начать сейчас
              </button>
              <button type="button" className="landingPromo__btnSecondary" onClick={() => scrollToId('scenarios')}>
                Как это устроено
              </button>
            </div>
          </div>

          <div className="landingPromo__heroVisual landingPromo__mesh" aria-hidden>
            <div className="landingPromo__meshOrb landingPromo__meshOrb--a" />
            <div className="landingPromo__meshOrb landingPromo__meshOrb--b" />
            <div className="landingPromo__meshOrb landingPromo__meshOrb--c" />
            <div className="landingPromo__meshGrid" />
          </div>
        </div>

        <section className="landingPromo__twoCol landingPromo__reveal" aria-labelledby="about-app">
          <div>
            <h2 id="about-app" className="landingPromo__blockTitle">
              Что такое Near?
            </h2>
            <p className="landingPromo__blockText">
              Это веб-приложение для поиска подработки и публикации смен: вы видите условия, локацию на карте и можете откликнуться сразу или опубликовать задачу как работодатель.
            </p>
          </div>
          <div>
            <h2 className="landingPromo__blockTitle">Кому подойдёт?</h2>
            <p className="landingPromo__blockText">
              Исполнителям — чтобы находить смены по городу и ставке. Работодателям — чтобы быстро закрывать задачи и собирать отклики в одном интерфейсе вместе с картой и каталогом.
            </p>
          </div>
        </section>

        <section className="landingPromo__process landingPromo__reveal" aria-labelledby="process-title">
          <div className="landingPromo__processTop">
            <h2 id="process-title" className="landingPromo__processTitle">
              Как это работает для исполнителя?
            </h2>
            <div className="landingPromo__stat" aria-label="Открытых вакансий на платформе">
              {openVacancies != null ? `${formatVacancyStat(openVacancies)}+` : '24/7'}
            </div>
          </div>
          <p className="landingPromo__statNote">{openVacancies != null ? 'открытых вакансий и смен в каталоге' : 'доступ к каталогу и карте'}</p>

          <div className="landingPromo__ribbon">
            <svg className="landingPromo__ribbonSvg landingPromo__ribbonWave" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="lpRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#304040">
                    <animate attributeName="stop-color" values="#304040;#3d5454;#304040" dur="8s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="45%" stopColor="#5b7065">
                    <animate attributeName="stop-color" values="#5b7065;#7a9488;#5b7065" dur="8s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#04202c">
                    <animate attributeName="stop-color" values="#04202c;#0e3545;#04202c" dur="8s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                <filter id="lpGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                className="landingPromo__ribbonPath"
                d="M0,75 C200,35 400,105 600,65 C800,25 1000,95 1200,55 L1200,95 C1000,125 800,55 600,95 C400,135 200,65 0,105 Z"
                fill="url(#lpRibbonGrad)"
                opacity="0.55"
                filter="url(#lpGlow)"
              />
            </svg>

            <div className="landingPromo__steps">
              {PROCESS_STEPS.map((step) => (
                <div key={step.title} className="landingPromo__step">
                  <div className="landingPromo__stepIcon">
                    <ProcessStepIcon kind={step.iconKind} />
                  </div>
                  <h3 className="landingPromo__stepTitle">{step.title}</h3>
                  <p className="landingPromo__stepText">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landingPromo__portfolio landingPromo__reveal" aria-labelledby="portfolio-title">
          <h2 id="portfolio-title" className="landingPromo__sectionTitle">
            Популярные направления
          </h2>

          <div className="landingPromo__carousel" aria-live="polite">
            <button type="button" className="landingPromo__carouselNav landingPromo__carouselNav--prev" aria-label="Предыдущая категория" onClick={prevSlide}>
              <CarouselChevron dir="left" />
            </button>

            <div
              key={carouselIndex}
              className={[
                'landingPromo__carouselTrack',
                carouselUsed ? `landingPromo__carouselTrack--reel-${carouselDir}` : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="landingPromo__portfolioCircle landingPromo__portfolioCircle--side" aria-hidden>
                <div key={`side-prev-${carouselIndex}`} className="landingPromo__sideCircleInner">
                  <div className="landingPromo__sideCircleStack">
                    <p className="landingPromo__sideCircleTitle">{CATEGORY_SLIDES[prevSlideIdx].title}</p>
                    <p className="landingPromo__sideCircleSub">{CATEGORY_SLIDES[prevSlideIdx].subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="landingPromo__portfolioCircle landingPromo__portfolioCircle--lg">
                <div key={carouselIndex} className="landingPromo__slideInner">
                  <div className="landingPromo__portfolioCircleLabel">{CATEGORY_SLIDES[carouselIndex].title}</div>
                  <div className="landingPromo__portfolioCircleLabel landingPromo__portfolioSub">{CATEGORY_SLIDES[carouselIndex].subtitle}</div>
                </div>
              </div>

              <div className="landingPromo__portfolioCircle landingPromo__portfolioCircle--side" aria-hidden>
                <div key={`side-next-${carouselIndex}`} className="landingPromo__sideCircleInner">
                  <div className="landingPromo__sideCircleStack">
                    <p className="landingPromo__sideCircleTitle">{CATEGORY_SLIDES[nextSlideIdx].title}</p>
                    <p className="landingPromo__sideCircleSub">{CATEGORY_SLIDES[nextSlideIdx].subtitle}</p>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" className="landingPromo__carouselNav landingPromo__carouselNav--next" aria-label="Следующая категория" onClick={nextSlide}>
              <CarouselChevron dir="right" />
            </button>
          </div>
        </section>

        <section className="landingPromo__pricing landingPromo__reveal" id="scenarios" aria-labelledby="scenarios-title">
          <h2 id="scenarios-title" className="landingPromo__sectionTitle">
            Сценарии использования
          </h2>

          <div className="landingPromo__pricingGrid">
            {SCENARIOS.map((plan) => (
              <article key={plan.tier} className="landingPromo__priceCard landingPromo__priceLift landingPromo__priceCard--featured">
                <h3 className="landingPromo__tierName">{plan.tier}</h3>
                <ul className="landingPromo__tierList">
                  {plan.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button type="button" className="landingPromo__btnPrimary" onClick={onRegister}>
                  Создать аккаунт
                </button>
              </article>
            ))}
          </div>
        </section>



        <footer className="landingPromo__footer landingPromo__reveal">
          <ul className="landingPromo__footerLegal">
            <li>
              <Link to={FAQ_PATH}>FAQ</Link>
            </li>
            <li>
              <Link to={CONTACTS_PATH}>Контакты</Link>
            </li>
            <li>
              <Link to={PRIVACY_PATH}>Политика конфиденциальности</Link>
            </li>
          </ul>
          <p style={{ margin: '0 0 8px' }}>
            <a href={`mailto:${email}`}>{email}</a>
          </p>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} NEAR.by. Все права защищены.</p>
        </footer>
      </div>
    </section>
  )
}
