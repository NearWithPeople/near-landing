import { useEffect, useState } from 'react'

import './LaunchLandingPage.css'

const LAUNCH_TARGET = new Date('2026-06-17T00:00:00')

const LANDING_CARDS = [
  {
    image: '/landing-card/card-1.jpg',
    text: 'Никаких спам-чатов — все предложения в одном месте',
  },
  {
    image: '/landing-card/card-2.jpg',
    text: 'Зарабатывайте здесь и сейчас — найдём подработку рядом',
  },
  {
    image: '/landing-card/card-3.jpg',
    text: 'Страхуем от отмен, заботимся о репутации и атмосфере',
  },
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
      <div className="launchLanding__logoBar">
        <div className="launchLanding__topBlur" aria-hidden="true" />
        <div className="launchLanding__logoWrap">
          <span className="launchLanding__logo" role="img" aria-label="nearby" />
        </div>
      </div>

      <header className="launchLanding__hero launchLanding__zone launchLanding__zone--light">
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

        <div className="launchLanding__heroCopy">
          <p className="launchLanding__caption">
            ...осталось до запуска первого{' '}
            <span className="launchLanding__captionHighlight">радара подработок</span>
          </p>
          <p className="launchLanding__heroLead">
            и вот почему
            <br />
            это стоит попробовать:
          </p>
        </div>
        <h1 id="launch-landing-title" className="launchLanding__srOnly">
          Запуск радара подработок nearby
        </h1>
      </header>

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
    </section>
  )
}
