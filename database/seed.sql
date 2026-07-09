-- Seeding Forensic Case Management System (FMS) with Default Metadata & Demo Records
-- Hashed credentials for Admin, Lead Investigator, and Forensic Analyst.

USE forensic_management_system;

-- 1. Seed Roles
INSERT INTO roles (role_id, role_name, description) VALUES 
  (1, 'Admin', 'System administrator with full database access.'),
  (2, 'Lead Investigator', 'Investigator lead with authority to open/close cases and assign personnel.'),
  (3, 'Investigator', 'Investigator with read/write access to assigned cases, evidence, and persons.'),
  (4, 'Forensic Analyst', 'Lab technician with access to evidence testing, reports, and details.'),
  (5, 'Technician', 'Staff responsible for evidence collection and secure storage.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 2. Seed Departments
INSERT INTO departments (department_id, department_name, location) VALUES 
  (1, 'Homicide Division', 'Floor 3, Main HQ'),
  (2, 'Cyber Forensics Unit', 'Floor 5, Lab A'),
  (3, 'Ballistics & Firearm Analysis', 'Basement, Range 1'),
  (4, 'DNA & Serology Lab', 'Floor 4, Sterile Lab'),
  (5, 'Toxicology & Narcotics', 'Floor 4, Lab B')
ON DUPLICATE KEY UPDATE location = VALUES(location);

-- 3. Seed Crime Types
INSERT INTO crime_types (type_id, name) VALUES 
  (1, 'Murder'),
  (2, 'Theft'),
  (3, 'Cyber Crime'),
  (4, 'Fraud'),
  (5, 'Assault'),
  (6, 'Narcotics'),
  (7, 'Kidnapping'),
  (8, 'Homicide & Burglary'),
  (9, 'Grand Larceny'),
  (10, 'Other')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 4. Seed Users (With pre-hashed passwords using bcrypt)
-- 'admin123' -> $2a$10$WqBFrEOn8C6rE299i6tEbu/CenGOn3wW1BqgB7ZgX3vQeN694rC7O (or similar)
-- Hashing will be done dynamically during Javascript initialization if DB is empty.
-- We seed basic credentials.
INSERT INTO users (user_id, employee_id, first_name, last_name, email, phone, password_hash, role_id, department_id, status, created_at, updated_at) VALUES 
  (1, 'EMP-001', 'John', 'Miller', 'admin@forensics.gov', '+1 (555) 019-2834', '$2b$10$hC3wdVepgqwqmO0mc.zQQ.e32LnUGkQEDNDrZpKI3GFl/rfFG5KBu', 1, 1, 'Active', '2026-06-15T02:30:00Z', '2026-06-15T02:30:00Z'),
  (2, 'EMP-002', 'Sarah', 'Connor', 'investigator@forensics.gov', '+1 (555) 014-9988', '$2b$10$hhP/REXGz8.AGrTdbHCIUe5CGxtkBaaCNECuTshMzr41.7VjM4QKi', 2, 1, 'Active', '2026-06-15T02:30:00Z', '2026-06-15T02:30:00Z'),
  (3, 'EMP-003', 'David', 'Kim', 'analyst@forensics.gov', '+1 (555) 018-7711', '$2b$10$f5uxP57rSjt46GZJteQFRel3QPs40APJmDmXAY3QfufOG51UKSlx.', 4, 4, 'Active', '2026-06-15T02:30:00Z', '2026-06-15T02:30:00Z')
ON DUPLICATE KEY UPDATE status = VALUES(status), password_hash = VALUES(password_hash);

-- 5. Seed Crime Scenes
INSERT INTO crime_scenes (scene_id, address, city, district, state, country, latitude, longitude, description) VALUES 
  (1, '104 Industrial Parkway, Sector 4', 'Metro City', 'Downtown District', 'New State', 'USA', 40.7128, -74.006, 'Primary commercial shipping warehouse. Victims found near Sector B loading docks. Forced entry at Rear Entrance C.'),
  (2, '77 Government Plaza, State Treasury Bldg', 'Metro City', 'Capitol Hill', 'New State', 'USA', 40.7150, -74.010, 'Server room rack 12, Terminal unit 4-A. Virtual crime scene detailing active command-and-control connection.'),
  (3, '500 Financial Boulevard', 'Metro City', 'Financial Center', 'New State', 'USA', 40.7090, -74.008, 'Metro Bank Vault 3 and lobby floor teller cages.')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 6. Seed Cases
INSERT INTO cases (case_id, case_number, title, description, crime_type, priority, status, opened_date, closed_date, lead_investigator, crime_scene_id) VALUES 
  (1, 'CASE-2026-0001', 'Double Homicide at Downtown Warehouse', 'Two security guards found deceased with gunshot wounds at 104 Industrial Parkway. Vault door was breached, files stolen.', 'Homicide & Burglary', 'Critical', 'Under Investigation', '2026-06-15T02:30:00Z', NULL, 2, 1),
  (2, 'CASE-2026-0002', 'State Treasury Ransomware Attack', 'Treasury databases locked with BitLocker cryptor. Threat actor demanding $5M BTC. Infiltration vector appears to be phishing.', 'Cyber Crime', 'High', 'Under Investigation', '2026-06-20T09:00:00Z', NULL, 2, 2),
  (3, 'CASE-2026-0003', 'The Grand Bank Robbery (Archived)', 'Armed heist at Metro Bank. Dynamic entry by 4 suspects wearing silicone masks. Recovered getaway van.', 'Grand Larceny', 'Medium', 'Closed', '2026-02-10T11:00:00Z', '2026-03-05T17:00:00Z', 2, 3)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 7. Seed Case Assignments
INSERT INTO case_assignments (assignment_id, case_id, user_id, assigned_date, role_in_case) VALUES 
  (1, 1, 2, '2026-06-15T03:00:00Z', 'Lead Investigator'),
  (2, 1, 3, '2026-06-15T04:00:00Z', 'Lab DNA Analyst'),
  (3, 2, 2, '2026-06-20T10:00:00Z', 'Lead Investigator')
ON DUPLICATE KEY UPDATE role_in_case = VALUES(role_in_case);

-- 8. Seed Persons
INSERT INTO persons (person_id, first_name, last_name, gender, dob, phone, email, address) VALUES 
  (1, 'Marcus', 'Vance', 'Male', '1984-04-12', '+1 (555) 012-3456', 'mvance@gmail.com', '12 Gridley Ave, Metro City'),
  (2, 'Robert', 'Gomez', 'Male', '1976-11-23', '+1 (555) 013-1122', 'rgomez@securitypro.com', '404 Pine Dr, District 2'),
  (3, 'Emily', 'Watson', 'Female', '1992-08-01', '+1 (555) 017-9090', 'emily.w@downtownretail.com', '99 Oak Lane, Apt 4C'),
  (4, 'Arthur', 'Pendleton', 'Male', '1989-12-15', '+1 (555) 019-3829', 'pendleton@shadowdomain.net', 'Unknown / Transient')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- 9. Seed Suspects
INSERT INTO suspects (suspect_id, person_id, case_id, risk_level, criminal_record, status) VALUES 
  (1, 1, 1, 'High', 'Prior felony conviction for armed burglary in 2018. Released in 2024.', 'Detained'),
  (2, 4, 2, 'High', 'Cyber espionage and carding ring investigation in Europe.', 'Wanted')
ON DUPLICATE KEY UPDATE risk_level = VALUES(risk_level);

-- 10. Seed Victims
INSERT INTO victims (victim_id, person_id, case_id, injury_details) VALUES 
  (1, 2, 1, 'Fatal blunt force trauma and gunshot wound to chest. Pronounced dead at scene.')
ON DUPLICATE KEY UPDATE injury_details = VALUES(injury_details);

-- 11. Seed Witnesses
INSERT INTO witnesses (witness_id, person_id, case_id, statement) VALUES 
  (1, 3, 1, 'Saw a dark-colored delivery van leave the warehouse parking lot at high speed around 01:45 AM. Heard two loud pops shortly before.')
ON DUPLICATE KEY UPDATE statement = VALUES(statement);

-- 12. Seed Evidence Types
INSERT INTO evidence_types (type_id, type_name) VALUES 
  (1, 'Firearms & Ammunition'),
  (2, 'Biological (DNA/Blood)'),
  (3, 'Digital Device / Hard Drive'),
  (4, 'Latent Fingerprints'),
  (5, 'Documentary / Written Record'),
  (6, 'Trace Evidence (Fibers, Hair)'),
  (7, 'Toxicological Sample')
ON DUPLICATE KEY UPDATE type_name = VALUES(type_name);

-- 13. Seed Evidence
INSERT INTO evidence (evidence_id, case_id, type_id, barcode, description, collected_by, collected_date, storage_location, current_status, is_sealed) VALUES 
  (1, 1, 1, 'EVID-9028-11A', 'Glock 19 Gen 5, 9mm semi-automatic pistol. Scratched serial number. Found under metal shelf at scene.', 2, '2026-06-15T03:45:00Z', 'Safe Cabinet 4-B, Ballistics Lab', 'In Lab', 1),
  (2, 1, 2, 'EVID-9028-12B', 'Blood swab from loading dock handrail. Droplet form, suspect likely cut themselves while fleeing.', 3, '2026-06-15T04:15:00Z', 'Cold Storage Locker 3, DNA Lab', 'Storage', 1),
  (3, 2, 3, 'EVID-3382-77X', 'Western Digital 1TB SSD extracted from terminal server 4-A. Suspected entry point logs.', 2, '2026-06-20T11:30:00Z', 'Anti-Static Bag B-1, Cyber Unit', 'In Lab', 0)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 14. Seed Evidence Custody
INSERT INTO evidence_custody (custody_id, evidence_id, from_user, to_user, transfer_date, purpose, location, remarks) VALUES 
  (1, 1, 2, 3, '2026-06-15T06:00:00Z', 'Chemical latent print enhancement and serial restoration.', 'DNA & Fingerprint Room 10', 'Seals verified intact at transfer.')
ON DUPLICATE KEY UPDATE purpose = VALUES(purpose);

-- 15. Seed Documents
INSERT INTO documents (document_id, case_id, evidence_id, uploaded_by, file_name, file_path, file_type, uploaded_at) VALUES 
  (1, 1, NULL, 2, 'first_responders_report.pdf', '/uploads/mock_first_responder.pdf', 'application/pdf', '2026-06-15T05:00:00Z')
ON DUPLICATE KEY UPDATE file_name = VALUES(file_name);

-- 16. Seed Timeline
INSERT INTO case_timeline (timeline_id, case_id, performed_by, action, description, created_at) VALUES 
  (1, 1, 2, 'Case Created', 'Case folder opened. Primary scene investigators dispatched to 104 Industrial Parkway.', '2026-06-15T02:45:00Z'),
  (2, 1, 2, 'Evidence Logged', 'Barcode EVID-9028-11A (Glock 19) registered in the custody engine.', '2026-06-15T03:50:00Z')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 17. Seed Notifications
INSERT INTO notifications (notification_id, user_id, title, message, is_read, created_at) VALUES 
  (1, 2, 'New Assignment', 'You have been assigned as Lead Investigator on Case CASE-2026-0001', 0, '2026-07-08T06:39:50-07:00'),
  (2, 3, 'Lab Handover', 'Secure Evidence EVID-9028-11A transferred to your custody.', 0, '2026-07-08T06:39:50-07:00')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 18. Seed Audit Logs
INSERT INTO audit_logs (log_id, user_id, action, table_name, record_id, timestamp, ip_address) VALUES 
  (1, 1, 'Database Seeded', 'all', 1, '2026-07-08T06:39:50-07:00', '127.0.0.1')
ON DUPLICATE KEY UPDATE action = VALUES(action);
