/**
 * OmniScribe Regulatory Compliance & Logistics Audit Types
 */

export type AuditStatus = 'APPROVED' | 'FLAGGED' | 'REJECTED';
export type RiskLevel = 'LOW' | 'MODERATE' | 'CRITICAL';
export type DiscrepancySeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionPriority = 'URGENT' | 'REQUIRED' | 'ADVISORY';

export interface LineItem {
  item_description: string;
  declared_hs_code: string;
  verified_hs_code?: string;
  quantity: number;
  unit: string;
  unit_value: number;
  total_value: number;
  country_of_origin: string;
  hazardous_class?: string;
  compliance_flags?: string[];
}

export interface ExtractedEntities {
  document_type: string;
  document_number: string;
  document_date?: string;
  shipper_name: string;
  shipper_address: string;
  shipper_country: string;
  shipper_tax_id?: string;
  consignee_name: string;
  consignee_address: string;
  consignee_country: string;
  consignee_tax_id?: string;
  notify_party?: string;
  port_of_loading: string;
  port_of_discharge: string;
  mode_of_transport: string;
  incoterms: string;
  currency: string;
  total_declared_value: number;
  items: LineItem[];
}

export interface DiscrepancyItem {
  code: string;
  severity: DiscrepancySeverity;
  title: string;
  description: string;
  regulation_ref: string;
}

export interface RecommendedAction {
  id?: string;
  priority: ActionPriority;
  action: string;
  target_agency: string;
  required_document: string;
  completed?: boolean;
}

export interface DutyTariffEstimate {
  estimated_duty_rate: string;
  applicable_agencies: string[];
  special_permits_required: string[];
  cbam_or_carbon_applicable?: boolean;
  estimated_duty_amount?: number;
}

export interface AuditResponse {
  audit_id: string;
  audit_status: AuditStatus;
  risk_score: number; // 0 to 100
  risk_level: RiskLevel;
  destination_country: string;
  regulatory_framework: string;
  extracted_entities: ExtractedEntities;
  compliance_discrepancies: string[];
  discrepancy_details: DiscrepancyItem[];
  recommended_actions: string[];
  action_details: RecommendedAction[];
  duty_tariff_analysis?: DutyTariffEstimate;
  agent_reasoning_trace?: string[];
  quick_summary?: string;
  timestamp: string;
  document_file_name?: string;
  audit_engine?: string;
}

export interface SampleDocument {
  id: string;
  title: string;
  subtitle: string;
  destination_country: string;
  document_type: string;
  badge: {
    label: string;
    variant: 'success' | 'warning' | 'danger';
  };
  sample_text: string;
  description: string;
  key_risks_preview: string[];
}
