export interface B24Deal {
  ID: string | number;
  TITLE: string;
  STAGE_ID: string;
  CATEGORY_ID: string;
  DATE_CREATE: string;
  DATE_MODIFY: string;
  ASSIGNED_BY_ID: string;
  COMMENTS: string | null;
  SOURCE_ID?: string;
  SOURCE_DESCRIPTION?: string;
  
  UF_CRM_1584459530383?: string;
  UF_CRM_1584459905775?: string;
  UF_CRM_1584459915897?: string;
  UF_CRM_1584459948925?: string;
  UF_CRM_1585653172826?: string;
  
  UF_CRM_1780931799?: string;
  UF_CRM_1780931836?: string;
  UF_CRM_1780931855?: string;
  UF_CRM_1780931961?: boolean | string;
  UF_CRM_1780932003?: string;
  
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