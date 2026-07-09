import os
import base64
import bcrypt
import random
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel
from app.db import init_database, query, get, run_db, log_action, log_timeline

app = FastAPI(title="FMS Python Backend Service")

# Startup event to bootstrap MySQL database
@app.on_event("startup")
def startup_event():
    init_database()

# Pydantic schemas for request payloads
class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = ""
    role_id: Optional[int] = 3
    department_id: Optional[int] = 1
    status: Optional[str] = "Active"
    password: Optional[str] = "password123"
    employee_id: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    department_id: Optional[int] = None
    status: Optional[str] = None
    password: Optional[str] = None

class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    crime_type: Optional[str] = "Other"
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Open"
    lead_investigator: Optional[int] = 1
    crime_scene_id: Optional[int] = None
    case_number: Optional[str] = None

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    crime_type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    lead_investigator: Optional[int] = None
    crime_scene_id: Optional[int] = None
    operator_id: Optional[int] = 1

class CaseAssignmentCreate(BaseModel):
    user_id: int
    role_in_case: Optional[str] = "Investigator"

class CrimeSceneCreate(BaseModel):
    address: Optional[str] = ""
    city: Optional[str] = ""
    district: Optional[str] = ""
    state: Optional[str] = ""
    country: Optional[str] = ""
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    description: Optional[str] = ""

class EvidenceCreate(BaseModel):
    case_id: int
    type_id: int
    description: Optional[str] = ""
    collected_by: Optional[int] = None
    collected_date: Optional[str] = None
    storage_location: Optional[str] = "General Storage Vault"
    current_status: Optional[str] = "Collected"
    is_sealed: Optional[bool] = True
    barcode: Optional[str] = None
    operator_id: Optional[int] = 1

class EvidenceUpdate(BaseModel):
    description: Optional[str] = None
    storage_location: Optional[str] = None
    current_status: Optional[str] = None
    is_sealed: Optional[bool] = None
    operator_id: Optional[int] = 1

class EvidenceCustodyCreate(BaseModel):
    evidence_id: int
    to_user: int
    purpose: Optional[str] = "Analysis"
    location: Optional[str] = "Main Laboratory"
    remarks: Optional[str] = ""
    from_user: Optional[int] = 1

class PersonCreate(BaseModel):
    first_name: str
    last_name: str
    gender: Optional[str] = ""
    dob: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""

class SuspectCreate(BaseModel):
    person_id: int
    case_id: int
    risk_level: Optional[str] = "Medium"
    criminal_record: Optional[str] = ""
    status: Optional[str] = "Under Watch"
    operator_id: Optional[int] = 1

class VictimCreate(BaseModel):
    person_id: int
    case_id: int
    injury_details: Optional[str] = ""
    operator_id: Optional[int] = 1

class WitnessCreate(BaseModel):
    person_id: int
    case_id: int
    statement: str
    operator_id: Optional[int] = 1

class PersonUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SuspectUpdate(BaseModel):
    risk_level: Optional[str] = None
    criminal_record: Optional[str] = None
    status: Optional[str] = None
    operator_id: Optional[int] = 1

class VictimUpdate(BaseModel):
    injury_details: Optional[str] = None
    operator_id: Optional[int] = 1

class WitnessUpdate(BaseModel):
    statement: Optional[str] = None
    operator_id: Optional[int] = 1

class DocumentUploadRequest(BaseModel):
    case_id: int
    uploaded_by: int
    file_name: str
    file_type: Optional[str] = "application/octet-stream"
    file_data: str  # Base64 string
    evidence_id: Optional[int] = None


# Helpers for password hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    # Match JS format prefix replacing $2a$ with $2b$
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8").replace("$2a$", "$2b$")

def verify_password(password: str, password_hash: str) -> bool:
    # Handle direct comparisons for migrations if needed, otherwise standard bcrypt check
    try:
        # Match standard bcrypt hashes
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        # Fallback to direct string check if comparison fails
        return password == password_hash


# --- ROUTE ENDPOINTS ---

