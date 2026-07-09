# Federal Forensic Case Management Suite

A secure, modern, full-stack Laboratory Operations and Custody Management system built with **Next.js**, **Python FastAPI**, and **MySQL**.

---

## Technical Architecture

* **Frontend**: Next.js (App Router), Tailwind CSS, Lucide Icons
* **Backend**: Python FastAPI, Uvicorn, `mysql-connector-python` connection pool
* **Database**: MySQL (Host: `localhost:3306`, Database: `forensic_management_system`)
* **Process Concurrency**: Configured with `concurrently` to run frontend and backend simultaneously with a single command.

---

## Advanced MySQL-Centric Features

This project utilizes advanced MySQL constructs to shift relational complexity and transaction safety directly into the database engine:

### 1. Relational Views (`v_case_summaries`)
Offloads complex multi-table joins and data aggregation to the MySQL query optimizer.
* Combines case files, geolocated crime scenes, and lead investigator names.
* Aggregates live counts of linked evidence logs, suspects, victims, and witnesses.

### 2. ACID Transactions & Stored Procedures (`sp_transfer_custody`)
Encapsulates critical custody handovers to guarantee database integrity.
* Uses database-level transaction control (`START TRANSACTION`, `COMMIT`, `ROLLBACK`).
* Atomically inserts handoff history into `evidence_custody` and updates parent coordinates in the `evidence` table. If any step fails, changes are completely rolled back.

### 3. Automated Database Triggers
Ensures security tracking is bulletproof, even if records are updated outside the application shell.
* `trg_case_update`: fires `AFTER UPDATE` on cases. Automatically writes case priority, status, and investigator changes to `audit_logs`.
* `trg_evidence_update`: fires `AFTER UPDATE` on evidence. Automatically writes location, sealed status, and custody status logs.

---

## Schema Structure (`database/schema.sql`)

1. **roles**: User access roles (Admin, Investigator, Supervisor, Analyst)
2. **departments**: Division catalogs (Forensic Unit, Cyber Division, Ballistics Lab, etc.)
3. **users**: Personnel credentials and profile details
4. **crime_scenes**: Geolocated offense zones
5. **cases**: Relational forensic file dossiers
6. **persons**: Unified registry of case participants (suspects, victims, witnesses)
7. **evidence**: Core physical asset inventory
8. **evidence_custody**: Signed handover logs and transfer audits
9. **audit_logs**: Immutable user-action security logs
10. **case_timeline**: Automated milestone event tracker

---

## Installation & Setup Instructions

To run this application locally:

### 1. Setup MySQL Database
Ensure MySQL Server is running on your local machine. Log into your MySQL console and execute:
```sql
CREATE DATABASE forensic_management_system;
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the root directory (you can copy `.env.example`) and fill in your local MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=forensic_management_system
DB_USER=root
DB_PASSWORD=your_mysql_password
```

### 3. Install Dependencies
In the root directory, install all Node.js and Python packages:
```bash
# Install Next.js frontend package dependencies
npm install

# Setup Python Virtual Environment and install packages
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
cd ..
```

### 4. Start Development Servers
Run the unified dev command to launch both Next.js and the FastAPI server concurrently:
```bash
npm run dev
```

> **Note:** The database schema is lazily bootstrapped. On the first API call, the system will programmatically read `schema.sql` and `seed.sql` to construct the tables, views, stored procedures, triggers, and populate demo accounts.

---

## Initial Demo Accounts

Use these credentials to sign in:
* **Administrator**: `admin@forensics.gov` / `admin123`
* **Lead Investigator**: `investigator@forensics.gov` / `investigator123`
* **Lab Analyst**: `analyst@forensics.gov` / `analyst123`
