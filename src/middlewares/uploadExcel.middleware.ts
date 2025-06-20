import multer from "multer";

const storage = multer.memoryStorage(); // Store file in memory
export const uploadExcel = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed!"));
    }
  }
});