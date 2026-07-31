import { useEffect, useMemo, useRef, useState } from 'react'

import { DateTimePicker, isEndDateTimeValid, isValidTimeValue, normalizeTimeValue, TIME_MASK_TEMPLATE } from '../../components/DateTimePicker/DateTimePicker'
import { CustomSelect } from '../../components/CustomSelect'
import { MapboxPointPicker } from '../../components/MapboxPointPicker'
import { VACANCY_CATEGORIES } from '../../constants/vacancyCategories'
import { BELARUS_CITY_OPTIONS, getCityPoint } from '../../constants/belarusCities'
import { geocodeBelarusAddress, reverseGeocodeBelarusPoint } from '../../services/mapboxGeocoding'
import { formatActiveUntil, getTodayDateValue } from '../../services/vacancyService'
import { isBelarusPhone, normalizePhone } from '../../utils/common'
import '../ApplicationDetailPage/ApplicationDetailPage.css'
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

const CREATE_STEPS = [
  { id: 'category', label: 'Категория' },
  { id: 'details', label: 'Описание' },
  { id: 'schedule', label: 'Время' },
  { id: 'review', label: 'Проверка' },
]

const DEFAULT_ACTIVE_UNTIL = getTodayDateValue()
const DEFAULT_ACTIVE_UNTIL_TIME = TIME_MASK_TEMPLATE
const DEFAULT_SCHEDULE = SCHEDULE_OPTIONS[0].value

