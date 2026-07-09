import os
import re
from mysql.connector import pooling, Error
from dotenv import load_dotenv

load_dotenv()

db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "forensic_management_system")
}

pool = None
is_initialized = False
is_standby_mode = False

def get_pool():
    global pool, is_standby_mode
    if is_standby_mode:
        raise Exception("Database is in standby mode. MySQL server on localhost:3306 is currently unreachable.")
    if pool is None:
        try:
            pool = pooling.MySQLConnectionPool(
                pool_name="fms_pool",
                pool_size=10,
                pool_reset_session=True,
                host=db_config["host"],
                port=db_config["port"],
                user=db_config["user"],
                password=db_config["password"],
                database=db_config["database"]
            )
        except Error as err:
            print(f"Failed to create connection pool: {err}")
            raise err
    return pool

def get_raw(sql, params=None):
    active_pool = get_pool()
    conn = active_pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params or [])
        row = cursor.fetchone()
        if row:
            return sanitize_row(row)
        return None
    finally:
        cursor.close()
        conn.close()

def init_database():
    global is_initialized, is_standby_mode
    if is_initialized:
        return

    # Try creating database first
    try:
        import mysql.connector
        conn = mysql.connector.connect(
            host=db_config["host"],
            port=db_config["port"],
            user=db_config["user"],
            password=db_config["password"]
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_config['database']}`")
        cursor.close()
        conn.close()
    except Error as err:
        print(f"⚠️ WARNING: Could not connect to MySQL server. Standby mode active. Error: {err}")
        is_standby_mode = True
        is_initialized = True
        return

    try:
        active_pool = get_pool()
        # Verify connection
        conn = active_pool.get_connection()
        conn.close()

        # Load schema
        schema_path = os.path.join(os.getcwd(), "..", "database", "schema.sql")
        if not os.path.exists(schema_path):
            schema_path = os.path.join(os.getcwd(), "database", "schema.sql")
        
        if os.path.exists(schema_path):
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            statements = parse_sql(schema_sql)
            for stmt in statements:
                if not stmt.lower().startswith("create database") and not stmt.lower().startswith("use"):
                    run_raw(stmt)

        # Count roles using raw get to prevent recursion
        count_roles = get_raw("SELECT COUNT(*) as count FROM roles")
        if not count_roles or count_roles["count"] == 0:
            seed_path = os.path.join(os.getcwd(), "..", "database", "seed.sql")
            if not os.path.exists(seed_path):
                seed_path = os.path.join(os.getcwd(), "database", "seed.sql")
            
            if os.path.exists(seed_path):
                with open(seed_path, "r", encoding="utf-8") as f:
                    seed_sql = f.read()
                statements = parse_sql(seed_sql)
                for stmt in statements:
                    if not stmt.lower().startswith("use"):
                        run_raw(stmt)

        # Correct default hashes
        old_admin_hash = '$2a$10$fV28nJb2/0XgY5uQ8g9ZreU7IUnD3KjWlO96Hwz6UeMsh7E9R/V8.'
        old_investigator_hash = '$2a$10$C8l8HjZfP6Suxu7tI8rI7OaIq6p9v7XwB7D0H6lRbeVd29p7m7tD6'
        old_analyst_hash = '$2a$10$GfO3Z7pS4DrtZ8o6G6jLleY6vG6p1S8W6v8N7D1KbfRfeZ7R7h7tD'

        run_raw("UPDATE users SET password_hash = %s WHERE user_id = 1 AND password_hash = %s", [
            '$2b$10$hC3wdVepgqwqmO0mc.zQQ.e32LnUGkQEDNDrZpKI3GFl/rfFG5KBu', old_admin_hash
        ])
        run_raw("UPDATE users SET password_hash = %s WHERE user_id = 2 AND password_hash = %s", [
            '$2b$10$hhP/REXGz8.AGrTdbHCIUe5CGxtkBaaCNECuTshMzr41.7VjM4QKi', old_investigator_hash
        ])
        run_raw("UPDATE users SET password_hash = %s WHERE user_id = 3 AND password_hash = %s", [
            '$2b$10$f5uxP57rSjt46GZJteQFRel3QPs40APJmDmXAY3QfufOG51UKSlx.', old_analyst_hash
        ])

        is_initialized = True
        print("Database schema bootstrapped and checked successfully.")
    except Exception as err:
        print(f"Error during MySQL verification/seeding: {err}")
        raise err

def parse_sql(sql):
    sql = re.sub(r'/\*[\s\S]*?\*/', '', sql)
    sql = re.sub(r'--.*$', '', sql, flags=re.MULTILINE)
    statements = sql.split(";")
    res = []
    for stmt in statements:
        cleaned = stmt.strip()
        if cleaned:
            res.append(cleaned)
    return res

def run_raw(sql, params=None):
    active_pool = get_pool()
    conn = active_pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params or [])
        conn.commit()
        last_id = cursor.lastrowid or 0
        changes = cursor.rowcount or 0
        return {"lastID": last_id, "changes": changes}
    except Error as err:
        conn.rollback()
        raise err
    finally:
        cursor.close()
        conn.close()

def query(sql, params=None):
    init_database()
    if is_standby_mode:
        return []
    active_pool = get_pool()
    conn = active_pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(sql, params or [])
        rows = cursor.fetchall()
        return sanitize_rows(rows)
    except Error as err:
        print(f"MySQL Query Error [{sql}]: {err}")
        raise err
    finally:
        cursor.close()
        conn.close()

def get(sql, params=None):
    init_database()
    if is_standby_mode:
        return None
    return get_raw(sql, params)

def run_db(sql, params=None):
    init_database()
    if is_standby_mode:
        return {"lastID": 0, "changes": 0}
    try:
        return run_raw(sql, params)
    except Error as err:
        print(f"MySQL Run Error [{sql}]: {err}")
        raise err

def sanitize_rows(rows):
    return [sanitize_row(row) for row in rows]

def sanitize_row(row):
    import datetime
    import decimal
    sanitized = {}
    for k, v in row.items():
        if isinstance(v, (datetime.datetime, datetime.date)):
            sanitized[k] = v.isoformat()
        elif isinstance(v, datetime.timedelta):
            sanitized[k] = str(v)
        elif isinstance(v, decimal.Decimal):
            sanitized[k] = float(v)
        else:
            safe_val = v
            # Prevent bytes serialization crash (e.g. for blob or barcode if mysql driver returns bytearray)
            if isinstance(v, (bytes, bytearray)):
                safe_val = v.decode('utf-8', errors='ignore')
            sanitized[k] = safe_val
    return sanitized

def log_action(user_id, action, table_name, record_id, ip="127.0.0.1"):
    import datetime
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        run_db(
            "INSERT INTO audit_logs (user_id, action, table_name, record_id, timestamp, ip_address) VALUES (%s, %s, %s, %s, %s, %s)",
            [user_id, action, table_name, record_id, timestamp, ip]
        )
    except Exception as err:
        print(f"Failed to log audit action: {err}")

def log_timeline(case_id, performed_by, action, description):
    import datetime
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        run_db(
            "INSERT INTO case_timeline (case_id, performed_by, action, description, created_at) VALUES (%s, %s, %s, %s, %s)",
            [case_id, performed_by, action, description, created_at]
        )
    except Exception as err:
        print(f"Failed to log timeline event: {err}")
