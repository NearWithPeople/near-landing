export function GuestLandingPage({ content, onLogin, onRegister }) {
  const openVacancies = typeof content?.stats?.openVacancies === 'number' ? content.stats.openVacancies : 0
  const supportItems = [
    content?.settings?.supportPhone ? `Телефон: ${content.settings.supportPhone}` : '',
    content?.settings?.supportEmail ? `Email: ${content.settings.supportEmail}` : '',
    content?.settings?.supportTelegram ? `Telegram: ${content.settings.supportTelegram}` : '',
  ].filter(Boolean)

  const featureCards = [
    {
      eyebrow: 'Каталог',
      title: 'Вакансии рядом на карте и в ленте',
      text: 'Быстрый поиск по городу, категории, ставке и дате смены.',
    },
    {
      eyebrow: 'Для работодателей',
      title: 'Публикация смен за пару минут',
      text: 'Ручное создание и парсер текста помогают быстро собрать карточку вакансии.',
    },
    {
      eyebrow: 'Для соискателей',
      title: 'Быстрые отклики без лишних шагов',
      text: 'Пользователь видит условия, адрес, оплату и может откликнуться сразу.',
    },
    {
      eyebrow: 'Контроль',
      title: 'Профиль, отклики и управление вакансиями',
      text: 'Работодатель следит за откликами, а исполнитель хранит историю задач в одном месте.',
    },
  ]

  const audienceCards = [
    {
      title: 'Работодателям',
      items: ['Публикация новых смен', 'Управление своими вакансиями', 'Просмотр откликов и кандидатов'],
    },
    {
      title: 'Соискателям',
      items: ['Поиск подработки поблизости', 'Отклик в пару нажатий', 'Личный профиль и выполненные задачи'],
    },
  ]

  const faqItems = [
    {
      question: 'Кому подходит платформа?',
      answer: 'Сервис рассчитан на работодателей, которым нужно быстро публиковать смены, и на людей, которые ищут подработку рядом.',
    },
    {
      question: 'Можно ли публиковать вакансии без ручного ввода?',
      answer: 'Да. На форме создания задачи уже есть интерфейс парсера: можно вставить текст сообщения и автоматически заполнить поля.',
    },
    {
      question: 'Как пользователь находит подходящие задачи?',
      answer: 'Через каталог и карту: можно смотреть вакансии по городу, расстоянию, категории, оплате и дате смены.',
    },
  ]

  return (
    <section className="guestLanding guestLanding--showcase">
      <div className="guestLandingShowcase">
        <header className="guestLandingNav">
          <div className="guestLandingNav__brand">
            <div className="guestLandingNav__logo">N</div>
            <div>
              <div className="guestLandingNav__name">Near</div>
              <div className="guestLandingNav__meta">Подработка и вакансии рядом</div>
            </div>
          </div>

          <nav className="guestLandingNav__links">
            <a href="#features">Преимущества</a>
            <a href="#roles">Роли</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="guestLandingNav__actions">
            <button className="ghostButton" onClick={onLogin}>
              {content?.landingPage?.loginLabel || 'Войти'}
            </button>
            <button className="primaryButton" onClick={onRegister}>
              {content?.landingPage?.registerLabel || 'Зарегистрироваться'}
            </button>
          </div>
        </header>

        <div className="guestHero">
          <div className="guestHero__content">
            <div className="guestLanding__badge">{content?.landingPage?.guestBadge || 'Гостевой экран'}</div>
            <h1 className="guestLanding__title">{content?.landingPage?.guestTitle || 'Веб-приложение для вакансий и подработки рядом'}</h1>
            <p className="guestLanding__lead">
              {content?.landingPage?.guestLead || 'После входа откроется рабочее приложение: роли пользователь/работодатель, onboarding, карта вакансий, каталог и отзывы.'}
            </p>

            <div className="guestHero__actions">
              <button className="primaryButton" onClick={onRegister}>
                Начать сейчас
              </button>
              <button className="ghostButton" onClick={onLogin}>
                Открыть вход
              </button>
            </div>

            <div className="guestHero__chips">
              <span className="guestHero__chip">Карта вакансий</span>
              <span className="guestHero__chip">Парсер смен</span>
              <span className="guestHero__chip">Отклики в 1 клик</span>
            </div>
          </div>

          <div className="guestHero__preview">
            <div className="guestPreviewCard guestPreviewCard--hero">
              <div className="guestPreviewCard__label">Live overview</div>
              <div className="guestPreviewCard__title">Публикация смен и отклики в одном интерфейсе</div>
              <div className="guestPreviewCard__text">Тёмный лендинг ведёт в рабочее приложение: каталог, карта, профиль, отклики и создание вакансий.</div>
            </div>

            <div className="guestPreviewGrid">
              <div className="guestPreviewCard">
                <div className="guestPreviewCard__metric">{openVacancies}+</div>
                <div className="guestPreviewCard__text">Открытых вакансий уже сейчас</div>
              </div>
              <div className="guestPreviewCard">
                <div className="guestPreviewCard__metric">2 роли</div>
                <div className="guestPreviewCard__text">Работодатель и пользователь в одном продукте</div>
              </div>
              <div className="guestPreviewCard guestPreviewCard--wide">
                <div className="guestPreviewCard__text">Near помогает быстро опубликовать смену, показать её на карте и собрать отклики без лишних экранов.</div>
              </div>
            </div>
          </div>
        </div>

        <section className="guestStats">
          <div className="guestStats__item">
            <span className="guestStats__value">{openVacancies}+</span>
            <span className="guestStats__label">Открытых вакансий</span>
          </div>
          <div className="guestStats__item">
            <span className="guestStats__value">24/7</span>
            <span className="guestStats__label">Доступ к каталогу и карте</span>
          </div>
          <div className="guestStats__item">
            <span className="guestStats__value">1 поток</span>
            <span className="guestStats__label">Создание, публикация и отклики в одном месте</span>
          </div>
        </section>

        <section className="guestSection" id="features">
          <div className="guestSection__head">
            <div className="guestLanding__badge">Преимущества</div>
            <h2 className="guestSection__title">Тёмный продуктовый лендинг с фокусом на действие</h2>
            <p className="guestSection__lead">По референсу я собрал структуру из крупных блоков, стеклянных карточек и контрастного hero-экрана.</p>
          </div>

          <div className="guestFeatureGrid">
            {featureCards.map((card) => (
              <article key={card.title} className="guestFeatureCard">
                <div className="guestFeatureCard__eyebrow">{card.eyebrow}</div>
                <div className="guestFeatureCard__title">{card.title}</div>
                <div className="guestFeatureCard__text">{card.text}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="guestSection guestSection--split" id="roles">
          <div className="guestSection__head">
            <div className="guestLanding__badge">Как работает</div>
            <h2 className="guestSection__title">Один продукт для двух сценариев</h2>
            <p className="guestSection__lead">Интерфейс помогает работодателю быстро закрыть смену, а соискателю быстро найти подработку рядом.</p>
          </div>

          <div className="guestAudienceGrid">
            {audienceCards.map((card) => (
              <article key={card.title} className="guestAudienceCard">
                <div className="guestAudienceCard__title">{card.title}</div>
                <div className="guestAudienceCard__list">
                  {card.items.map((item) => (
                    <div key={item} className="guestAudienceCard__item">
                      <span className="guestAudienceCard__dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="guestSection">
          <div className="guestSection__head">
            <div className="guestLanding__badge">Контакты</div>
            <h2 className="guestSection__title">Подключение и поддержка</h2>
          </div>

          <div className="guestSupportCard">
            <div className="guestSupportCard__text">
              {supportItems.length ? supportItems.join(' | ') : 'Контакты поддержки можно вывести здесь из настроек платформы.'}
            </div>
          </div>
        </section>

        <section className="guestSection" id="faq">
          <div className="guestSection__head">
            <div className="guestLanding__badge">FAQ</div>
            <h2 className="guestSection__title">Частые вопросы</h2>
          </div>

          <div className="guestFaq">
            {faqItems.map((item) => (
              <details key={item.question} className="guestFaq__item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="guestCta">
          <div>
            <div className="guestCta__title">Готово для входа в приложение</div>
            <div className="guestCta__text">Если хочешь найти задачу или опубликовать смену, можно перейти к регистрации уже сейчас.</div>
          </div>

          <div className="guestCta__actions">
            <button className="primaryButton" onClick={onRegister}>
              Создать аккаунт
            </button>
            <button className="ghostButton" onClick={onLogin}>
              Уже есть аккаунт
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}

