import { Icon } from './Icon'
import { CustomSelect } from './CustomSelect'

export function AppShell({
  currentUser,
  currentSection,
  onNavigate,
  currentLocationName,
  children,
  cityOptions,
  selectedCity,
  onCityChange,
  onCreateVacancy,
  mapFilters = null,
  isVacancySelected = false,
  headerTitle,
  headerSubtitle,
  hideTopbar = false,
  chatsCount = 0,
}) {
  const resolvedChatsCount = Number(chatsCount) || 0
  const isMapSection = currentSection === 'map'
  const keepBottomNavOnAdaptive = true // Always keep bottom nav as per request

  const getHeaderContent = () => {
    switch (currentSection) {
      case 'map':
        return {
          title: currentLocationName || 'пр. Независимости',
          subtitle: '4 вакансии поблизости ›',
        }
      case 'applications':
        return {
          title: 'Отклики',
          subtitle: 'Пока нет активных откликов',
        }
      case 'chat':
        return {
          title: 'Чат',
          subtitle: `${resolvedChatsCount} ${resolvedChatsCount === 1 ? 'активный чат' : 'активных чатов'}`,
        }
      case 'profile':
        return {
          title: 'Профиль',
          subtitle:
            currentUser?.role === 'employer'
              ? currentUser?.companyName || currentUser?.fullName || 'Работодатель'
              : 'нашего звёздного специалиста',
        }
      case 'vacancy':
        return {
          title: currentLocationName || 'Вакансия',
          subtitle: 'Детали смены',
        }
      default:
        return {
          title: 'near',
          subtitle: 'Вакансии рядом',
        }
    }
  }

  const header = getHeaderContent()
  const resolvedTitle = headerTitle ?? header.title
  const resolvedSubtitle = headerSubtitle ?? header.subtitle

  return (
    <div className={`appFrame ${isMapSection ? '' : 'appFrame--promo'}`}>
      <div className={`appMain ${isMapSection ? 'appMain--map' : ''}`}>
        {currentSection !== 'landing' && !hideTopbar ? (
          <header className="appTopbar--custom">
            <div className="appTopbar__content">
              <div className="appTopbar__location">
                <div className="appTopbar__address">{resolvedTitle}</div>
                <div className="appTopbar__nearby">{resolvedSubtitle}</div>
              </div>
              <div className="appTopbar__balance">
                9999<span className="balance-dot"></span>
              </div>
            </div>
          </header>
        ) : null}

        <div className={`appContent ${isMapSection ? 'appContent--map' : 'appContent--promo'}`}>{children}</div>

        {currentSection !== 'landing' && (
          <>
            <div className="bottomNav__page-blur" aria-hidden="true"></div>
            {isMapSection ? (
              <>
                <div className="bottomNav__controls bottomNav__controls--left" aria-hidden="true">
                  <button type="button" className="bottomNav__controlButton">
                    <img src="/map-icons/funnel.png" alt="" />
                  </button>
                  <button type="button" className="bottomNav__controlButton">
                    <img src="/map-icons/list.png" alt="" />
                  </button>
                  <button type="button" className="bottomNav__controlButton">
                    <img src="/map-icons/losso.png" alt="" />
                  </button>
                </div>
                <div className="bottomNav__controls bottomNav__controls--right" aria-hidden="true">
                  <button type="button" className="bottomNav__controlButton">
                    <img src="/map-icons/locate-fixed.png" alt="" />
                  </button>
                </div>
              </>
            ) : null}
            <nav className={`bottomNav--custom ${isVacancySelected ? 'is-hidden' : 'is-visible'}`} aria-label="Основная навигация">
              <div
                className="bottomNav__active-indicator"
                style={{
                  '--bottom-nav-indicator-index': ['map', 'applications', 'chat', 'profile'].indexOf(currentSection),
                }}
              >
                <div className="bottomNav__active-outer"></div>
                <div className="bottomNav__active-bg"></div>
              </div>
              <button className={`bottomNav__item ${currentSection === 'map' ? 'is-active' : ''}`} onClick={() => onNavigate('/map')}>
                <img src="/map-icons/map-pin.png" alt="" className="bottomNav__icon" />
                <span>Карта</span>
              </button>
              <button className={`bottomNav__item ${currentSection === 'applications' ? 'is-active' : ''}`} onClick={() => onNavigate('/applications')}>
                <img src="/map-icons/notepad-text.png" alt="" className="bottomNav__icon" />
                <span>Отклики</span>
              </button>
              <button className={`bottomNav__item ${currentSection === 'chat' ? 'is-active' : ''}`} onClick={() => onNavigate('/chat')}>
                <div className="bottomNav__iconWrapper">
                  <img src="/map-icons/message-circle.png" alt="" className="bottomNav__icon" />
                  {resolvedChatsCount > 0 && (
                    <span className="bottomNav__badge">{resolvedChatsCount}</span>
                  )}
                </div>
                <span>Чат</span>
              </button>
              <button className={`bottomNav__item ${currentSection === 'profile' ? 'is-active' : ''}`} onClick={() => onNavigate('/profile')}>
                <div className="bottomNav__icon bottomNav__icon--user"></div>
                <span>Ты</span>
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
