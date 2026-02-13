const extractCastingTable = (sheetRows, tableName) => {

  if (!tableName || !sheetRows?.length) return [];

  const normalize = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();

  let tableRow = -1;
  let tableCol = -1;

  for (let r = 0; r < sheetRows.length; r++) {
    for (let c = 0; c < sheetRows[r].length; c++) {

      const cell = sheetRows[r][c];

      if (normalize(cell) === normalize(tableName)) {
        tableRow = r;
        tableCol = c;
        break;
      }
    }
    if (tableRow !== -1) break;
  }

  if (tableRow === -1) {
    console.log("TABLE NOT FOUND:", tableName);
    return [];
  }

  const result = [];

  for (let i = tableRow + 2; i < sheetRows.length; i++) {

    const row = sheetRows[i];

    const item = (row[tableCol] || "").trim();

    if (!item) break;

    result.push({
      item,
      qty: Number(row[tableCol + 1] || 0),
      rate: Number(row[tableCol + 2] || 0),
      amount: Number(row[tableCol + 3] || 0),
    });
  }
  console.log('result: ', result);

  return result;
};


module.exports = {
  extractCastingTable
};
