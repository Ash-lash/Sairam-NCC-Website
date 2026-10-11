import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * Generates an official Microsoft Word (.docx) On Duty (OD) request letter
 * matching the exact formatting of the Python OD GENERATOR template.
 *
 * @param {Object} options
 * @param {Array} options.selectedCadets - Array of cadet objects
 * @param {string} options.fromDate - Start date (YYYY-MM-DD or DD.MM.YYYY)
 * @param {string} options.toDate - End date (optional)
 * @param {string} options.fromAddress - From address multiline text
 * @param {string} options.toAddress - To address multiline text
 * @param {string} options.programLocation - Venue / location
 * @param {string} options.programDetails - Purpose / programme details
 * @param {string} options.programTime - Schedule timings (e.g. 09:00 AM to 04:00 PM)
 * @param {string} options.academicYear - Academic year label (e.g. "II Year" or auto)
 * @param {string} options.sincerelyName - ANO / Officer signatory name
 * @param {string} options.letterContent - Optional custom letter body
 * @returns {Promise<Blob>}
 */
export const generateAndDownloadODDocx = async ({
  selectedCadets = [],
  fromDate = '',
  toDate = '',
  fromAddress = `The Commanding Officer / ANO\nSri Sairam Engineering College\nChennai`,
  toAddress = `The Principal\nSri Sairam Engineering College\nChennai`,
  programLocation = '',
  programDetails = '',
  programTime = '',
  academicYear = '',
  sincerelyName = 'Associate NCC Officer',
  letterContent = ''
}) => {
  // Format dates for display (e.g. DD.MM.YYYY)
  const formatDisplayDate = (dStr) => {
    if (!dStr) return '';
    if (dStr.includes('.')) return dStr;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dStr;
  };

  const todayStr = formatDisplayDate(new Date().toISOString().split('T')[0]);
  const dispFromDate = formatDisplayDate(fromDate);
  const dispToDate = formatDisplayDate(toDate);

  // Determine year text
  let yearText = '';
  if (academicYear) {
    yearText = academicYear.includes('Year') ? `${academicYear} ` : `${academicYear} Year `;
  } else {
    const years = Array.from(new Set(selectedCadets.map(c => c.year || c.Year || '').filter(Boolean)));
    if (years.length === 1) {
      yearText = `${years[0]} Year `;
    }
  }

  // Build body text runs
  let bodyParagraph;
  if (letterContent && letterContent.trim()) {
    bodyParagraph = new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
      children: [
        new TextRun({ text: letterContent.trim(), font: 'Times New Roman', size: 22 })
      ]
    });
  } else {
    const dateText = dispToDate ? `from ${dispFromDate} to ${dispToDate}` : `on ${dispFromDate}`;
    let scheduleText = `The programme is scheduled ${dateText}`;
    if (programTime) scheduleText += ` during ${programTime}`;

    bodyParagraph = new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 276 },
      children: [
        new TextRun({ text: "I bring to your kind notice that the ", font: 'Times New Roman', size: 22 }),
        new TextRun({ text: yearText, bold: true, font: 'Times New Roman', size: 22 }),
        new TextRun({ text: "NCC cadets of our college will be attending the programme", font: 'Times New Roman', size: 22 }),
        ...(programLocation ? [
          new TextRun({ text: " at ", font: 'Times New Roman', size: 22 }),
          new TextRun({ text: programLocation, bold: true, font: 'Times New Roman', size: 22 })
        ] : []),
        ...(programDetails ? [
          new TextRun({ text: ` for ${programDetails}`, font: 'Times New Roman', size: 22 })
        ] : []),
        new TextRun({ text: ". ", font: 'Times New Roman', size: 22 }),
        new TextRun({
          text: `${scheduleText}. In this regard, I kindly request you to grant permission for the following cadets and mark their absence as 'ON DUTY' for the above-mentioned programme.`,
          font: 'Times New Roman',
          size: 22
        })
      ]
    });
  }

  // Create table
  const tableBorderObj = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "000000"
  };

  const bordersConfig = {
    top: tableBorderObj,
    bottom: tableBorderObj,
    left: tableBorderObj,
    right: tableBorderObj,
    insideHorizontal: tableBorderObj,
    insideVertical: tableBorderObj
  };

  const headers = ["S.No", "SEC ID / Regt No", "Name", "Year", "Dept.", "Wing"];
  // Approximate column width percentages or DXA (total ~9360 dxa for letter)
  const colWidths = [700, 1800, 3200, 1100, 1500, 1060];

  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.DXA },
      borders: bordersConfig,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: h, bold: true, font: 'Times New Roman', size: 20 })
          ]
        })
      ]
    }))
  });

  const cadetRows = selectedCadets.map((c, idx) => {
    const sNo = String(idx + 1);
    const id = c.student_id || c.regNo || c.regimentNo || c.id || '';
    const name = c.name || c.Name || '';
    const yr = c.year || c.Year || c.seniority?.label || '';
    const yrDisplay = yr.includes('Year') ? yr : (yr ? `${yr} Year` : '');
    const dept = c.department || c.dept || '';
    const wing = c.wing || c.Wing || '';

    const rowValues = [sNo, id, name, yrDisplay, dept, wing];

    return new TableRow({
      children: rowValues.map((val, i) => new TableCell({
        width: { size: colWidths[i], type: WidthType.DXA },
        borders: bordersConfig,
        margins: { top: 70, bottom: 70, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: String(val), font: 'Times New Roman', size: 20 })
            ]
          })
        ]
      }))
    });
  });

  const table = new Table({
    width: { size: 9360, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    rows: [headerRow, ...cadetRows]
  });

  // Construct Full Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.7),
              right: convertInchesToTwip(0.7)
            }
          }
        },
        children: [
          // Date right-aligned
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 140 },
            children: [
              new TextRun({ text: todayStr, font: 'Times New Roman', size: 22 })
            ]
          }),

          // From Heading
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "From:", bold: true, font: 'Times New Roman', size: 22 })
            ]
          }),

          // From Address lines
          ...fromAddress.split('\n').map(line => new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 20 },
            children: [
              new TextRun({ text: line, font: 'Times New Roman', size: 22 })
            ]
          })),

          // Spacing
          new Paragraph({ spacing: { after: 120 }, children: [] }),

          // To Heading
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "To:", bold: true, font: 'Times New Roman', size: 22 })
            ]
          }),

          // To Address lines
          ...toAddress.split('\n').map(line => new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 20 },
            children: [
              new TextRun({ text: line, font: 'Times New Roman', size: 22 })
            ]
          })),

          // Spacing
          new Paragraph({ spacing: { after: 120 }, children: [] }),

          // Respected Sir
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "Respected Sir,", bold: true, font: 'Times New Roman', size: 22 })
            ]
          }),

          // Body paragraph
          bodyParagraph,

          // Thank you centered
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 160 },
            children: [
              new TextRun({ text: "Thank you.", bold: true, font: 'Times New Roman', size: 22 })
            ]
          }),

          // Cadets Table
          table,

          // Spacing
          new Paragraph({ spacing: { after: 200 }, children: [] }),

          // Yours sincerely right-aligned
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 240 },
            children: [
              new TextRun({ text: "Yours sincerely,\n\n\n", font: 'Times New Roman', size: 22 }),
              new TextRun({ text: sincerelyName, bold: true, font: 'Times New Roman', size: 22 }),
              new TextRun({ text: "\nAssociate NCC Officer", font: 'Times New Roman', size: 20 })
            ]
          })
        ]
      }
    ]
  });

  // Pack to Blob and trigger download
  const blob = await Packer.toBlob(doc);
  const dateSuffix = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const filename = `OD_Letter_${dateSuffix}.docx`;
  saveAs(blob, filename);

  return blob;
};
