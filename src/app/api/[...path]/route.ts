import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { query, get, run, logAction, logTimeline } from '../../../lib/db';

// Unified Dynamic Catch-All Route Handler
async function handle(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const p = resolvedParams.path;
  const method = req.method;
  const searchParams = req.nextUrl.searchParams;

  try {
    // 1. POST /api/auth/login
    if (method === 'POST' && p.length === 2 && p[0] === 'auth' && p[1] === 'login') {
      const { email, password } = await req.json();
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }
      const user = await get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      const passwordMatch = bcrypt.compareSync(password, user.password_hash) || password === user.password_hash;
      if (!passwordMatch) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      if (user.status === 'Inactive') {
        return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
      }
      await logAction(user.user_id, 'USER_LOGIN', 'users', user.user_id);
      return NextResponse.json({
        token: `secure-session-token-for-${user.user_id}`,
        user: {
          user_id: user.user_id,
          employee_id: user.employee_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role_id: user.role_id,
          department_id: user.department_id,
          status: user.status
        }
      });
    }

    // 2. GET /api/roles
    if (method === 'GET' && p.length === 1 && p[0] === 'roles') {
      const roles = await query('SELECT * FROM roles ORDER BY role_id ASC');
      return NextResponse.json(roles);
    }

    // 3. GET /api/departments
    if (method === 'GET' && p.length === 1 && p[0] === 'departments') {
      const departments = await query('SELECT * FROM departments ORDER BY department_id ASC');
      return NextResponse.json(departments);
    }

    // 4. GET /api/users, POST /api/users
    if (p.length === 1 && p[0] === 'users') {
      if (method === 'GET') {
        const users = await query('SELECT * FROM users ORDER BY user_id DESC');
        return NextResponse.json(users);
      }
      if (method === 'POST') {
        const body = await req.json();
        const { first_name, last_name, email, phone, role_id, department_id, status, password } = body;
        if (!first_name || !last_name || !email) {
          return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 });
        }
        const countRow = await get('SELECT COUNT(*) as cnt FROM users');
        const employeeId = body.employee_id || `EMP-${String(countRow.cnt + 1).padStart(3, '0')}`;
        const passwordHash = bcrypt.hashSync(password || 'password123', 10);
        const now = new Date().toISOString();

        const result = await run(
          `INSERT INTO users (employee_id, first_name, last_name, email, phone, password_hash, role_id, department_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [employeeId, first_name, last_name, email, phone || '', passwordHash, role_id ? Number(role_id) : 3, department_id ? Number(department_id) : 1, status || 'Active', now, now]
        );
        const newUser = await get('SELECT * FROM users WHERE user_id = ?', [result.lastID]);
        await logAction(1, 'CREATE_USER_ACCOUNT', 'users', result.lastID);
        return NextResponse.json(newUser, { status: 201 });
      }
    }

    // PUT /api/users/:id
    if (method === 'PUT' && p.length === 2 && p[0] === 'users') {
      const id = Number(p[1]);
      const body = await req.json();
      const existing = await get('SELECT * FROM users WHERE user_id = ?', [id]);
      if (!existing) {
        return NextResponse.json({ error: 'User account not found' }, { status: 404 });
      }
      const first_name = body.first_name !== undefined ? body.first_name : existing.first_name;
      const last_name = body.last_name !== undefined ? body.last_name : existing.last_name;
      const email = body.email !== undefined ? body.email : existing.email;
      const phone = body.phone !== undefined ? body.phone : existing.phone;
      const role_id = body.role_id !== undefined ? Number(body.role_id) : existing.role_id;
      const department_id = body.department_id !== undefined ? Number(body.department_id) : existing.department_id;
      const status = body.status !== undefined ? body.status : existing.status;
      const updated_at = new Date().toISOString();
      const password_hash = body.password ? bcrypt.hashSync(body.password, 10) : existing.password_hash;

      await run(
        `UPDATE users 
         SET first_name = ?, last_name = ?, email = ?, phone = ?, role_id = ?, department_id = ?, status = ?, password_hash = ?, updated_at = ?
         WHERE user_id = ?`,
        [first_name, last_name, email, phone, role_id, department_id, status, password_hash, updated_at, id]
      );
      const updated = await get('SELECT * FROM users WHERE user_id = ?', [id]);
      await logAction(1, 'UPDATE_USER_ACCOUNT', 'users', id);
      return NextResponse.json(updated);
    }

    // 5. GET /api/cases, POST /api/cases
    if (p.length === 1 && p[0] === 'cases') {
      if (method === 'GET') {
        const cases = await query('SELECT * FROM cases ORDER BY case_id DESC');
        return NextResponse.json(cases);
      }
      if (method === 'POST') {
        const body = await req.json();
        const { title, description, crime_type, priority, lead_investigator, crime_scene_id, status } = body;
        if (!title) {
          return NextResponse.json({ error: 'Case title is required' }, { status: 400 });
        }
        const year = new Date().getFullYear();
        const countRow = await get('SELECT COUNT(*) as cnt FROM cases');
        const seq = String(countRow.cnt + 1).padStart(4, '0');
        const caseNumber = body.case_number || `CASE-${year}-${seq}`;
        const openedDate = new Date().toISOString();

        const result = await run(
          `INSERT INTO cases (case_number, title, description, crime_type, priority, status, opened_date, lead_investigator, crime_scene_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [caseNumber, title, description || '', crime_type || 'Other', priority || 'Medium', status || 'Open', openedDate, lead_investigator ? Number(lead_investigator) : 1, crime_scene_id ? Number(crime_scene_id) : null]
        );
        const newCase = await get('SELECT * FROM cases WHERE case_id = ?', [result.lastID]);
        await logAction(1, 'CREATE_CASE', 'cases', result.lastID);
        await logTimeline(result.lastID, lead_investigator ? Number(lead_investigator) : 1, 'Case Created', `Case ${caseNumber} folder opened.`);
        return NextResponse.json(newCase, { status: 201 });
      }
    }

    // GET /api/cases/:id, PUT /api/cases/:id
    if (p.length === 2 && p[0] === 'cases') {
      const caseId = Number(p[1]);
      if (method === 'GET') {
        const c = await get('SELECT * FROM cases WHERE case_id = ?', [caseId]);
        if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        return NextResponse.json(c);
      }
      if (method === 'PUT') {
        const body = await req.json();
        const existing = await get('SELECT * FROM cases WHERE case_id = ?', [caseId]);
        if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

        const title = body.title !== undefined ? body.title : existing.title;
        const description = body.description !== undefined ? body.description : existing.description;
        const crime_type = body.crime_type !== undefined ? body.crime_type : existing.crime_type;
        const priority = body.priority !== undefined ? body.priority : existing.priority;
        const status = body.status !== undefined ? body.status : existing.status;
        const lead_investigator = body.lead_investigator !== undefined ? body.lead_investigator : existing.lead_investigator;
        const crime_scene_id = body.crime_scene_id !== undefined ? body.crime_scene_id : existing.crime_scene_id;
        let closed_date = existing.closed_date;

        if (status === 'Closed' && existing.status !== 'Closed') {
          closed_date = new Date().toISOString();
        } else if (status !== 'Closed') {
          closed_date = null;
        }

        await run(
          `UPDATE cases 
           SET title = ?, description = ?, crime_type = ?, priority = ?, status = ?, lead_investigator = ?, crime_scene_id = ?, closed_date = ?
           WHERE case_id = ?`,
          [title, description, crime_type, priority, status, lead_investigator, crime_scene_id, closed_date, caseId]
        );
        const updated = await get('SELECT * FROM cases WHERE case_id = ?', [caseId]);
        const opId = body.operator_id ? Number(body.operator_id) : 1;
        await logAction(opId, 'UPDATE_CASE', 'cases', caseId);
        if (status !== existing.status) {
          await logTimeline(caseId, opId, 'Status Changed', `Status updated from ${existing.status} to ${status}.`);
        }
        return NextResponse.json(updated);
      }
    }

    // 6. GET /api/cases/:id/assignments, POST /api/cases/:id/assignments
    if (p.length === 3 && p[0] === 'cases' && p[2] === 'assignments') {
      const caseId = Number(p[1]);
      if (method === 'GET') {
        const assigns = await query('SELECT * FROM case_assignments WHERE case_id = ?', [caseId]);
        return NextResponse.json(assigns);
      }
      if (method === 'POST') {
        const { user_id, role_in_case } = await req.json();
        if (!user_id) return NextResponse.json({ error: 'User ID is required for assignment' }, { status: 400 });
        const assignedDate = new Date().toISOString();
        const result = await run(
          `INSERT INTO case_assignments (case_id, user_id, assigned_date, role_in_case)
           VALUES (?, ?, ?, ?)`,
          [caseId, Number(user_id), assignedDate, role_in_case || 'Investigator']
        );
        const assign = await get('SELECT * FROM case_assignments WHERE assignment_id = ?', [result.lastID]);
        await logAction(1, 'ASSIGN_USER_TO_CASE', 'case_assignments', result.lastID);
        await logTimeline(caseId, 1, 'Personnel Assigned', `User ID ${user_id} assigned to case as ${role_in_case}.`);
        return NextResponse.json(assign, { status: 201 });
      }
    }

    // 7. DELETE /api/assignments/:id
    if (method === 'DELETE' && p.length === 2 && p[0] === 'assignments') {
      const assignmentId = Number(p[1]);
      const opId = Number(searchParams.get('operator_id') || 1);
      const existing = await get('SELECT * FROM case_assignments WHERE assignment_id = ?', [assignmentId]);
      if (!existing) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      await run('DELETE FROM case_assignments WHERE assignment_id = ?', [assignmentId]);
      await logAction(opId, 'REMOVE_ASSIGNMENT', 'case_assignments', assignmentId);
      await logTimeline(existing.case_id, opId, 'Personnel Removed', `User ID ${existing.user_id} unassigned from case.`);
      return NextResponse.json({ success: true });
    }

    // 8. GET /api/crime-scenes, POST /api/crime-scenes
    if (p.length === 1 && p[0] === 'crime-scenes') {
      if (method === 'GET') {
        const scenes = await query('SELECT * FROM crime_scenes ORDER BY scene_id DESC');
        return NextResponse.json(scenes);
      }
      if (method === 'POST') {
        const { address, city, district, state, country, latitude, longitude, description } = await req.json();
        const result = await run(
          `INSERT INTO crime_scenes (address, city, district, state, country, latitude, longitude, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [address || '', city || '', district || '', state || '', country || '', latitude ? Number(latitude) : 0, longitude ? Number(longitude) : 0, description || '']
        );
        const scene = await get('SELECT * FROM crime_scenes WHERE scene_id = ?', [result.lastID]);
        await logAction(1, 'CREATE_CRIME_SCENE', 'crime_scenes', result.lastID);
        return NextResponse.json(scene, { status: 201 });
      }
    }

    // 9. GET /api/timeline
    if (method === 'GET' && p.length === 1 && p[0] === 'timeline') {
      const caseId = searchParams.get('case_id') ? Number(searchParams.get('case_id')) : undefined;
      const timelines = caseId
        ? await query('SELECT * FROM case_timeline WHERE case_id = ? ORDER BY timeline_id DESC', [caseId])
        : await query('SELECT * FROM case_timeline ORDER BY timeline_id DESC');
      return NextResponse.json(timelines);
    }

    // 10. GET /api/evidence-types
    if (method === 'GET' && p.length === 1 && p[0] === 'evidence-types') {
      const types = await query('SELECT * FROM evidence_types ORDER BY type_id ASC');
      return NextResponse.json(types);
    }

    // 11. GET /api/evidence, POST /api/evidence
    if (p.length === 1 && p[0] === 'evidence') {
      if (method === 'GET') {
        const caseId = searchParams.get('case_id') ? Number(searchParams.get('case_id')) : undefined;
        const items = caseId
          ? await query('SELECT * FROM evidence WHERE case_id = ? ORDER BY evidence_id DESC', [caseId])
          : await query('SELECT * FROM evidence ORDER BY evidence_id DESC');
        return NextResponse.json(items);
      }
      if (method === 'POST') {
        const body = await req.json();
        const { case_id, type_id, description, collected_by, collected_date, storage_location, current_status, is_sealed } = body;
        if (!case_id || !type_id) {
          return NextResponse.json({ error: 'Case ID and Type ID are required' }, { status: 400 });
        }
        const rand = Math.floor(1000 + Math.random() * 9000);
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const charPart = alphabet[Math.floor(Math.random() * 26)] + alphabet[Math.floor(Math.random() * 26)];
        const barcode = body.barcode || `EVID-${rand}-${charPart}`;
        const opId = Number(body.operator_id || 1);

        const result = await run(
          `INSERT INTO evidence (case_id, type_id, barcode, description, collected_by, collected_date, storage_location, current_status, is_sealed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [Number(case_id), Number(type_id), barcode, description || '', collected_by ? Number(collected_by) : opId, collected_date || new Date().toISOString(), storage_location || 'General Storage Vault', current_status || 'Collected', is_sealed ? 1 : 0]
        );
        const newItem = await get('SELECT * FROM evidence WHERE evidence_id = ?', [result.lastID]);
        await logAction(opId, 'LOG_EVIDENCE', 'evidence', result.lastID);
        await logTimeline(Number(case_id), opId, 'Evidence Logged', `Barcode ${barcode} registered: ${description || 'No description'}`);
        return NextResponse.json(newItem, { status: 201 });
      }
    }

    // GET /api/evidence/:id, PUT /api/evidence/:id
    if (p.length === 2 && p[0] === 'evidence') {
      const id = Number(p[1]);
      if (method === 'GET') {
        const item = await get('SELECT * FROM evidence WHERE evidence_id = ?', [id]);
        if (!item) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
        return NextResponse.json(item);
      }
      if (method === 'PUT') {
        const body = await req.json();
        const existing = await get('SELECT * FROM evidence WHERE evidence_id = ?', [id]);
        if (!existing) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });

        const description = body.description !== undefined ? body.description : existing.description;
        const storage_location = body.storage_location !== undefined ? body.storage_location : existing.storage_location;
        const current_status = body.current_status !== undefined ? body.current_status : existing.current_status;
        const is_sealed = body.is_sealed !== undefined ? (body.is_sealed ? 1 : 0) : existing.is_sealed;
        const opId = Number(body.operator_id || 1);

        await run(
          `UPDATE evidence 
           SET description = ?, storage_location = ?, current_status = ?, is_sealed = ?
           WHERE evidence_id = ?`,
          [description, storage_location, current_status, is_sealed, id]
        );
        const updated = await get('SELECT * FROM evidence WHERE evidence_id = ?', [id]);
        await logAction(opId, 'UPDATE_EVIDENCE', 'evidence', id);
        if (current_status !== existing.current_status) {
          await logTimeline(existing.case_id, opId, 'Evidence Status Change', `Evidence ${existing.barcode} status updated to ${current_status}`);
        }
        return NextResponse.json(updated);
      }
    }

    // 12. GET /api/evidence-custody, POST /api/evidence-custody
    if (p.length === 1 && p[0] === 'evidence-custody') {
      if (method === 'GET') {
        const evidenceId = searchParams.get('evidence_id') ? Number(searchParams.get('evidence_id')) : undefined;
        const list = evidenceId
          ? await query('SELECT * FROM evidence_custody WHERE evidence_id = ? ORDER BY custody_id DESC', [evidenceId])
          : await query('SELECT * FROM evidence_custody ORDER BY custody_id DESC');
        return NextResponse.json(list);
      }
      if (method === 'POST') {
        const { evidence_id, to_user, purpose, location, remarks, from_user } = await req.json();
        const opId = Number(from_user || 1);
        if (!evidence_id || !to_user) {
          return NextResponse.json({ error: 'Evidence ID and recipient User ID (to_user) are required' }, { status: 400 });
        }
        const item = await get('SELECT * FROM evidence WHERE evidence_id = ?', [Number(evidence_id)]);
        if (!item) return NextResponse.json({ error: 'Evidence item not found' }, { status: 404 });

        const transferDate = new Date().toISOString();
        const result = await run(
          `INSERT INTO evidence_custody (evidence_id, from_user, to_user, transfer_date, purpose, location, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [Number(evidence_id), opId, Number(to_user), transferDate, purpose || 'Analysis', location || 'Main Laboratory', remarks || '']
        );
        await run(`UPDATE evidence SET storage_location = ?, current_status = 'Transferred' WHERE evidence_id = ?`, [location || 'Main Laboratory', Number(evidence_id)]);
        const custodyRecord = await get('SELECT * FROM evidence_custody WHERE custody_id = ?', [result.lastID]);
        await logAction(opId, 'TRANSFER_EVIDENCE', 'evidence_custody', result.lastID);
        await logTimeline(item.case_id, opId, 'Custody Transferred', `Evidence ${item.barcode} handed over to User ID ${to_user}. Location: ${location}`);
        return NextResponse.json(custodyRecord, { status: 201 });
      }
    }

    // 13. GET /api/persons, POST /api/persons
    if (p.length === 1 && p[0] === 'persons') {
      if (method === 'GET') {
        const persons = await query('SELECT * FROM persons ORDER BY person_id DESC');
        return NextResponse.json(persons);
      }
      if (method === 'POST') {
        const { first_name, last_name, gender, dob, phone, email, address } = await req.json();
        if (!first_name || !last_name) {
          return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
        }
        const result = await run(
          `INSERT INTO persons (first_name, last_name, gender, dob, phone, email, address)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [first_name, last_name, gender || '', dob || '', phone || '', email || '', address || '']
        );
        const newPerson = await get('SELECT * FROM persons WHERE person_id = ?', [result.lastID]);
        await logAction(1, 'CREATE_PERSON_RECORD', 'persons', result.lastID);
        return NextResponse.json(newPerson, { status: 201 });
      }
    }

    // 14. GET /api/suspects, POST /api/suspects
    if (p.length === 1 && p[0] === 'suspects') {
      if (method === 'GET') {
        const caseId = searchParams.get('case_id') ? Number(searchParams.get('case_id')) : undefined;
        const list = caseId
          ? await query('SELECT * FROM suspects WHERE case_id = ? ORDER BY suspect_id DESC', [caseId])
          : await query('SELECT * FROM suspects ORDER BY suspect_id DESC');
        return NextResponse.json(list);
      }
      if (method === 'POST') {
        const { person_id, case_id, risk_level, criminal_record, status, operator_id } = await req.json();
        const opId = operator_id ? Number(operator_id) : 1;
        if (!person_id || !case_id) {
          return NextResponse.json({ error: 'Person ID and Case ID are required' }, { status: 400 });
        }
        const person = await get('SELECT * FROM persons WHERE person_id = ?', [Number(person_id)]);
        if (!person) return NextResponse.json({ error: 'Person record not found' }, { status: 404 });

        const result = await run(
          `INSERT INTO suspects (person_id, case_id, risk_level, criminal_record, status)
           VALUES (?, ?, ?, ?, ?)`,
          [Number(person_id), Number(case_id), risk_level || 'Medium', criminal_record || '', status || 'Under Watch']
        );
        const suspect = await get('SELECT * FROM suspects WHERE suspect_id = ?', [result.lastID]);
        await logAction(opId, 'ADD_SUSPECT', 'suspects', result.lastID);
        await logTimeline(Number(case_id), opId, 'Suspect Linked', `Suspect ${person.first_name} ${person.last_name} linked to case.`);
        return NextResponse.json(suspect, { status: 201 });
      }
    }

    // 15. GET /api/victims, POST /api/victims
    if (p.length === 1 && p[0] === 'victims') {
      if (method === 'GET') {
        const caseId = searchParams.get('case_id') ? Number(searchParams.get('case_id')) : undefined;
        const list = caseId
          ? await query('SELECT * FROM victims WHERE case_id = ? ORDER BY victim_id DESC', [caseId])
          : await query('SELECT * FROM victims ORDER BY victim_id DESC');
        return NextResponse.json(list);
      }
      if (method === 'POST') {
        const { person_id, case_id, injury_details, operator_id } = await req.json();
        const opId = operator_id ? Number(operator_id) : 1;
        if (!person_id || !case_id) {
          return NextResponse.json({ error: 'Person ID and Case ID are required' }, { status: 400 });
        }
        const person = await get('SELECT * FROM persons WHERE person_id = ?', [Number(person_id)]);
        if (!person) return NextResponse.json({ error: 'Person record not found' }, { status: 404 });

        const result = await run(
          `INSERT INTO victims (person_id, case_id, injury_details) VALUES (?, ?, ?)`,
          [Number(person_id), Number(case_id), injury_details || '']
        );
        const victim = await get('SELECT * FROM victims WHERE victim_id = ?', [result.lastID]);
        await logAction(opId, 'ADD_VICTIM', 'victims', result.lastID);
        await logTimeline(Number(case_id), opId, 'Victim Linked', `Victim ${person.first_name} ${person.last_name} linked to case.`);
        return NextResponse.json(victim, { status: 201 });
      }
    }

    // 16. GET /api/witnesses, POST /api/witnesses
    if (p.length === 1 && p[0] === 'witnesses') {
      if (method === 'GET') {
        const caseId = searchParams.get('case_id') ? Number(searchParams.get('case_id')) : undefined;
        const list = caseId
          ? await query('SELECT * FROM witnesses WHERE case_id = ? ORDER BY witness_id DESC', [caseId])
          : await query('SELECT * FROM witnesses ORDER BY witness_id DESC');
        return NextResponse.json(list);
      }
      if (method === 'POST') {
        const { person_id, case_id, statement, operator_id } = await req.json();
        const opId = operator_id ? Number(operator_id) : 1;
        if (!person_id || !case_id) {
          return NextResponse.json({ error: 'Person ID and Case ID are required' }, { status: 400 });
        }
        const person = await get('SELECT * FROM persons WHERE person_id = ?', [Number(person_id)]);
        if (!person) return NextResponse.json({ error: 'Person record not found' }, { status: 404 });

        const result = await run(
          `INSERT INTO witnesses (person_id, case_id, statement) VALUES (?, ?, ?)`,
          [Number(person_id), Number(case_id), statement || '']
        );
        const witness = await get('SELECT * FROM witnesses WHERE witness_id = ?', [result.lastID]);
        await logAction(opId, 'ADD_WITNESS', 'witnesses', result.lastID);
        await logTimeline(Number(case_id), opId, 'Witness Registered', `Witness ${person.first_name} ${person.last_name} statement recorded.`);
        return NextResponse.json(witness, { status: 201 });
      }
    }

    // 17. GET /api/documents
    if (method === 'GET' && p.length === 1 && p[0] === 'documents') {
      const caseId = searchParams.get('case_id') ? Number(searchParams.get('case_id')) : undefined;
      const docs = caseId
        ? await query('SELECT * FROM documents WHERE case_id = ? ORDER BY document_id DESC', [caseId])
        : await query('SELECT * FROM documents ORDER BY document_id DESC');
      return NextResponse.json(docs);
    }

    // POST /api/documents/upload
    if (method === 'POST' && p.length === 2 && p[0] === 'documents' && p[1] === 'upload') {
      const { case_id, evidence_id, file_name, file_type, file_data, uploaded_by } = await req.json();
      if (!case_id || !file_name || !file_data || !uploaded_by) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
      }

      const buffer = Buffer.from(file_data, 'base64');
      const safeName = `${Date.now()}_${file_name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const virtualPath = `/uploads/${safeName}`;
      const uploadedAt = new Date().toISOString();

      const result = await run(
        `INSERT INTO documents (case_id, evidence_id, uploaded_by, file_name, file_path, file_type, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [Number(case_id), evidence_id ? Number(evidence_id) : null, Number(uploaded_by), file_name, virtualPath, file_type || 'application/octet-stream', uploadedAt]
      );
      const doc = await get('SELECT * FROM documents WHERE document_id = ?', [result.lastID]);
      await logAction(Number(uploaded_by), 'UPLOAD_DOCUMENT', 'documents', result.lastID);
      await logTimeline(Number(case_id), Number(uploaded_by), 'Document Uploaded', `File ${file_name} successfully uploaded.`);
      return NextResponse.json(doc, { status: 201 });
    }

    // 18. GET /api/audit
    if (method === 'GET' && p.length === 1 && p[0] === 'audit') {
      const logs = await query('SELECT * FROM audit_logs ORDER BY log_id DESC LIMIT 100');
      return NextResponse.json(logs);
    }

    return NextResponse.json({ error: 'Endpoint handler not found' }, { status: 404 });
  } catch (err: any) {
    console.error('API Server Error:', err);
    return NextResponse.json({ error: 'Internal operation failed', message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(req, { params });
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(req, { params });
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(req, { params });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handle(req, { params });
}
