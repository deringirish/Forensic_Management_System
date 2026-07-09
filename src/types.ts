export interface Role {
  role_id: number;
  role_name: string;
  description: string;
}

export interface Department {
  department_id: number;
  department_name: string;
  location: string;
}

export interface User {
  user_id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_id: number;
  department_id: number;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface Case {
  case_id: number;
  case_number: string;
  title: string;
  description: string;
  crime_type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Under Investigation' | 'Closed' | 'Cold Case';
  opened_date: string;
  closed_date: string | null;
  lead_investigator: number;
  crime_scene_id: number | null;
}

export interface CaseAssignment {
  assignment_id: number;
  case_id: number;
  user_id: number;
  assigned_date: string;
  role_in_case: string;
}

export interface CrimeScene {
  scene_id: number;
  address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface Person {
  person_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
}

export interface Suspect {
  suspect_id: number;
  person_id: number;
  case_id: number;
  risk_level: 'Low' | 'Medium' | 'High';
  criminal_record: string;
  status: 'Under Watch' | 'Detained' | 'Released' | 'Wanted';
}

export interface Victim {
  victim_id: number;
  person_id: number;
  case_id: number;
  injury_details: string;
}

export interface Witness {
  witness_id: number;
  person_id: number;
  case_id: number;
  statement: string;
}

export interface EvidenceType {
  type_id: number;
  type_name: string;
}

export interface Evidence {
  evidence_id: number;
  case_id: number;
  type_id: number;
  barcode: string;
  description: string;
  collected_by: number;
  collected_date: string;
  storage_location: string;
  current_status: 'Collected' | 'In Lab' | 'Storage' | 'Transferred' | 'Released' | 'Destroyed';
  is_sealed: boolean;
}

export interface EvidenceCustody {
  custody_id: number;
  evidence_id: number;
  from_user: number;
  to_user: number;
  transfer_date: string;
  purpose: string;
  location: string;
  remarks: string;
}

export interface Document {
  document_id: number;
  case_id: number;
  evidence_id: number | null;
  uploaded_by: number;
  file_name: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
}

export interface CaseTimeline {
  timeline_id: number;
  case_id: number;
  performed_by: number;
  action: string;
  description: string;
  created_at: string;
}

export interface AuditLog {
  log_id: number;
  user_id: number | null;
  action: string;
  table_name: string;
  record_id: number | null;
  timestamp: string;
  ip_address: string;
}
