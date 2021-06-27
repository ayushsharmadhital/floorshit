const path = require("path");
const Chrome = require("chrome-launcher");
const CDebugPort = require("chrome-remote-interface");

var newFlags = Chrome.Launcher.defaultFlags();
var { writeJson, readJson } = require("./modules/borFuncs");
var settingsPath = path.join(__dirname, "settings", "settings.json");

newFlags.push("--headless"); 

Chrome.launch({
  port: 9222,
  chromeFlags: newFlags,
  ignoreDefaultFlags: true,
  startingUrl: "https://newweb.nepalstock.com/floor-sheet",
})
  .then((chrome) => {
    CDebugPort((client) => {
      const { Network } = client;
      Network.setRequestInterception({
        patterns: [
          {
            urlPattern:
              "https://newweb.nepalstock.com/api/nots/nepse-data/floorsheet?&sort=contractId,desc",
            interceptionStage: "HeadersReceived",
          },
        ],
      });
      Network.requestIntercepted(({ interceptionId, request }) => {
        var settings = readJson(settingsPath);
        settings.uselessId = JSON.parse(request.postData).id;
        writeJson(settingsPath, settings);
        chrome.kill();
        require("./modules/dasBored");
      });
    });
  })
  .catch((error) => {
    console.log(error.message);
  });