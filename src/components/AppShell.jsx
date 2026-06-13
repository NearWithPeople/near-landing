import { Icon } from './Icon'
import { CustomSelect } from './CustomSelect'

export function AppShell({ currentUser, currentSection, onNavigate, currentLocationName, children, cityOptions, selectedCity, onCityChange, onCreateVacancy, mapFilters = null, isVacancySelected = false }) {
  const isMapSection = currentSection === 'map'
  const keepBottomNavOnAdaptive = true // Always keep bottom nav as per request

  const getHeaderContent = () => {
    switch (currentSection) {
      case 'map':
        return {
          title: currentLocationName || 'пр. Независимости',
          subtitle: '4 вакансии поблизости ›'
        }
      case 'applications':
        return {
          title: 'Задачи',
          subtitle: '2 активные задачи'
        }
      case 'chat':
        return {
          title: 'Чат',
          subtitle: '4 вакансии поблизости ›'
        }
      case 'profile':
        return {
          title: 'Профиль',
          subtitle: currentUser?.fullName || 'Пользователь'
        }
      case 'vacancy':
        return {
          title: currentLocationName || 'Вакансия',
          subtitle: 'Детали смены'
        }
      default:
        return {
          title: 'near',
          subtitle: 'Вакансии рядом'
        }
    }
  }

  const header = getHeaderContent()

  return (
    <div className={`appFrame ${isMapSection ? '' : 'appFrame--promo'}`}>
      <div className={`appMain ${isMapSection ? 'appMain--map' : ''}`}>
        {currentSection !== 'landing' && (
          <header className="appTopbar--custom">
            <div className="appTopbar__content">
              <div className="appTopbar__location">
                <div className="appTopbar__address">{header.title}</div>
                <div className="appTopbar__nearby">{header.subtitle}</div>
              </div>
              <div className="appTopbar__balance">
                9999<span className="balance-dot"></span>
              </div>
            </div>
          </header>
        )}

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
                  '--bottom-nav-indicator-index': ['map', 'applications', 'chat', 'profile'].indexOf(currentSection)
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
                <img src="/map-icons/message-circle.png" alt="" className="bottomNav__icon" />
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

