// src/domains/bank-dashboard/model/types.ts

export interface B24Deal {
  ID: string;
  TITLE: string;           // Название клиента/сделки
  STAGE_ID: string;        // Код стадии (C26:NEW и т.д.)
  CATEGORY_ID: string;     // ID воронки (должно быть "26")
  DATE_CREATE: string;
  DATE_MODIFY: string;
  ASSIGNED_BY_ID: string;  // Кто ответственный
  COMMENTS: string | null;
  SOURCE_ID?: string;      // Источник (откуда пришёл клиент)
  SOURCE_DESCRIPTION?: string;
}