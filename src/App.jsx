import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

import { AppShell } from './components/AppShell'
import { BELARUS_CITY_OPTIONS, DEFAULT_CITY_VALUE, getCityOption, getCityPoint } from './constants/belarusCities'
import { AuthPage } from './pages/AuthPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { CatalogPage } from './pages/CatalogPage'
import { GuestLandingPage } from './pages/GuestLandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfilePage } from './pages/ProfilePage'
import { AppMapPage } from './pages/AppMapPage'
import { VacancyPage } from './pages/VacancyPage'
import { createApplication, hasUserAppliedToVacancy, listApplicationsForEmployer, listApplicationsForUser } from './services/applicationService'
import { completeUserOnboarding, getCurrentUser, loginAccount, logoutUser, registerAccount, updateUserProfile } from './services/authService'
import { listCompletedTasksForUser, listEmployerVacancies } from './services/taskService'
import { getVacancyById, listVacancies } from './services/vacancyService'
import { buildFullName, normalizePhone } from './utils/common'
import { DEFAULT_ONBOARDING } from './utils/defaults'

const LEGACY_APP_ROUTES = {
  '/app': '/',
  '/app/catalog': '/',
  '/app/map': '/map',
  '/app/applications': '/applications',
  '/app/profile': '/profile',
}

