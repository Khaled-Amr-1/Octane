import multer from "multer";

// Accept .xlsx, .xls, .csv, .ods
const ACCEPTED_MIMETYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv", // .csv
  "application/vnd.oasis.opendocument.spreadsheet" // .ods
];

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".ods"];

const storage = multer.memoryStorage();

export const uploadExcel = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Check mime type OR extension
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (
      ACCEPTED_MIMETYPES.includes(file.mimetype) ||
      ACCEPTED_EXTENSIONS.includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel (.xlsx, .xls), CSV, or ODS files are allowed!"));
    }
  }
});