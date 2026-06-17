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
  lassoActive = false,
  onLassoToggle,
  onMapNearbyClick,
  onMapListClick,
}) {
  const resolvedChatsCount = Number(chatsCount) || 0
  const isEmployer = currentUser?.role === 'employer'
  const isMapSection = currentSection === 'map'
  const keepBottomNavOnAdaptive = true // Always keep bottom nav as per request

  const getHeaderContent = () => {
    switch (currentSection) {
      case 'map':
        return {
          title: currentLocationName || 'пр. Независимости',
          subtitle: 'нет вакансий поблизости',
        }
      case 'applications':
        return isEmployer
          ? {
              title: 'Смены',
              subtitle: 'Нет активных смен',
            }
          : {
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
          title: isEmployer ? 'Компания' : 'Профиль',
          subtitle: isEmployer
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
                {isMapSection && onMapNearbyClick ? (
                  <button type="button" className="appTopbar__nearby" onClick={onMapNearbyClick}>
                    {resolvedSubtitle}
                  </button>
                ) : (
                  <div className="appTopbar__nearby">{resolvedSubtitle}</div>
                )}
              </div>
              {!isEmployer ? (
                <div className="appTopbar__balance">
                  9999<span className="balance-dot"></span>
                </div>
              ) : null}
            </div>
          </header>
        ) : null}

        <div className={`appContent ${isMapSection ? 'appContent--map' : 'appContent--promo'}`}>{children}</div>

        {currentSection !== 'landing' && (
          <>
            <div className="bottomNav__page-blur" aria-hidden="true"></div>
            {isMapSection ? (
              <>
                <div className="bottomNav__controls bottomNav__controls--left">
                  <button type="button" className="bottomNav__controlButton" aria-label="Фильтры">
                    <img src="/map-icons/funnel.png" alt="" />
                  </button>
                  <button type="button" className="bottomNav__controlButton" aria-label="Список вакансий на экране" onClick={onMapListClick}>
                    <img src="/map-icons/list.png" alt="" />
                  </button>
                  <button type="button" className={`bottomNav__controlButton ${lassoActive ? 'is-active' : ''}`} aria-label="Выделение лассо" onClick={onLassoToggle}>
                    <img src="/map-icons/losso.png" alt="" />
                  </button>
                </div>
                <div className="bottomNav__controls bottomNav__controls--right">
                  <button type="button" className="bottomNav__controlButton" aria-label="Моё местоположение">
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
                <span>{isEmployer ? 'Смены' : 'Отклики'}</span>
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
                <span>{isEmployer ? 'Компания' : 'Ты'}</span>
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
