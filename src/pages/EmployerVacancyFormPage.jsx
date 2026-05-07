import { useEffect, useMemo, useRef, useState } from 'react'
import { CustomSelect } from '../components/CustomSelect'
import { MapboxPointPicker } from '../components/MapboxPointPicker'
import { BELARUS_CITY_OPTIONS, getCityPoint } from '../constants/belarusCities'
import { geocodeBelarusAddress, reverseGeocodeBelarusPoint } from '../services/mapboxGeocoding'
import { formatActiveUntil, getTodayDateValue } from '../services/vacancyService'
import { isBelarusPhone, normalizePhone } from '../utils/common'

const CATEGORY_OPTIONS = [
  { value: 'Курьер', label: 'Курьер' },
  { value: 'Склад', label: 'Склад' },
  { value: 'Промо', label: 'Промо' },
  { value: 'HoReCa', label: 'HoReCa' },
  { value: 'Подсобные', label: 'Подсобные' },
]

const SHIFT_DATE_OPTIONS = [
  { value: 'Сегодня', label: 'Сегодня' },
  { value: 'Завтра', label: 'Завтра' },
  { value: 'Выходные', label: 'Выходные' },
  { value: 'Дата уточняется', label: 'Дата уточняется' },
]

const SCHEDULE_OPTIONS = [
  { value: 'Дневная', label: 'Дневная' },
  { value: 'Средняя', label: 'Средняя' },
  { value: 'Вечерняя', label: 'Вечерняя' },
  { value: 'Ночная', label: 'Ночная' },
]

const DEFAULT_ACTIVE_UNTIL = getTodayDateValue()
const DEFAULT_SCHEDULE = SCHEDULE_OPTIONS[0].value

