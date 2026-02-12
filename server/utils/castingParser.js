const extractCastingTable = (sheetRows, tableName) => {

  if (!tableName || !sheetRows?.length) return [];

  let tableRow = -1;
  let tableCol = -1;

  // 🔥 find table position anywhere
  for (let r = 0; r < sheetRows.length; r++) {
    for (let c = 0; c < sheetRows[r].length; c++) {

      const cell = (sheetRows[r][c] || "").trim().toLowerCase();

      if (cell === tableName.toLowerCase()) {
        tableRow = r;
        tableCol = c;
        break;
      }
    }
    if (tableRow !== -1) break;
  }

  if (tableRow === -1) return [];

  // header assumed next row
  const headerRow = sheetRows[tableRow + 1];

  if (!headerRow) return [];

  // find ITEMS column
  const startCol = tableCol;

  const result = [];

  // data starts after header
  for (let i = tableRow + 2; i < sheetRows.length; i++) {

    const row = sheetRows[i];

    const item = (row[startCol] || "").trim();

    if (!item) break; // stop when blank

    result.push({
      item,
      qty: Number(row[startCol + 1] || 0),
      rate: Number(row[startCol + 2] || 0),
      amount: Number(row[startCol + 3] || 0),
    });
  }

  return result;
};

module.exports = {
  extractCastingTable
};
