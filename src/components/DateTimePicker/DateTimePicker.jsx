import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { getTodayDateValue } from '../../services/vacancyService'
import './DateTimePicker.css'

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTH_LABELS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

function parseDateValue(value) {
  const normalized = String(value || '').trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null

  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const TIME_MASK_TEMPLATE = '__:__'

function isPartialTimeDigitsValid(digits) {
  if (!digits) return true

  const [d0, d1, d2, d3] = digits.split('')

  if (d0 !== undefined && Number(d0) > 2) return false

  if (d1 !== undefined) {
    const hours = Number(`${d0}${d1}`)
    if (hours > 23) return false
  }

  if (d2 !== undefined && Number(d2) > 5) return false

  if (d3 !== undefined) {
    const minutes = Number(`${d2}${d3}`)
    if (minutes > 59) return false
  }

  return true
}

function buildMaskFromDigits(digits) {
  const onlyDigits = String(digits || '').replace(/\D/g, '')
  const chars = TIME_MASK_TEMPLATE.split('')
  const slots = [0, 1, 3, 4]
  let accepted = ''

  for (let index = 0; index < onlyDigits.length && index < 4; index += 1) {
    const digit = onlyDigits[index]
    const candidate = `${accepted}${digit}`

    if (!isPartialTimeDigitsValid(candidate)) {
      break
    }

    accepted = candidate
    chars[slots[index]] = digit
  }

  return chars.join('')
}

export function normalizeTimeValue(value) {
  const masked = formatTimeMask(value)
  if (!isValidTimeValue(masked)) return ''

  return masked
}

export function formatTimeMask(value) {
  const raw = String(value || '').trim()
  if (isValidTimeValue(raw)) {
    return raw
  }

  return buildMaskFromDigits(raw)
}

export function isValidTimeValue(value) {
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{2}):(\d{2})$/)
  if (!match) return false

  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

export function isTimeMaskComplete(value) {
  return isValidTimeValue(value)
}

function formatDateLabel(dateValue) {
  const parsed = parseDateValue(dateValue)
  if (!parsed) return ''

  return parsed.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildCalendarDays(monthDate, minDateValue) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells = []

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = toDateValue(new Date(year, month, day))
    cells.push({
      day,
      dateValue,
      isDisabled: dateValue < minDateValue,
    })
  }

  return cells
}

