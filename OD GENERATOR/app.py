from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    send_file
)

from pathlib import Path
from datetime import datetime
import re
import pandas as pd

from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from database import (
    create_database,
    get_all_students,
    get_student,
    save_student,
    update_student,
    delete_student,
    delete_all_students,
    get_students_by_ids
)


# ============================================================
# APP
# ============================================================

app = Flask(__name__)

app.secret_key = "od-generator-secret-key"

BASE_DIR = Path(__file__).parent

UPLOAD_FOLDER = BASE_DIR / "uploads"

GENERATED_FOLDER = BASE_DIR / "generated_letters"

UPLOAD_FOLDER.mkdir(exist_ok=True)

GENERATED_FOLDER.mkdir(exist_ok=True)


create_database()


# ============================================================
# YEAR MAPPING
# ============================================================

def calculate_engineering_year(batch):

    """
    Engineering batch mapping:

    2024 -> III Year
    2025 -> II Year
    2026 -> I Year

    Future batches continue similarly.
    """

    try:
        batch = int(str(batch).strip())
    except:
        return ""

    current_reference_batch = 2026

    difference = current_reference_batch - batch

    year_number = difference + 1

    if year_number < 1:
        return ""

    if year_number == 1:
        return "I"

    if year_number == 2:
        return "II"

    if year_number == 3:
        return "III"

    if year_number == 4:
        return "IV"

    return str(year_number)


def normalize_year(value):

    if value is None:
        return ""

    value = str(value).strip().upper()

    value = value.replace(".", "")
    value = value.replace("-", " ")

    if value in ["1", "I", "I YEAR", "1ST YEAR", "FIRST YEAR"]:
        return "I"

    if value in ["2", "II", "II YEAR", "2ND YEAR", "SECOND YEAR"]:
        return "II"

    if value in ["3", "III", "III YEAR", "3RD YEAR", "THIRD YEAR"]:
        return "III"

    if value in ["4", "IV", "IV YEAR", "4TH YEAR", "FOURTH YEAR"]:
        return "IV"

    return value


# ============================================================
# CLEAN EXCEL VALUE
# ============================================================

def clean_value(value):

    if pd.isna(value):
        return ""

    value = str(value).strip()

    if value.lower() == "nan":
        return ""

    if value.endswith(".0"):
        try:
            value = str(int(float(value)))
        except:
            pass

    return value


# ============================================================
# NORMALIZE COLUMN NAME
# ============================================================

def normalize_column(column):

    column = str(column).strip().upper()

    column = column.replace("\n", " ")
    column = column.replace("_", " ")
    column = column.replace("-", " ")

    column = re.sub(r"\s+", " ", column)

    return column


# ============================================================
# FIND COLUMN
# ============================================================

def find_column(columns, possible_names):

    normalized = {
        normalize_column(column): column
        for column in columns
    }

    for name in possible_names:

        name = normalize_column(name)

        if name in normalized:
            return normalized[name]

    # partial match

    for actual in normalized:

        for possible in possible_names:

            possible = normalize_column(possible)

            if possible in actual or actual in possible:
                return normalized[actual]

    return None


# ============================================================
# DETECT GENDER
# ============================================================

def detect_gender(
    wing_value,
    rank_value,
    gender_value,
    regiment_value=""
):

    gender = clean_value(gender_value).upper()

    if gender in ["SD", "SW"]:
        return gender

    if gender in ["BOY", "BOYS", "MALE", "M"]:
        return "SD"

    if gender in ["GIRL", "GIRLS", "FEMALE", "F"]:
        return "SW"

    text = (
        clean_value(wing_value)
        + " "
        + clean_value(rank_value)
        + " "
        + clean_value(regiment_value)
    ).upper()

    if "SW" in text:
        return "SW"

    if "SD" in text:
        return "SD"

    return ""


# ============================================================
# READ ONE EXCEL SHEET
# ============================================================

