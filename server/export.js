const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.resolve(__dirname, '..', 'uploads');

/**
 * Generate an Excel workbook with check-in records and embedded photos.
 * @param {Array} records - Array of check-in records from the database.
 * @returns {ExcelJS.Workbook}
 */
async function generateExcelExport(records) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Family Check-In';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Check-Ins', {
    views: [{ showGridLines: true }],
  });

  // Define columns
  worksheet.columns = [
    { header: '#', key: 'row_num', width: 6 },
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'Student Name', key: 'student_name', width: 30 },
    { header: 'Photo', key: 'photo', width: 18 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Add data rows with embedded photos
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowIndex = i + 2; // Row 1 is header

    const row = worksheet.addRow({
      row_num: i + 1,
      timestamp: new Date(record.created_at).toLocaleString(),
      student_name: record.student_name,
      photo: '',
    });

    // Set row height for photo thumbnail
    row.height = 80;
    row.alignment = { vertical: 'middle', horizontal: 'left' };

    // Embed photo if file exists
    if (record.photo_filename) {
      const photoPath = path.join(uploadsDir, record.photo_filename);
      if (fs.existsSync(photoPath)) {
        const ext = path.extname(record.photo_filename).toLowerCase().replace('.', '');
        const extension = ext === 'jpg' ? 'jpeg' : ext;

        try {
          const imageId = workbook.addImage({
            filename: photoPath,
            extension: extension === 'png' ? 'png' : 'jpeg',
          });

          worksheet.addImage(imageId, {
            tl: { col: 3.1, row: rowIndex - 0.9 },
            ext: { width: 90, height: 90 },
            editAs: 'oneCell',
          });
        } catch (err) {
          // If image embedding fails, put a text placeholder
          row.getCell('photo').value = '[Photo unavailable]';
        }
      } else {
        row.getCell('photo').value = '[Photo missing]';
      }
    }
  }

  return workbook;
}

module.exports = { generateExcelExport };