export function DateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  minDate = getTodayDateValue(),
  label = 'Дата окончания',
  timeLabel = 'Время окончания',
  placeholder = 'Выберите дату',
  timePlaceholder = TIME_MASK_TEMPLATE,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)
  const timeInputRef = useRef(null)
  const panelId = useId()
  const parsedDate = parseDateValue(dateValue) || parseDateValue(minDate) || new Date()
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1))
  const [draftTime, setDraftTime] = useState(() => formatTimeMask(timeValue || TIME_MASK_TEMPLATE))
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth, minDate), [minDate, visibleMonth])
  const displayDate = dateValue ? formatDateLabel(dateValue) : ''

  useEffect(() => {
    setDraftTime(formatTimeMask(timeValue || TIME_MASK_TEMPLATE))
  }, [timeValue])

  function focusNextTimeSlot(mask = draftTime) {
    const input = timeInputRef.current
    if (!input) return

    const slotIndex = mask.indexOf('_')
    if (slotIndex === -1) {
      input.setSelectionRange(mask.length, mask.length)
      return
    }

    input.setSelectionRange(slotIndex, slotIndex + 1)
  }

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  function handleSelectDate(nextDateValue) {
    if (nextDateValue < minDate) return
    onDateChange?.(nextDateValue)
    setIsOpen(false)
  }

  function shiftMonth(delta) {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  function handleTimeFocus() {
    const masked = formatTimeMask(timeValue || TIME_MASK_TEMPLATE)
    setDraftTime(masked)
    onTimeChange?.(masked)
    requestAnimationFrame(() => focusNextTimeSlot(masked))
  }

  function handleTimeChange(event) {
    const nextValue = formatTimeMask(event.target.value)
    setDraftTime(nextValue)
    onTimeChange?.(nextValue)
    requestAnimationFrame(() => focusNextTimeSlot(nextValue))
  }

  function handleTimeKeyDown(event) {
    if (event.key !== 'Backspace') return

    const digits = String(draftTime || '').replace(/\D/g, '')
    event.preventDefault()
    const nextValue = buildMaskFromDigits(digits.slice(0, -1))
    setDraftTime(nextValue)
    onTimeChange?.(nextValue)
    requestAnimationFrame(() => focusNextTimeSlot(nextValue))
  }

  function handleTimeBlur() {
    if (isValidTimeValue(draftTime)) {
      const normalized = formatTimeMask(draftTime)
      setDraftTime(normalized)
      onTimeChange?.(normalized)
      return
    }

    setDraftTime(TIME_MASK_TEMPLATE)
    onTimeChange?.(TIME_MASK_TEMPLATE)
  }

  return (
    <div ref={rootRef} className={`dateTimePicker${isOpen ? ' is-open' : ''}`}>
      <div className="dateTimePicker__row">
        <div className="dateTimePicker__dateField">
          <span className="dateTimePicker__label">{label}</span>
          <button
            type="button"
            className="dateTimePicker__trigger"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className={`dateTimePicker__value${displayDate ? '' : ' is-placeholder'}`}>{displayDate || placeholder}</span>
            <span className="dateTimePicker__icon" aria-hidden="true" />
          </button>
        </div>

        <label className="dateTimePicker__timeField">
          <span className="dateTimePicker__label">{timeLabel}</span>
          <input
            ref={timeInputRef}
            className={`dateTimePicker__timeInput${isTimeMaskComplete(draftTime) ? '' : ' is-mask'}`}
            type="text"
            inputMode="numeric"
            placeholder={timePlaceholder}
            value={draftTime}
            onFocus={handleTimeFocus}
            onClick={() => requestAnimationFrame(() => focusNextTimeSlot(draftTime))}
            onChange={handleTimeChange}
            onKeyDown={handleTimeKeyDown}
            onBlur={handleTimeBlur}
            autoComplete="off"
            spellCheck={false}
            aria-label={`${timeLabel}, формат ЧЧ:ММ`}
          />
          <span className="dateTimePicker__hint">Часы 00–23, минуты 00–59</span>
        </label>
      </div>

      {isOpen ? (
        <div id={panelId} className="dateTimePicker__panel" role="dialog" aria-label={label}>
          <div className="dateTimePicker__calendarHead">
            <button type="button" className="dateTimePicker__navBtn" onClick={() => shiftMonth(-1)} aria-label="Предыдущий месяц">
              ‹
            </button>
            <div className="dateTimePicker__month">
              {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </div>
            <button type="button" className="dateTimePicker__navBtn" onClick={() => shiftMonth(1)} aria-label="Следующий месяц">
              ›
            </button>
          </div>

          <div className="dateTimePicker__weekdays">
            {WEEKDAY_LABELS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="dateTimePicker__days">
            {calendarDays.map((cell, index) =>
              cell ? (
                <button
                  key={cell.dateValue}
                  type="button"
                  className={`dateTimePicker__day${dateValue === cell.dateValue ? ' is-selected' : ''}${cell.dateValue === minDate ? ' is-today' : ''}`}
                  disabled={cell.isDisabled}
                  onClick={() => handleSelectDate(cell.dateValue)}
                >
                  {cell.day}
                </button>
              ) : (
                <span key={`empty-${index}`} className="dateTimePicker__day dateTimePicker__day--empty" />
              )
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function isEndDateTimeValid(dateValue, timeValue, now = new Date()) {
  const normalizedDate = String(dateValue || '').trim().slice(0, 10)
  const normalizedTime = isValidTimeValue(timeValue) ? formatTimeMask(timeValue) : ''
  const today = getTodayDateValue()

  if (!normalizedDate || normalizedDate < today) return false
  if (!normalizedTime) return false
  if (normalizedDate > today) return true

  const [hours, minutes] = normalizedTime.split(':').map(Number)
  const endDate = new Date(now)
  endDate.setHours(hours, minutes, 0, 0)
  return endDate > now
}