def read_excel_sheet(dataframe, batch):

    if dataframe.empty:
        return []

    # --------------------------------------------------------
    # Find actual header row
    # --------------------------------------------------------

    header_index = None

    for index, row in dataframe.iterrows():

        row_text = " ".join(
            clean_value(value).upper()
            for value in row.tolist()
        )

        if (
            ("NAME" in row_text)
            and (
                "SEC ID" in row_text
                or "SECID" in row_text
                or "REGIMENT" in row_text
            )
        ):
            header_index = index
            break

    if header_index is not None:

        dataframe = pd.read_excel(
            current_excel_file,
            sheet_name=current_sheet_name,
            header=header_index
        )

    # --------------------------------------------------------
    # COLUMN DETECTION
    # --------------------------------------------------------

    columns = list(dataframe.columns)

    sec_id_column = find_column(
        columns,
        [
            "SEC ID",
            "SECID",
            "SEC_ID",
            "SEC ID NO",
            "CADET ID",
            "STUDENT ID",
            "ID"
        ]
    )

    name_column = find_column(
        columns,
        [
            "NAME",
            "CADET NAME",
            "STUDENT NAME"
        ]
    )

    year_column = find_column(
        columns,
        [
            "YEAR",
            "ACADEMIC YEAR",
            "STUDY YEAR"
        ]
    )

    department_column = find_column(
        columns,
        [
            "DEPT",
            "DEPARTMENT",
            "BRANCH"
        ]
    )

    section_column = find_column(
        columns,
        [
            "SEC",
            "SECTION"
        ]
    )

    wing_column = find_column(
        columns,
        [
            "WING",
            "NCC WING"
        ]
    )

    batch_column = find_column(
        columns,
        [
            "BATCH",
            "BATCH YEAR",
            "ADMISSION YEAR",
            "ADMISSION BATCH"
        ]
    )

    regiment_column = find_column(
        columns,
        [
            "REGIMENT NO",
            "REGIMENT NUMBER",
            "REGT NO",
            "REGT NUMBER",
            "REGIMENT"
        ]
    )

    rank_column = find_column(
        columns,
        [
            "RANK",
            "NCC RANK"
        ]
    )

    gender_column = find_column(
        columns,
        [
            "SD/SW",
            "SD SW",
            "GENDER",
            "SEX",
            "CADET TYPE"
        ]
    )

    students = []

    # --------------------------------------------------------
    # READ ROWS
    # --------------------------------------------------------

    for _, row in dataframe.iterrows():

        student_id = (
            clean_value(row.get(sec_id_column))
            if sec_id_column
            else ""
        )

        name = (
            clean_value(row.get(name_column))
            if name_column
            else ""
        )

        if not student_id or not name:
            continue

        wing = (
            clean_value(row.get(wing_column)).upper()
            if wing_column
            else ""
        )

        batch_value = (
            clean_value(row.get(batch_column))
            if batch_column
            else clean_value(batch)
        )

        original_year = (
            clean_value(row.get(year_column))
            if year_column
            else ""
        )

        # If Excel year is already I/II/III use it.
        # Otherwise calculate using batch.

        normalized_excel_year = normalize_year(original_year)

        if normalized_excel_year in ["I", "II", "III", "IV"]:
            final_year = normalized_excel_year
        else:
            final_year = calculate_engineering_year(batch_value)

        department = (
            clean_value(row.get(department_column)).upper()
            if department_column
            else ""
        )

        section = (
            clean_value(row.get(section_column)).upper()
            if section_column
            else ""
        )

        regiment_no = (
            clean_value(row.get(regiment_column))
            if regiment_column
            else ""
        )

        rank = (
            clean_value(row.get(rank_column))
            if rank_column
            else ""
        )

        gender_raw = (
            clean_value(row.get(gender_column))
            if gender_column
            else ""
        )

        gender = detect_gender(
            wing,
            rank,
            gender_raw,
            regiment_no
        )

        students.append({

            "student_id": student_id,

            "name": name,

            "year": final_year,

            "department": department,

            "section": section,

            "wing": wing,

            "batch": batch_value,

            "regiment_no": regiment_no,

            "rank": rank,

            "gender": gender
        })

    return students


# Global variables used only while reading an Excel workbook.
current_excel_file = None
current_sheet_name = None


# ============================================================
# STUDENT DATABASE
# ============================================================

@app.route("/students")
def students():

    query = request.args.get("q", "").strip()

    if query:
        from database import search_students
        student_list = search_students(query)
    else:
        student_list = get_all_students()

    return render_template(
        "students.html",
        students=student_list,
        query=query
    )


# ============================================================
# UPLOAD EXCEL
# ============================================================

