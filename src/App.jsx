import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

import { AppShell } from './components/AppShell'
import { MapFiltersToolbar } from './components/MapFiltersToolbar'
import { BELARUS_CITY_OPTIONS, DEFAULT_CITY_VALUE, getCityOption, getCityPoint } from './constants/belarusCities'
import { CONTACTS_PATH, FAQ_PATH, PRIVACY_PATH } from './constants/legalPages'
import { AuthPage } from './pages/AuthPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { CatalogPage } from './pages/CatalogPage'
import { EmployerVacancyFormPage } from './pages/EmployerVacancyFormPage'
import { EmployerVacancyManagePage } from './pages/EmployerVacancyManagePage'
import { GuestLandingPage } from './pages/GuestLandingPage'
import { ProfilePage } from './pages/ProfilePage'
import { AppMapPage } from './pages/AppMapPage'
import { StaticInfoPage } from './pages/StaticInfoPage'
import { VacancyPage } from './pages/VacancyPage'
import { createApplication, hasUserAppliedToVacancy, listApplicationsForEmployer, listApplicationsForUser, listApplicationsForVacancy } from './services/applicationService'
import { getCurrentUser, loginAccount, logoutUser, registerAccount, updateUserProfile } from './services/authService'
import { loadAppBootstrap } from './services/appService'
import { loadSiteContent } from './services/siteService'
import { listCompletedTasksForUser, listEmployerVacancies, rateCompletedTask } from './services/taskService'
import { archiveVacancy, createVacancy, getVacancyById, listVacancies } from './services/vacancyService'
import { buildFullName, isBelarusPhone, normalizePhone } from './utils/common'

const LEGACY_APP_ROUTES = {
  '/app': '/',
  '/app/catalog': '/',
  '/app/map': '/map',
  '/app/applications': '/applications',
  '/app/profile': '/profile',
  '/app/faq': FAQ_PATH,
  '/app/contacts': CONTACTS_PATH,
  '/app/privacy': PRIVACY_PATH,
}

const CITY_STORAGE_KEY = 'near_selected_city_v1'
const DEFAULT_SITE_CONTENT = {
  landingPage: {
    guestBadge: 'Гостевой экран',
    guestTitle: 'Веб-приложение для вакансий и подработки рядом',
    guestLead: 'После входа откроется рабочее приложение: роли пользователь/работодатель, карта вакансий, каталог и отзывы.',
    loginLabel: 'Войти',
    registerLabel: 'Зарегистрироваться',
  },
  settings: {
    supportEmail: '',
    supportPhone: '',
    supportTelegram: '',
  },
  stats: {
    openVacancies: 0,
  },
}

const FALLBACK_CITY_OPTIONS = BELARUS_CITY_OPTIONS.filter((city) => city.value !== 'all')
const FALLBACK_CATEGORY_OPTIONS = [
  { value: 'all', label: 'Все категории' },
  { value: 'Курьер', label: 'Курьер' },
  { value: 'Склад', label: 'Склад' },
  { value: 'Промо', label: 'Промо' },
  { value: 'HoReCa', label: 'HoReCa' },
  { value: 'Подсобные', label: 'Подсобные' },
]
const FALLBACK_PAY_OPTIONS = [
  { value: '0', label: 'Любая ставка' },
  { value: '40', label: 'От 40 BYN' },
  { value: '60', label: 'От 60 BYN' },
  { value: '80', label: 'От 80 BYN' },
]

function normalizeSelectOptions(options, fallbackOptions) {
  if (!Array.isArray(options)) return fallbackOptions

  const seenValues = new Set()
  const normalized = options
    .map((option) => ({
      value: String(option?.value ?? '').trim(),
      label: String(option?.label ?? '').trim(),
    }))
    .filter((option) => option.value && option.label)
    .filter((option) => {
      if (seenValues.has(option.value)) return false
      seenValues.add(option.value)
      return true
    })

  return normalized.length ? normalized : fallbackOptions
}

