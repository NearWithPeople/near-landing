import { useEffect, useMemo, useRef, useState } from 'react'

import { DateTimePicker, isEndDateTimeValid, isValidTimeValue, normalizeTimeValue, TIME_MASK_TEMPLATE } from '../../components/DateTimePicker/DateTimePicker'
import { CustomSelect } from '../../components/CustomSelect'
import { MapboxPointPicker } from '../../components/MapboxPointPicker'
import { VACANCY_CATEGORIES } from '../../constants/vacancyCategories'
import { BELARUS_CITY_OPTIONS, getCityPoint } from '../../constants/belarusCities'
import { geocodeBelarusAddress, reverseGeocodeBelarusPoint } from '../../services/mapboxGeocoding'
import { formatActiveUntil, getTodayDateValue } from '../../services/vacancyService'
import { isBelarusPhone, normalizePhone } from '../../utils/common'
import './EmployerVacancyFormPage.css'

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
const DEFAULT_ACTIVE_UNTIL_TIME = TIME_MASK_TEMPLATE
const DEFAULT_SCHEDULE = SCHEDULE_OPTIONS[0].value

export function EmployerVacancyFormPage({ currentUser, selectedCity, onCreateVacancy, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    payFrom: '70',
    type: VACANCY_CATEGORIES[0].value,
    shiftDate: SHIFT_DATE_OPTIONS[0].value,
    activeUntil: DEFAULT_ACTIVE_UNTIL,
    activeUntilTime: DEFAULT_ACTIVE_UNTIL_TIME,
    schedule: DEFAULT_SCHEDULE,
    city: selectedCity === 'all' ? 'minsk' : selectedCity,
    addressLine: '',
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
  const selectedCategory = useMemo(() => VACANCY_CATEGORIES.find((category) => category.value === form.type) || VACANCY_CATEGORIES[0], [form.type])

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
      setError('Заполните название, описание, адрес и график смены.')
      return
    }

    const activeUntil = form.activeUntil || DEFAULT_ACTIVE_UNTIL
    const activeUntilTime = normalizeTimeValue(form.activeUntilTime) || form.activeUntilTime

    if (!activeUntil) {
      setError('Укажите дату окончания публикации смены.')
      return
    }

    if (!isValidTimeValue(activeUntilTime)) {
      setError('Укажите корректное время: часы 00–23, минуты 00–59.')
      return
    }

    if (!isEndDateTimeValid(activeUntil, activeUntilTime)) {
      setError('Время окончания не может быть в прошлом.')
      return
    }

    const payFrom = Number(form.payFrom)
    if (!Number.isFinite(payFrom) || payFrom < 1) {
      setError('Укажите корректную оплату за смену.')
      return
    }

    if (!point?.lat || !point?.lng) {
      setError('Выберите точку на карте для смены.')
      return
    }

    const contactDigits = normalizePhone(form.contactPhone)
    if (contactDigits && !isBelarusPhone(contactDigits)) {
      setError('Телефон для связи: белорусский формат (+375 …) или оставьте поле пустым.')
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
      activeUntilTime: normalizeTimeValue(activeUntilTime),
      schedule: form.schedule || DEFAULT_SCHEDULE,
      city: form.city,
      address: `${selectedCityOption.label}, ${form.addressLine.trim()}`,
      lat: point.lat,
      lng: point.lng,
      tags: [],
      contactPhone: contactDigits || '',
      contactTelegram,
    })

    if (errorMessage) {
      setError(errorMessage)
    }
  }

  return (
    <section className="shiftCreatePage">
      <form className="shiftCreatePage__form" onSubmit={handleSubmit}>
        <section className="shiftCreatePage__section">
          <div className="shiftCreatePage__sectionHead">
            <h2>Категория</h2>
            <p>Выберите направление смены</p>
          </div>

          <div className="shiftCreatePage__categoryRail">
            {VACANCY_CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                className={`shiftCreatePage__categoryChip${form.type === category.value ? ' is-active' : ''}`}
                onClick={() => handleChange('type', category.value)}
              >
                <span className="shiftCreatePage__categoryEmoji">{category.emoji}</span>
                <span className="shiftCreatePage__categoryLabel">{category.label}</span>
              </button>
            ))}
          </div>

          <div className="shiftCreatePage__categoryPreview">
            <div className="shiftCreatePage__categoryPreviewEmoji">{selectedCategory.emoji}</div>
            <div>
              <div className="shiftCreatePage__categoryPreviewTitle">{selectedCategory.label}</div>
              <div className="shiftCreatePage__categoryPreviewDesc">{selectedCategory.description}</div>
            </div>
          </div>
        </section>

        <section className="shiftCreatePage__section">
          <div className="shiftCreatePage__sectionHead">
            <h2>Основное</h2>
            <p>Название, оплата и описание</p>
          </div>

          <div className="shiftCreatePage__fields">
            <label className="field">
              <span className="field__label">Название смены</span>
              <input className="input input--dark" value={form.title} onChange={(event) => handleChange('title', event.target.value)} placeholder="Курьер на вечер" />
            </label>

            <label className="field">
              <span className="field__label">Оплата от, BYN</span>
              <input className="input input--dark" type="number" min="1" inputMode="numeric" value={form.payFrom} onChange={(event) => handleChange('payFrom', event.target.value)} />
            </label>

            <label className="field shiftCreatePage__field--full">
              <span className="field__label">Описание</span>
              <textarea
                className="input input--dark authForm__textarea"
                rows={5}
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                placeholder="Задачи, условия, требования к кандидату."
              />
            </label>
          </div>
        </section>

        <section className="shiftCreatePage__section">
          <div className="shiftCreatePage__sectionHead">
            <h2>Срок публикации</h2>
            <p>До какого дня и времени смена видна на карте</p>
          </div>

          <div className="shiftCreatePage__fields">
            <label className="field">
              <span className="field__label">Когда смена</span>
              <CustomSelect value={form.shiftDate} options={SHIFT_DATE_OPTIONS} onChange={(nextValue) => handleChange('shiftDate', nextValue)} triggerClassName="input input--dark vacancyFormSelect" />
            </label>

            <label className="field">
              <span className="field__label">График</span>
              <CustomSelect value={form.schedule} options={SCHEDULE_OPTIONS} onChange={(nextValue) => handleChange('schedule', nextValue)} triggerClassName="input input--dark vacancyFormSelect" />
            </label>

            <div className="field shiftCreatePage__field--full">
              <DateTimePicker
                dateValue={form.activeUntil}
                timeValue={form.activeUntilTime}
                minDate={getTodayDateValue()}
                onDateChange={(nextValue) => handleChange('activeUntil', nextValue)}
                onTimeChange={(nextValue) => handleChange('activeUntilTime', nextValue)}
              />
              <span className="field__hint">
                Смена исчезнет с карты после {formatActiveUntil(form.activeUntil, normalizeTimeValue(form.activeUntilTime) || form.activeUntilTime)}
              </span>
            </div>
          </div>
        </section>

        <section className="shiftCreatePage__section">
          <div className="shiftCreatePage__sectionHead">
            <h2>Локация</h2>
            <p>Город, адрес и точка на карте</p>
          </div>

          <div className="shiftCreatePage__fields">
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

            <div className="shiftCreatePage__field--full">
              <MapboxPointPicker value={point} onChange={handlePointChange} centerPoint={getCityPoint(form.city)} className="shiftCreatePage__map" />
            </div>
          </div>
        </section>

        <section className="shiftCreatePage__section">
          <div className="shiftCreatePage__sectionHead">
            <h2>Контакты</h2>
            <p>Необязательно — по умолчанию из профиля компании</p>
          </div>

          <div className="shiftCreatePage__fields">
            <label className="field shiftCreatePage__field--full">
              <span className="field__label">Телефон для этой смены</span>
              <input className="input input--dark" type="tel" inputMode="tel" value={form.contactPhone} onChange={(event) => handleChange('contactPhone', event.target.value)} placeholder={currentUser.phone || '+375 29 000 00 00'} />
            </label>

            <label className="field shiftCreatePage__field--full">
              <span className="field__label">Telegram для этой смены</span>
              <input className="input input--dark" value={form.contactTelegram} onChange={(event) => handleChange('contactTelegram', event.target.value)} placeholder={currentUser.telegramUsername || '@username'} />
            </label>
          </div>
        </section>

        {error ? <div className="formError shiftCreatePage__error">{error}</div> : null}

        <div className="shiftCreatePage__actions">
          <button type="button" className="ghostButton" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="primaryButton">
            Опубликовать смену
          </button>
        </div>
      </form>
    </section>
  )
}