@app.route("/students/upload", methods=["POST"])
def upload():

    global current_excel_file
    global current_sheet_name

    file = request.files.get("master_file")

    batch = request.form.get(
        "batch",
        ""
    ).strip()

    if not file or not file.filename:

        flash(
            "Please select an Excel file.",
            "error"
        )

        return redirect(url_for("students"))

    try:

        # ----------------------------------------------------
        # Read workbook
        # ----------------------------------------------------

        excel_path = UPLOAD_FOLDER / file.filename

        file.save(excel_path)

        workbook = pd.ExcelFile(excel_path)

        imported_count = 0

        # ----------------------------------------------------
        # READ EVERY WORKSHEET
        # ----------------------------------------------------

        for sheet_name in workbook.sheet_names:

            current_excel_file = excel_path
            current_sheet_name = sheet_name

            try:

                raw_data = pd.read_excel(
                    excel_path,
                    sheet_name=sheet_name,
                    header=None
                )

                students_from_sheet = read_excel_sheet(
                    raw_data,
                    batch
                )

                for student in students_from_sheet:

                    save_student(student)

                    imported_count += 1

            except Exception as sheet_error:

                print(
                    f"Error reading sheet {sheet_name}:",
                    sheet_error
                )

                continue

        flash(
            f"{imported_count} student records imported successfully from all worksheets.",
            "success"
        )

    except Exception as error:

        flash(
            f"Excel import error: {error}",
            "error"
        )

    return redirect(url_for("students"))


# ============================================================
# EDIT STUDENT
# ============================================================

@app.route(
    "/students/edit/<student_id>",
    methods=["GET", "POST"]
)
def edit_student(student_id):

    student = get_student(student_id)

    if student is None:

        flash(
            "Student not found.",
            "error"
        )

        return redirect(url_for("students"))

    if request.method == "POST":

        data = {

            "name":
                request.form.get(
                    "name",
                    ""
                ).strip(),

            "year":
                normalize_year(
                    request.form.get(
                        "year",
                        ""
                    )
                ),

            "department":
                request.form.get(
                    "department",
                    ""
                ).strip().upper(),

            "section":
                request.form.get(
                    "section",
                    ""
                ).strip().upper(),

            "wing":
                request.form.get(
                    "wing",
                    ""
                ).strip().upper(),

            "batch":
                request.form.get(
                    "batch",
                    ""
                ).strip(),

            "regiment_no":
                request.form.get(
                    "regiment_no",
                    ""
                ).strip(),

            "rank":
                request.form.get(
                    "rank",
                    ""
                ).strip(),

            "gender":
                request.form.get(
                    "gender",
                    ""
                ).strip().upper()
        }

        update_student(
            student_id,
            data
        )

        flash(
            "Student details updated successfully.",
            "success"
        )

        return redirect(
            url_for("students")
        )

    return render_template(
        "edit_student.html",
        student=student
    )


# ============================================================
# DELETE STUDENT
# ============================================================

@app.route(
    "/students/delete/<student_id>",
    methods=["POST"]
)
def remove_student(student_id):

    delete_student(student_id)

    flash(
        "Student deleted successfully.",
        "success"
    )

    return redirect(
        url_for("students")
    )


# ============================================================
# DELETE ALL
# ============================================================

@app.route(
    "/students/clear",
    methods=["POST"]
)
def clear():

    delete_all_students()

    flash(
        "All student data deleted.",
        "success"
    )

    return redirect(
        url_for("students")
    )


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return redirect(
        url_for("generate")
    )


# ============================================================
# GENERATE PAGE
# ============================================================