function normalizeCityOptions(options) {
  const fallbackByValue = new Map(BELARUS_CITY_OPTIONS.map((city) => [city.value, city]))
  const fallbackDefault = fallbackByValue.get(DEFAULT_CITY_VALUE)
  const normalized = normalizeSelectOptions(options, FALLBACK_CITY_OPTIONS)

  return normalized.map((option) => {
    const fallback =
      fallbackByValue.get(option.value) ||
      BELARUS_CITY_OPTIONS.find((city) => city.label === option.label) ||
      fallbackDefault

    return {
      ...option,
      lat: fallback?.lat ?? fallbackDefault.lat,
      lng: fallback?.lng ?? fallbackDefault.lng,
      zoom: fallback?.zoom ?? fallbackDefault.zoom,
    }
  })
}

function normalizeCategoryOptions(options) {
  const normalized = normalizeSelectOptions(options, FALLBACK_CATEGORY_OPTIONS.slice(1))
  return [{ value: 'all', label: 'Все категории' }, ...normalized.filter((option) => option.value !== 'all')]
}

function normalizePayOptions(options) {
  const normalized = normalizeSelectOptions(options, FALLBACK_PAY_OPTIONS.slice(1)).map((option) => ({
    value: String(option.value),
    label: option.label,
  }))

  return [{ value: '0', label: 'Любая ставка' }, ...normalized.filter((option) => option.value !== '0')]
}

