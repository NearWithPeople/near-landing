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
import { CatalogPage } from './pages/CatalogPage/CatalogPage'
import { EmployerVacancyFormPage } from './pages/EmployerVacancyFormPage/EmployerVacancyFormPage'
import { EmployerVacancyManagePage } from './pages/EmployerVacancyManagePage/EmployerVacancyManagePage'
import { LaunchLandingPage } from './pages/LaunchLandingPage/LaunchLandingPage'
import { ProfilePage } from './pages/ProfilePage/ProfilePage'
import { AppMapPage } from './pages/AppMapPage/AppMapPage'
import { StaticInfoPage } from './pages/StaticInfoPage/StaticInfoPage'
import { createApplication, hasUserAppliedToVacancy, listApplicationsForEmployer, listApplicationsForUser, listApplicationsForVacancy } from './services/applicationService'
import { getCurrentUser, loginAccount, logoutUser, updateUserProfile } from './services/authService'
import { loadAppBootstrap } from './services/appService'
import { loadSiteContent } from './services/siteService'
import { listCompletedTasksForUser, listEmployerVacancies, rateCompletedTask } from './services/taskService'
import { archiveVacancy, createVacancy, getVacancyById, listVacancies } from './services/vacancyService'
import { buildFullName, isBelarusPhone, normalizePhone } from './utils/common'
import {
  consumePreLaunchAccessFromSearch,
  readPreLaunchAccess,
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

const MOCK_VACANCIES = [
  {
    id: 'mock-center',
    title: 'Администратор (тестовая)',
    companyName: 'NEAR Team',
    payFrom: 100,
    address: 'пр. Независимости 1',
    city: 'minsk',
    lat: 53.9023,
    lng: 27.5619,
    type: 'HoReCa',
    category: 'HoReCa',
    shiftDate: 'Сегодня',
    schedule: 'Гибкий график',
    status: 'open',
    applicationCount: 5,
    description: 'Тестовая вакансия в самом центре Минска для проверки интерфейса.',
    requirements: ['Пунктуальность', 'Вежливость']
  },
  {
    id: 'mock-1',
    title: 'Сотрудник бригады ресторана (разнорабочий)',
    companyName: 'УП «МАК.БАЙ»',
    payFrom: 70,
    address: 'пр. Независимости 43к7',
    city: 'minsk',
    lat: 53.9188,
    lng: 27.5235,
    type: 'HoReCa',
    category: 'HoReCa',
    shiftDate: 'Завтра',
    schedule: 'Дневная смена',
    status: 'open',
    applicationCount: 3,
    description: 'Ночная или дневная смена (8 часов) в качестве сотрудника бригады ресторана быстрого обслуживания Mak.by Вокзальная. Приятная подработка в ведущей сети ресторанов быстрого обслуживания в Беларуси на стабильных условиях, гибким графиком и удобной локацией.',
    requirements: ['Для работы необходима медсправка*', 'Доступно с 14 лет с согласием законного представителя*']
  },
  {
    id: 'mock-2',
    title: 'Курьер на личном авто',
    companyName: 'Доставка Плюс',
    payFrom: 120,
    address: 'ул. Сурганова 50',
    city: 'minsk',
    lat: 53.9244,
    lng: 27.552,
    type: 'Курьер',
    category: 'Курьер',
    shiftDate: 'Сегодня',
    schedule: 'Свободный график',
    status: 'open',
    applicationCount: 12,
    description: 'Доставка заказов по городу. Оплата ежедневно.',
    requirements: ['Наличие авто', 'Стаж вождения от 1 года']
  },
  {
    id: 'mock-3',
    title: 'Промоутер',
    companyName: 'Рекламное Агентство',
    payFrom: 45,
    address: 'пр. Победителей 9',
    city: 'minsk',
    lat: 53.9084,
    lng: 27.5638,
    type: 'Промо',
    category: 'Промо',
    shiftDate: 'Сб, 30 мая',
    schedule: '4 часа',
    status: 'open',
    applicationCount: 5,
    description: 'Раздача листовок возле ТЦ.',
    requirements: ['Активность', 'Коммуникабельность']
  },
  {
    id: 'mock-4',
    title: 'Сотрудник склада',
    companyName: 'Логистик Центр',
    payFrom: 85,
    address: 'ул. Притыцкого 29',
    city: 'minsk',
    lat: 53.9065,
    lng: 27.4844,
    type: 'Склад',
    category: 'Склад',
    shiftDate: 'Пн, 1 июня',
    schedule: 'Ночная смена',
    status: 'open',
    applicationCount: 8,
    description: 'Сортировка и упаковка товаров на теплом складе.',
    requirements: ['Ответственность', 'Готовность к физическому труду']
  }
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialUser = useMemo(() => getCurrentUser(), [])
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [authError, setAuthError] = useState('')
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false)
  const [remoteData, setRemoteData] = useState({
    vacancies: MOCK_VACANCIES,
    applications: [],
    completedTasks: [],
    employerCompletedTasks: [],
    employerVacancies: [],
  })
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT)
  const [appFilters, setAppFilters] = useState(() => normalizeAppFilters())
  const [authForm, setAuthForm] = useState({
    mode: 'login',
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
  const [currentLocationName, setCurrentLocationName] = useState('Минск')
  const [catalogFilters, setCatalogFilters] = useState({
    query: '',
    payMin: 0,
    category: 'all',
    shiftDate: 'all',
    sortBy: 'relevant',
  })
  const [userPoint, setUserPoint] = useState({ lat: 53.9023, lng: 27.5619 }) // Minsk center fallback
  const [preLaunchAccessGranted, setPreLaunchAccessGranted] = useState(() => readPreLaunchAccess())
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
    if (!consumePreLaunchAccessFromSearch(location.search)) return

    setPreLaunchAccessGranted(true)

    const cleanedSearch = stripPreLaunchAccessFromSearch(location.search)
    if (cleanedSearch === location.search) return

    navigate({ pathname: location.pathname, search: cleanedSearch }, { replace: true })
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    if (preLaunchAccessGranted) return
    if (location.pathname === '/') return

    navigate('/', { replace: true })
  }, [location.pathname, navigate, preLaunchAccessGranted])
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
            vacancies: MOCK_VACANCIES,
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
            vacancies: MOCK_VACANCIES,
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
          vacancies: payload.vacancies?.length ? payload.vacancies : MOCK_VACANCIES,
          applications: payload.applications || [],
          completedTasks: payload.completedTasks || [],
          employerCompletedTasks: payload.employerCompletedTasks || [],
          employerVacancies: payload.employerVacancies || [],
        })
      } catch {
        // On error, keep using mock data
        if (!cancelled) {
          setRemoteData(prev => ({
            ...prev,
            vacancies: prev.vacancies.length ? prev.vacancies : MOCK_VACANCIES
          }))
        }
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
        navigate('/map')
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
    if (!preLaunchAccessGranted) return <Navigate to="/" replace />
    if (!currentUser) return <Navigate to="/" replace />

    return (
      <AppShell
        currentUser={currentUser}
        currentSection={section}
        onNavigate={navigate}
        currentLocationName={currentLocationName}
        isVacancySelected={section === 'map' && Boolean(selectedVacancyId)}
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        headerSubtitle={section === 'applications' ? applicationsSummary.subtitle : undefined}
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
            applications={displayApplications}
            onOpenApplication={(applicationId) => navigate(`/application/${applicationId}`)}
          />
        ) : null}
        {section === 'chat' ? (
          <div className="placeholder-page">
          </div>
        ) : null}
        {section === 'profile' ? (
          <ProfilePage
            currentUser={currentUser}
            completedTasks={completedTasks}
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

  function VacancyPageRoute() {
    if (!preLaunchAccessGranted) return <Navigate to="/" replace />
    if (!currentUser) return <Navigate to="/" replace />

    const { vacancyId } = useParams()
    const rawVacancy = getVacancyById(remoteData.vacancies, vacancyId, searchPoint)
    const canViewNonPublicVacancy = rawVacancy && currentUser?.role === 'employer' && rawVacancy.ownerId === currentUser.id
    const vacancy = rawVacancy && (rawVacancy.status === 'open' || canViewNonPublicVacancy) ? rawVacancy : null
    const application = displayApplications.find((item) => item.vacancyId === vacancyId) || null

    if (application) {
      return <Navigate to={`/application/${application.id}`} replace />
    }

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="map"
        onNavigate={navigate}
        currentLocationName={currentLocationName}
        hideTopbar
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      >
        <ApplicationDetailPage
          vacancy={vacancy}
          hasApplied={vacancy ? appliedVacancyIds.includes(vacancy.id) : false}
          onBack={() => navigate('/map')}
          onApply={() => handleApplyToVacancy(vacancyId)}
          onShowOnMap={(nextVacancyId) => navigate(`/map?vacancy=${nextVacancyId}`)}
          emptyBackLabel="Назад к карте"
          emptyMessage="Смена не найдена"
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
    if (!preLaunchAccessGranted) return <Navigate to="/" replace />
    if (!currentUser || currentUser.role !== 'employer') {
      return <Navigate to="/" replace />
    }

    return (
      <AppShell
        currentUser={currentUser}
        currentSection="profile"
        onNavigate={navigate}
        currentLocationName={currentLocationName}
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
    if (!preLaunchAccessGranted) return <Navigate to="/" replace />

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
        currentLocationName={currentLocationName}
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

  function ApplicationDetailRoute() {
    if (!preLaunchAccessGranted) return <Navigate to="/" replace />
    if (!currentUser) return <Navigate to="/" replace />

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
        onCreateVacancy={() => navigate('/employer/vacancies/new')}
        cityOptions={appFilters.cityOptions.map(({ value, label }) => ({ value, label }))}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      >
        <ApplicationDetailPage
          application={application}
          vacancy={vacancy}
          onBack={() => navigate('/applications')}
          onOpenChat={() => navigate('/chat')}
          onCancel={() => navigate('/applications')}
          onShowOnMap={(vacancyId) => navigate(`/map?vacancy=${vacancyId}`)}
          emptyMessage="Отклик не найден"
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
              currentUser && preLaunchAccessGranted ? <Navigate to="/map" replace /> : <LaunchLandingPage />
            }
          />
          <Route
            path="/auth"
            element={
              !preLaunchAccessGranted ? (
                <Navigate to="/" replace />
              ) : currentUser ? (
                <Navigate to="/map" replace />
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
          <Route path="/vacancy/:vacancyId" element={<VacancyPageRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
