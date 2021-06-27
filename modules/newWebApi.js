/**
    Node-Modules Imports
*/
const path = require("path");
const https = require("https");
const fetch = require("node-fetch");
const { writeJson } = require("./borFuncs");

/**
    Private Module Imports
    And some variable declatation.
*/
const headers = {
  origin: "https://newweb.nepalstock.com.np",
  referer: "https://newweb.nepalstock.com.np/floor-sheet",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "sec-ch-ua":
    '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
  "sec-ch-ua-mobile": "?0",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": 1,
  "content-type": "application/json",
  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
};
const httpsAgent = new https.Agent({ keepAlive: true });
const stockslistPath = path.join(__dirname, "..", "out", "stockslist.json");
const flootsheetPath = path.join(__dirname, "..", "out", "floorsheet.json");
const brokerlistPath = path.join(__dirname, "..", "out", "brokerlist.json");

/** Get Non-Delisted Stocks list From API. */
async function saveStocks() {
  try {
    var res = await fetch(
      "https://newweb.nepalstock.com/api/nots/security?nonDelisted=true",
      {
        method: "GET",
        agent: httpsAgent,
        headers: headers,
        timeout: 2000,
      }
    );
    var ndata = await res.json();
    writeJson(stockslistPath, ndata);
  } catch (error) {
    return null
  }
}

/** Get Current active brokerList. */
async function saveBrokers() {
  try {
    var res = await fetch(
      "https://newweb.nepalstock.com.np/api/nots/member?&size=50",
      {
        method: "POST",
        agent: httpsAgent,
        headers: headers,
        body: JSON.stringify({
          memberName: "",
          contactPerson: "",
          contactNumber: "",
          memberCode: "",
          provinceId: 0,
          districtId: 0,
          municipalityId: 0,
        }),
        timeout: "2000",
      }
    );
    var ndata = await res.json();
    writeJson(brokerlistPath, ndata.content);
  } catch (error) {
    return null;
  }
}

/** Get floorsheet with specific Page */
async function getSheet(pageNo = "0", pageSize = "500", uselessId, stockId = false) {
  var url = "https://newweb.nepalstock.com.np/api/nots/nepse-data/floorsheet";
  url = url + "?page=" + pageNo;
  url = url + "&size=" + pageSize;
  if (stockId) url = url + "&stockId=" + stockId;
  url = url + "&sort=contractId,desc";
  try {
    var res = await fetch(url,
      {
        method: "POST",
        agent: httpsAgent,
        headers: headers,
        body: JSON.stringify({ id: uselessId.toString() }),
        timeout: "10000",
      }
    );
    var ndata = await res.json();
    return ndata.floorsheets;
  } catch (error) {
    return null;
  }
}

/** Save all of the floorsheet to file. */
async function saveFullSheet(uselessId) {
  try {
    var floorsheet = [];
    var sheet = await getSheet("0", "500", uselessId);
    if (sheet != null) {
      var i = 1;
      floorsheet = sheet.content;
      var totalPages = sheet.totalPages;
      while (i < totalPages) {
        var page = i.toString();
        var response = await getSheet(page, "500", uselessId);
        if (response != null) {
          console.log(page + " out of " + totalPages);
          floorsheet = floorsheet.concat(response.content);
          i++;
        }
      }
      writeJson(flootsheetPath, floorsheet);
    }
  } catch (error) {}
}

/**
    Export functions as modules.
*/
module.exports.getSheet = getSheet;

module.exports.saveStocks = saveStocks;
module.exports.saveBrokers = saveBrokers;
module.exports.saveFullSheet = saveFullSheet;