const CITY_STORAGE_KEY = 'near_selected_city_v1'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialUser = useMemo(() => getCurrentUser(), [])
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [authError, setAuthError] = useState('')
  const [authForm, setAuthForm] = useState({
    mode: 'register',
    role: 'user',
    lastName: '',
    firstName: '',
    middleName: '',
    companyName: '',
    age: '',
    phone: '',
    email: '',
    telegramUsername: '',
  })
  const [selectedCity, setSelectedCity] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CITY_VALUE
    return localStorage.getItem(CITY_STORAGE_KEY) || DEFAULT_CITY_VALUE
  })
  const [dataVersion, setDataVersion] = useState(0)
  const [activeVacancyId, setActiveVacancyId] = useState('')
  const [catalogFilters, setCatalogFilters] = useState({
    query: '',
    payMin: 0,
    category: 'all',
    shiftDate: 'all',
    sortBy: 'relevant',
  })
  const [userPoint, setUserPoint] = useState({ lat: 53.9023, lng: 27.5619 }) // Minsk center fallback
  const [onboarding, setOnboarding] = useState(() => ({ ...DEFAULT_ONBOARDING, ...(initialUser?.onboardingData || {}) }))
  const [onboardingStep, setOnboardingStep] = useState(0)

  const selectedCityOption = useMemo(() => getCityOption(selectedCity), [selectedCity])
  const selectedCityPoint = useMemo(() => getCityPoint(selectedCity), [selectedCity])
  const searchPoint = useMemo(() => (selectedCity === 'all' ? userPoint : selectedCityPoint), [selectedCity, selectedCityPoint, userPoint])
  const mapFocusedVacancyId = useMemo(() => new URLSearchParams(location.search).get('vacancy') || '', [location.search])

  const vacancies = useMemo(() => {
    return listVacancies({
      userPoint: searchPoint,
      city: selectedCity,
      query: catalogFilters.query,
      payMin: catalogFilters.payMin,
      category: catalogFilters.category,
      shiftDate: catalogFilters.shiftDate,
      sortBy: catalogFilters.sortBy,
    })
  }, [catalogFilters.category, catalogFilters.payMin, catalogFilters.query, catalogFilters.shiftDate, catalogFilters.sortBy, dataVersion, searchPoint, selectedCity])

  const userApplications = useMemo(() => {
    if (!currentUser || currentUser.role !== 'user') return []
    return listApplicationsForUser(currentUser.id)
  }, [currentUser, dataVersion])

  const applications = useMemo(() => {
    if (!currentUser) return []
    return currentUser.role === 'employer' ? listApplicationsForEmployer(currentUser.id) : listApplicationsForUser(currentUser.id)
  }, [currentUser, dataVersion])
  const completedTasks = useMemo(() => (currentUser ? listCompletedTasksForUser(currentUser.id) : []), [currentUser, dataVersion])
  const employerVacancies = useMemo(() => (currentUser ? listEmployerVacancies(currentUser.id) : []), [currentUser, dataVersion])
  const appliedVacancyIds = useMemo(() => userApplications.map((application) => application.vacancyId), [userApplications])

  const selectedVacancyId = useMemo(() => {
    return vacancies.some((vacancy) => vacancy.id === activeVacancyId) ? activeVacancyId : ''
  }, [vacancies, activeVacancyId])

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    localStorage.setItem(CITY_STORAGE_KEY, selectedCity)
  }, [selectedCity])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search])

  useEffect(() => {
    if (location.pathname !== '/auth') return
    const nextMode = new URLSearchParams(location.search).get('mode')
    if (nextMode !== 'login' && nextMode !== 'register') return
    setAuthForm((prev) => (prev.mode === nextMode ? prev : { ...prev, mode: nextMode }))
  }, [location.pathname, location.search])

  function handleAuthSubmit(e) {
    e.preventDefault()

    if (authForm.mode === 'login') {
      const phone = normalizePhone(authForm.phone)
      const email = authForm.email.trim()

      if (!phone && !email) {
        setAuthError('Укажи телефон или email для входа.')
        return
      }

      const user = loginAccount({
        role: authForm.role,
        phone,
        email,
      })

      if (!user) {
        setAuthError('Пользователь не найден. Проверь данные или зарегистрируйся.')
        return
      }

      setCurrentUser(user)
      setAuthError('')
      setOnboarding({ ...DEFAULT_ONBOARDING, ...(user.onboardingData || {}) })
      setOnboardingStep(0)
      navigate(user.onboardingCompleted ? '/' : '/onboarding')
      return
    }

    const fullName = buildFullName({
      lastName: authForm.lastName,
      firstName: authForm.firstName,
      middleName: authForm.middleName,
    })

    const payload = {
      role: authForm.role,
      fullName,
      companyName: authForm.companyName.trim(),
      age: authForm.role === 'user' ? Number(authForm.age) : null,
      phone: normalizePhone(authForm.phone),
      email: authForm.email.trim(),
      telegramUsername: authForm.telegramUsername.trim(),
    }

    if (!authForm.lastName.trim() || !authForm.firstName.trim() || !payload.phone || !payload.email || (payload.role === 'employer' && !payload.companyName)) {
      setAuthError('Заполните все обязательные поля.')
      return
    }

    if (payload.role === 'user' && (!Number.isFinite(payload.age) || payload.age < 16)) {
      setAuthError('Искать работу через приложение можно с 16 лет.')
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
    if (field === 'mode') {
      navigate(`/auth?mode=${value}`, { replace: true })
    }
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
    navigate('/')
  }

  function handleLogout() {
    logoutUser()
    setCurrentUser(null)
    setOnboarding(DEFAULT_ONBOARDING)
    setOnboardingStep(0)
    navigate('/', { replace: true })
  }

  function handleApplyToVacancy(vacancyId) {
    if (!currentUser || currentUser.role !== 'user') return
    if (hasUserAppliedToVacancy(currentUser.id, vacancyId)) return
    createApplication({ vacancyId, applicantId: currentUser.id })
    setDataVersion((prev) => prev + 1)
  }

  function handleProfileSave(profileForm) {
    if (!currentUser) return
    const updatedUser = updateUserProfile(currentUser.id, {
      fullName: buildFullName({
        lastName: profileForm.lastName,
        firstName: profileForm.firstName,
        middleName: profileForm.middleName,
      }),
      age: currentUser.role === 'user' ? Number(profileForm.age) : currentUser.age,
      phone: normalizePhone(profileForm.phone),
      email: profileForm.email.trim(),
      telegramUsername: profileForm.telegramUsername.trim(),
      review: profileForm.review.trim(),
    })
    setCurrentUser(updatedUser)
    setDataVersion((prev) => prev + 1)
  }

  useEffect(() => {
    if (!currentUser) return

    const isLegacyAppRoute = Object.hasOwn(LEGACY_APP_ROUTES, location.pathname)
    const isProtectedRoute = ['/', '/catalog', '/map', '/applications', '/profile'].includes(location.pathname) || location.pathname.startsWith('/vacancy/')

    if (!currentUser.onboardingCompleted && (isProtectedRoute || isLegacyAppRoute)) {
      navigate('/onboarding', { replace: true })
      return
    }

    if (isLegacyAppRoute && currentUser.onboardingCompleted) {
      navigate(LEGACY_APP_ROUTES[location.pathname], { replace: true })
      return
    }

    if (currentUser.onboardingCompleted && (location.pathname === '/auth' || location.pathname === '/onboarding')) {
      navigate('/', { replace: true })
    }
  }, [currentUser, location.pathname, navigate])

  useEffect(() => {
    if (location.pathname !== '/map') return
    const focusedVacancyId = new URLSearchParams(location.search).get('vacancy')
    if (!focusedVacancyId) return
    if (vacancies.some((vacancy) => vacancy.id === focusedVacancyId)) {
      setActiveVacancyId(focusedVacancyId)
    }
  }, [location.pathname, location.search, vacancies])

  function renderAppPage(section) {
    if (!currentUser) return <Navigate to="/" replace />
    if (!currentUser.onboardingCompleted) return <Navigate to="/onboarding" replace />

    return (
      <AppShell
        currentUser={currentUser}
        currentSection={section}
        onNavigate={navigate}
        cityOptions={BELARUS_CITY_OPTIONS.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      >
        {section === 'map' ? (
          <AppMapPage
            vacancies={vacancies}
            selectedVacancyId={selectedVacancyId}
            onSelect={setActiveVacancyId}
            onOpenVacancy={(vacancyId) => navigate(`/vacancy/${vacancyId}`)}
            autoOpenVacancyId={mapFocusedVacancyId}
            filters={catalogFilters}
            onFilterChange={(field, value) => setCatalogFilters((prev) => ({ ...prev, [field]: value }))}
            selectedCityLabel={selectedCityOption.label}
            selectedCityPoint={selectedCityPoint}
          />
        ) : null}
        {section === 'catalog' ? (
          <CatalogPage
            filters={catalogFilters}
            onFilterChange={(field, value) => setCatalogFilters((prev) => ({ ...prev, [field]: value }))}
            vacancies={vacancies}
            onShowMap={() => navigate('/map')}
            selectedCity={selectedCity}
            cityOptions={BELARUS_CITY_OPTIONS.map(({ value, label }) => ({ value, label }))}
            onCityChange={setSelectedCity}
            selectedCityLabel={selectedCityOption.label}
            currentUser={currentUser}
            appliedVacancyIds={appliedVacancyIds}
            onApplyToVacancy={handleApplyToVacancy}
            onOpenVacancy={(vacancyId) => navigate(`/vacancy/${vacancyId}`)}
          />
        ) : null}
        {section === 'applications' ? (
          <ApplicationsPage currentUser={currentUser} applications={applications} onGoToCatalog={() => navigate('/')} onOpenVacancy={(vacancyId) => navigate(`/vacancy/${vacancyId}`)} />
        ) : null}
        {section === 'profile' ? (
          <ProfilePage
            currentUser={currentUser}
            completedTasks={completedTasks}
            employerVacancies={employerVacancies}
            onGoToCatalog={() => navigate('/')}
            onLogout={handleLogout}
            onSaveProfile={handleProfileSave}
          />
        ) : null}
      </AppShell>
    )
  }

  function VacancyPageRoute() {
    const { vacancyId } = useParams()
    const vacancy = getVacancyById(vacancyId, searchPoint)
    const relatedVacancies = vacancies.filter((item) => item.id !== vacancyId).slice(0, 3)

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="vacancy"
        onNavigate={navigate}
        cityOptions={BELARUS_CITY_OPTIONS.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      >
        <VacancyPage
          vacancy={vacancy}
          currentUser={currentUser}
          hasApplied={vacancy ? appliedVacancyIds.includes(vacancy.id) : false}
          onApply={handleApplyToVacancy}
          onBackToCatalog={() => navigate('/')}
          onOpenVacancy={(nextVacancyId) => navigate(`/vacancy/${nextVacancyId}`)}
          onShowOnMap={(nextVacancyId) => navigate(`/map?vacancy=${nextVacancyId}`)}
          relatedVacancies={relatedVacancies}
        />
      </AppShell>
    )
  }

  return (
    <div className="site">
      <main className="site__main" id="start">
        <Routes>
          <Route
            path="/"
            element={
              currentUser ? renderAppPage('catalog') : <GuestLandingPage onLogin={() => navigate('/auth?mode=login')} onRegister={() => navigate('/auth?mode=register')} />
            }
          />
          <Route path="/auth" element={currentUser ? <Navigate to={currentUser.onboardingCompleted ? '/' : '/onboarding'} replace /> : <AuthPage form={authForm} error={authError} onChange={handleAuthFieldChange} onSubmit={handleAuthSubmit} />} />
          <Route
            path="/onboarding"
            element={
              !currentUser ? <Navigate to="/" replace /> : currentUser.onboardingCompleted ? <Navigate to="/" replace /> : <OnboardingPage role={currentUser.role} step={onboardingStep} onStepChange={setOnboardingStep} values={onboarding} onChange={(field, value) => setOnboarding((prev) => ({ ...prev, [field]: value }))} onFinish={onboardingFinish} />
            }
          />
          <Route path="/catalog" element={renderAppPage('catalog')} />
          <Route path="/map" element={renderAppPage('map')} />
          <Route path="/applications" element={renderAppPage('applications')} />
          <Route path="/profile" element={renderAppPage('profile')} />
          <Route path="/vacancy/:vacancyId" element={<VacancyPageRoute />} />
          <Route path="/app" element={<Navigate to="/" replace />} />
          <Route path="/app/catalog" element={<Navigate to="/" replace />} />
          <Route path="/app/map" element={<Navigate to="/map" replace />} />
          <Route path="/app/applications" element={<Navigate to="/applications" replace />} />
          <Route path="/app/profile" element={<Navigate to="/profile" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
