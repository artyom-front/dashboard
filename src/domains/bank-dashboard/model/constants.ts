// src/domains/bank-dashboard/model/constants.ts

/**
 * Стадии воронки "Облачные кассы" (DEAL_STAGE_26).
 * Ключ = то, что приходит в STAGE_ID из API.
 */
export const STAGE_MAP: Record<string, string> = {
  'C26:NEW': '1. Новая заявка',
  'C26:1': '2. Лид думает',
  'C26:PREPARATION': '3. Счёт выставлен, ожидается оплата',
  'C26:EXECUTING': '4. Настройка кассы в ЛК/ФНС',
  'C26:UC_7ZSU68': '5. Интеграция Пейкипер/Прямая',
  'C26:UC_F8TPLV': '6. Интеграция CMS/ПС',
  'C26:WON': '7. Сделка завершена',
  'C26:LOSE': '8. Сделка провалена',
};

/**
 * Цвета бейджей. Используем те же цвета, что в Б24.
 * Tailwind v4 поддерживает произвольные значения в квадратных скобках.
 */
export const STAGE_COLORS: Record<string, string> = {
  'C26:NEW': 'bg-[#A6DC00] text-black',
  'C26:1': 'bg-[#FFA900] text-black',
  'C26:PREPARATION': 'bg-[#2FC6F6] text-black',
  'C26:EXECUTING': 'bg-[#47e4c2] text-black',
  'C26:UC_7ZSU68': 'bg-[#f69ac1] text-black',
  'C26:UC_F8TPLV': 'bg-[#c4baed] text-black',
  'C26:WON': 'bg-[#7bd500] text-black',
  'C26:LOSE': 'bg-[#FF5752] text-white',
};

/**
 * ID воронки "Облачные кассы" в Б24.
 * Без этого фильтра API будет возвращать сделки из ВСЕХ воронок.
 */
export const CLOUD_KASSA_CATEGORY_ID = '26';

/**
 * Доступ для банков (пока заглушка, настроим позже).
 */
export const BANK_ACCESS: Record<string, { filterValue: string; name: string }> = {
  [process.env.BANK_TOKEN_BSPB || '']: {
    filterValue: process.env.BANK_FILTER_BSPB || '',
    name: 'Банк СПБ',
  },
};