export function EmployerVacancyFormPage({ currentUser, selectedCity, onCreateVacancy, onCancel }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const [point, setPoint] = useState(null)
  const [hasPickedLocation, setHasPickedLocation] = useState(false)
  const [error, setError] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [isAddressLoading, setIsAddressLoading] = useState(false)
  const [isAddressFocused, setIsAddressFocused] = useState(false)
  const geocodeRequestIdRef = useRef(0)

  const cityOptions = useMemo(() => BELARUS_CITY_OPTIONS.filter((city) => city.value !== 'all').map(({ value, label }) => ({ value, label })), [])
  const selectedCityOption = useMemo(() => cityOptions.find((city) => city.value === form.city) || cityOptions[0], [cityOptions, form.city])
  const selectedCategory = useMemo(() => VACANCY_CATEGORIES.find((category) => category.value === form.type) || VACANCY_CATEGORIES[0], [form.type])
  const currentStep = CREATE_STEPS[stepIndex]
  const isLastStep = stepIndex === CREATE_STEPS.length - 1

  const previewAddress = form.addressLine.trim()
    ? `${selectedCityOption.label}, ${form.addressLine.trim()}`
    : selectedCityOption.label

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
      setPoint(null)
      setHasPickedLocation(false)
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
    setHasPickedLocation(true)
    setAddressSuggestions([])
    setIsAddressFocused(false)
    if (error) setError('')
  }

  async function handlePointChange(nextPoint) {
    setPoint(nextPoint)
    setHasPickedLocation(true)

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

  function validateStep(index) {
    if (index === 0) {
      if (!form.type) return 'Выберите категорию смены.'
      return ''
    }

    if (index === 1) {
      if (!form.title.trim() || !form.description.trim()) {
        return 'Заполните название и описание смены.'
      }
      const payFrom = Number(form.payFrom)
      if (!Number.isFinite(payFrom) || payFrom < 1) {
        return 'Укажите корректную оплату за смену.'
      }
      return ''
    }

    if (index === 2) {
      if (!form.schedule.trim()) {
        return 'Укажите график смены.'
      }

      if (!hasPickedLocation || !point?.lat || !point?.lng) {
        return 'Нажмите на карту, чтобы указать место смены.'
      }

      const activeUntil = form.activeUntil || DEFAULT_ACTIVE_UNTIL
      const activeUntilTime = normalizeTimeValue(form.activeUntilTime) || form.activeUntilTime

      if (!activeUntil) return 'Укажите дату окончания публикации.'
      if (!isValidTimeValue(activeUntilTime)) return 'Укажите корректное время: часы 00–23, минуты 00–59.'
      if (!isEndDateTimeValid(activeUntil, activeUntilTime)) return 'Время окончания не может быть в прошлом.'
      return ''
    }

    return ''
  }

  function handleNextStep() {
    const stepError = validateStep(stepIndex)
    if (stepError) {
      setError(stepError)
      return
    }

    setError('')
    setStepIndex((prev) => Math.min(prev + 1, CREATE_STEPS.length - 1))
  }

  function handlePrevStep() {
    setError('')
    if (stepIndex === 0) {
      onCancel?.()
      return
    }
    setStepIndex((prev) => Math.max(prev - 1, 0))
  }

  async function handleSubmit(event) {
    event?.preventDefault()

    for (let index = 0; index < CREATE_STEPS.length - 1; index += 1) {
      const stepError = validateStep(index)
      if (stepError) {
        setStepIndex(index)
        setError(stepError)
        return
      }
    }

    const contactDigits = normalizePhone(form.contactPhone)
    if (contactDigits && !isBelarusPhone(contactDigits)) {
      setError('Телефон: белорусский формат (+375 …) или оставьте поле пустым.')
      return
    }

    const activeUntil = form.activeUntil || DEFAULT_ACTIVE_UNTIL
    const activeUntilTime = normalizeTimeValue(form.activeUntilTime) || form.activeUntilTime
    const payFrom = Number(form.payFrom)
    const contactTelegram = form.contactTelegram.trim().replace(/^@+/, '')

    setIsSubmitting(true)
    setError('')

    const errorMessage = await onCreateVacancy({
      title: form.title.trim(),
      description: form.description.trim(),
      payFrom,
      type: form.type,
      shiftDate: form.shiftDate,
      activeUntil,
      activeUntilTime,
      schedule: form.schedule || DEFAULT_SCHEDULE,
      city: form.city,
      address: previewAddress,
      lat: point.lat,
      lng: point.lng,
      tags: [],
      contactPhone: contactDigits || '',
      contactTelegram,
    })

    setIsSubmitting(false)

    if (errorMessage) {
      setError(errorMessage)
    }
  }

  return (
    <section className="applicationDetailPage shiftCreateFlow">
      <div className="applicationDetailPage__topbar">
        <button type="button" className="applicationDetailPage__back" onClick={handlePrevStep} aria-label="Назад">
          ←
        </button>
        <h1 className="applicationDetailPage__topTitle">Новая смена</h1>
        <div className="applicationDetailPage__statusBadge applicationDetailPage__statusBadge--pending">
          <span>{stepIndex + 1}/{CREATE_STEPS.length}</span>
        </div>
      </div>

      <div className="applicationDetailPage__scroll shiftCreateFlow__scroll">
        <div className="shiftCreateFlow__progress">
          <div className="applicationDetailPage__progressTrack" aria-hidden="true">
            {CREATE_STEPS.map((step, index) => (
              <span
                key={step.id}
                className={`applicationDetailPage__progressSegment${index <= stepIndex ? ' applicationDetailPage__progressSegment--filled' : ''}`}
              />
            ))}
          </div>
          <div className="applicationDetailPage__progressLabels">
            {CREATE_STEPS.map((step) => (
              <span key={step.id}>{step.label}</span>
            ))}
          </div>
        </div>

        <form className="shiftCreateFlow__form" onSubmit={handleSubmit}>
          {currentStep.id === 'category' ? (
            <article className="applicationDetailPage__card shiftCreateFlow__card">
              <div className="shiftCreateFlow__cardHead">
                <h2>Категория смены</h2>
                <p>Выберите направление — так соискатели быстрее найдут вашу смену на карте.</p>
              </div>

              <div className="shiftCreateFlow__categoryGrid">
                {VACANCY_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    className={`shiftCreateFlow__categoryCard${form.type === category.value ? ' is-active' : ''}`}
                    onClick={() => handleChange('type', category.value)}
                  >
                    <span className="shiftCreateFlow__categoryEmoji">{category.emoji}</span>
                    <span className="shiftCreateFlow__categoryTitle">{category.label}</span>
                  </button>
                ))}
              </div>

              <div className="shiftCreateFlow__categoryHint">
                <span className="shiftCreateFlow__categoryHintEmoji">{selectedCategory.emoji}</span>
                <div>
                  <strong>{selectedCategory.label}</strong>
                  <p>{selectedCategory.description}</p>
                </div>
              </div>
            </article>
          ) : null}

          {currentStep.id === 'details' ? (
            <article className="applicationDetailPage__card shiftCreateFlow__card">
              <div className="shiftCreateFlow__cardHead">
                <h2>Описание смены</h2>
                <p>Кратко опишите задачи и условия — это увидят кандидаты в карточке на карте.</p>
              </div>

              <div className="shiftCreateFlow__fields">
                <label className="shiftCreateFlow__field">
                  <span>Название смены</span>
                  <input
                    className="shiftCreateFlow__input"
                    value={form.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    placeholder="Курьер на вечер"
                  />
                </label>

                <label className="shiftCreateFlow__field">
                  <span>Оплата от, BYN</span>
                  <input
                    className="shiftCreateFlow__input"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.payFrom}
                    onChange={(event) => handleChange('payFrom', event.target.value)}
                  />
                </label>

                <label className="shiftCreateFlow__field shiftCreateFlow__field--full">
                  <span>Описание</span>
                  <textarea
                    className="shiftCreateFlow__textarea"
                    rows={6}
                    value={form.description}
                    onChange={(event) => handleChange('description', event.target.value)}
                    placeholder="Задачи, требования, что взять с собой, как связаться на месте."
                  />
                </label>
              </div>
            </article>
          ) : null}

          {currentStep.id === 'schedule' ? (
            <>
              <article className="applicationDetailPage__card shiftCreateFlow__card">
                <div className="shiftCreateFlow__cardHead">
                  <h2>Когда проходит смена</h2>
                  <p>Укажите график и срок, до которого объявление будет на карте.</p>
                </div>

                <div className="shiftCreateFlow__fields">
                  <label className="shiftCreateFlow__field">
                    <span>Когда смена</span>
                    <CustomSelect
                      value={form.shiftDate}
                      options={SHIFT_DATE_OPTIONS}
                      onChange={(nextValue) => handleChange('shiftDate', nextValue)}
                      triggerClassName="shiftCreateFlow__input shiftCreateFlow__select"
                    />
                  </label>

                  <label className="shiftCreateFlow__field">
                    <span>График</span>
                    <CustomSelect
                      value={form.schedule}
                      options={SCHEDULE_OPTIONS}
                      onChange={(nextValue) => handleChange('schedule', nextValue)}
                      triggerClassName="shiftCreateFlow__input shiftCreateFlow__select"
                    />
                  </label>

                  <div className="shiftCreateFlow__field shiftCreateFlow__field--full">
                    <DateTimePicker
                      dateValue={form.activeUntil}
                      timeValue={form.activeUntilTime}
                      minDate={getTodayDateValue()}
                      onDateChange={(nextValue) => handleChange('activeUntil', nextValue)}
                      onTimeChange={(nextValue) => handleChange('activeUntilTime', nextValue)}
                    />
                    <p className="shiftCreateFlow__hint">
                      Смена исчезнет с карты после {formatActiveUntil(form.activeUntil, normalizeTimeValue(form.activeUntilTime) || form.activeUntilTime)}
                    </p>
                  </div>
                </div>
              </article>

              <article className="applicationDetailPage__card shiftCreateFlow__card">
                <div className="shiftCreateFlow__cardHead">
                  <h2>Где проходит смена</h2>
                  <p>Нажмите на карту — адрес подставится автоматически, его можно уточнить ниже.</p>
                </div>

                <div className="shiftCreateFlow__mapBlock">
                  <MapboxPointPicker
                    value={point}
                    onChange={handlePointChange}
                    centerPoint={getCityPoint(form.city)}
                    className={`shiftCreateFlow__map${hasPickedLocation ? ' shiftCreateFlow__map--picked' : ''}`}
                    hint={hasPickedLocation ? 'Точка выбрана — можно нажать ещё раз, чтобы изменить' : 'Нажмите на карту, где проходит смена'}
                  />
                </div>

                <div className="shiftCreateFlow__fields shiftCreateFlow__fields--location">
                  <label className="shiftCreateFlow__field">
                    <span>Город</span>
                    <CustomSelect
                      value={form.city}
                      options={cityOptions}
                      onChange={(nextValue) => handleChange('city', nextValue)}
                      triggerClassName="shiftCreateFlow__input shiftCreateFlow__select"
                    />
                  </label>

                  <label className="shiftCreateFlow__field">
                    <span>Улица или район</span>
                    <div className="shiftCreateFlow__addressSearch">
                      <input
                        className="shiftCreateFlow__input"
                        value={form.addressLine}
                        onChange={(event) => handleChange('addressLine', event.target.value)}
                        onFocus={() => setIsAddressFocused(true)}
                        onBlur={() => window.setTimeout(() => setIsAddressFocused(false), 120)}
                        placeholder={hasPickedLocation ? 'Адрес подставлен с карты' : 'Или найдите адрес по названию'}
                      />

                      {isAddressFocused && form.addressLine.trim().length >= 3 ? (
                        <div className="shiftCreateFlow__addressMenu">
                          {isAddressLoading ? <div className="shiftCreateFlow__addressStatus">Ищем адрес…</div> : null}
                          {!isAddressLoading && !addressSuggestions.length ? (
                            <div className="shiftCreateFlow__addressStatus">Ничего не найдено. Укажите точку на карте.</div>
                          ) : null}
                          {!isAddressLoading
                            ? addressSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  type="button"
                                  className="shiftCreateFlow__addressOption"
                                  onMouseDown={() => applySuggestion(suggestion)}
                                >
                                  {suggestion.label}
                                </button>
                              ))
                            : null}
                        </div>
                      ) : null}
                    </div>
                  </label>
                </div>
              </article>
            </>
          ) : null}

          {currentStep.id === 'review' ? (
            <>
              <article className="applicationDetailPage__card shiftCreateFlow__card shiftCreateFlow__preview">
                <div className="shiftCreateFlow__previewTop">
                  <span className="shiftCreateFlow__previewEmoji">{selectedCategory.emoji}</span>
                  <div>
                    <h2>{form.title.trim() || 'Название смены'}</h2>
                    <p>от {form.payFrom} BYN · {selectedCategory.label}</p>
                  </div>
                </div>

                <div className="shiftCreateFlow__previewRows">
                  <div><span>Когда</span><strong>{form.shiftDate}, {form.schedule}</strong></div>
                  <div><span>Активна до</span><strong>{formatActiveUntil(form.activeUntil, normalizeTimeValue(form.activeUntilTime) || form.activeUntilTime)}</strong></div>
                  <div><span>Адрес</span><strong>{previewAddress}</strong></div>
                </div>

                <p className="shiftCreateFlow__previewDescription">{form.description.trim() || 'Описание не заполнено.'}</p>
              </article>

              <article className="applicationDetailPage__card shiftCreateFlow__card">
                <div className="shiftCreateFlow__cardHead">
                  <h2>Контакты</h2>
                  <p>Необязательно — если пусто, используются данные из профиля компании.</p>
                </div>

                <div className="shiftCreateFlow__fields">
                  <label className="shiftCreateFlow__field shiftCreateFlow__field--full">
                    <span>Телефон для этой смены</span>
                    <input
                      className="shiftCreateFlow__input"
                      type="tel"
                      inputMode="tel"
                      value={form.contactPhone}
                      onChange={(event) => handleChange('contactPhone', event.target.value)}
                      placeholder={currentUser.phone || '+375 29 000 00 00'}
                    />
                  </label>

                  <label className="shiftCreateFlow__field shiftCreateFlow__field--full">
                    <span>Telegram</span>
                    <input
                      className="shiftCreateFlow__input"
                      value={form.contactTelegram}
                      onChange={(event) => handleChange('contactTelegram', event.target.value)}
                      placeholder={currentUser.telegramUsername || '@username'}
                    />
                  </label>
                </div>
              </article>

              <p className="shiftCreateFlow__moderationNote">
                После публикации смена отправится на модерацию и появится на карте после одобления.
              </p>
            </>
          ) : null}

          {error ? <div className="formError shiftCreateFlow__error">{error}</div> : null}
        </form>
      </div>

      <div className="applicationDetailPage__fixedActions applicationDetailPage__fixedActions--single shiftCreateFlow__actions">
        {isLastStep ? (
          <button
            type="button"
            className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--primary shiftCreateFlow__submit"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Публикуем…' : 'Опубликовать смену'}
          </button>
        ) : (
          <button
            type="button"
            className="applicationDetailPage__actionBtn applicationDetailPage__actionBtn--primary shiftCreateFlow__submit"
            onClick={handleNextStep}
          >
            Далее
          </button>
        )}
      </div>
    </section>
  )
}
