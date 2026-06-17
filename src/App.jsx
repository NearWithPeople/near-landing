import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

import { AppShell } from './components/AppShell'
import { MapFiltersToolbar } from './components/MapFiltersToolbar'
import { BELARUS_CITY_OPTIONS, DEFAULT_CITY_VALUE, getCityOption, getCityPoint } from './constants/belarusCities'
import { CONTACTS_PATH, FAQ_PATH, PRIVACY_PATH } from './constants/legalPages'
import { AuthPage } from './pages/AuthPage/AuthPage'
import { ApplicationsPage } from './pages/ApplicationsPage/ApplicationsPage'
import { ApplicationDetailPage } from './pages/ApplicationDetailPage/ApplicationDetailPage'
import { ChatPage } from './pages/ChatPage/ChatPage'
import { EmployerVacancyFormPage } from './pages/EmployerVacancyFormPage/EmployerVacancyFormPage'
import { EmployerVacancyManagePage } from './pages/EmployerVacancyManagePage/EmployerVacancyManagePage'
import { EmployerShiftsPage, formatEmployerShiftsSubtitle } from './pages/EmployerShiftsPage/EmployerShiftsPage'
import { LaunchLandingPage } from './pages/LaunchLandingPage/LaunchLandingPage'
import { ProfilePage } from './pages/ProfilePage/ProfilePage'
import { AppMapPage } from './pages/AppMapPage/AppMapPage'
import { StaticInfoPage } from './pages/StaticInfoPage/StaticInfoPage'
import { CompanyProfilePage } from './pages/CompanyProfilePage/CompanyProfilePage'
import { UserProfilePage } from './pages/UserProfilePage/UserProfilePage'
import { getCategoryOptions } from './constants/vacancyCategories'
import { createApplication, hasUserAppliedToVacancy, listApplicationsForEmployer, listApplicationsForUser, listApplicationsForVacancy, updateApplicationStatus } from './services/applicationService'
import { getCurrentUser, loginAccount, logoutUser, updateUserProfile } from './services/authService'
import { loadAppBootstrap } from './services/appService'
import { loadSiteContent } from './services/siteService'
import { listCompletedTasksForUser, listEmployerVacancies, rateCompletedTask } from './services/taskService'
import { archiveVacancy, createVacancy, getVacancyById, listVacancies } from './services/vacancyService'
import { buildFullName, formatNearbyVacanciesLabel, isBelarusPhone, normalizePhone } from './utils/common'
import {
  consumePreLaunchAccessFromSearch,
  getDefaultAppPath,
  readPreLaunchAccessRole,
  stripPreLaunchAccessFromSearch,
} from './utils/preLaunchAccess'
import { getDisplayApplications, summarizeApplications } from './utils/applicationPresentation'

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