# 1. POST /api/auth/login
@app.post("/api/auth/login")
def auth_login(body: LoginRequest, request: Request):
    user = get("SELECT * FROM users WHERE LOWER(email) = LOWER(%s)", [body.email])
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    if user["status"] == "Inactive":
        raise HTTPException(status_code=403, detail="Account is deactivated")
        
    ip = request.client.host if request.client else "127.0.0.1"
    log_action(user["user_id"], "USER_LOGIN", "users", user["user_id"], ip)
    
    return {
        "token": f"secure-session-token-for-{user['user_id']}",
        "user": {
            "user_id": user["user_id"],
            "employee_id": user["employee_id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"],
            "phone": user["phone"],
            "role_id": user["role_id"],
            "department_id": user["department_id"],
            "status": user["status"]
        }
    }

# 2. GET /api/roles
@app.get("/api/roles")
def get_roles():
    return query("SELECT * FROM roles ORDER BY role_id ASC")

# 3. GET /api/departments
@app.get("/api/departments")
def get_departments():
    return query("SELECT * FROM departments ORDER BY department_id ASC")

# 4. GET /api/users & POST /api/users
@app.get("/api/users")
def get_users():
    return query("SELECT * FROM users ORDER BY user_id DESC")

@app.post("/api/users", status_code=201)
def create_user(body: UserCreate):
    count_row = get("SELECT COUNT(*) as cnt FROM users")
    employee_id = body.employee_id or f"EMP-{str(count_row['cnt'] + 1).zfill(3)}"
    pass_hash = hash_password(body.password or "password123")
    import datetime
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    result = run_db(
        """INSERT INTO users (employee_id, first_name, last_name, email, phone, password_hash, role_id, department_id, status, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        [employee_id, body.first_name, body.last_name, body.email, body.phone, pass_hash, body.role_id, body.department_id, body.status, now, now]
    )
    newUser = get("SELECT * FROM users WHERE user_id = %s", [result["lastID"]])
    log_action(1, "CREATE_USER_ACCOUNT", "users", result["lastID"])
    return newUser

# PUT /api/users/{user_id}
@app.put("/api/users/{user_id}")
def update_user(user_id: int, body: UserUpdate):
    existing = get("SELECT * FROM users WHERE user_id = %s", [user_id])
    if not existing:
        raise HTTPException(status_code=404, detail="User account not found")
        
    first_name = body.first_name if body.first_name is not None else existing["first_name"]
    last_name = body.last_name if body.last_name is not None else existing["last_name"]
    email = body.email if body.email is not None else existing["email"]
    phone = body.phone if body.phone is not None else existing["phone"]
    role_id = body.role_id if body.role_id is not None else existing["role_id"]
    department_id = body.department_id if body.department_id is not None else existing["department_id"]
    status = body.status if body.status is not None else existing["status"]
    
    password_hash = hash_password(body.password) if body.password else existing["password_hash"]
    import datetime
    updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    run_db(
        """UPDATE users 
           SET first_name = %s, last_name = %s, email = %s, phone = %s, role_id = %s, department_id = %s, status = %s, password_hash = %s, updated_at = %s
           WHERE user_id = %s""",
        [first_name, last_name, email, phone, role_id, department_id, status, password_hash, updated_at, user_id]
    )
    updated = get("SELECT * FROM users WHERE user_id = %s", [user_id])
    log_action(1, "UPDATE_USER_ACCOUNT", "users", user_id)
    return updated

# 5. GET /api/cases & POST /api/cases
@app.get("/api/cases")
def get_cases():
    return query("SELECT * FROM v_case_summaries ORDER BY case_id DESC")

@app.post("/api/cases", status_code=201)
def create_case(body: CaseCreate):
    year = 2026
    count_row = get("SELECT COUNT(*) as cnt FROM cases")
    seq = str(count_row["cnt"] + 1).zfill(4)
    case_number = body.case_number or f"CASE-{year}-{seq}"
    import datetime
    opened_date = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    result = run_db(
        """INSERT INTO cases (case_number, title, description, crime_type, priority, status, opened_date, lead_investigator, crime_scene_id)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        [case_number, body.title, body.description, body.crime_type, body.priority, body.status, opened_date, body.lead_investigator, body.crime_scene_id]
    )
    new_case = get("SELECT * FROM cases WHERE case_id = %s", [result["lastID"]])
    log_action(1, "CREATE_CASE", "cases", result["lastID"])
    log_timeline(result["lastID"], body.lead_investigator or 1, "Case Created", f"Case {case_number} folder opened.")
    return new_case

# GET /api/cases/{case_id} & PUT /api/cases/{case_id}
@app.get("/api/cases/{case_id}")
def get_case(case_id: int):
    c = get("SELECT * FROM cases WHERE case_id = %s", [case_id])
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    return c

