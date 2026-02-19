const axios = require("axios");
const csv = require("csv-parser");

const SPREADSHEET_ID = "19cNC8a3CLMMnyoOdPN4NGex2I10bxc6BcyFxudv-UP4";

const fetchSheetData = async (gid) => {

  try {

    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

    const response = await axios.get(csvUrl, {
      responseType: "stream"
    });

    return new Promise((resolve, reject) => {

      const results = [];

      response.data
        .pipe(csv())
        .on("data", (row) => results.push(row))
        .on("end", () => resolve(results))
        .on("error", reject);

    });

  } catch (error) {

    console.error("Sheet fetch error:", error.message);
    return [];

  }

};

module.exports = {
  fetchSheetData
};