@app.route(
    "/generate",
    methods=["GET", "POST"]
)
def generate():

    all_students = get_all_students()

    # --------------------------------------------------------
    # FILTER VALUES
    # --------------------------------------------------------

    wing_filter = request.args.get(
        "wing",
        ""
    ).strip().upper()

    department_filter = request.args.get(
        "department",
        ""
    ).strip().upper()

    year_filter = request.args.get(
        "year",
        ""
    ).strip().upper()

    gender_filter = request.args.get(
        "gender",
        ""
    ).strip().upper()

    search_filter = request.args.get(
        "search",
        ""
    ).strip().lower()

    # --------------------------------------------------------
    # FILTER
    # --------------------------------------------------------

    filtered_students = []

    for student in all_students:

        # Wing
        if wing_filter:

            student_wing = str(
                student["wing"] or ""
            ).strip().upper()

            if student_wing != wing_filter:
                continue

        # Department
        if department_filter:

            student_department = str(
                student["department"] or ""
            ).strip().upper()

            if student_department != department_filter:
                continue

        # Year
        if year_filter:

            student_year = normalize_year(
                student["year"]
            )

            if student_year != year_filter:
                continue

        # SD / SW
        if gender_filter:

            student_gender = str(
                student["gender"] or ""
            ).strip().upper()

            # Also recognise SD/SW from rank/wing if
            # database was imported from an older file.

            if not student_gender:

                text = (
                    str(student["rank"] or "")
                    + " "
                    + str(student["wing"] or "")
                    + " "
                    + str(student["regiment_no"] or "")
                ).upper()

                if "SW" in text:
                    student_gender = "SW"

                elif "SD" in text:
                    student_gender = "SD"

            if gender_filter == "BOY":
                if student_gender != "SD":
                    continue

            elif gender_filter == "GIRL":
                if student_gender != "SW":
                    continue

            elif student_gender != gender_filter:
                continue

        # Search
        if search_filter:

            search_values = [

                str(
                    student["name"] or ""
                ).lower(),

                str(
                    student["student_id"] or ""
                ).lower(),

                str(
                    student["department"] or ""
                ).lower(),

                str(
                    student["section"] or ""
                ).lower(),

                str(
                    student["wing"] or ""
                ).lower(),

                str(
                    student["regiment_no"] or ""
                ).lower(),

                str(
                    student["rank"] or ""
                ).lower()
            ]

            if not any(
                search_filter in value
                for value in search_values
            ):
                continue

        filtered_students.append(student)

    # --------------------------------------------------------
    # DROPDOWN VALUES
    # --------------------------------------------------------

    wings = sorted({
        str(student["wing"]).strip().upper()
        for student in all_students
        if student["wing"]
    })

    departments = sorted({
        str(student["department"]).strip().upper()
        for student in all_students
        if student["department"]
    })

    return render_template(

        "generate.html",

        students=filtered_students,

        all_students=all_students,

        wings=wings,

        departments=departments,

        wing_filter=wing_filter,

        department_filter=department_filter,

        year_filter=year_filter,

        gender_filter=gender_filter,

        search_filter=search_filter
    )


# ============================================================
# WORD FORMATTING FUNCTIONS
# ============================================================

def set_cell_text(
    cell,
    text,
    bold=False,
    alignment=WD_ALIGN_PARAGRAPH.CENTER
):

    cell.text = ""

    paragraph = cell.paragraphs[0]

    paragraph.alignment = alignment

    run = paragraph.add_run(
        str(text or "")
    )

    run.bold = bold

    run.font.size = Pt(10)

    cell.vertical_alignment = (
        WD_CELL_VERTICAL_ALIGNMENT.CENTER
    )


def set_cell_width(cell, width):

    tc = cell._tc

    tcPr = tc.get_or_add_tcPr()

    tcW = tcPr.find(qn("w:tcW"))

    if tcW is None:

        tcW = OxmlElement("w:tcW")

        tcPr.append(tcW)

    tcW.set(
        qn("w:w"),
        str(int(width * 1440))
    )

    tcW.set(
        qn("w:type"),
        "dxa"
    )


def set_table_borders(table):

    tbl = table._tbl

    tblPr = tbl.tblPr

    borders = tblPr.first_child_found_in(
        "w:tblBorders"
    )

    if borders is None:

        borders = OxmlElement(
            "w:tblBorders"
        )

        tblPr.append(borders)

    for edge in (
        "top",
        "left",
        "bottom",
        "right",
        "insideH",
        "insideV"
    ):

        tag = "w:" + edge

        element = borders.find(
            qn(tag)
        )

        if element is None:

            element = OxmlElement(tag)

            borders.append(element)

        element.set(
            qn("w:val"),
            "single"
        )

        element.set(
            qn("w:sz"),
            "6"
        )

        element.set(
            qn("w:space"),
            "0"
        )


# ============================================================
# CREATE WORD OD LETTER
# ============================================================

