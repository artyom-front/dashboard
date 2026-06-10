// src/domains/bank-dashboard/model/types.ts

export interface B24Contact {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE?: string }>;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE?: string }>;
}

export interface B24User {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  EMAIL: string;
}

export interface B24Deal {
  ID: string | number;
  TITLE: string;
  STAGE_ID: string;
  CATEGORY_ID: string;
  DATE_CREATE: string;
  DATE_MODIFY: string;
  ASSIGNED_BY_ID: string;
  CONTACT_ID: string;
  COMMENTS: string | null;
  SOURCE_ID?: string;
  SOURCE_DESCRIPTION?: string;

  // ИНН / КПП / ОГРН
  UF_CRM_1605269817?: string;
  // Сайт
  UF_CRM_1696587488771?: string;
  // Способ интеграции
  UF_CRM_1696587549662?: string;
  // Сертификат (дата выдачи)
  UF_CRM_1780931799?: string;
  // Дата теста
  UF_CRM_1780931836?: string;
  // Дата запуска
  UF_CRM_1780931855?: string;
  // Необходима ОК (boolean)
  UF_CRM_1777549192165?: boolean | string;
  // Установлена ОК (boolean)
  UF_CRM_1780931961?: boolean | string;
  // DB_ОблачнаяКассаТест (дата)
  UF_CRM_1780932003?: string;
  // SSL сертификат статус (enum)
  UF_CRM_1777549089614?: string;
  // Облачная касса тип (enum)
  UF_CRM_1777552279762?: string;
  // Дата следующего контакта
  UF_CRM_1696588034362?: string;
  // Последний контакт (штатное поле)
  LAST_ACTIVITY_TIME?: string;

  [key: string]: unknown;
}

export type StageStat = {
  stageId: string;
  count: number;
};

export type DealDashboardSummary = {
  total: number;
  inWorkCount: number;
  newCount: number;
  todayCount: number;
  stageStats: StageStat[];
  suggestedWorkingStageId?: string;
};

export type FetchDealsResult = {
  deals: B24Deal[];
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
  summary: DealDashboardSummary;
};

export interface ParsedDeal {
  id: string | number;
  dateCreate: string;
  title: string;
  inn: string;
  assignedName: string;
  site: string;
  contacts: string;
  integration: string;
  certDate: string;
  sslStatus: string;
  testDate: string;
  launchDate: string;
  needOk: string;
  okType: string;
  installedOk: string;
  okTestDate: string;
  lastContact: string;
  comments: string;
  stage: string;
  stageColor: string;
  stageStatus: string;
}