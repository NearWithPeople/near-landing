import { Icon } from './Icon'
import { CustomSelect } from './CustomSelect'

export function AppShell({ currentUser, currentSection, onNavigate, children, cityOptions, selectedCity, onCityChange, onCreateVacancy, mapFilters = null }) {
  const isMapSection = currentSection === 'map'
  const keepBottomNavOnAdaptive = currentSection === 'map' || currentSection === 'vacancy'
  const primaryActionLabel = currentUser.role === 'employer' ? 'Разместить смену' : 'Создать резюме'
  const mapFiltersSlot = isMapSection ? mapFilters : null

  return (
    <div className={`appFrame ${isMapSection ? '' : 'appFrame--promo'}`}>
      <div className={`appMain ${isMapSection ? 'appMain--map' : ''}`}>
        <header className={`appTopbar appTopbar--flat ${isMapSection ? 'appTopbar--overlay' : ''}`}>
          <div className={`appTopbar__shell ${mapFiltersSlot ? 'appTopbar__shell--mapFilters' : ''}`}>
            <div className="appTopbar__mainRow">
              <div className="appTopbar__left">
              <button type="button" className="appBrand appBrand--button appBrand--header" onClick={() => onNavigate('/')}>
                <span className="appWordmark">
                  <span className="appWordmark__near">NEAR</span>
                  <span className="appWordmark__by">.by</span>
                </span>
              </button>

              <nav className="appHeaderNav" aria-label="Основная навигация">
                <button className={`appHeaderNav__item ${currentSection === 'catalog' ? 'is-active' : ''}`} onClick={() => onNavigate('/')}>
                  Вакансии
                </button>
                <button className={`appHeaderNav__item ${currentSection === 'map' ? 'is-active' : ''}`} onClick={() => onNavigate('/map')}>
                  Карта
                </button>
                <button className={`appHeaderNav__item ${currentSection === 'applications' ? 'is-active' : ''}`} onClick={() => onNavigate('/applications')}>
                  Отклики
                </button>
              </nav>
            </div>

            <div className="appTopbar__right">
              <button className="appTopbar__utility" type="button" onClick={() => onNavigate('/')}>
                <Icon name="search" className="appTopbar__utilityIcon" />
                <span>Поиск</span>
              </button>

              <div className="appTopbar__city">
                <CustomSelect
                  value={selectedCity}
                  options={cityOptions}
                  onChange={onCityChange}
                  triggerClassName="appTopbar__cityTrigger"
                  menuClassName="appTopbar__cityMenu"
                />
              </div>

              {currentUser.role === 'employer' ? (
                <button className="primaryButton appTopbar__cta" type="button" onClick={onCreateVacancy}>
                  {primaryActionLabel}
                </button>
              ) : null}

              <button className={`profileIconButton ${currentSection === 'profile' ? 'is-active' : ''}`} onClick={() => onNavigate('/profile')}>
                <Icon name="user" />
              </button>
            </div>

            <div className="appTopbar__mobileActions" aria-label="Мобильная навигация">
              <div className="appTopbar__mobileCity">
                <CustomSelect
                  value={selectedCity}
                  options={cityOptions}
                  onChange={onCityChange}
                  triggerClassName="appTopbar__mobileCityTrigger"
                  menuClassName="appTopbar__cityMenu"
                />
              </div>
              {currentUser.role === 'employer' ? (
                <button className="appTopbar__mobileCta" type="button" onClick={onCreateVacancy}>
                  Смена
                </button>
              ) : null}
              <button className={`appTopbar__mobileIcon ${currentSection === 'catalog' ? 'is-active' : ''}`} onClick={() => onNavigate('/')} aria-label="Каталог">
                <Icon name="briefcase" className="appTopbar__mobileIconGlyph" />
              </button>
              <button className={`appTopbar__mobileIcon ${currentSection === 'map' ? 'is-active' : ''}`} onClick={() => onNavigate('/map')} aria-label="Карта">
                <Icon name="mapPin" className="appTopbar__mobileIconGlyph" />
              </button>
              <button className={`appTopbar__mobileIcon ${currentSection === 'applications' ? 'is-active' : ''}`} onClick={() => onNavigate('/applications')} aria-label="Отклики">
                <Icon name="spark" className="appTopbar__mobileIconGlyph" />
              </button>
              <button className={`appTopbar__mobileIcon ${currentSection === 'profile' ? 'is-active' : ''}`} onClick={() => onNavigate('/profile')} aria-label="Профиль">
                <Icon name="user" className="appTopbar__mobileIconGlyph" />
              </button>
            </div>
            </div>

            {mapFiltersSlot ? <div className="appTopbar__filtersRow">{mapFiltersSlot}</div> : null}
          </div>
        </header>

        <div className={`appContent ${isMapSection ? 'appContent--map' : 'appContent--promo'}`}>{children}</div>

        <nav className={`bottomNav ${isMapSection ? 'bottomNav--map' : ''} ${keepBottomNavOnAdaptive ? 'bottomNav--adaptive' : ''}`.trim()} aria-label="Основная навигация">
          <button className={`bottomNav__item ${currentSection === 'catalog' ? 'is-active' : ''}`} onClick={() => onNavigate('/')}>
            <Icon name="briefcase" />
            <span>Каталог</span>
          </button>
          <button className={`bottomNav__item ${currentSection === 'map' ? 'is-active' : ''}`} onClick={() => onNavigate('/map')}>
            <Icon name="mapPin" />
            <span>Карта</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