def create_od_letter(
    selected_students,
    from_date,
    to_date,
    from_address,
    to_address,
    program_location,
    program_details,
    program_time,
    academic_year,
    sincerely_name,
    letter_content
):

    document = Document()

    section = document.sections[0]

    section.top_margin = Inches(0.6)
    section.bottom_margin = Inches(0.6)
    section.left_margin = Inches(0.7)
    section.right_margin = Inches(0.7)

    # --------------------------------------------------------
    # DATE - UPPER LEFT
    # --------------------------------------------------------

    date_paragraph = document.add_paragraph()

    date_paragraph.alignment = (
        WD_ALIGN_PARAGRAPH.RIGHT
    )

    date_paragraph.add_run(
        datetime.now().strftime(
            "%d.%m.%Y"
        )
    )

    # --------------------------------------------------------
    # FROM ADDRESS
    # --------------------------------------------------------

    from_heading = document.add_paragraph()

    from_heading.alignment = WD_ALIGN_PARAGRAPH.LEFT

    from_heading.add_run("From:").bold = True

    from_para = document.add_paragraph()

    from_para.alignment = (
        WD_ALIGN_PARAGRAPH.LEFT
    )

    for line in from_address.splitlines():

        run = from_para.add_run(
            line + "\n"
        )

        run.font.size = Pt(11)

    # Two blank spaces for officer / ANO names
    from_para.add_run("\n\n")

    # --------------------------------------------------------
    # TO ADDRESS
    # --------------------------------------------------------

    to_heading = document.add_paragraph()

    to_heading.alignment = WD_ALIGN_PARAGRAPH.LEFT

    to_heading.add_run("To:").bold = True

    to_para = document.add_paragraph()

    to_para.alignment = (
        WD_ALIGN_PARAGRAPH.LEFT
    )

    for line in to_address.splitlines():

        run = to_para.add_run(
            line + "\n"
        )

        run.font.size = Pt(11)

    # --------------------------------------------------------
    # RESPECTED SIR
    # --------------------------------------------------------

    paragraph = document.add_paragraph()

    paragraph.alignment = (
        WD_ALIGN_PARAGRAPH.LEFT
    )

    run = paragraph.add_run(
        "Respected Sir,"
    )

    run.bold = True

    run.font.size = Pt(11)

    # --------------------------------------------------------
    # CONTENT
    # --------------------------------------------------------

    paragraph = document.add_paragraph()

    paragraph.alignment = (
        WD_ALIGN_PARAGRAPH.JUSTIFY
    )

    if letter_content:
        paragraph.add_run(letter_content)

    else:
        year_text = ""

        if academic_year:
            year_text = f"{academic_year} Year "

        else:
            years = sorted({
                normalize_year(
                    student["year"]
                )
                for student in selected_students
                if student["year"]
            })

            if len(years) == 1:
                year_text = f"{years[0]} Year "

        paragraph.add_run(
            "I bring to your kind notice that the "
        )

        paragraph.add_run(
            year_text
        ).bold = True

        paragraph.add_run(
            "NCC cadets of our college will be attending the programme"
        )

        if program_location:
            paragraph.add_run(" at ")

            paragraph.add_run(
                program_location
            ).bold = True

        if program_details:
            paragraph.add_run(
                f" for {program_details}"
            )

        paragraph.add_run(". ")

        if to_date:
            date_text = f"from {from_date} to {to_date}"
        else:
            date_text = f"on {from_date}"

        schedule_text = f"The programme is scheduled {date_text}"

        if program_time:
            schedule_text += f" during {program_time}"

        paragraph.add_run(
            schedule_text + ". In this regard, I kindly request you "
            "to grant permission for the following "
            "cadets and mark their absence as "
            "'ON DUTY' for the above-mentioned "
            "programme."
        )

    # --------------------------------------------------------
    # THANK YOU - CENTRE
    # --------------------------------------------------------

    thank_you = document.add_paragraph()

    thank_you.alignment = (
        WD_ALIGN_PARAGRAPH.CENTER
    )

    thank_you.add_run(
        "Thank you."
    ).bold = True

    # --------------------------------------------------------
    # CADET TABLE
    # --------------------------------------------------------

    table = document.add_table(
        rows=1,
        cols=6
    )

    table.alignment = (
        WD_TABLE_ALIGNMENT.CENTER
    )

    table.autofit = False

    set_table_borders(table)

    headers = [

        "S.No",

        "SEC ID",

        "Name",

        "Year",

        "Dept.",

        "Wing"

    ]

    widths = [
        0.45,
        0.8,
        2.0,
        0.65,
        1.0,
        0.65
    ]

    for index, header in enumerate(headers):

        cell = table.rows[0].cells[index]

        set_cell_text(
            cell,
            header,
            bold=True
        )

        set_cell_width(
            cell,
            widths[index]
        )

    # --------------------------------------------------------
    # CADET ROWS
    # --------------------------------------------------------

    for serial, student in enumerate(
        selected_students,
        start=1
    ):

        row = table.add_row()

        values = [

            serial,

            student["student_id"],

            student["name"],

            (
                f'{normalize_year(student["year"])} Year'
                if student["year"]
                else ""
            ),

            student["department"],

            student["wing"]
        ]

        for index, value in enumerate(values):

            cell = row.cells[index]

            set_cell_text(
                cell,
                value,
                alignment=WD_ALIGN_PARAGRAPH.CENTER
            )

            set_cell_width(
                cell,
                widths[index]
            )

    # --------------------------------------------------------
    # YOURS SINCERELY - RIGHT
    # --------------------------------------------------------

    document.add_paragraph()

    sincerely = document.add_paragraph()

    sincerely.alignment = (
        WD_ALIGN_PARAGRAPH.RIGHT
    )

    sincerely.add_run(
        "Yours sincerely,\n\n"
    )

    sincerely.add_run(
        sincerely_name
    ).bold = True

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    filename = (
        "OD_Letter_"
        + datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )
        + ".docx"
    )

    output_path = (
        GENERATED_FOLDER / filename
    )

    document.save(output_path)

    return output_path