function normalizeAppFilters(filters) {
  const cityOptions = normalizeCityOptions(filters?.cityOptions)
  const defaultCity = cityOptions.some((city) => city.value === filters?.defaultCity) ? filters.defaultCity : cityOptions[0]?.value || DEFAULT_CITY_VALUE

  return {
    defaultCity,
    cityOptions,
    categoryOptions: normalizeCategoryOptions(filters?.categoryOptions),
    payOptions: normalizePayOptions(filters?.payOptions),
  }
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialUser = useMemo(() => getCurrentUser(), [])
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [authError, setAuthError] = useState('')
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [remoteData, setRemoteData] = useState({
    vacancies: [],
    applications: [],
    completedTasks: [],
    employerCompletedTasks: [],
    employerVacancies: [],
  })
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT)
  const [appFilters, setAppFilters] = useState(() => normalizeAppFilters())
  const [authForm, setAuthForm] = useState({
    mode: 'register',
    role: 'seeker',
    lastName: '',
    firstName: '',
    middleName: '',
    companyName: '',
    age: '',
    phone: '',
    email: '',
    telegramUsername: '',
    password: '',
    acceptedLegal: false,
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
  const currentUserId = currentUser?.id || ''

  const selectedCityOption = useMemo(() => getCityOption(selectedCity, appFilters.cityOptions), [appFilters.cityOptions, selectedCity])
  const selectedCityPoint = useMemo(() => getCityPoint(selectedCity, appFilters.cityOptions), [appFilters.cityOptions, selectedCity])
  const searchPoint = useMemo(() => (selectedCity === 'all' ? userPoint : selectedCityPoint), [selectedCity, selectedCityPoint, userPoint])
  const mapFocusedVacancyId = useMemo(() => new URLSearchParams(location.search).get('vacancy') || '', [location.search])

  const vacancies = useMemo(() => {
    return listVacancies({
      vacancies: remoteData.vacancies,
      userPoint: searchPoint,
      city: selectedCity,
      cityOptions: appFilters.cityOptions,
      query: catalogFilters.query,
      payMin: catalogFilters.payMin,
      category: catalogFilters.category,
      shiftDate: catalogFilters.shiftDate,
      sortBy: catalogFilters.sortBy,
    })
  }, [appFilters.cityOptions, catalogFilters.category, catalogFilters.payMin, catalogFilters.query, catalogFilters.shiftDate, catalogFilters.sortBy, remoteData.vacancies, searchPoint, selectedCity])

  const userApplications = useMemo(() => {
    if (!currentUser || currentUser.role !== 'seeker') return []
    return listApplicationsForUser(remoteData.applications, currentUser.id)
  }, [currentUser, remoteData.applications])

  const applications = useMemo(() => {
    if (!currentUser) return []
    return currentUser.role === 'employer' ? listApplicationsForEmployer(remoteData.applications, currentUser.id) : listApplicationsForUser(remoteData.applications, currentUser.id)
  }, [currentUser, remoteData.applications])
  const completedTasks = useMemo(() => (currentUser ? listCompletedTasksForUser(remoteData.completedTasks, currentUser.id) : []), [currentUser, remoteData.completedTasks])
  const employerVacancies = useMemo(() => (currentUser ? listEmployerVacancies(remoteData.employerVacancies, currentUser.id) : []), [currentUser, remoteData.employerVacancies])
  const employerCompletedTasks = useMemo(() => [...(remoteData.employerCompletedTasks || [])], [remoteData.employerCompletedTasks])
  const appliedVacancyIds = useMemo(() => userApplications.map((application) => application.vacancyId), [userApplications])

  const selectedVacancyId = useMemo(() => {
    return vacancies.some((vacancy) => vacancy.id === activeVacancyId) ? activeVacancyId : ''
  }, [vacancies, activeVacancyId])

  useEffect(() => {
    let cancelled = false

    async function syncSiteContent() {
      try {
        const payload = await loadSiteContent()
        if (cancelled || !payload) return
        setSiteContent({
          landingPage: {
            ...DEFAULT_SITE_CONTENT.landingPage,
            ...(payload.landingPage || {}),
          },
          settings: {
            ...DEFAULT_SITE_CONTENT.settings,
            ...(payload.settings || {}),
          },
          stats: {
            ...DEFAULT_SITE_CONTENT.stats,
            ...(payload.stats || {}),
          },
        })
      } catch {
        if (cancelled) return
      }
    }

    syncSiteContent()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    let cancelled = false

    async function syncAppData() {
      if (!currentUserId) {
        if (!cancelled) {
          setRemoteData({
            vacancies: [],
            applications: [],
            completedTasks: [],
            employerCompletedTasks: [],
            employerVacancies: [],
          })
        }
        return
      }

      try {
        const payload = await loadAppBootstrap()
        if (cancelled) return

        if (!payload?.currentUser) {
          logoutUser()
          setCurrentUser(null)
          setRemoteData({
            vacancies: [],
            applications: [],
            completedTasks: [],
            employerCompletedTasks: [],
            employerVacancies: [],
          })
          return
        }

        setCurrentUser(payload.currentUser)
        setAppFilters(normalizeAppFilters(payload.filters))
        setRemoteData({
          vacancies: payload.vacancies || [],
          applications: payload.applications || [],
          completedTasks: payload.completedTasks || [],
          employerCompletedTasks: payload.employerCompletedTasks || [],
          employerVacancies: payload.employerVacancies || [],
        })
      } catch {
        if (cancelled) return
      }
    }

    syncAppData()

    return () => {
      cancelled = true
    }
  }, [currentUserId, dataVersion])

  useEffect(() => {
    if (!appFilters.cityOptions.length) return
    if (appFilters.cityOptions.some((city) => city.value === selectedCity)) return
    setSelectedCity(appFilters.defaultCity)
  }, [appFilters.cityOptions, appFilters.defaultCity, selectedCity])

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
    setAuthForm((prev) => {
      if (prev.mode === nextMode) return prev
      return { ...prev, mode: nextMode, ...(nextMode === 'register' ? { acceptedLegal: false } : {}) }
    })
  }, [location.pathname, location.search])

  async function handleAuthSubmit(e) {
    e.preventDefault()
    setIsAuthSubmitting(true)

    try {
      if (!authForm.password.trim()) {
        setAuthError('Введите пароль.')
        return
      }

      if (authForm.password.trim().length < 6) {
        setAuthError('Пароль должен содержать минимум 6 символов.')
        return
      }

      if (authForm.mode === 'login') {
        const phone = normalizePhone(authForm.phone)
        const email = authForm.email.trim()

        if (!phone && !email) {
          setAuthError('Укажи телефон или email для входа.')
          return
        }

        if (phone && !isBelarusPhone(phone)) {
          setAuthError('Укажи телефон в белорусском формате: +375 XX XXX XX XX или 80XX XXX XX XX.')
          return
        }

        const user = await loginAccount({
          role: authForm.role,
          phone,
          email,
          password: authForm.password.trim(),
        })

        if (!user) {
          setAuthError('Неверные данные для входа или выбрана не та роль.')
          return
        }

        setCurrentUser(user)
        setAuthError('')
        setDataVersion((prev) => prev + 1)
        navigate('/')
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
        age: authForm.role === 'seeker' ? Number(authForm.age) : null,
        phone: normalizePhone(authForm.phone),
        email: authForm.email.trim(),
        telegramUsername: authForm.telegramUsername.trim(),
        password: authForm.password.trim(),
      }

      if (!authForm.lastName.trim() || !authForm.firstName.trim() || !payload.phone || !payload.email) {
        setAuthError('Заполните все обязательные поля.')
        return
      }

      if (!isBelarusPhone(payload.phone)) {
        setAuthError('Укажи телефон в белорусском формате: +375 XX XXX XX XX или 80XX XXX XX XX.')
        return
      }

      if (payload.role === 'seeker' && (!Number.isFinite(payload.age) || payload.age < 16 || payload.age > 99)) {
        setAuthError('Возраст при регистрации должен быть от 16 до 99 лет.')
        return
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
      if (!emailOk) {
        setAuthError('Проверьте email.')
        return
      }

      if (!authForm.acceptedLegal) {
        setAuthError('Подтвердите ознакомление с FAQ, контактами и политикой конфиденциальности.')
        return
      }

      const user = await registerAccount(payload)
      setCurrentUser(user)
      setAuthError('')
      setDataVersion((prev) => prev + 1)
      navigate('/')
    } catch (error) {
      setAuthError(error.message || 'Не удалось выполнить авторизацию.')
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  function handleAuthFieldChange(field, value) {
    if (field === 'mode') {
      navigate(`/auth?mode=${value}`, { replace: true })
    }
    setAuthForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'mode' && value === 'register') next.acceptedLegal = false
      return next
    })
    if (authError) setAuthError('')
  }

  function handleLogout() {
    logoutUser()
    setCurrentUser(null)
    setRemoteData({
      vacancies: [],
      applications: [],
      completedTasks: [],
      employerCompletedTasks: [],
      employerVacancies: [],
    })
    navigate('/', { replace: true })
  }

  async function handleRateCompletedTask(taskId, rating) {
    await rateCompletedTask(taskId, rating)
    setDataVersion((prev) => prev + 1)
  }

  async function handleApplyToVacancy(vacancyId) {
    if (!currentUser || currentUser.role !== 'seeker') return
    if (hasUserAppliedToVacancy(remoteData.applications, currentUser.id, vacancyId)) return
    try {
      await createApplication({ vacancyId })
      setDataVersion((prev) => prev + 1)
    } catch {
      // The CTA stays idempotent; retry is allowed on the next click.
    }
  }

  async function handleProfileSave(profileForm) {
    if (!currentUser) return
    try {
      const updatedUser = await updateUserProfile(currentUser.id, {
        fullName: buildFullName({
          lastName: profileForm.lastName,
          firstName: profileForm.firstName,
          middleName: profileForm.middleName,
        }),
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        middleName: profileForm.middleName,
        age: currentUser.role === 'seeker' ? Number(profileForm.age) : currentUser.age,
        phone: normalizePhone(profileForm.phone),
        email: profileForm.email.trim(),
        telegramUsername: profileForm.telegramUsername.trim(),
        review: profileForm.review.trim(),
      })
      setCurrentUser(updatedUser)
      setDataVersion((prev) => prev + 1)
      return ''
    } catch (error) {
      return error.message || 'Не удалось сохранить профиль.'
    }
  }

  useEffect(() => {
    if (!currentUser) return

    const isLegacyAppRoute = Object.hasOwn(LEGACY_APP_ROUTES, location.pathname)

    if (isLegacyAppRoute) {
      navigate(LEGACY_APP_ROUTES[location.pathname], { replace: true })
      return
    }

    if (location.pathname === '/auth' || location.pathname === '/onboarding') {
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

    return (
      <AppShell
        currentUser={currentUser}
        currentSection={section}
        onNavigate={navigate}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        mapFilters={
          section === 'map' ? (
            <MapFiltersToolbar
              filters={catalogFilters}
              onFilterChange={(field, value) => setCatalogFilters((prev) => ({ ...prev, [field]: value }))}
              categoryOptions={appFilters.categoryOptions}
              payOptions={appFilters.payOptions}
            />
          ) : null
        }
      >
        {section === 'map' ? (
          <AppMapPage
            vacancies={vacancies}
            selectedVacancyId={selectedVacancyId}
            onSelect={setActiveVacancyId}
            onOpenVacancy={(vacancyId) => navigate(`/vacancy/${vacancyId}`)}
            autoOpenVacancyId={mapFocusedVacancyId}
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
            cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
            onCityChange={setSelectedCity}
            selectedCityLabel={selectedCityOption.label}
            categoryOptions={appFilters.categoryOptions}
            payOptions={appFilters.payOptions}
            currentUser={currentUser}
            appliedVacancyIds={appliedVacancyIds}
            onApplyToVacancy={handleApplyToVacancy}
            onOpenVacancy={(vacancyId) => navigate(`/vacancy/${vacancyId}`)}
          />
        ) : null}
        {section === 'applications' ? (
          <ApplicationsPage
            currentUser={currentUser}
            applications={applications}
            onGoToCatalog={() => navigate('/')}
            onOpenVacancy={(vacancyId) => (currentUser.role === 'employer' ? navigate(`/employer/vacancies/${vacancyId}`) : navigate(`/vacancy/${vacancyId}`))}
          />
        ) : null}
        {section === 'profile' ? (
          <ProfilePage
            currentUser={currentUser}
            completedTasks={completedTasks}
            employerCompletedTasks={employerCompletedTasks}
            employerVacancies={employerVacancies}
            onGoToCatalog={() => navigate('/')}
            onOpenEmployerVacancy={(vacancyId) => navigate(`/employer/vacancies/${vacancyId}`)}
            onCreateVacancy={() => navigate('/employer/vacancies/new')}
            onLogout={handleLogout}
            onSaveProfile={handleProfileSave}
            onRateCompletedTask={handleRateCompletedTask}
          />
        ) : null}
      </AppShell>
    )
  }

  function VacancyPageRoute() {
    const { vacancyId } = useParams()
    const rawVacancy = getVacancyById(remoteData.vacancies, vacancyId, searchPoint)
    const canViewNonPublicVacancy = rawVacancy && currentUser?.role === 'employer' && rawVacancy.ownerId === currentUser.id
    const vacancy = rawVacancy && (rawVacancy.status === 'open' || canViewNonPublicVacancy) ? rawVacancy : null
    const relatedVacancies = vacancies.filter((item) => item.id !== vacancyId && item.status === 'open').slice(0, 3)

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="vacancy"
        onNavigate={navigate}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      >
        <VacancyPage
          vacancy={vacancy}
          currentUser={currentUser}
          hasApplied={vacancy ? appliedVacancyIds.includes(vacancy.id) : false}
          seekerApplication={
            currentUser?.role === 'seeker'
              ? remoteData.applications.find((application) => application.vacancyId === vacancyId && application.applicantId === currentUser.id) ||
                null
              : null
          }
          onApply={handleApplyToVacancy}
          onBackToCatalog={() => navigate('/')}
          onOpenVacancy={(nextVacancyId) => navigate(`/vacancy/${nextVacancyId}`)}
          onShowOnMap={(nextVacancyId) => navigate(`/map?vacancy=${nextVacancyId}`)}
          relatedVacancies={relatedVacancies}
        />
      </AppShell>
    )
  }

  async function handleCreateVacancy(payload) {
    if (!currentUser || currentUser.role !== 'employer') return
    try {
      const vacancy = await createVacancy({
        ...payload,
        city: payload.city || selectedCity,
      })
      setDataVersion((prev) => prev + 1)
      navigate(`/employer/vacancies/${vacancy.id}`)
      return ''
    } catch (error) {
      return error.message || 'Не удалось создать вакансию.'
    }
  }

  async function handleArchiveVacancy(vacancyId, shiftClosure) {
    if (!currentUser || currentUser.role !== 'employer') return 'Недостаточно прав для архивации вакансии.'

    try {
      await archiveVacancy(vacancyId, shiftClosure)
      setDataVersion((prev) => prev + 1)
      return ''
    } catch (error) {
      return error.message || 'Не удалось закрыть вакансию.'
    }
  }

  function EmployerVacancyFormRoute() {
    if (!currentUser || currentUser.role !== 'employer') {
      return <Navigate to="/" replace />
    }

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="profile"
        onNavigate={navigate}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      >
        <EmployerVacancyFormPage currentUser={currentUser} selectedCity={selectedCity} onCreateVacancy={handleCreateVacancy} onCancel={() => navigate('/profile')} />
      </AppShell>
    )
  }

  function EmployerVacancyManageRoute() {
    const { vacancyId } = useParams()

    if (!currentUser || currentUser.role !== 'employer') {
      return <Navigate to="/" replace />
    }

    const vacancy = getVacancyById(remoteData.employerVacancies, vacancyId, searchPoint, { includeExpired: true })
    const applicationsForVacancy = listApplicationsForVacancy(remoteData.applications, currentUser.id, vacancyId)

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="applications"
        onNavigate={navigate}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      >
        <EmployerVacancyManagePage
          vacancy={vacancy?.ownerId === currentUser.id ? vacancy : null}
          applications={applicationsForVacancy}
          onBack={() => navigate('/profile')}
          onCreateNew={() => navigate('/employer/vacancies/new')}
          onArchiveVacancy={handleArchiveVacancy}
          onShowOnMap={(nextVacancyId) => navigate(`/map?vacancy=${nextVacancyId}`)}
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
              currentUser ? renderAppPage('catalog') : <GuestLandingPage content={siteContent} onLogin={() => navigate('/auth?mode=login')} onRegister={() => navigate('/auth?mode=register')} />
            }
          />
          <Route path="/faq" element={<StaticInfoPage title="Вопросы и ответы (FAQ)" />} />
          <Route path="/contacts" element={<StaticInfoPage title="Контакты" />} />
          <Route path="/privacy" element={<StaticInfoPage title="Политика конфиденциальности" />} />
          <Route path="/auth" element={currentUser ? <Navigate to="/" replace /> : <AuthPage form={authForm} error={authError} isSubmitting={isAuthSubmitting} onChange={handleAuthFieldChange} onSubmit={handleAuthSubmit} />} />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="/catalog" element={renderAppPage('catalog')} />
          <Route path="/map" element={renderAppPage('map')} />
          <Route path="/applications" element={renderAppPage('applications')} />
          <Route path="/profile" element={renderAppPage('profile')} />
          <Route path="/vacancy/:vacancyId" element={<VacancyPageRoute />} />
          <Route path="/employer/vacancies/new" element={<EmployerVacancyFormRoute />} />
          <Route path="/employer/vacancies/:vacancyId" element={<EmployerVacancyManageRoute />} />
          <Route path="/app" element={<Navigate to="/" replace />} />
          <Route path="/app/catalog" element={<Navigate to="/" replace />} />
          <Route path="/app/map" element={<Navigate to="/map" replace />} />
          <Route path="/app/applications" element={<Navigate to="/applications" replace />} />
          <Route path="/app/profile" element={<Navigate to="/profile" replace />} />
          <Route path="/app/faq" element={<Navigate to={FAQ_PATH} replace />} />
          <Route path="/app/contacts" element={<Navigate to={CONTACTS_PATH} replace />} />
          <Route path="/app/privacy" element={<Navigate to={PRIVACY_PATH} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
