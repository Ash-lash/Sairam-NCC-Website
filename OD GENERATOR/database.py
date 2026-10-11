import sqlite3
from pathlib import Path


DATABASE = Path(__file__).parent / "students.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():
    connection = sqlite3.connect(str(DATABASE))
    connection.row_factory = sqlite3.Row
    return connection


# ============================================================
# CREATE DATABASE
# ============================================================

def create_database():

    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS students (

            student_id TEXT PRIMARY KEY,

            name TEXT NOT NULL,

            year TEXT,

            department TEXT,

            section TEXT,

            wing TEXT,

            batch TEXT,

            regiment_no TEXT,

            rank TEXT,

            gender TEXT

        )
    """)

    connection.commit()
    connection.close()


# ============================================================
# ADD / UPDATE STUDENT
# ============================================================

def save_student(student):

    connection = get_connection()

    connection.execute("""
        INSERT INTO students
        (
            student_id,
            name,
            year,
            department,
            section,
            wing,
            batch,
            regiment_no,
            rank,
            gender
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON CONFLICT(student_id)
        DO UPDATE SET

            name = excluded.name,
            year = excluded.year,
            department = excluded.department,
            section = excluded.section,
            wing = excluded.wing,
            batch = excluded.batch,
            regiment_no = excluded.regiment_no,
            rank = excluded.rank,
            gender = excluded.gender
    """, (
        student["student_id"],
        student["name"],
        student.get("year", ""),
        student.get("department", ""),
        student.get("section", ""),
        student.get("wing", ""),
        student.get("batch", ""),
        student.get("regiment_no", ""),
        student.get("rank", ""),
        student.get("gender", "")
    ))

    connection.commit()
    connection.close()


# ============================================================
# GET ALL STUDENTS
# ============================================================

def get_all_students():

    connection = get_connection()

    students = connection.execute("""
        SELECT *
        FROM students
        ORDER BY name COLLATE NOCASE
    """).fetchall()

    connection.close()

    return students


# ============================================================
# GET ONE STUDENT
# ============================================================

def get_student(student_id):

    connection = get_connection()

    student = connection.execute("""
        SELECT *
        FROM students
        WHERE student_id = ?
    """, (student_id,)).fetchone()

    connection.close()

    return student


# ============================================================
# UPDATE STUDENT
# ============================================================

def update_student(student_id, data):

    connection = get_connection()

    connection.execute("""
        UPDATE students

        SET
            name = ?,
            year = ?,
            department = ?,
            section = ?,
            wing = ?,
            batch = ?,
            regiment_no = ?,
            rank = ?,
            gender = ?

        WHERE student_id = ?
    """, (
        data.get("name", ""),
        data.get("year", ""),
        data.get("department", ""),
        data.get("section", ""),
        data.get("wing", ""),
        data.get("batch", ""),
        data.get("regiment_no", ""),
        data.get("rank", ""),
        data.get("gender", ""),
        student_id
    ))

    connection.commit()
    connection.close()


# ============================================================
# DELETE STUDENT
# ============================================================

def delete_student(student_id):

    connection = get_connection()

    connection.execute("""
        DELETE FROM students
        WHERE student_id = ?
    """, (student_id,))

    connection.commit()
    connection.close()


# ============================================================
# DELETE ALL
# ============================================================

def delete_all_students():

    connection = get_connection()

    connection.execute("DELETE FROM students")

    connection.commit()
    connection.close()


# ============================================================
# SEARCH STUDENTS
# ============================================================

def search_students(search=""):

    connection = get_connection()

    search = f"%{search}%"

    students = connection.execute("""
        SELECT *
        FROM students

        WHERE
            name LIKE ?
            OR student_id LIKE ?
            OR department LIKE ?
            OR section LIKE ?
            OR wing LIKE ?
            OR batch LIKE ?

        ORDER BY name COLLATE NOCASE
    """, (
        search,
        search,
        search,
        search,
        search,
        search
    )).fetchall()

    connection.close()

    return students


# ============================================================
# STUDENTS BY IDS
# ============================================================

def get_students_by_ids(ids):

    if not ids:
        return []

    connection = get_connection()

    placeholders = ",".join(["?"] * len(ids))

    students = connection.execute(
        f"""
        SELECT *
        FROM students
        WHERE student_id IN ({placeholders})
        """,
        ids
    ).fetchall()

    connection.close()

    student_map = {
        student["student_id"]: student
        for student in students
    }

    return [
        student_map[student_id]
        for student_id in ids
        if student_id in student_map
    ]


# ============================================================
# STATISTICS
# ============================================================

def get_statistics():

    connection = get_connection()

    total = connection.execute(
        "SELECT COUNT(*) FROM students"
    ).fetchone()[0]

    army = connection.execute(
        "SELECT COUNT(*) FROM students WHERE UPPER(wing)='ARMY'"
    ).fetchone()[0]

    air = connection.execute(
        "SELECT COUNT(*) FROM students WHERE UPPER(wing)='AIR'"
    ).fetchone()[0]

    navy = connection.execute(
        "SELECT COUNT(*) FROM students WHERE UPPER(wing)='NAVY'"
    ).fetchone()[0]

    connection.close()

    return {
        "total": total,
        "army": army,
        "air": air,
        "navy": navy
    }