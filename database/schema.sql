-- Forensic Case Management System (FMS) - MySQL Database Schema
-- Enforces referential integrity, cascading deletes, and data constraints.

CREATE DATABASE IF NOT EXISTS forensic_management_system;
USE forensic_management_system;

-- Disable foreign key checks momentarily to drop or recreate
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(255) UNIQUE NOT NULL,
  location TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Crime Types
CREATE TABLE IF NOT EXISTS crime_types (
  type_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Users (Lab Personnel)
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role_id INT,
  department_id INT,
  status VARCHAR(50) DEFAULT 'Active',
  created_at VARCHAR(255),
  updated_at VARCHAR(255),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Crime Scenes
CREATE TABLE IF NOT EXISTS crime_scenes (
  scene_id INT AUTO_INCREMENT PRIMARY KEY,
  address VARCHAR(255),
  city VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  latitude DOUBLE,
  longitude DOUBLE,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Cases
CREATE TABLE IF NOT EXISTS cases (
  case_id INT AUTO_INCREMENT PRIMARY KEY,
  case_number VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  crime_type VARCHAR(255),
  priority VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'Open',
  opened_date VARCHAR(255),
  closed_date VARCHAR(255),
  lead_investigator INT,
  crime_scene_id INT,
  FOREIGN KEY (lead_investigator) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (crime_scene_id) REFERENCES crime_scenes(scene_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Case Assignments (Investigator tracking)
CREATE TABLE IF NOT EXISTS case_assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT,
  user_id INT,
  assigned_date VARCHAR(255),
  role_in_case VARCHAR(255),
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Persons (Core entity for people connected to cases)
CREATE TABLE IF NOT EXISTS persons (
  person_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  dob VARCHAR(50),
  phone VARCHAR(100),
  email VARCHAR(255),
  address TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Suspects
CREATE TABLE IF NOT EXISTS suspects (
  suspect_id INT AUTO_INCREMENT PRIMARY KEY,
  person_id INT,
  case_id INT,
  risk_level VARCHAR(50) DEFAULT 'Medium',
  criminal_record TEXT,
  status VARCHAR(50) DEFAULT 'Under Watch',
  FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Victims
CREATE TABLE IF NOT EXISTS victims (
  victim_id INT AUTO_INCREMENT PRIMARY KEY,
  person_id INT,
  case_id INT,
  injury_details TEXT,
  FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Witnesses
CREATE TABLE IF NOT EXISTS witnesses (
  witness_id INT AUTO_INCREMENT PRIMARY KEY,
  person_id INT,
  case_id INT,
  statement TEXT,
  FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Evidence Types
CREATE TABLE IF NOT EXISTS evidence_types (
  type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(255) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Evidence Inventory
CREATE TABLE IF NOT EXISTS evidence (
  evidence_id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT,
  type_id INT,
  barcode VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  collected_by INT,
  collected_date VARCHAR(255),
  storage_location VARCHAR(255),
  current_status VARCHAR(50) DEFAULT 'Collected',
  is_sealed INT DEFAULT 1,
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
  FOREIGN KEY (type_id) REFERENCES evidence_types(type_id) ON DELETE SET NULL,
  FOREIGN KEY (collected_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Evidence Custody Transfer History
CREATE TABLE IF NOT EXISTS evidence_custody (
  custody_id INT AUTO_INCREMENT PRIMARY KEY,
  evidence_id INT,
  from_user INT,
  to_user INT,
  transfer_date VARCHAR(255),
  purpose VARCHAR(255),
  location VARCHAR(255),
  remarks TEXT,
  FOREIGN KEY (evidence_id) REFERENCES evidence(evidence_id) ON DELETE CASCADE,
  FOREIGN KEY (from_user) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (to_user) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Case Documents & Uploads
CREATE TABLE IF NOT EXISTS documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT,
  evidence_id INT,
  uploaded_by INT,
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  file_type VARCHAR(255),
  uploaded_at VARCHAR(255),
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_id) REFERENCES evidence(evidence_id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Case Timelines
CREATE TABLE IF NOT EXISTS case_timeline (
  timeline_id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT,
  performed_by INT,
  action VARCHAR(255),
  description TEXT,
  created_at VARCHAR(255),
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Security & Immutable Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255),
  table_name VARCHAR(255),
  record_id INT,
  timestamp VARCHAR(255),
  ip_address VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. Secured User Notifications
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255),
  message TEXT,
  is_read INT DEFAULT 0,
  created_at VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. Exported Court Reports
CREATE TABLE IF NOT EXISTS reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT,
  generated_by INT,
  generated_at VARCHAR(255),
  file_path VARCHAR(255),
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. Lab Forensic Analysis Reports
CREATE TABLE IF NOT EXISTS lab_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT,
  evidence_id INT,
  examiner_id INT,
  report_type VARCHAR(255),
  result TEXT,
  created_at VARCHAR(255),
  FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_id) REFERENCES evidence(evidence_id) ON DELETE CASCADE,
  FOREIGN KEY (examiner_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
