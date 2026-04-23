// src/domains/bank-dashboard/model/types.ts

export interface B24Deal {
  ID: string;
  TITLE: string;
  STAGE_ID: string;
  CATEGORY_ID: string;
  DATE_CREATE: string;
  DATE_MODIFY: string;
  ASSIGNED_BY_ID: string;
  COMMENTS: string | null;
  SOURCE_ID?: string;
  SOURCE_DESCRIPTION?: string;
}