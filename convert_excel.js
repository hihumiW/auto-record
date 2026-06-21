const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const excelPath = path.join(__dirname, "template1.xls");
const jsonPath = path.join(__dirname, "data.json");

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0]; // Assuming Sheet1 is the first sheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON, starting from the 4th row (index 3) as header
  let jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 3 });

  // Clean data: remove \t from all string values
  jsonData = jsonData
    .map((row) => {
      const cleanRow = {};
      for (const key in row) {
        if (typeof row[key] === "string") {
          cleanRow[key] = row[key].replace(/\t/g, "").trim();
        } else {
          cleanRow[key] = row[key];
        }
      }
      return cleanRow;
    })
    .filter((row) =>
      [
        "当事人1",
        "当事人2",
        "当事人1证件号码",
        "当事人2证件号码",
        "联系方式",
        "联系方式2",
        "基本情况",
      ].every((key) => Boolean(row[key])),
    );

  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`Successfully converted ${excelPath} to ${jsonPath}`);
  console.log(`Total records: ${jsonData.length}`);
} catch (error) {
  console.error("Error converting Excel to JSON:", error);
  process.exit(1);
}