@app.put("/api/cases/{case_id}")
def update_case(case_id: int, body: CaseUpdate):
    existing = get("SELECT * FROM cases WHERE case_id = %s", [case_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Case not found")
        
    title = body.title if body.title is not None else existing["title"]
    description = body.description if body.description is not None else existing["description"]
    crime_type = body.crime_type if body.crime_type is not None else existing["crime_type"]
    priority = body.priority if body.priority is not None else existing["priority"]
    status = body.status if body.status is not None else existing["status"]
    lead_investigator = body.lead_investigator if body.lead_investigator is not None else existing["lead_investigator"]
    crime_scene_id = body.crime_scene_id if body.crime_scene_id is not None else existing["crime_scene_id"]
    
    closed_date = existing["closed_date"]
    if status == "Closed" and existing["status"] != "Closed":
        import datetime
        closed_date = datetime.datetime.now(datetime.timezone.utc).isoformat()
    elif status != "Closed":
        closed_date = None
        
    run_db(
        """UPDATE cases 
           SET title = %s, description = %s, crime_type = %s, priority = %s, status = %s, lead_investigator = %s, crime_scene_id = %s, closed_date = %s
           WHERE case_id = %s""",
        [title, description, crime_type, priority, status, lead_investigator, crime_scene_id, closed_date, case_id]
    )
    updated = get("SELECT * FROM cases WHERE case_id = %s", [case_id])
    op_id = body.operator_id or 1
    log_action(op_id, "UPDATE_CASE", "cases", case_id)
    if status != existing["status"]:
        log_timeline(case_id, op_id, "Status Changed", f"Status updated from {existing['status']} to {status}.")
    return updated

# 6. GET /api/cases/{case_id}/assignments & POST
@app.get("/api/cases/{case_id}/assignments")
def get_case_assignments(case_id: int):
    return query("SELECT * FROM case_assignments WHERE case_id = %s", [case_id])

@app.post("/api/cases/{case_id}/assignments", status_code=201)
def create_case_assignment(case_id: int, body: CaseAssignmentCreate):
    import datetime
    assigned_date = datetime.datetime.now(datetime.timezone.utc).isoformat()
    result = run_db(
        "INSERT INTO case_assignments (case_id, user_id, assigned_date, role_in_case) VALUES (%s, %s, %s, %s)",
        [case_id, body.user_id, assigned_date, body.role_in_case]
    )
    assign = get("SELECT * FROM case_assignments WHERE assignment_id = %s", [result["lastID"]])
    log_action(1, "ASSIGN_USER_TO_CASE", "case_assignments", result["lastID"])
    log_timeline(case_id, 1, "Personnel Assigned", f"User ID {body.user_id} assigned to case as {body.role_in_case}.")
    return assign

# 7. DELETE /api/assignments/{assignment_id}
@app.delete("/api/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, operator_id: int = 1):
    existing = get("SELECT * FROM case_assignments WHERE assignment_id = %s", [assignment_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Assignment not found")
    run_db("DELETE FROM case_assignments WHERE assignment_id = %s", [assignment_id])
    log_action(operator_id, "REMOVE_ASSIGNMENT", "case_assignments", assignment_id)
    log_timeline(existing["case_id"], operator_id, "Personnel Removed", f"User ID {existing['user_id']} unassigned from case.")
    return {"success": True}

# 8. GET /api/crime-scenes & POST
@app.get("/api/crime-scenes")
def get_crime_scenes():
    return query("SELECT * FROM crime_scenes ORDER BY scene_id DESC")

@app.post("/api/crime-scenes", status_code=201)
def create_crime_scene(body: CrimeSceneCreate):
    result = run_db(
        """INSERT INTO crime_scenes (address, city, district, state, country, latitude, longitude, description)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        [body.address, body.city, body.district, body.state, body.country, body.latitude, body.longitude, body.description]
    )
    scene = get("SELECT * FROM crime_scenes WHERE scene_id = %s", [result["lastID"]])
    log_action(1, "CREATE_CRIME_SCENE", "crime_scenes", result["lastID"])
    return scene

# 9. GET /api/timeline
@app.get("/api/timeline")
def get_timeline_events(case_id: Optional[int] = None):
    if case_id is not None:
        return query("SELECT * FROM case_timeline WHERE case_id = %s ORDER BY timeline_id DESC", [case_id])
    return query("SELECT * FROM case_timeline ORDER BY timeline_id DESC")

# 10. GET /api/evidence-types
@app.get("/api/evidence-types")
def get_evidence_types():
    return query("SELECT * FROM evidence_types ORDER BY type_id ASC")

# 11. GET /api/evidence & POST
@app.get("/api/evidence")
def get_evidence_items(case_id: Optional[int] = None):
    if case_id is not None:
        return query("SELECT * FROM evidence WHERE case_id = %s ORDER BY evidence_id DESC", [case_id])
    return query("SELECT * FROM evidence ORDER BY evidence_id DESC")

@app.post("/api/evidence", status_code=201)
def create_evidence(body: EvidenceCreate):
    rand = random.randint(1000, 9999)
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    char_part = random.choice(alphabet) + random.choice(alphabet)
    barcode = body.barcode or f"EVID-{rand}-{char_part}"
    
    import datetime
    collected_date = body.collected_date or datetime.datetime.now(datetime.timezone.utc).isoformat()
    op_id = body.operator_id or 1
    is_sealed_val = 1 if body.is_sealed else 0
    
    result = run_db(
        """INSERT INTO evidence (case_id, type_id, barcode, description, collected_by, collected_date, storage_location, current_status, is_sealed)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        [body.case_id, body.type_id, barcode, body.description, body.collected_by or op_id, collected_date, body.storage_location, body.current_status, is_sealed_val]
    )
    newItem = get("SELECT * FROM evidence WHERE evidence_id = %s", [result["lastID"]])
    log_action(op_id, "LOG_EVIDENCE", "evidence", result["lastID"])
    log_timeline(body.case_id, op_id, "Evidence Logged", f"Barcode {barcode} registered: {body.description or 'No description'}")
    return newItem

# GET /api/evidence/{evidence_id} & PUT
@app.get("/api/evidence/{evidence_id}")
def get_evidence(evidence_id: int):
    item = get("SELECT * FROM evidence WHERE evidence_id = %s", [evidence_id])
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    return item

@app.put("/api/evidence/{evidence_id}")
def update_evidence(evidence_id: int, body: EvidenceUpdate):
    existing = get("SELECT * FROM evidence WHERE evidence_id = %s", [evidence_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Evidence item not found")
        
    description = body.description if body.description is not None else existing["description"]
    storage_location = body.storage_location if body.storage_location is not None else existing["storage_location"]
    current_status = body.current_status if body.current_status is not None else existing["current_status"]
    
    is_sealed = existing["is_sealed"]
    if body.is_sealed is not None:
        is_sealed = 1 if body.is_sealed else 0
        
    op_id = body.operator_id or 1
    
    run_db(
        """UPDATE evidence 
           SET description = %s, storage_location = %s, current_status = %s, is_sealed = %s
           WHERE evidence_id = %s""",
        [description, storage_location, current_status, is_sealed, evidence_id]
    )
    updated = get("SELECT * FROM evidence WHERE evidence_id = %s", [evidence_id])
    log_action(op_id, "UPDATE_EVIDENCE", "evidence", evidence_id)
    if current_status != existing["current_status"]:
        log_timeline(existing["case_id"], op_id, "Evidence Status Change", f"Evidence {existing['barcode']} status updated to {current_status}")
    return updated

# 12. GET /api/evidence-custody & POST
@app.get("/api/evidence-custody")
def get_evidence_custody_history(evidence_id: Optional[int] = None):
    if evidence_id is not None:
        return query("SELECT * FROM evidence_custody WHERE evidence_id = %s ORDER BY custody_id DESC", [evidence_id])
    return query("SELECT * FROM evidence_custody ORDER BY custody_id DESC")

@app.post("/api/evidence-custody", status_code=201)
def transfer_evidence_custody(body: EvidenceCustodyCreate):
    item = get("SELECT * FROM evidence WHERE evidence_id = %s", [body.evidence_id])
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
        
    import datetime
    transfer_date = datetime.datetime.now(datetime.timezone.utc).isoformat()
    op_id = body.from_user or 1
    
    # Call MySQL Stored Procedure using transaction parameters
    run_db("CALL sp_transfer_custody(%s, %s, %s, %s, %s, %s, %s, @success)", [
        body.evidence_id, op_id, body.to_user, body.purpose or "Custody Transfer", body.location, body.remarks or "", "Transferred"
    ])
    
    # Fetch the newly created custody record from database View/Table
    custody = get("SELECT * FROM evidence_custody WHERE evidence_id = %s ORDER BY custody_id DESC LIMIT 1", [body.evidence_id])
    if not custody:
        raise HTTPException(status_code=500, detail="Custody transfer transaction failed.")
        
    log_action(op_id, "TRANSFER_EVIDENCE", "evidence_custody", custody["custody_id"])
    log_timeline(item["case_id"], op_id, "Custody Transferred", f"Evidence {item['barcode']} handed over to User ID {body.to_user}. Location: {body.location}")
    return custody

# 13. GET /api/persons & POST
@app.get("/api/persons")
def get_persons():
    return query("SELECT * FROM persons ORDER BY person_id DESC")

@app.post("/api/persons", status_code=201)
def create_person(body: PersonCreate):
    result = run_db(
        """INSERT INTO persons (first_name, last_name, gender, dob, phone, email, address)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [body.first_name, body.last_name, body.gender, body.dob, body.phone, body.email, body.address]
    )
    newPerson = get("SELECT * FROM persons WHERE person_id = %s", [result["lastID"]])
    log_action(1, "CREATE_PERSON_RECORD", "persons", result["lastID"])
    return newPerson

# 14. GET /api/suspects & POST
@app.get("/api/suspects")
def get_suspects(case_id: Optional[int] = None):
    if case_id is not None:
        return query("SELECT * FROM suspects WHERE case_id = %s ORDER BY suspect_id DESC", [case_id])
    return query("SELECT * FROM suspects ORDER BY suspect_id DESC")

@app.post("/api/suspects", status_code=201)
def create_suspect(body: SuspectCreate):
    person = get("SELECT * FROM persons WHERE person_id = %s", [body.person_id])
    if not person:
        raise HTTPException(status_code=404, detail="Person record not found")
        
    result = run_db(
        """INSERT INTO suspects (person_id, case_id, risk_level, criminal_record, status)
           VALUES (%s, %s, %s, %s, %s)""",
        [body.person_id, body.case_id, body.risk_level, body.criminal_record, body.status]
    )
    suspect = get("SELECT * FROM suspects WHERE suspect_id = %s", [result["lastID"]])
    op_id = body.operator_id or 1
    log_action(op_id, "ADD_SUSPECT", "suspects", result["lastID"])
    log_timeline(body.case_id, op_id, "Suspect Linked", f"Suspect {person['first_name']} {person['last_name']} linked to case.")
    return suspect

# 15. GET /api/victims & POST
@app.get("/api/victims")
def get_victims(case_id: Optional[int] = None):
    if case_id is not None:
        return query("SELECT * FROM victims WHERE case_id = %s ORDER BY victim_id DESC", [case_id])
    return query("SELECT * FROM victims ORDER BY victim_id DESC")

@app.post("/api/victims", status_code=201)
def create_victim(body: VictimCreate):
    person = get("SELECT * FROM persons WHERE person_id = %s", [body.person_id])
    if not person:
        raise HTTPException(status_code=404, detail="Person record not found")
        
    result = run_db(
        "INSERT INTO victims (person_id, case_id, injury_details) VALUES (%s, %s, %s)",
        [body.person_id, body.case_id, body.injury_details]
    )
    victim = get("SELECT * FROM victims WHERE victim_id = %s", [result["lastID"]])
    op_id = body.operator_id or 1
    log_action(op_id, "ADD_VICTIM", "victims", result["lastID"])
    log_timeline(body.case_id, op_id, "Victim Linked", f"Victim {person['first_name']} {person['last_name']} linked to case.")
    return victim

# 16. GET /api/witnesses & POST
@app.get("/api/witnesses")
def get_witnesses(case_id: Optional[int] = None):
    if case_id is not None:
        return query("SELECT * FROM witnesses WHERE case_id = %s ORDER BY witness_id DESC", [case_id])
    return query("SELECT * FROM witnesses ORDER BY witness_id DESC")

@app.post("/api/witnesses", status_code=201)
def create_witness(body: WitnessCreate):
    person = get("SELECT * FROM persons WHERE person_id = %s", [body.person_id])
    if not person:
        raise HTTPException(status_code=404, detail="Person record not found")
        
    result = run_db(
        "INSERT INTO witnesses (person_id, case_id, statement) VALUES (%s, %s, %s)",
        [body.person_id, body.case_id, body.statement]
    )
    witness = get("SELECT * FROM witnesses WHERE witness_id = %s", [result["lastID"]])
    op_id = body.operator_id or 1
    log_action(op_id, "ADD_WITNESS", "witnesses", result["lastID"])
    log_timeline(body.case_id, op_id, "Witness Registered", f"Witness {person['first_name']} {person['last_name']} statement recorded.")
    return witness

@app.put("/api/persons/{person_id}")
def update_person(person_id: int, body: PersonUpdate):
    existing = get("SELECT * FROM persons WHERE person_id = %s", [person_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Person not found")
        
    first_name = body.first_name if body.first_name is not None else existing["first_name"]
    last_name = body.last_name if body.last_name is not None else existing["last_name"]
    gender = body.gender if body.gender is not None else existing["gender"]
    dob = body.dob if body.dob is not None else existing["dob"]
    phone = body.phone if body.phone is not None else existing["phone"]
    email = body.email if body.email is not None else existing["email"]
    address = body.address if body.address is not None else existing["address"]
    
    run_db(
        """UPDATE persons 
           SET first_name = %s, last_name = %s, gender = %s, dob = %s, phone = %s, email = %s, address = %s
           WHERE person_id = %s""",
        [first_name, last_name, gender, dob, phone, email, address, person_id]
    )
    return get("SELECT * FROM persons WHERE person_id = %s", [person_id])

@app.put("/api/suspects/{suspect_id}")
def update_suspect(suspect_id: int, body: SuspectUpdate):
    existing = get("SELECT * FROM suspects WHERE suspect_id = %s", [suspect_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Suspect link not found")
        
    risk_level = body.risk_level if body.risk_level is not None else existing["risk_level"]
    criminal_record = body.criminal_record if body.criminal_record is not None else existing["criminal_record"]
    status = body.status if body.status is not None else existing["status"]
    
    run_db(
        """UPDATE suspects 
           SET risk_level = %s, criminal_record = %s, status = %s
           WHERE suspect_id = %s""",
        [risk_level, criminal_record, status, suspect_id]
    )
    updated = get("SELECT * FROM suspects WHERE suspect_id = %s", [suspect_id])
    log_action(body.operator_id or 1, "UPDATE_SUSPECT", "suspects", suspect_id)
    return updated

@app.put("/api/witnesses/{witness_id}")
def update_witness(witness_id: int, body: WitnessUpdate):
    existing = get("SELECT * FROM witnesses WHERE witness_id = %s", [witness_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Witness link not found")
        
    statement = body.statement if body.statement is not None else existing["statement"]
    
    run_db(
        "UPDATE witnesses SET statement = %s WHERE witness_id = %s",
        [statement, witness_id]
    )
    updated = get("SELECT * FROM witnesses WHERE witness_id = %s", [witness_id])
    log_action(body.operator_id or 1, "UPDATE_WITNESS", "witnesses", witness_id)
    return updated

@app.put("/api/victims/{victim_id}")
def update_victim(victim_id: int, body: VictimUpdate):
    existing = get("SELECT * FROM victims WHERE victim_id = %s", [victim_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Victim link not found")
        
    injury_details = body.injury_details if body.injury_details is not None else existing["injury_details"]
    
    run_db(
        "UPDATE victims SET injury_details = %s WHERE victim_id = %s",
        [injury_details, victim_id]
    )
    updated = get("SELECT * FROM victims WHERE victim_id = %s", [victim_id])
    log_action(body.operator_id or 1, "UPDATE_VICTIM", "victims", victim_id)
    return updated

# 17. GET /api/documents
@app.get("/api/documents")
def get_documents(case_id: Optional[int] = None):
    if case_id is not None:
        return query("SELECT * FROM documents WHERE case_id = %s ORDER BY document_id DESC", [case_id])
    return query("SELECT * FROM documents ORDER BY document_id DESC")

# POST /api/documents/upload
@app.post("/api/documents/upload", status_code=201)
def upload_document(body: DocumentUploadRequest):
    # Locate project root public/uploads directory dynamically
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uploads_dir = os.path.join(base_dir, "public", "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir, exist_ok=True)
        
    buffer = base64.b64decode(body.file_data)
    import time
    clean_name = "".join(c for c in body.file_name if c.isalnum() or c in ".-_")
    safe_name = f"{int(time.time())}_{clean_name}"
    file_path = os.path.join(uploads_dir, safe_name)
    
    with open(file_path, "wb") as f:
        f.write(buffer)
        
    virtual_path = f"/uploads/{safe_name}"
    import datetime
    uploaded_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    result = run_db(
        """INSERT INTO documents (case_id, evidence_id, uploaded_by, file_name, file_path, file_type, uploaded_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [body.case_id, body.evidence_id, body.uploaded_by, body.file_name, virtual_path, body.file_type, uploaded_at]
    )
    doc = get("SELECT * FROM documents WHERE document_id = %s", [result["lastID"]])
    log_action(body.uploaded_by, "UPLOAD_DOCUMENT", "documents", result["lastID"])
    log_timeline(body.case_id, body.uploaded_by, "Document Uploaded", f"File {body.file_name} successfully uploaded.")
    return doc

# 18. GET /api/audit
@app.get("/api/audit")
def get_audit_logs():
    return query("SELECT * FROM audit_logs ORDER BY log_id DESC LIMIT 100")

# --- DELETE ROUTES ---

@app.delete("/api/cases/{case_id}")
def delete_case(case_id: int, operator_id: int = 1):
    existing = get("SELECT * FROM cases WHERE case_id = %s", [case_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Case not found")
    run_db("DELETE FROM cases WHERE case_id = %s", [case_id])
    log_action(operator_id, "DELETE_CASE", "cases", case_id)
    return {"success": True}

@app.delete("/api/evidence/{evidence_id}")
def delete_evidence(evidence_id: int, operator_id: int = 1):
    existing = get("SELECT * FROM evidence WHERE evidence_id = %s", [evidence_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    run_db("DELETE FROM evidence WHERE evidence_id = %s", [evidence_id])
    log_action(operator_id, "DELETE_EVIDENCE", "evidence", evidence_id)
    return {"success": True}

@app.delete("/api/users/{user_id}")
def delete_user_endpoint(user_id: int, operator_id: int = 1):
    existing = get("SELECT * FROM users WHERE user_id = %s", [user_id])
    if not existing:
        raise HTTPException(status_code=404, detail="User account not found")
    run_db("DELETE FROM users WHERE user_id = %s", [user_id])
    log_action(operator_id, "DELETE_USER", "users", user_id)
    return {"success": True}

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int, operator_id: int = 1):
    existing = get("SELECT * FROM documents WHERE document_id = %s", [document_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove physical file if exists
    if existing["file_path"]:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        filename = os.path.basename(existing["file_path"])
        physical_path = os.path.join(base_dir, "public", "uploads", filename)
        if os.path.exists(physical_path):
            try:
                os.remove(physical_path)
            except Exception as err:
                print(f"Failed to delete file from disk: {err}")
                
    run_db("DELETE FROM documents WHERE document_id = %s", [document_id])
    log_action(operator_id, "DELETE_DOCUMENT", "documents", document_id)
    return {"success": True}

@app.delete("/api/suspects/{suspect_id}")
def delete_suspect(suspect_id: int, operator_id: int = 1):
    existing = get("SELECT * FROM suspects WHERE suspect_id = %s", [suspect_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Suspect link not found")
    run_db("DELETE FROM suspects WHERE suspect_id = %s", [suspect_id])
    log_action(operator_id, "REMOVE_SUSPECT", "suspects", suspect_id)
    return {"success": True}

@app.delete("/api/victims/{victim_id}")
def delete_victim(victim_id: int, operator_id: int = 1):
    existing = get("SELECT * FROM victims WHERE victim_id = %s", [victim_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Victim link not found")
    run_db("DELETE FROM victims WHERE victim_id = %s", [victim_id])
    log_action(operator_id, "REMOVE_VICTIM", "victims", victim_id)
    return {"success": True}

@app.delete("/api/witnesses/{witness_id}")
def delete_witness(witness_id: int, operator_id: int = 1):
    existing = get("SELECT * FROM witnesses WHERE witness_id = %s", [witness_id])
    if not existing:
        raise HTTPException(status_code=404, detail="Witness link not found")
    run_db("DELETE FROM witnesses WHERE witness_id = %s", [witness_id])
    log_action(operator_id, "REMOVE_WITNESS", "witnesses", witness_id)
    return {"success": True}

