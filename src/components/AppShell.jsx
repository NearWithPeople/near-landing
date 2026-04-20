import { Icon } from './Icon'
import { Logo } from './Logo'

export function AppShell({ currentUser, currentSection, onNavigate, onLogout, children }) {
  const roleLabel = currentUser.role === 'employer' ? 'Работодатель' : currentUser.role === 'admin' ? 'Админ' : 'Пользователь'

  return (
    <div className="appFrame">
      <div className="appMain">
        <header className="appTopbar appTopbar--flat">
          <button className="appBrand appBrand--button" onClick={() => onNavigate('/app/map')}>
            <span className="brand__mark" aria-hidden>
              <Logo size={26} className="brand__img" />
            </span>
            <div>
              <div className="appBrand__title">Рядом</div>
              <div className="appBrand__subtitle">вакансии на один день</div>
            </div>
          </button>

          <div className="appTopbar__right">
            <div className="statusBadge">{roleLabel}</div>
            <button className={`profileIconButton ${currentSection === 'profile' ? 'is-active' : ''}`} onClick={() => onNavigate('/app/profile')}>
              <Icon name="user" />
            </button>
          </div>
        </header>

        <div className="appContent">{children}</div>

        <nav className="bottomNav" aria-label="Основная навигация">
          <button className={`bottomNav__item ${currentSection === 'catalog' ? 'is-active' : ''}`} onClick={() => onNavigate('/app/catalog')}>
            <Icon name="briefcase" />
            <span>Каталог</span>
          </button>
          <button className={`bottomNav__item ${currentSection === 'map' ? 'is-active' : ''}`} onClick={() => onNavigate('/app/map')}>
            <Icon name="mapPin" />
            <span>Карта</span>
          </button>
          <button className={`bottomNav__item ${currentSection === 'reviews' ? 'is-active' : ''}`} onClick={() => onNavigate('/app/reviews')}>
            <span className="appNav__dot" aria-hidden />
            <span>Отзывы</span>
          </button>
        </nav>

        <div className="appActions">
          <div className="userCard">
            <div className="userCard__name">{currentUser.companyName || currentUser.fullName}</div>
            <div className="userCard__meta">{roleLabel}</div>
          </div>
          <button className="ghostButton" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}