# ============================================================
# GENERATE WORD LETTER
# ============================================================

@app.route(
    "/generate-letter",
    methods=["POST"]
)
def generate_letter():

    selected_ids = request.form.getlist(
        "selected_students"
    )

    if not selected_ids:

        flash(
            "Please select at least one cadet.",
            "error"
        )

        return redirect(
            url_for("generate")
        )

    students = get_students_by_ids(
        selected_ids
    )

    if not students:

        flash(
            "Selected cadets were not found.",
            "error"
        )

        return redirect(
            url_for("generate")
        )

    from_date = request.form.get(
        "from_date",
        ""
    ).strip()

    to_date = request.form.get(
        "to_date",
        ""
    ).strip()

    from_address = request.form.get(
        "from_address",
        ""
    ).strip()

    to_address = request.form.get(
        "to_address",
        ""
    ).strip()

    program_location = request.form.get(
        "program_location",
        ""
    ).strip()

    program_details = request.form.get(
        "program_details",
        ""
    ).strip()

    program_time = request.form.get(
        "program_time",
        ""
    ).strip()

    letter_content = request.form.get(
        "letter_content",
        ""
    ).strip()

    academic_year = request.form.get(
        "academic_year",
        ""
    ).strip().upper()

    sincerely_name = request.form.get(
        "sincerely_name",
        ""
    ).strip()

    if not from_date:
        flash(
            "Please enter From Date.",
            "error"
        )
        return redirect(url_for("generate"))

    if not program_location:
        flash(
            "Please enter Program Location.",
            "error"
        )
        return redirect(url_for("generate"))

    if not sincerely_name:
        sincerely_name = "ANO / Officer"

    output_path = create_od_letter(

        selected_students=students,

        from_date=from_date,

        to_date=to_date,

        from_address=from_address,

        to_address=to_address,

        program_location=program_location,

        program_details=program_details,

        program_time=program_time,

        academic_year=academic_year,

        sincerely_name=sincerely_name,

        letter_content=letter_content
    )

    return send_file(
        output_path,
        as_attachment=True
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
 # ============================================================
# FINAL OD WORD LETTER GENERATION
# ============================================================

from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


# ============================================================
# YEAR MAPPING
# ============================================================

def get_cadet_year(student, selected_year=""):

    # If year is selected in OD form,
    # use the selected year.
    if selected_year:

        value = str(selected_year).strip().upper()

        year_map = {
            "I": "I",
            "I YEAR": "I",
            "1": "I",
            "1ST YEAR": "I",
            "FIRST YEAR": "I",

            "II": "II",
            "II YEAR": "II",
            "2": "II",
            "2ND YEAR": "II",
            "SECOND YEAR": "II",

            "III": "III",
            "III YEAR": "III",
            "3": "III",
            "3RD YEAR": "III",
            "THIRD YEAR": "III",

            "IV": "IV",
            "IV YEAR": "IV",
            "4": "IV",
            "4TH YEAR": "IV",
            "FOURTH YEAR": "IV"
        }

        if value in year_map:
            return year_map[value]

    # ========================================================
    # BATCH BASED ENGINEERING YEAR
    #
    # 2024 -> III
    # 2025 -> II
    # 2026 -> I
    # ========================================================

    batch = str(student["batch"] or "").strip()

    batch_map = {
        "2024": "III",
        "2025": "II",
        "2026": "I"
    }

    if batch in batch_map:
        return batch_map[batch]

    # ========================================================
    # FALLBACK TO YEAR STORED IN DATABASE
    # ========================================================

    year = str(student["year"] or "").strip().upper()

    year_map = {
        "I": "I",
        "I YEAR": "I",
        "1": "I",
        "1ST YEAR": "I",
        "FIRST YEAR": "I",

        "II": "II",
        "II YEAR": "II",
        "2": "II",
        "2ND YEAR": "II",
        "SECOND YEAR": "II",

        "III": "III",
        "III YEAR": "III",
        "3": "III",
        "3RD YEAR": "III",
        "THIRD YEAR": "III",

        "IV": "IV",
        "IV YEAR": "IV",
        "4": "IV",
        "4TH YEAR": "IV",
        "FOURTH YEAR": "IV"
    }

    return year_map.get(year, year)


# ============================================================
# TABLE CELL FORMAT
# ============================================================

def format_od_cell(cell, text, bold=False):

    cell.text = ""

    paragraph = cell.paragraphs[0]

    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER

    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.paragraph_format.space_before = Pt(0)

    run = paragraph.add_run(
        "" if text is None else str(text)
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(10)
    run.bold = bold

    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


# ============================================================
# TABLE BORDERS
# ============================================================

def set_od_table_borders(table):

    tbl = table._tbl
    tblPr = tbl.tblPr

    borders = tblPr.first_child_found_in("w:tblBorders")

    if borders is None:

        borders = OxmlElement("w:tblBorders")
        tblPr.append(borders)

    for edge in (
        "top",
        "left",
        "bottom",
        "right",
        "insideH",
        "insideV"
    ):

        tag = "w:" + edge

        element = borders.find(qn(tag))

        if element is None:

            element = OxmlElement(tag)
            borders.append(element)

        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "8")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "000000")


