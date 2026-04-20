import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

const TG_URL = 'https://t.me/nearbelapp'
const IG_URL = 'https://www.instagram.com/nearapp.by/'

import { AppShell } from './components/AppShell'
import { AuthPage } from './pages/AuthPage'
import { CatalogPage } from './pages/CatalogPage'
import { GuestLandingPage } from './pages/GuestLandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import { ReviewsPage } from './pages/ReviewsPage'
import { AppMapPage } from './pages/AppMapPage'
import { completeUserOnboarding, getCurrentUser, logoutUser, registerAccount } from './services/authService'
import { DB_SCHEMA } from './services/dbSchema'
import { listReviews } from './services/reviewService'
import { listCompletedTasksForUser, listEmployerVacancies } from './services/taskService'
import { listVacancies } from './services/vacancyService'
import { normalizePhone } from './utils/common'
import { DEFAULT_ONBOARDING } from './utils/defaults'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialUser = useMemo(() => getCurrentUser(), [])
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [authError, setAuthError] = useState('')
  const [authForm, setAuthForm] = useState({
    role: 'user',
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
  })
  const [activeVacancyId, setActiveVacancyId] = useState('vac_1')
  const [catalogFilters, setCatalogFilters] = useState({
    query: '',
    payMin: 0,
    category: 'all',
  })
  const [userPoint, setUserPoint] = useState({ lat: 53.9023, lng: 27.5619 }) // Minsk center fallback
  const [onboarding, setOnboarding] = useState(() => ({ ...DEFAULT_ONBOARDING, ...(initialUser?.onboardingData || {}) }))
  const [onboardingStep, setOnboardingStep] = useState(0)

  const vacancies = useMemo(() => {
    return listVacancies({
      userPoint,
      query: catalogFilters.query,
      payMin: catalogFilters.payMin,
      category: catalogFilters.category,
    })
  }, [catalogFilters.category, catalogFilters.payMin, catalogFilters.query, userPoint])

  const reviews = useMemo(() => listReviews(), [])
  const completedTasks = useMemo(() => (currentUser ? listCompletedTasksForUser(currentUser.id) : []), [currentUser])
  const employerVacancies = useMemo(() => (currentUser ? listEmployerVacancies(currentUser.id) : []), [currentUser])

  const selectedVacancyId = useMemo(() => {
    return vacancies.some((vacancy) => vacancy.id === activeVacancyId) ? activeVacancyId : vacancies[0]?.id || ''
  }, [vacancies, activeVacancyId])

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    )
  }, [])

  function handleAuthSubmit(e) {
    e.preventDefault()

    const payload = {
      role: authForm.role,
      fullName: authForm.fullName.trim(),
      companyName: authForm.companyName.trim(),
      phone: normalizePhone(authForm.phone),
      email: authForm.email.trim(),
    }

    if (!payload.fullName || !payload.phone || !payload.email || (payload.role === 'employer' && !payload.companyName)) {
      setAuthError('Заполните все обязательные поля.')
      return
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    if (!emailOk) {
      setAuthError('Проверьте email.')
      return
    }

    const user = registerAccount(payload)
    setCurrentUser(user)
    setAuthError('')
    setOnboarding(DEFAULT_ONBOARDING)
    setOnboardingStep(0)
    navigate('/onboarding')
  }

  function handleAuthFieldChange(field, value) {
    setAuthForm((prev) => ({ ...prev, [field]: value }))
    if (authError) setAuthError('')
  }

  function onboardingFinish() {
    if (!currentUser) return
    const updated = completeUserOnboarding(currentUser.id, onboarding)
    setCurrentUser(updated)
    setCatalogFilters((prev) => ({
      ...prev,
      payMin: Number(onboarding.payMin || 0),
    }))
    navigate('/app/map')
  }

  function handleLogout() {
    logoutUser()
    setCurrentUser(null)
    navigate('/')
  }

  useEffect(() => {
    if (!currentUser) return
    if (!currentUser.onboardingCompleted && location.pathname.startsWith('/app')) {
      navigate('/onboarding', { replace: true })
      return
    }
    if (currentUser.onboardingCompleted && (location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/onboarding')) {
      navigate('/app/map', { replace: true })
    }
  }, [currentUser, location.pathname, navigate])

  const schemaSummary = `${DB_SCHEMA.tables.users.length} fields in users • roles: ${DB_SCHEMA.roles.join(', ')}`

  function renderAppPage(section) {
    if (!currentUser) return <Navigate to="/" replace />
    if (!currentUser.onboardingCompleted) return <Navigate to="/onboarding" replace />

    return (
      <AppShell currentUser={currentUser} currentSection={section} onNavigate={navigate} onLogout={handleLogout}>
        <div className="heroStrip">
          <div>
            <div className="heroStrip__title">Тёмная веб‑приложуха вакансий</div>
            <div className="heroStrip__meta">{schemaSummary}</div>
          </div>
          <div className="heroStrip__badge">black + yellow ui</div>
        </div>

        {section === 'map' ? (
          <AppMapPage
            vacancies={vacancies}
            selectedVacancyId={selectedVacancyId}
            onSelect={setActiveVacancyId}
            onShowCatalog={() => navigate('/app/catalog')}
          />
        ) : null}
        {section === 'catalog' ? (
          <CatalogPage
            filters={catalogFilters}
            onFilterChange={(field, value) => setCatalogFilters((prev) => ({ ...prev, [field]: value }))}
            vacancies={vacancies}
            onShowMap={() => navigate('/app/map')}
          />
        ) : null}
        {section === 'reviews' ? <ReviewsPage reviews={reviews} currentUser={currentUser} /> : null}
        {section === 'profile' ? (
          <ProfilePage
            currentUser={currentUser}
            completedTasks={completedTasks}
            employerVacancies={employerVacancies}
            onGoToCatalog={() => navigate('/app/catalog')}
          />
        ) : null}
      </AppShell>
    )
  }

  return (
    <div className="site">
      <main className="site__main" id="start">
        <Routes>
          <Route path="/" element={currentUser ? <Navigate to={currentUser.onboardingCompleted ? '/app/map' : '/onboarding'} replace /> : <GuestLandingPage onEnter={() => navigate('/auth')} />} />
          <Route path="/auth" element={currentUser ? <Navigate to={currentUser.onboardingCompleted ? '/app/map' : '/onboarding'} replace /> : <AuthPage form={authForm} error={authError} onChange={handleAuthFieldChange} onSubmit={handleAuthSubmit} />} />
          <Route
            path="/onboarding"
            element={
              !currentUser ? <Navigate to="/" replace /> : currentUser.onboardingCompleted ? <Navigate to="/app/map" replace /> : <OnboardingPage role={currentUser.role} step={onboardingStep} onStepChange={setOnboardingStep} values={onboarding} onChange={(field, value) => setOnboarding((prev) => ({ ...prev, [field]: value }))} onFinish={onboardingFinish} />
            }
          />
          <Route path="/app" element={<Navigate to="/app/map" replace />} />
          <Route path="/app/map" element={renderAppPage('map')} />
          <Route path="/app/catalog" element={renderAppPage('catalog')} />
          <Route path="/app/reviews" element={renderAppPage('reviews')} />
          <Route path="/app/profile" element={renderAppPage('profile')} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