function getVacancyStatusLabel(status) {
  if (status === 'pending_review') return 'На модерации'
  if (status === 'rejected') return 'Отклонена'
  if (status === 'archived') return 'В архиве'
  if (status === 'closed') return 'Закрыта'
  if (status === 'paused') return 'На паузе'
  if (status === 'draft') return 'Черновик'
  return 'Открыта'
}

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
const FALLBACK_CATEGORY_OPTIONS = [{ value: 'all', label: 'Все категории' }, ...getCategoryOptions()]
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
  const [authForm, setAuthForm] = useState(() => ({
    mode: 'login',
    role: readPreLaunchAccessRole() === 'employer' ? 'employer' : 'seeker',
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
  }))
  const [selectedCity, setSelectedCity] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CITY_VALUE
    return localStorage.getItem(CITY_STORAGE_KEY) || DEFAULT_CITY_VALUE
  })
  const [dataVersion, setDataVersion] = useState(0)
  const [activeVacancyId, setActiveVacancyId] = useState('')
  const [activeChatId, setActiveChatId] = useState('')
  const [visibleMapVacancies, setVisibleMapVacancies] = useState([])
  const [isNearbyListOpen, setIsNearbyListOpen] = useState(false)
  const [currentLocationName, setCurrentLocationName] = useState('Минск')
  const [catalogFilters, setCatalogFilters] = useState({
    query: '',
    payMin: 0,
    category: 'all',
    shiftDate: 'all',
    sortBy: 'relevant',
  })
  const [userPoint, setUserPoint] = useState({ lat: 53.9023, lng: 27.5619 }) // Minsk center fallback
  const [preLaunchAccessRole, setPreLaunchAccessRole] = useState(() => readPreLaunchAccessRole())
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
  const displayApplications = useMemo(() => getDisplayApplications(applications), [applications])
  const applicationsSummary = useMemo(() => summarizeApplications(displayApplications), [displayApplications])
  const isEmployer = currentUser?.role === 'employer'
  const employerApplications = useMemo(
    () => (currentUser && isEmployer ? listApplicationsForEmployer(remoteData.applications, currentUser.id) : []),
    [currentUser, isEmployer, remoteData.applications]
  )
  const completedTasks = useMemo(() => (currentUser ? listCompletedTasksForUser(remoteData.completedTasks, currentUser.id) : []), [currentUser, remoteData.completedTasks])
  const allCompletedTasks = useMemo(() => {
    const merged = [...(remoteData.completedTasks || []), ...(remoteData.employerCompletedTasks || [])]
    const seen = new Set()
    return merged.filter((task) => {
      const key = String(task.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [remoteData.completedTasks, remoteData.employerCompletedTasks])
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

        if (payload.settings) {
          setAppFilters((prev) =>
            normalizeAppFilters({
              defaultCity: payload.settings.defaultCity || prev.defaultCity,
              cityOptions: payload.settings.cityOptions || prev.cityOptions,
              categoryOptions: payload.settings.categoryOptions || prev.categoryOptions,
              payOptions: payload.settings.payOptions || prev.payOptions,
            })
          )
        }
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
    const grantedRole = consumePreLaunchAccessFromSearch(location.search)
    if (!grantedRole) return

    setPreLaunchAccessRole(grantedRole)

    if (grantedRole === 'employer') {
      setAuthForm((prev) => ({ ...prev, role: 'employer' }))
    }

    const cleanedSearch = stripPreLaunchAccessFromSearch(location.search)
    const nextPath = getDefaultAppPath({
      user: currentUser,
      accessRole: grantedRole,
    })

    navigate({ pathname: nextPath, search: cleanedSearch }, { replace: true })
  }, [currentUser, location.pathname, location.search, navigate])

// сдеоай так чтобы он щапрагивал первый ращ когда нажимаешь чтобы  на карте найти себя а не при взоде на сайт
  // useEffect(() => {
  //   if (!('geolocation' in navigator)) return
  //   navigator.geolocation.getCurrentPosition(
  //     (pos) => setUserPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
  //     () => {},
  //     { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
  //   )
  // }, [])

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
        if (cancelled || !payload) return

        if (!payload.currentUser) {
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
        if (payload.filters) {
          setAppFilters(normalizeAppFilters(payload.filters))
        }
        setRemoteData({
          vacancies: payload.vacancies,
          applications: payload.applications,
          completedTasks: payload.completedTasks,
          employerCompletedTasks: payload.employerCompletedTasks,
          employerVacancies: payload.employerVacancies,
        })
      } catch (error) {
        console.error('Failed to load app bootstrap from API', error)
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
    if (location.pathname !== '/chat') {
      setActiveChatId('')
    }
  }, [location.pathname])

  useEffect(() => {
    localStorage.setItem(CITY_STORAGE_KEY, selectedCity)
  }, [selectedCity])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search])

  useEffect(() => {
    if (location.pathname !== '/auth') return
    const nextMode = new URLSearchParams(location.search).get('mode')
    if (nextMode === 'register') {
      navigate('/auth?mode=login', { replace: true })
      return
    }
    if (nextMode !== 'login') return
    setAuthForm((prev) => {
      if (prev.mode === nextMode) return prev
      return { ...prev, mode: nextMode }
    })
  }, [location.pathname, location.search, navigate])

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
        navigate(getDefaultAppPath({ user, accessRole: preLaunchAccessRole }))
        return
      }

      setAuthError('Регистрация временно недоступна.')
    } catch (error) {
      setAuthError(error.message || 'Не удалось выполнить авторизацию.')
    } finally {
      setIsAuthSubmitting(false)
    }
  }

  function handleAuthFieldChange(field, value) {
    if (field === 'mode') {
      if (value === 'register') {
        setAuthError('Регистрация временно недоступна.')
        return
      }
      navigate(`/auth?mode=${value}`, { replace: true })
    }
    setAuthForm((prev) => ({ ...prev, [field]: value }))
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

  async function handleOpenVacancy(vacancyId) {
    if (!currentUser || currentUser.role !== 'seeker') return

    const existingApp = userApplications.find((app) => app.vacancyId === vacancyId)
    if (existingApp) {
      navigate(`/application/${existingApp.id}`)
      return
    }

    try {
      const newApp = await createApplication({ vacancyId })
      setDataVersion((prev) => prev + 1)
      if (newApp?.id) {
        navigate(`/application/${newApp.id}`)
      } else {
        navigate('/applications')
      }
    } catch (error) {
      console.error('Failed to automatically apply to vacancy:', error)
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
    if (location.pathname !== '/map') {
      setIsNearbyListOpen(false)
    }
  }, [location.pathname])

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
    if (!currentUser) return <Navigate to="/auth" replace />

    return (
      <AppShell
        currentUser={currentUser}
        currentSection={section}
        onNavigate={navigate}
        currentLocationName={currentLocationName}
        isVacancySelected={(section === 'map' && Boolean(selectedVacancyId)) || (section === 'chat' && Boolean(activeChatId))}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        chatsCount={displayApplications.length}
        hideTopbar={section === 'chat' && Boolean(activeChatId)}
        headerSubtitle={
          section === 'map'
            ? formatNearbyVacanciesLabel(visibleMapVacancies.length)
            : section === 'applications'
              ? isEmployer
                ? formatEmployerShiftsSubtitle(employerVacancies)
                : applicationsSummary.subtitle
              : undefined
        }
        onMapNearbyClick={section === 'map' ? () => setIsNearbyListOpen(true) : undefined}
        onMapListClick={section === 'map' ? () => setIsNearbyListOpen(true) : undefined}
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
            onLocationChange={setCurrentLocationName}
            onOpenVacancy={handleOpenVacancy}
            autoOpenVacancyId={mapFocusedVacancyId}
            selectedCityPoint={selectedCityPoint}
            visibleVacancies={visibleMapVacancies}
            onVisibleVacanciesChange={setVisibleMapVacancies}
            isNearbyListOpen={isNearbyListOpen}
            onNearbyListOpenChange={setIsNearbyListOpen}
            currentUser={currentUser}
            completedTasks={allCompletedTasks}
            onOpenCompanyProfile={(ownerId) => navigate(`/company/${ownerId}`)}
            onOpenEmployerVacancy={(vacancyId) => navigate(`/employer/vacancies/${vacancyId}`)}
          />
        ) : null}
        {section === 'applications' ? (
          isEmployer ? (
            <EmployerShiftsPage
              vacancies={employerVacancies}
              applications={employerApplications}
              onOpenShift={(vacancyId) => navigate(`/employer/vacancies/${vacancyId}`)}
              onCreateShift={() => navigate('/employer/vacancies/new')}
            />
          ) : (
            <ApplicationsPage
              currentUser={currentUser}
              applications={displayApplications}
              onOpenApplication={(applicationId) => navigate(`/application/${applicationId}`)}
            />
          )
        ) : null}
        {section === 'chat' ? (
          <ChatPage
            currentUser={currentUser}
            applications={displayApplications}
            onNavigate={navigate}
            activeChatId={activeChatId}
            onActiveChatChange={setActiveChatId}
            onChatActivity={() => setDataVersion((prev) => prev + 1)}
          />
        ) : null}
        {section === 'profile' ? (
          <ProfilePage
            currentUser={currentUser}
            completedTasks={completedTasks}
            employerCompletedTasks={remoteData.employerCompletedTasks}
            employerVacancies={employerVacancies}
            onNavigate={navigate}
            onOpenEmployerVacancy={(vacancyId) => navigate(`/employer/vacancies/${vacancyId}`)}
            onCreateVacancy={() => navigate('/employer/vacancies/new')}
            onLogout={handleLogout}
            onSaveProfile={handleProfileSave}
          />
        ) : null}
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

  async function handleUpdateApplicationStatus(applicationId, status) {
    if (!currentUser) return 'Требуется авторизация.'

    try {
      await updateApplicationStatus(applicationId, status)
      setDataVersion((prev) => prev + 1)
      return ''
    } catch (error) {
      return error.message || 'Не удалось обновить статус отклика.'
    }
  }

  async function handleCancelApplication(applicationId) {
    const error = await handleUpdateApplicationStatus(applicationId, 'cancelled')
    if (!error) {
      navigate('/applications')
    }
  }

  function EmployerVacancyFormRoute() {
    if (!currentUser || currentUser.role !== 'employer') {
      return <Navigate to="/auth" replace />
    }

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="applications"
        onNavigate={navigate}
        currentLocationName={currentLocationName}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        chatsCount={displayApplications.length}
        isVacancySelected
        hideTopbar
        headerTitle="Новая смена"
        headerSubtitle="Заполните данные и опубликуйте"
      >
        <EmployerVacancyFormPage currentUser={currentUser} selectedCity={selectedCity} onCreateVacancy={handleCreateVacancy} onCancel={() => navigate('/applications')} />
      </AppShell>
    )
  }

  function EmployerVacancyManageRoute() {
    const { vacancyId } = useParams()

    if (!currentUser || currentUser.role !== 'employer') {
      return <Navigate to="/auth" replace />
    }

    const vacancy = getVacancyById(remoteData.employerVacancies, vacancyId, searchPoint, { includeExpired: true })
    const applicationsForVacancy = listApplicationsForVacancy(remoteData.applications, currentUser.id, vacancyId)
    const ownedVacancy = vacancy?.ownerId === currentUser.id ? vacancy : null

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="applications"
        onNavigate={navigate}
        currentLocationName={currentLocationName}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        chatsCount={displayApplications.length}
        hideTopbar
        isVacancySelected
        headerTitle={ownedVacancy?.title || 'Смена'}
        headerSubtitle={ownedVacancy ? getVacancyStatusLabel(ownedVacancy.status) : 'Детали смены'}
      >
        <EmployerVacancyManagePage
          vacancy={ownedVacancy}
          applications={applicationsForVacancy}
          onBack={() => navigate('/applications')}
          onCreateNew={() => navigate('/employer/vacancies/new')}
          onArchiveVacancy={handleArchiveVacancy}
          onShowOnMap={(nextVacancyId) => navigate(`/map?vacancy=${nextVacancyId}`)}
          onUpdateApplicationStatus={handleUpdateApplicationStatus}
          onOpenChat={(applicationId) => {
            setActiveChatId(applicationId)
            navigate('/chat')
          }}
          onOpenUserProfile={(userId) => navigate(`/user/${userId}`)}
        />
      </AppShell>
    )
  }

  function ApplicationDetailRoute() {
    if (!currentUser) return <Navigate to="/auth" replace />

    const { applicationId } = useParams()
    const application = displayApplications.find((item) => item.id === applicationId) || null
    const vacancy = application?.vacancyId ? getVacancyById(remoteData.vacancies, application.vacancyId, searchPoint) : null

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="applications"
        onNavigate={navigate}
        currentLocationName={currentLocationName}
        hideTopbar
        isVacancySelected={true}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        chatsCount={displayApplications.length}
      >
        <ApplicationDetailPage
          application={application}
          vacancy={vacancy}
          onBack={() => navigate('/applications')}
          onOpenChat={() => {
            setActiveChatId(applicationId)
            navigate('/chat')
          }}
          onCancel={() => handleCancelApplication(applicationId)}
          onShowOnMap={(vacancyId) => navigate(`/map?vacancy=${vacancyId}`)}
          onOpenCompanyProfile={vacancy?.ownerId ? () => navigate(`/company/${vacancy.ownerId}`) : undefined}
          completedTasks={allCompletedTasks}
          vacancies={remoteData.vacancies}
          emptyMessage="Отклик не найден"
        />
      </AppShell>
    )
  }

  function CompanyProfileRoute() {
    if (!currentUser) return <Navigate to="/auth" replace />

    const { ownerId } = useParams()

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="profile"
        onNavigate={navigate}
        currentLocationName={currentLocationName}
        hideTopbar
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        chatsCount={displayApplications.length}
      >
        <CompanyProfilePage
          ownerId={ownerId}
          vacancies={remoteData.vacancies}
          completedTasks={allCompletedTasks}
          onBack={() => navigate(-1)}
          onOpenMapVacancy={(vacancyId) => navigate(`/map?vacancy=${vacancyId}`)}
        />
      </AppShell>
    )
  }

  function UserProfileRoute() {
    if (!currentUser) return <Navigate to="/auth" replace />

    const { userId } = useParams()
    const isOwnProfile = String(currentUser.id) === String(userId)
    const profileUser = isOwnProfile
      ? currentUser
      : {
          id: userId,
          fullName: displayApplications.find((item) => String(item.applicantId) === String(userId))?.applicantName || 'Исполнитель',
          age: displayApplications.find((item) => String(item.applicantId) === String(userId))?.applicantAge ?? null,
          review: displayApplications.find((item) => String(item.applicantId) === String(userId))?.applicantReview || '',
        }

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="profile"
        onNavigate={navigate}
        currentLocationName={currentLocationName}
        hideTopbar
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        chatsCount={displayApplications.length}
      >
        <UserProfilePage user={profileUser} completedTasks={allCompletedTasks} onBack={() => navigate(-1)} />
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
              currentUser ? (
                <Navigate to={getDefaultAppPath({ user: currentUser, accessRole: preLaunchAccessRole })} replace />
              ) : (
                <LaunchLandingPage />
              )
            }
          />
          <Route
            path="/auth"
            element={
              currentUser ? (
                <Navigate to={getDefaultAppPath({ user: currentUser, accessRole: preLaunchAccessRole })} replace />
              ) : (
                <AuthPage
                  form={authForm}
                  error={authError}
                  isSubmitting={isAuthSubmitting}
                  registrationDisabled
                  onChange={handleAuthFieldChange}
                  onSubmit={handleAuthSubmit}
                />
              )
            }
          />
          <Route path="/map" element={renderAppPage('map')} />
          <Route path="/applications" element={renderAppPage('applications')} />
          <Route path="/application/:applicationId" element={<ApplicationDetailRoute />} />
          <Route path="/chat" element={renderAppPage('chat')} />
          <Route path="/profile" element={renderAppPage('profile')} />
          <Route path="/employer/vacancies/new" element={<EmployerVacancyFormRoute />} />
          <Route path="/employer/vacancies/:vacancyId" element={<EmployerVacancyManageRoute />} />
          <Route path="/company/:ownerId" element={<CompanyProfileRoute />} />
          <Route path="/user/:userId" element={<UserProfileRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
