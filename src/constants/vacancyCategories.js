export const VACANCY_CATEGORIES = [
  {
    value: 'Курьерские и развозки',
    label: 'Курьерские и развозки',
    emoji: '🚚',
    description: 'Доставка еды, продуктов, документов, товаров с маркетплейсов на своей машине/велике/пешком',
  },
  {
    value: 'Помощь по дому и хозяйству',
    label: 'Помощь по дому и хозяйству',
    emoji: '🛒',
    description: 'Уборка, мытье окон, глажка, приготовление еды, помощь пенсионерам',
  },
  {
    value: 'Работа с людьми и детьми',
    label: 'Работа с людьми и детьми',
    emoji: '👫',
    description: 'Няни, бебиситтеры, гувернантки, сиделки, аниматоры на праздники',
  },
  {
    value: 'Складские и комплектация',
    label: 'Складские и комплектация',
    emoji: '📦',
    description: 'Комплектовщик заказов, упаковщик, маркировка, работа на складах Ozon/Wildberries',
  },
  {
    value: 'Работа в сфере услуг',
    label: 'Работа в сфере услуг',
    emoji: '🍽️',
    description: 'Промоутер, мерчендайзер, хостес, бариста, официант на подработку, помощь в кафе на массовые мероприятия',
  },
  {
    value: 'Удаленная и IT-подработка',
    label: 'Удаленная и IT-подработка',
    emoji: '💻',
    description: 'Верстка, копирайтинг, набор текста, обработка данных, сбор отзывов, тестирование приложений',
  },
  {
    value: 'Творчество и ручная работа',
    label: 'Творчество и ручная работа',
    emoji: '🎨',
    description: 'Фотосъемка заказов, съемка мероприятий, дизайн, создание визиток/стикеров, услуги маникюра/визажа на дому',
  },
  {
    value: 'Помощь с авто',
    label: 'Помощь с авто',
    emoji: '🚗',
    description: 'Встреча/проводы в аэропорт (MSQ), такси на своем авто, перевозка мебели, вывоз мусора, прикурить/открыть авто',
  },
  {
    value: 'Услуги репетиторов',
    label: 'Услуги репетиторов',
    emoji: '📚',
    description: 'Онлайн и очно: английский, подготовка к ЦТ, музыка, школа, помощь студентам',
  },
  {
    value: 'Мужчина на час / Ремонт',
    label: 'Мужчина на час / Ремонт',
    emoji: '🛠️',
    description: 'Сборка мебели (ИКЕА, другие), мелкий ремонт, повесить полку, заменить розетку',
  },
  {
    value: 'Офлайн и съемки',
    label: 'Офлайн и съемки',
    emoji: '📄',
    description: 'Массовка для фильмов/клипов, участник оплачиваемых опросов, дегустации в гипермаркетах',
  },
  {
    value: 'Забота о животных',
    label: 'Забота о животных',
    emoji: '🐶',
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