# ============================================================
# FINAL CADET TABLE
# ============================================================

def add_final_cadet_table(
    document,
    students,
    selected_year=""
):

    heading = document.add_paragraph()

    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    heading.paragraph_format.space_before = Pt(8)
    heading.paragraph_format.space_after = Pt(6)

    run = heading.add_run("CADET DETAILS")

    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # IMPORTANT:
    #
    # ONLY THESE COLUMNS ARE ALLOWED IN FINAL WORD OD
    #
    # NO WING
    # NO REGIMENT NUMBER
    # NO RANK
    # NO SD/SW
    # ========================================================

    headers = [
        "S.No",
        "SEC ID",
        "NAME",
        "YEAR",
        "DEPT",
        "SEC"
    ]

    table = document.add_table(
        rows=1,
        cols=6
    )

    # Center entire table
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    table.autofit = False

    set_od_table_borders(table)

    # ========================================================
    # COLUMN WIDTHS
    # ========================================================

    widths = [
        Inches(0.55),
        Inches(1.00),
        Inches(2.20),
        Inches(0.70),
        Inches(1.00),
        Inches(0.55)
    ]

    # ========================================================
    # HEADER
    # ========================================================

    header_cells = table.rows[0].cells

    for i in range(6):

        format_od_cell(
            header_cells[i],
            headers[i],
            bold=True
        )

        header_cells[i].width = widths[i]

    # ========================================================
    # CADET DATA
    # ========================================================

    for serial_no, student in enumerate(
        students,
        start=1
    ):

        row = table.add_row()

        cells = row.cells

        # ----------------------------------------------------
        # YEAR
        # ----------------------------------------------------

        cadet_year = get_cadet_year(
            student,
            selected_year
        )

        # ----------------------------------------------------
        # IMPORTANT:
        # DO NOT ADD:
        #
        # student["wing"]
        # student["regiment_no"]
        # student["rank"]
        # student["gender"]
        #
        # They are intentionally excluded.
        # ----------------------------------------------------

        values = [
            serial_no,
            student["student_id"],
            student["name"],
            cadet_year,
            student["department"],
            student["section"]
        ]

        for i in range(6):

            format_od_cell(
                cells[i],
                values[i]
            )

            cells[i].width = widths[i]

    return table


