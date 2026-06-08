// src/domains/bank-dashboard/model/constants.ts

/**
 * Стадии воронки "Облачные кассы" (CATEGORY_ID = 26).
 * Оригинальные коды с префиксом C26: — как было в рабочей версии.
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

export const CLOUD_KASSA_CATEGORY_ID = '26';

/**
 * Новый маппинг статусов для дашборда (без префикса C26:).
 * API возвращает STAGE_ID без префикса, но оригинальный код использует C26:.
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

export const BANK_ACCESS: Record<string, { filterValue: string; name: string }> = {
  [process.env.BANK_TOKEN_BSPB || '']: {
    filterValue: process.env.BANK_FILTER_BSPB || '',
    name: 'Банк СПБ',
  },
};