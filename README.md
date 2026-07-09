# Federal Forensic Case Management System (FMS)

A secure, modern, full-stack Laboratory Operations and Custody Management system built with React, Node.js (Express), and MySQL.

---

## Technical Architecture

- **Frontend**: React 19, Tailwind CSS, Lucide icons, Recharts
- **Backend**: Node.js, Express, `mysql2` Promise Connection Pool
- **Database**: MySQL (Host: `localhost:3306`, Database: `forensic_management_system`)
- **API Core**: Modular routers with prepared SQL statements
- **Security**: SHA-256 equivalent Salt bcrypt-based password hashing, immutable security logs, chain of custody tracking

---

## Database Migration: SQLite to MySQL

The database has been completely migrated from a local SQLite file database to a high-performance **MySQL** instance utilizing connection pooling and standard InnoDB relational indexing.

### Schema Structure (`database/schema.sql`)
1. **roles**: User access roles (Admin, Lead Investigator, etc.)
2. **departments**: Division catalogs (Homicide, Cyber, DNA Lab, etc.)
3. **crime_types**: Standardized crime classifications
4. **users**: Laboratory and investigator personnel profiles
5. **crime_scenes**: Geolocated offense and processing zones
6. **cases**: Relational forensic file portfolios
7. **case_assignments**: Personnel to case matching
8. **persons**: Unified registry of case participants
9. **suspects**: Risk levels, watch states, and records
10. **victims**: Injury details and records
11. **witnesses**: Verbatim statements
12. **evidence_types**: Forensic classifications (Biological, Ballistics, Digital, etc.)
13. **evidence**: Core chain of custody inventory
14. **evidence_custody**: Signed handover logs and transfer audits
15. **documents**: External uploads and PDF/text archives
16. **case_timeline**: Automated milestone event tracker
17. **audit_logs**: Immutable user-action security tracker
18. **notifications**: In-app message routing
19. **reports**: Official exported court documents
20. **lab_reports**: Forensic examiner testing logs and results

---

## Installation & Setup Instructions (Localhost)

To run this application locally with your MySQL database:

### 1. Install MySQL Server
Ensure MySQL Server is installed and running on your local machine:
- **macOS** (via Homebrew): `brew install mysql && brew services start mysql`
- **Windows / Linux**: Download and install via official MySQL Installer or package manager.

### 2. Create the Database
Connect to your local MySQL server as `root` (or configured user) and execute:
```sql
CREATE DATABASE forensic_management_system;
```

### 3. Configure the Environment (`.env`)
Create a `.env` file in the root directory (copied from `.env.example`) and fill in your local MySQL login credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=forensic_management_system
DB_USER=root
DB_PASSWORD=your_mysql_password
```

### 4. Install Dependencies
Install all backend and frontend dependencies:
```bash
npm install
```

### 5. Start Development Server
Run the unified full-stack server (tsx handles hot-reloads of Express backend while Vite serves frontend assets):
```bash
npm run dev
```

The database connection is lazily-initialized. On the first connection, the system programmatically reads `database/schema.sql` and `database/seed.sql` to construct the entire database schema and seed the initial personnel roles, departments, crime classifications, geolocated crime scenes, and hashed mock user accounts.

### Initial Demo Accounts
- **Administrator**: `admin@forensics.gov` / `admin123`
- **Lead Investigator**: `investigator@forensics.gov` / `investigator123`
- **Forensic Analyst**: `analyst@forensics.gov` / `analyst123`
