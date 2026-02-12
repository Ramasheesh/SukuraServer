const extractCastingTable = (sheetRows, tableName) => {

  if (!tableName) return [];

  let capture = false;
  let result = [];

  for (let i = 0; i < sheetRows.length; i++) {

    const row = sheetRows[i];

    const item = (row.ITEMS || "").trim();

    // start capturing when table found
    if (item.toLowerCase() === tableName.toLowerCase()) {
      capture = true;
      continue;
    }

    if (capture) {

      // stop when next table detected
      if (
        item &&
        item.toLowerCase().startsWith("table")
      ) {
        break;
      }

      if (!item) continue;

      result.push({
        item,
        qty: Number(row.QTY || 0),
        rate: Number(row.RATE || 0),
        amount: Number(row.AMOUNT || 0)
      });

    }

  }

  return result;

};

module.exports = {
  extractCastingTable
};
