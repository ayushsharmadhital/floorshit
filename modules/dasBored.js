/**
    Node-Modules Imports
*/
const path = require("path");
const blessed = require("neo-blessed");

/**
    Private Module Imports
    And some variable declatation.
*/
var pageNo = 0;
var sheetList;
var stocklist;
var totalPages;
var sortBy = null;
var filterStock = null;
var { readJson, compareFunction } = require("./borFuncs");
var {
  getSheet,
  saveStocks,
  saveBrokers,
} = require("./newWebApi");
var settingsPath = path.join(__dirname, "..", "settings", "settings.json");
var stocklistPath = path.join(__dirname, "..", "out", "stockslist.json");
var floorshitSettings = readJson(settingsPath);

/**
    Declaring a terminal Screen. 
*/
var screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
  autoPadding: true,
});

/**
    Drawing Elements to terminal.
*/
var prompt = blessed.prompt({
  parent: screen,
  border: "line",
  height: "shrink",
  width: "half",
  top: "center",
  draggable: true,
  left: "center",
  label: "**Search**",
  tags: true,
  keys: true,
  vi: true,
  style: {
    border: {
      fg: "#FFFFFF",
    },
    hover: {
      border: {
        fg: "#C0C0C0",
      },
    },
    focus: {
      border: {
        fg: "#E18A07",
      },
    },
  },
});
var hiddenBox = blessed.box({
  parent: screen,
  shadow: false,
  left: "center",
  top: "center",
  width: "50%",
  height: "50%",
  border: "line",
  draggable: true,
  tags: true,
  style: {
    border: {
      fg: "#FFFFFF",
    },
    hover: {
      border: {
        fg: "#C0C0C0",
      },
    },
    focus: {
      border: {
        fg: "#E18A07",
      },
    },
  },
});
var stockList = blessed.list({
  parent: hiddenBox,
  label: "",
  top: "center",
  left: "center",
  border: "line",
  keys: true,
  width: "80%",
  height: "80%",
  vi: true,
  mouse: true,
  scrollable: true,
  draggable: true,
  search: function (find) {
    prompt.input("Enter search string!!!", (err, val) => {
      if (val !== null) find(val.toUpperCase());
      screen.render();
    });
  },
  scrollbar: {
    ch: "#",
    track: {
      bg: "#C0C0C0",
    },
  },
  style: {
    border: {
      fg: "#FFFFFF",
    },
    focus: {
      border: {
        fg: "#E18A07",
      },
    },
    hover: {
      border: {
        fg: "#C0C0C0",
      },
    },
    scrollbar: {
      bold: true,
      fg: "#000000",
      bg: "#E18A07",
    },
    item: {
      hover: {
        bold: true,
      },
    },
    selected: {
      bold: true,
      fg: "#000000",
      bg: "#C0C0C0",
    },
  },
  items: this.items,
});
var sheetTable = blessed.listtable({
  parent: screen,
  top: floorshitSettings.table.top,
  data: null,
  border: floorshitSettings.table.border,
  align: floorshitSettings.table.align,
  tags: true,
  keys: true,
  width: floorshitSettings.table.width,
  height: floorshitSettings.table.height,
  vi: true,
  mouse: true,
  scrollable: true,
  invertSelected: false,
  style: floorshitSettings.table.style,
});

hiddenBox.setIndex(9999);
prompt.setIndex(9999);

/** Function to Refresh items in table. */
async function parseSheet() {
  sheetList = [];
  try {
    var res = await getSheet(
      pageNo.toString(),
      floorshitSettings.table.tableListSize,
      floorshitSettings.uselessId,
      filterStock
    );
    var sheet = res.content;
    totalPages = res.totalPages;
    if (sortBy == "amount") {
      sheet = sheet.sort(compareFunction("contractAmount", "desc"));
    }
    var factor = parseInt(floorshitSettings.table.tableListSize);
    var sheetlength = sheet.length;
    if (sheetlength != 0) {
      for (var i = 0; i < sheetlength; i++) {
        sheetList.push([
          (pageNo * factor + i + 1).toString(),
          sheet[i].contractId.toString(),
          sheet[i].stockSymbol,
          sheet[i].contractQuantity.toString(),
          sheet[i].contractRate.toString(),
          sheet[i].contractAmount.toString(),
          sheet[i].buyerMemberId.toString() +
            " (" +
            sheet[i].buyerBrokerName.split(" ")[0] +
            ")",
          sheet[i].sellerMemberId.toString() +
            " (" +
            sheet[i].sellerBrokerName.split(" ")[0] +
            ")",
          sheet[i].businessDate,
          sheet[i].tradeTime.split("T")[1],
        ]);
      }
      sheetList.unshift([
        "ID",
        "CONTRACTID",
        "STOCK",
        "QUANTITY",
        "RATE",
        "AMOUNT",
        "BUYER",
        "SELLER",
        "DATE",
        "TIME",
      ]);
      sheetTable.setData(sheetList);
      screen.render();
    }
  } catch (error) {}
}
async function parseStocks() {
  stocklist = [];
  var stocks = readJson(stocklistPath);
  var stockslength = stocks.length;
  if (stockslength !== 0) {
    for (var i = 0; i < stockslength; i++) {
      stocklist.push(stocks[i].symbol);
    }
    stockList.setItems(stocklist);
    screen.render();
  }
}
/** 
    KeyPress Events on Screen.
    TAB = Changes focus,
    CTRL + q = Quit the application,
    CTRL + r = Refresh Dashboard. 
*/
screen.on("keypress", (ch, key) => {
  if (key.name === "tab")
    return key.shift ? screen.focusPrevious() : screen.focusNext();
  if (key.name === "q" && key.ctrl === true) return process.exit(0);
  if (key.name === "f" && key.ctrl === false) {
    hiddenBox.toggle();
    stockList.focus();
    screen.render();
  }
  if (key.name === "s" && key.ctrl === false) {
    sortBy = "amount";
    parseSheet();
  }
  if (key.name === "r" && key.ctrl === false) {
    pageNo = 0;
    filterStock = null;
    sortBy = null;
    parseSheet();
  }
  if (key.name === "left" && key.ctrl === false) {
    if (pageNo > 0) pageNo--;
    else pageNo = totalPages - 1;
    parseSheet();
  }
  if (key.name === "right" && key.ctrl === false) {
    if (pageNo < totalPages - 1) pageNo++;
    else pageNo = 0;
    parseSheet();
  }
});

stockList.on("select", function (element, index) {
  var stocks = readJson(stocklistPath);
  var stockslen = stocks.length;
  for (var i = 0; i < stockslen; i++) {
    if (stocks[i].symbol == element.content) {
      console.log(element.content);
      hiddenBox.toggle();
      filterStock = stocks[i].id.toString();
      parseSheet();
      break;
    }
  }
});

/** RunOnce Functions */
saveStocks();
saveBrokers();
parseSheet();
parseStocks();
hiddenBox.toggle();
sheetTable.focus();

/** Screen Rendering */
screen.render();

/** 
    Little magic to download floorsheet
    and save it in the folder "sheets",
    this will try to update fs to specified
    interval in the settings file.
*/
setInterval(async () => {
  parseSheet();
}, floorshitSettings.floorsheetUpdateInterval);
