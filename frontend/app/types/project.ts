export type ProfitType  = "percentage" | "amount";
export type CompanyName = "SWTS" | "SWTS Pvt. Ltd.";
export type ClientType  = "individual" | "enterprise";
export type Citizenship = "Indian" | "Foreign";
export type DeveloperType = "individual" | "enterprise";

export interface ProjectStatus {
  id: number;
  name: string;
  color: string;
}

export interface Client {
  id: number;
  name: string;
  contact_no: string;
  email: string;
  type: ClientType;
  citizenship: Citizenship;
  residential_address?: string;
  description?: string;
}

export interface Developer {
  id: number;
  name: string;
  contact_no: string;
  email: string;
  type: DeveloperType;
  residential_address: string;
  description: string;
  default_profit_sharing_percentage?: number;
  tds_percentage?: number;
}

export interface Project {
  id: number;
  project_name: string;
  client_id?: number;
  client_name?: string;
  developer_id?: number;
  developer_name?: string;
  status_id?: number;
  company_name?: CompanyName;
  profit_type: ProfitType;
  company_profit_value?: number;
  developer_profit_value?: number;
  show_ppp: boolean;
  start_date?: string;
  timeline_days?: number;
  deadline?: string;
  description?: string;
  created_by: string;
  created_at: string;
  client?: Client;
  developer?: Developer;
  status?: ProjectStatus;
}
