// src/domains/bank-dashboard/model/constants.ts

/**
 * Стадии воронки "Облачная касса" (CATEGORY_ID = 26).
 * Эти STATUS_ID уникальны для воронки 26 и не пересекаются с другими воронками.
 */
export const STAGE_MAP: Record<string, string> = {
  'NEW': 'Новый заказ',
  '5': 'Счет выставлен',
  '10': 'Счет отправлен, ожидается оплата',
  'FINAL_INVOICE': 'Счет оплачен',
  'UC_ETM6IC': 'Ожидание анкеты',
  '6': 'На настройку',
  'UC_7RGL0K': 'Название',
  '11': 'На Документы / доставку ТО',
  'WON': 'Продано и отгружено',
  'LOSE': 'Отказ клиента',
  '12': 'Внутренний заказ',
  'UC_79DBVD': 'OLD',
};

/**
 * Множество стадий воронки 26 для быстрой фильтрации.
 */
export const CLOUD_KASSA_STAGE_IDS = new Set([
  'NEW', '5', '10', 'FINAL_INVOICE', 'UC_ETM6IC',
  '6', 'UC_7RGL0K', '11', 'WON', 'LOSE', '12', 'UC_79DBVD',
]);

/**
 * Цвета бейджей статусов для дашборда.
 */
export const STAGE_STATUS_MAP: Record<string, { label: string; color: string; status: string }> = {
  'NEW':           { label: 'Новый заказ',                    color: 'bg-yellow-100 text-yellow-800',  status: 'В процессе интеграции' },
  '5':             { label: 'Счет выставлен',                 color: 'bg-yellow-100 text-yellow-800',  status: 'В процессе интеграции' },
  '10':            { label: 'Счет отправлен, ожидается оплата', color: 'bg-yellow-100 text-yellow-800',  status: 'В процессе интеграции' },
  'FINAL_INVOICE': { label: 'Счет оплачен',                   color: 'bg-yellow-100 text-yellow-800',  status: 'В процессе интеграции' },
  'UC_ETM6IC':     { label: 'Ожидание анкеты',                color: 'bg-yellow-100 text-yellow-800',  status: 'В процессе интеграции' },
  '6':             { label: 'На настройку',                   color: 'bg-blue-100 text-blue-800',      status: 'В процессе интеграции' },
  'UC_7RGL0K':     { label: 'Название',                       color: 'bg-yellow-100 text-yellow-800',  status: 'В процессе интеграции' },
  '11':            { label: 'На Документы / доставку ТО',     color: 'bg-blue-100 text-blue-800',      status: 'В процессе интеграции' },
  'WON':           { label: 'Продано и отгружено',            color: 'bg-green-100 text-green-800',    status: 'Подключена' },
  'LOSE':          { label: 'Отказ клиента',                  color: 'bg-red-100 text-red-800',        status: 'Отклонена' },
  '12':            { label: 'Внутренний заказ',               color: 'bg-gray-100 text-gray-800',      status: 'В процессе интеграции' },
  'UC_79DBVD':     { label: 'OLD',                            color: 'bg-gray-100 text-gray-800',      status: 'В процессе интеграции' },
};

/**
 * ID воронки (для справки, не используется в фильтре API).
 */
export const CLOUD_KASSA_CATEGORY_ID = '26';

/**
 * Доступ для банков.
 */
export const BANK_ACCESS: Record<string, { filterValue: string; name: string }> = {
  [process.env.BANK_TOKEN_BSPB || '']: {
    filterValue: process.env.BANK_FILTER_BSPB || '',
    name: 'Банк СПБ',
  },
};