# ============================================================
# FINAL OD LETTER
# ============================================================

def generate_final_od_letter(
    students,
    output_path,
    od_date,
    from_address,
    from_name_1,
    from_name_2,
    to_address,
    program_location,
    start_time,
    end_time,
    selected_year="",
    letter_content=""
):

    document = Document()

    # ========================================================
    # PAGE
    # ========================================================

    section = document.sections[0]

    section.top_margin = Inches(0.65)
    section.bottom_margin = Inches(0.65)
    section.left_margin = Inches(0.85)
    section.right_margin = Inches(0.85)

    # ========================================================
    # DEFAULT FONT
    # ========================================================

    document.styles["Normal"].font.name = "Times New Roman"
    document.styles["Normal"].font.size = Pt(12)

    # ========================================================
    # DATE - TOP RIGHT
    # ========================================================

    date_para = document.add_paragraph()

    date_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    date_para.paragraph_format.space_after = Pt(12)

    run = date_para.add_run(
        f"Date: {od_date}"
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # FROM ADDRESS
    # ========================================================

    from_para = document.add_paragraph()

    from_para.alignment = WD_ALIGN_PARAGRAPH.LEFT

    from_para.paragraph_format.space_after = Pt(8)

    run = from_para.add_run("From,\n")

    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    run = from_para.add_run(
        f"{from_address}\n"
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # Two additional spaces/lines
    run = from_para.add_run(
        f"{from_name_1}\n"
        f"{from_name_2}"
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # TO ADDRESS
    # ========================================================

    to_para = document.add_paragraph()

    to_para.alignment = WD_ALIGN_PARAGRAPH.LEFT

    to_para.paragraph_format.space_after = Pt(12)

    run = to_para.add_run("To,\n")

    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    run = to_para.add_run(
        to_address
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # RESPECTED SIR
    # ========================================================

    sir_para = document.add_paragraph()

    sir_para.alignment = WD_ALIGN_PARAGRAPH.LEFT

    sir_para.paragraph_format.space_after = Pt(8)

    run = sir_para.add_run(
        "Respected Sir,"
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # LETTER CONTENT
    # ========================================================

    body_para = document.add_paragraph()

    body_para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    body_para.paragraph_format.line_spacing = 1.15
    body_para.paragraph_format.space_after = Pt(10)

    if letter_content:

        content = letter_content

    else:

        content = (
            "I bring to your kind notice that the following NCC "
            "cadets of our college will be attending the programme "
            f"at {program_location}. The programme is scheduled "
            f"from {start_time} to {end_time}. "
            "In this regard, I kindly request you to grant permission "
            "for the following cadets and mark their absence as "
            "\"ON DUTY\" for the above-mentioned programme."
        )

    run = body_para.add_run(content)

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # THANK YOU - CENTER
    # ========================================================

    thank_para = document.add_paragraph()

    thank_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    thank_para.paragraph_format.space_before = Pt(8)
    thank_para.paragraph_format.space_after = Pt(8)

    run = thank_para.add_run(
        "Thank You"
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # CADET TABLE
    # ========================================================

    add_final_cadet_table(
        document=document,
        students=students,
        selected_year=selected_year
    )

    # ========================================================
    # YOURS SINCERELY
    #
    # IMPORTANT:
    # THIS IS BELOW THE CADET TABLE
    # AND RIGHT ALIGNED.
    # ========================================================

    sincerely_para = document.add_paragraph()

    sincerely_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    sincerely_para.paragraph_format.space_before = Pt(20)
    sincerely_para.paragraph_format.space_after = Pt(0)

    run = sincerely_para.add_run(
        "Yours sincerely,"
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # SIGNATURE
    # ========================================================

    signature_para = document.add_paragraph()

    signature_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT

    signature_para.paragraph_format.space_before = Pt(30)

    run = signature_para.add_run(
        f"{from_name_1}\n"
        "Associate NCC Officer"
    )

    run.font.name = "Times New Roman"
    run.font.size = Pt(12)

    # ========================================================
    # SAVE WORD FILE
    # ========================================================

    document.save(output_path)

    return output_path