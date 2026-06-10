import { useEffect, useState } from 'react'

import './LaunchLandingPage.css'

const LAUNCH_TARGET = new Date('2026-06-17T00:00:00')

const LANDING_CARDS = [
  {
    image: '/landing-card/card-1.jpg',
    text: 'Вместо бесконечных чатов мы упаковываем всё в одном месте — для вашего удобства',
  },
  {
    image: '/landing-card/card-2.jpg',
    text: 'Зарабатывайте там, где живёте или учитесь — мы поможем найти подработку рядом',
  },
  {
    image: '/landing-card/card-3.jpg',
    text: 'Платформа защищает\nвашу репутацию, страхует от необоснованных отмен и формирует личный рейтинг',
  },
]

const LANDING_HIGHLIGHTS = [
  'Подработки в вашем районе',
  'Без бесконечных чатов',
  'Прозрачные условия смены',
]

function getCountdownParts(targetDate) {
  const diff = Math.max(0, targetDate.getTime() - Date.now())
  const totalHours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1_000)

  return { totalHours, minutes, seconds, isFinished: diff === 0 }
}

function useLaunchCountdown(targetDate) {
  const [parts, setParts] = useState(() => getCountdownParts(targetDate))

  useEffect(() => {
    const tick = () => setParts(getCountdownParts(targetDate))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetDate])

  return parts
}

function padTime(value) {
  return String(value).padStart(2, '0')
}

export function LaunchLandingPage() {
  const { totalHours, minutes, seconds, isFinished } = useLaunchCountdown(LAUNCH_TARGET)

  return (
    <section className="launchLanding" aria-labelledby="launch-landing-title">
      <header className="launchLanding__hero launchLanding__zone launchLanding__zone--light">
        <div className="launchLanding__logoWrap">
          <span className="launchLanding__logo" role="img" aria-label="nearby" />
        </div>

        <div className="launchLanding__timer" aria-live="polite" aria-atomic="true">
          {isFinished ? (
            <p className="launchLanding__timerLine launchLanding__timerLine--hours">Скоро запуск</p>
          ) : (
            <>
              <p className="launchLanding__timerLine launchLanding__timerLine--hours">
                <span className="launchLanding__timerValue">{padTime(totalHours)}</span>
                <span className="launchLanding__timerUnit">ч.</span>
              </p>
              <p className="launchLanding__timerLine launchLanding__timerLine--minutes">
                <span className="launchLanding__timerValue">{padTime(minutes)}</span>
                <span className="launchLanding__timerUnit">мин.</span>
              </p>
              <p className="launchLanding__timerLine launchLanding__timerLine--seconds">
                <span className="launchLanding__timerValue">{padTime(seconds)}</span>
                <span className="launchLanding__timerUnit">сек.</span>
              </p>
            </>
          )}
        </div>

        <p className="launchLanding__caption">...осталось до запуска первого радара подработок</p>
        <h1 id="launch-landing-title" className="launchLanding__srOnly">
          Запуск радара подработок nearby
        </h1>
      </header>

      <section className="launchLanding__intro launchLanding__zone launchLanding__zone--light" aria-label="О запуске">
        <p className="launchLanding__introLead">Первый радар подработок nearby уже на подходе</p>
        <ul className="launchLanding__highlights">
          {LANDING_HIGHLIGHTS.map((item) => (
            <li key={item} className="launchLanding__highlight">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="launchLanding__cards">
        {LANDING_CARDS.map((card, index) => (
          <article key={card.image} className="launchLanding__card">
            <div className="launchLanding__cardVisual">
              <img src={card.image} alt="" className="launchLanding__cardImage" loading={index === 0 ? 'eager' : 'lazy'} />
              <div className="launchLanding__cardOverlay">
                <div className="launchLanding__cardCopy">
                  <span className="launchLanding__cardNum" aria-hidden="true">
                    {index + 1}
                  </span>
                  <p className="launchLanding__cardText">{card.text}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="launchLanding__pitch launchLanding__zone launchLanding__zone--dark" aria-label="Для кого платформа">
        <p className="launchLanding__pitchEyebrow">Для кого</p>
        <div className="launchLanding__pitchGrid">
          <article className="launchLanding__pitchCard">
            <h3 className="launchLanding__pitchTitle">Соискателям</h3>
            <p className="launchLanding__pitchText">Карта смен, быстрый отклик и понятные условия — чтобы находить подработку рядом с домом или учёбой.</p>
          </article>
          <article className="launchLanding__pitchCard">
            <h3 className="launchLanding__pitchTitle">Работодателям</h3>
            <p className="launchLanding__pitchText">Публикация смен, отклики в одном месте и инструменты, которые экономят время на поиск людей.</p>
          </article>
        </div>
      </section>

      <footer className="launchLanding__footer launchLanding__zone launchLanding__zone--dark">
        <p className="launchLanding__footerTitle">Скоро откроем доступ</p>
        <p className="launchLanding__footerText">Следите за таймером — первый радар подработок nearby стартует 17 июня.</p>
      </footer>
    </section>
  )
}