export function EmployerVacancyFormPage({ currentUser, selectedCity, onCreateVacancy, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    payFrom: '70',
    type: CATEGORY_OPTIONS[0].value,
    shiftDate: SHIFT_DATE_OPTIONS[0].value,
    activeUntil: DEFAULT_ACTIVE_UNTIL,
    schedule: DEFAULT_SCHEDULE,
    city: selectedCity === 'all' ? 'minsk' : selectedCity,
    addressLine: '',
    tags: '',
    contactPhone: '',
    contactTelegram: '',
  })
  const [point, setPoint] = useState(() => getCityPoint(selectedCity === 'all' ? 'minsk' : selectedCity))
  const [error, setError] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [isAddressLoading, setIsAddressLoading] = useState(false)
  const [isAddressFocused, setIsAddressFocused] = useState(false)
  const geocodeRequestIdRef = useRef(0)

  const cityOptions = useMemo(() => BELARUS_CITY_OPTIONS.filter((city) => city.value !== 'all').map(({ value, label }) => ({ value, label })), [])
  const selectedCityOption = useMemo(() => cityOptions.find((city) => city.value === form.city) || cityOptions[0], [cityOptions, form.city])

  useEffect(() => {
    setForm((prev) => {
      const nextActiveUntil = prev.activeUntil || DEFAULT_ACTIVE_UNTIL
      const nextSchedule = prev.schedule || DEFAULT_SCHEDULE

      if (nextActiveUntil === prev.activeUntil && nextSchedule === prev.schedule) {
        return prev
      }

      return {
        ...prev,
        activeUntil: nextActiveUntil,
        schedule: nextSchedule,
      }
    })
  }, [])

  useEffect(() => {
    const query = form.addressLine.trim()
    if (query.length < 3) {
      setAddressSuggestions([])
      setIsAddressLoading(false)
      return undefined
    }

    const requestId = geocodeRequestIdRef.current + 1
    geocodeRequestIdRef.current = requestId

    const timeoutId = window.setTimeout(async () => {
      setIsAddressLoading(true)

      try {
        const suggestions = await geocodeBelarusAddress(query, selectedCityOption.label)
        if (geocodeRequestIdRef.current !== requestId) return
        setAddressSuggestions(suggestions)
      } catch {
        if (geocodeRequestIdRef.current !== requestId) return
        setAddressSuggestions([])
      } finally {
        if (geocodeRequestIdRef.current === requestId) {
          setIsAddressLoading(false)
        }
      }
    }, 320)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [form.addressLine, selectedCityOption.label])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'city') {
      setPoint(getCityPoint(value))
      setAddressSuggestions([])
    }
    if (error) setError('')
  }

  function applySuggestion(suggestion) {
    const nextCity = cityOptions.find((city) => city.label === suggestion.cityName)?.value || form.city

    setForm((prev) => ({
      ...prev,
      city: nextCity,
      addressLine: suggestion.addressLine || prev.addressLine,
    }))
    setPoint({
      lat: suggestion.lat,
      lng: suggestion.lng,
    })
    setAddressSuggestions([])
    setIsAddressFocused(false)
    if (error) setError('')
  }

  async function handlePointChange(nextPoint) {
    setPoint(nextPoint)

    try {
      const result = await reverseGeocodeBelarusPoint(nextPoint)
      if (!result) return

      const nextCity = cityOptions.find((city) => city.label === result.cityName)?.value || form.city
      setForm((prev) => ({
        ...prev,
        city: nextCity,
        addressLine: result.addressLine || prev.addressLine,
      }))
      setAddressSuggestions([])
    } catch {
      // Keep selected point even if reverse geocoding fails.
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.title.trim() || !form.description.trim() || !form.addressLine.trim() || !form.schedule.trim()) {
      setError('Заполни название, описание, адрес и график смены.')
      return
    }

    const activeUntil = form.activeUntil || DEFAULT_ACTIVE_UNTIL

    if (!activeUntil) {
      setError('Укажи дату, до которой вакансия будет активна.')
      return
    }

    if (activeUntil < getTodayDateValue()) {
      setError('Дата активности вакансии не может быть раньше сегодняшнего дня.')
      return
    }

    const payFrom = Number(form.payFrom)
    if (!Number.isFinite(payFrom) || payFrom < 1) {
      setError('Укажи корректную оплату за смену.')
      return
    }

    if (!point?.lat || !point?.lng) {
      setError('Выбери точку на карте для вакансии.')
      return
    }

    const contactDigits = normalizePhone(form.contactPhone)
    if (contactDigits && !isBelarusPhone(contactDigits)) {
      setError('Телефон для связи по смене: белорусский формат (+375 …) или оставьте поле пустым — тогда используется телефон из профиля.')
      return
    }

    const contactTelegram = form.contactTelegram.trim().replace(/^@+/, '')

    const errorMessage = await onCreateVacancy({
      title: form.title,
      description: form.description,
      payFrom,
      type: form.type,
      shiftDate: form.shiftDate,
      activeUntil,
      schedule: form.schedule || DEFAULT_SCHEDULE,
      city: form.city,
      address: `${selectedCityOption.label}, ${form.addressLine.trim()}`,
      lat: point.lat,
      lng: point.lng,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      contactPhone: contactDigits || '',
      contactTelegram,
    })

    if (errorMessage) {
      setError(errorMessage)
    }
  }

  return (
    <section className="vacancyFormPage">
      <div className="panelHeader panelHeader--space">
        <div>
          <div className="panelHeader__eyebrow">Работодатель</div>
          <div className="panelHeader__title">Создать новую задачу</div>
        </div>
      </div>

      <form className="vacancyFormLayout" onSubmit={handleSubmit}>
        <div className="vacancyFormMain">
          <article className="vacancyFormCard">
            <div className="panelHeader__title">Основная информация</div>
            <div className="vacancyFormGrid">
              <label className="field">
                <span className="field__label">Название задачи</span>
                <input className="input input--dark" value={form.title} onChange={(event) => handleChange('title', event.target.value)} placeholder="Например, Курьер на вечер" />
              </label>

              <label className="field">
                <span className="field__label">Оплата от, BYN</span>
                <input className="input input--dark" type="number" min="1" inputMode="numeric" value={form.payFrom} onChange={(event) => handleChange('payFrom', event.target.value)} />
              </label>

              <label className="field">
                <span className="field__label">Категория</span>
                <CustomSelect value={form.type} options={CATEGORY_OPTIONS} onChange={(nextValue) => handleChange('type', nextValue)} triggerClassName="input input--dark vacancyFormSelect" />
              </label>

              <label className="field">
                <span className="field__label">Дата смены</span>
                <CustomSelect value={form.shiftDate} options={SHIFT_DATE_OPTIONS} onChange={(nextValue) => handleChange('shiftDate', nextValue)} triggerClassName="input input--dark vacancyFormSelect" />
              </label>

              <label className="field">
                <span className="field__label">Активна до</span>
                <input className="input input--dark" type="date" min={getTodayDateValue()} value={form.activeUntil || DEFAULT_ACTIVE_UNTIL} onChange={(event) => handleChange('activeUntil', event.target.value)} />
              </label>

              <label className="field">
                <span className="field__label">График</span>
                <CustomSelect value={form.schedule} options={SCHEDULE_OPTIONS} onChange={(nextValue) => handleChange('schedule', nextValue)} triggerClassName="input input--dark vacancyFormSelect" />
              </label>

              <label className="field">
                <span className="field__label">Город</span>
                <CustomSelect value={form.city} options={cityOptions} onChange={(nextValue) => handleChange('city', nextValue)} triggerClassName="input input--dark vacancyFormSelect" />
              </label>

              <label className="field">
                <span className="field__label">Улица или район</span>
                <div className="vacancyAddressSearch">
                  <input
                    className="input input--dark"
                    value={form.addressLine}
                    onChange={(event) => handleChange('addressLine', event.target.value)}
                    onFocus={() => setIsAddressFocused(true)}
                    onBlur={() => window.setTimeout(() => setIsAddressFocused(false), 120)}
                    placeholder="Немига, 3"
                  />

                  {isAddressFocused && form.addressLine.trim().length >= 3 ? (
                    <div className="vacancyAddressSearch__menu">
                      {isAddressLoading ? <div className="vacancyAddressSearch__status">Ищу адрес...</div> : null}

                      {!isAddressLoading && !addressSuggestions.length ? <div className="vacancyAddressSearch__status">Ничего не найдено. Можно поставить точку на карте вручную.</div> : null}

                      {!isAddressLoading
                        ? addressSuggestions.map((suggestion) => (
                            <button key={suggestion.id} type="button" className="vacancyAddressSearch__option" onMouseDown={() => applySuggestion(suggestion)}>
                              {suggestion.label}
                            </button>
                          ))
                        : null}
                    </div>
                  ) : null}
                </div>
              </label>

              <label className="field vacancyFormGrid__full">
                <span className="field__label">Описание вакансии</span>
                <textarea
                  className="input input--dark authForm__textarea"
                  rows={5}
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  placeholder="Опиши задачи, условия, что важно от кандидата и как пройдет смена."
                />
              </label>

              <label className="field vacancyFormGrid__full">
                <span className="field__label">Теги через запятую</span>
                <input className="input input--dark" value={form.tags} onChange={(event) => handleChange('tags', event.target.value)} placeholder="сегодня, быстрый выход, подработка, без опыта" />
              </label>

              <label className="field vacancyFormGrid__full">
                <span className="field__label">Телефон для связи по этой смене (необязательно)</span>
                <input
                  className="input input--dark"
                  type="tel"
                  inputMode="tel"
                  value={form.contactPhone}
                  onChange={(event) => handleChange('contactPhone', event.target.value)}
                  placeholder="Если не указать — используется телефон из профиля"
                />
                <span className="field__hint">Удобно, если ответственный по смене — другой человек или отдельная линия.</span>
              </label>

              <label className="field vacancyFormGrid__full">
                <span className="field__label">Telegram для этой смены (необязательно)</span>
                <input
                  className="input input--dark"
                  inputMode="text"
                  value={form.contactTelegram}
                  onChange={(event) => handleChange('contactTelegram', event.target.value)}
                  placeholder="@username или оставьте пустым — тогда из профиля"
                />
              </label>
            </div>
          </article>

          <article className="vacancyFormCard">
            <div className="panelHeader__title">Точка на карте</div>
            <div className="vacancyCard__meta">Можно искать по адресу или кликнуть по карте. Адрес и маркер синхронизируются в обе стороны.</div>
            <MapboxPointPicker value={point} onChange={handlePointChange} centerPoint={getCityPoint(form.city)} className="vacancyFormMap" />
          </article>
        </div>

        <aside className="vacancyFormSidebar">
          <article className="vacancyFormCard">
            <div className="panelHeader__title">Что будет опубликовано</div>
            <div className="vacancyDetailFacts">
              <div className="vacancyDetailFacts__item">Работодатель: {currentUser.companyName || currentUser.fullName}</div>
              <div className="vacancyDetailFacts__item">Адрес: {selectedCityOption.label}{form.addressLine.trim() ? `, ${form.addressLine.trim()}` : ''}</div>
              <div className="vacancyDetailFacts__item">Координаты: {point?.lat?.toFixed(4)}, {point?.lng?.toFixed(4)}</div>
              <div className="vacancyDetailFacts__item">Оплата: от {form.payFrom || '0'} BYN</div>
              <div className="vacancyDetailFacts__item">Активна до: {formatActiveUntil(form.activeUntil || DEFAULT_ACTIVE_UNTIL)}</div>
              <div className="vacancyDetailFacts__item">
                Контакт для откликов:{' '}
                {form.contactPhone.trim()
                  ? normalizePhone(form.contactPhone)
                  : currentUser.phone || 'укажите телефон в профиле или поле выше'}
              </div>
              <div className="vacancyDetailFacts__item">
                Telegram для откликов:{' '}
                {form.contactTelegram.trim()
                  ? `@${form.contactTelegram.trim().replace(/^@+/, '')}`
                  : currentUser.telegramUsername
                    ? `@${String(currentUser.telegramUsername).replace(/^@+/, '')}`
                    : 'не указан'}
              </div>
            </div>

            <div className="vacancyDetailText">
              <p>{form.description.trim() || 'Здесь появится описание, которое увидят соискатели.'}</p>
            </div>

            {form.tags.trim() ? (
              <div className="tagRow">
                {form.tags
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
              </div>
            ) : null}

            <div className="profileEditor__actions">
              <button type="button" className="ghostButton" onClick={onCancel}>
                Отмена
              </button>
              <button type="submit" className="primaryButton">
                Опубликовать задачу
              </button>
            </div>

            {error ? <div className="formError">{error}</div> : null}
          </article>
        </aside>
      </form>
    </section>
  )
}
