const path = require("path");

const { readJson } = require("./borFuncs");
const { saveFullSheet } = require("./newWebApi");

(main = async function () {
  var fsSettings = readJson(path.join(__dirname, ".." , "settings", "settings.json"));
  await saveFullSheet(fsSettings.uselessId);
})();