function AppNavigation({
  currentSection,
  isEmployer,
  resolvedChatsCount,
  onNavigate,
  variant = 'bottom',
}) {
  const isRail = variant === 'rail'
  const itemClassName = isRail ? 'desktopRail__item' : 'bottomNav__item'
  const iconClassName = isRail ? 'desktopRail__icon' : 'bottomNav__icon'
  const iconWrapperClassName = isRail ? 'desktopRail__iconWrapper' : 'bottomNav__iconWrapper'
  const badgeClassName = isRail ? 'desktopRail__badge' : 'bottomNav__badge'
  const userIconClassName = isRail ? 'desktopRail__icon desktopRail__icon--user' : 'bottomNav__icon bottomNav__icon--user'
  const labelClassName = isRail ? 'desktopRail__label' : undefined

  function renderItem(section, label, iconSrc, onClick) {
    const isActive = currentSection === section

    return (
      <button
        type="button"
        className={`${itemClassName}${isActive ? ' is-active' : ''}`}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
      >
        <img src={iconSrc} alt="" className={iconClassName} />
        <span className={labelClassName}>{label}</span>
      </button>
    )
  }

  return (
    <>
      {!isRail ? (
        <div
          className="bottomNav__active-indicator"
          style={{
            '--bottom-nav-indicator-index': ['map', 'applications', 'chat', 'profile'].indexOf(currentSection),
          }}
        >
          <div className="bottomNav__active-outer"></div>
          <div className="bottomNav__active-bg"></div>
        </div>
      ) : null}

      {renderItem('map', 'Карта', '/map-icons/map-pin.png', () => onNavigate('/map'))}
      {renderItem(
        'applications',
        isEmployer ? 'Смены' : 'Отклики',
        '/map-icons/notepad-text.png',
        () => onNavigate('/applications')
      )}
      <button
        type="button"
        className={`${itemClassName}${currentSection === 'chat' ? ' is-active' : ''}`}
        onClick={() => onNavigate('/chat')}
        aria-current={currentSection === 'chat' ? 'page' : undefined}
      >
        <div className={iconWrapperClassName}>
          <img src="/map-icons/message-circle.png" alt="" className={iconClassName} />
          {resolvedChatsCount > 0 ? <span className={badgeClassName}>{resolvedChatsCount}</span> : null}
        </div>
        <span className={labelClassName}>Чат</span>
      </button>
      <button
        type="button"
        className={`${itemClassName}${currentSection === 'profile' ? ' is-active' : ''}`}
        onClick={() => onNavigate('/profile')}
        aria-current={currentSection === 'profile' ? 'page' : undefined}
      >
        <div className={userIconClassName}></div>
        <span className={labelClassName}>{isEmployer ? 'Компания' : 'Ты'}</span>
      </button>
    </>
  )
}

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
  isMapFiltersOpen = false,
  onMapFiltersOpenChange,
  lassoSelectionCount = 0,
  hasLassoZoneActive = false,
  onClearLassoSelection,
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
  const hasLassoZone = lassoActive || hasLassoZoneActive

  function handleLassoControlClick() {
    if (hasLassoZone) {
      onClearLassoSelection?.()
      return
    }

    onLassoToggle?.()
  }

  return (
    <div className={`appFrame ${isMapSection ? '' : 'appFrame--promo'}`}>
      {currentSection !== 'landing' ? (
        <aside className={`desktopRail ${isVacancySelected ? 'is-hidden' : ''}`} aria-label="Основная навигация">
          
          <nav className="desktopRail__nav">
            <AppNavigation
              currentSection={currentSection}
              isEmployer={isEmployer}
              resolvedChatsCount={resolvedChatsCount}
              onNavigate={onNavigate}
              variant="rail"
            />
          </nav>
        </aside>
      ) : null}

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

        {isMapSection && lassoSelectionCount > 0 ? (
          <div className="mapLassoBadge">
            <span>{lassoSelectionCount} в области</span>
            <button type="button" onClick={onClearLassoSelection}>
              Сбросить
            </button>
          </div>
        ) : null}

        <div className={`appContent ${isMapSection ? 'appContent--map' : 'appContent--promo'}`}>{children}</div>

        {isMapSection && mapFilters ? mapFilters : null}

        {currentSection !== 'landing' && (
          <>
            <div className="bottomNav__page-blur" aria-hidden="true"></div>
            {isMapSection ? (
              <>
                <div className="bottomNav__controls bottomNav__controls--left">
                  <button
                    type="button"
                    className={`bottomNav__controlButton bottomNav__controlButton--filters${isMapFiltersOpen ? ' is-active' : ''}`}
                    aria-label="Фильтры"
                    onClick={() => onMapFiltersOpenChange?.(true)}
                  >
                    <img src="/map-icons/funnel.png" alt="" />
                  </button>
                  <button type="button" className="bottomNav__controlButton" aria-label="Список вакансий на экране" onClick={onMapListClick}>
                    <img src="/map-icons/list.png" alt="" />
                  </button>
                  <button
                    type="button"
                    className={`bottomNav__controlButton bottomNav__controlButton--lasso${hasLassoZone ? ' is-active' : ''}${hasLassoZone ? ' is-clear' : ''}`}
                    aria-label={hasLassoZone ? 'Сбросить выделение' : 'Выделение лассо'}
                    onClick={handleLassoControlClick}
                  >
                    {hasLassoZone ? (
                      <span className="bottomNav__controlClose" aria-hidden="true">
                        ×
                      </span>
                    ) : (
                      <img src="/map-icons/losso.png" alt="" />
                    )}
                  </button>
                </div>
                <div className="bottomNav__controls bottomNav__controls--right">
                  <button type="button" className="bottomNav__controlButton" aria-label="Моё местоположение">
                    <img src="/map-icons/locate-fixed.png" alt="" />
                  </button>
                </div>
              </>
            ) : null}
            <nav
              className={`bottomNav--custom bottomNav--mobile ${isVacancySelected ? 'is-hidden' : 'is-visible'}`}
              aria-label="Основная навигация"
            >
              <AppNavigation
                currentSection={currentSection}
                isEmployer={isEmployer}
                resolvedChatsCount={resolvedChatsCount}
                onNavigate={onNavigate}
                variant="bottom"
              />
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
