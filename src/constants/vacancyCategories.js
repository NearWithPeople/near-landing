export const VACANCY_CATEGORIES = [
  {
    value: 'Курьерские и развозки',
    label: 'Курьерские и развозки',
    emoji: '🚚',
    slug: 'courier',
    fill: '#FFB84D',
    glow: 'rgba(255, 184, 77, 0.62)',
    description: 'Доставка еды, продуктов, документов, товаров с маркетплейсов на своей машине/велике/пешком',
  },
  {
    value: 'Помощь по дому и хозяйству',
    label: 'Помощь по дому и хозяйству',
    emoji: '🛒',
    slug: 'home',
    fill: '#7DCE82',
    glow: 'rgba(125, 206, 130, 0.62)',
    description: 'Уборка, мытье окон, глажка, приготовление еды, помощь пенсионерам',
  },
  {
    value: 'Работа с людьми и детьми',
    label: 'Работа с людьми и детьми',
    emoji: '👫',
    slug: 'people',
    fill: '#FF7EB6',
    glow: 'rgba(255, 126, 182, 0.62)',
    description: 'Няни, бебиситтеры, гувернантки, сиделки, аниматоры на праздники',
  },
  {
    value: 'Складские и комплектация',
    label: 'Складские и комплектация',
    emoji: '📦',
    slug: 'warehouse',
    fill: '#D4A574',
    glow: 'rgba(212, 165, 116, 0.62)',
    description: 'Комплектовщик заказов, упаковщик, маркировка, работа на складах Ozon/Wildberries',
  },
  {
    value: 'Работа в сфере услуг',
    label: 'Работа в сфере услуг',
    emoji: '🍽️',
    slug: 'services',
    fill: '#FF7F7F',
    glow: 'rgba(255, 127, 127, 0.62)',
    description: 'Промоутер, мерчендайзер, хостес, бариста, официант на подработку, помощь в кафе на массовые мероприятия',
  },
  {
    value: 'Удаленная и IT-подработка',
    label: 'Удаленная и IT-подработка',
    emoji: '💻',
    slug: 'remote',
    fill: '#5B9DFF',
    glow: 'rgba(91, 157, 255, 0.62)',
    description: 'Верстка, копирайтинг, набор текста, обработка данных, сбор отзывов, тестирование приложений',
  },
  {
    value: 'Творчество и ручная работа',
    label: 'Творчество и ручная работа',
    emoji: '🎨',
    slug: 'creative',
    fill: '#B388FF',
    glow: 'rgba(179, 136, 255, 0.62)',
    description: 'Фотосъемка заказов, съемка мероприятий, дизайн, создание визиток/стикеров, услуги маникюра/визажа на дому',
  },
  {
    value: 'Помощь с авто',
    label: 'Помощь с авто',
    emoji: '🚗',
    slug: 'auto',
    fill: '#7FA8C9',
    glow: 'rgba(127, 168, 201, 0.62)',
    description: 'Встреча/проводы в аэропорт (MSQ), такси на своем авто, перевозка мебели, вывоз мусора, прикурить/открыть авто',
  },
  {
    value: 'Услуги репетиторов',
    label: 'Услуги репетиторов',
    emoji: '📚',
    slug: 'tutors',
    fill: '#45D1BE',
    glow: 'rgba(69, 209, 190, 0.62)',
    description: 'Онлайн и очно: английский, подготовка к ЦТ, музыка, школа, помощь студентам',
  },
  {
    value: 'Мужчина на час / Ремонт',
    label: 'Мужчина на час / Ремонт',
    emoji: '🛠️',
    slug: 'handyman',
    fill: '#FFC56E',
    glow: 'rgba(255, 197, 110, 0.62)',
    description: 'Сборка мебели (ИКЕА, другие), мелкий ремонт, повесить полку, заменить розетку',
  },
  {
    value: 'Офлайн и съемки',
    label: 'Офлайн и съемки',
    emoji: '📄',
    slug: 'offline',
    fill: '#E879F9',
    glow: 'rgba(232, 121, 249, 0.62)',
    description: 'Массовка для фильмов/клипов, участник оплачиваемых опросов, дегустации в гипермаркетах',
  },
  {
    value: 'Забота о животных',
    label: 'Забота о животных',
    emoji: '🐶',
    slug: 'pets',
    fill: '#86EFAC',
    glow: 'rgba(134, 239, 172, 0.62)',
    description: 'Выгул собак, присмотр за кошкой, кормление в отсутствие хозяев',
  },
]

const LEGACY_CATEGORY_MAP = {
  Курьер: 'Курьерские и развозки',
  Склад: 'Складские и комплектация',
  Промо: 'Работа в сфере услуг',
  HoReCa: 'Работа в сфере услуг',
  Подсобные: 'Помощь по дому и хозяйству',
}

const categoryByValue = new Map(VACANCY_CATEGORIES.map((item) => [item.value, item]))

export function getCategoryOptions() {
  return VACANCY_CATEGORIES.map(({ value, label }) => ({ value, label }))
}

export function normalizeVacancyCategory(rawCategory) {
  const value = String(rawCategory || '').trim()
  if (!value) return VACANCY_CATEGORIES[0].value
  if (categoryByValue.has(value)) return value
  return LEGACY_CATEGORY_MAP[value] || VACANCY_CATEGORIES[0].value
}

export function getCategoryMeta(rawCategory) {
  const value = normalizeVacancyCategory(rawCategory)
  return categoryByValue.get(value) || VACANCY_CATEGORIES[0]
}

export function getCategoryEmoji(rawCategory) {
  return getCategoryMeta(rawCategory).emoji
}

export function getCategoryLabel(rawCategory) {
  return getCategoryMeta(rawCategory).label
}

export function getCategoryMarkerStyle(rawCategory) {
  const meta = getCategoryMeta(rawCategory)
  return {
    fill: meta.fill,
    glow: meta.glow,
    slug: meta.slug,
  }
}

export function applyCategoryMarkerStyle(element, rawCategory) {
  if (!element) return
  const { fill, glow, slug } = getCategoryMarkerStyle(rawCategory)
  element.style.setProperty('--marker-fill', fill)
  element.style.setProperty('--marker-glow', glow)
  element.dataset.category = slug
}
