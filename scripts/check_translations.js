/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const en = JSON.parse(fs.readFileSync("messages/en.json"));
const es = JSON.parse(fs.readFileSync("messages/es.json"));
const keysToCheck = ["eforms", "crm", "inventory", "links", "analytics", "auditLogs"];
let hasMissing = false;

function checkKeys(objEn, objEs, path) {
  if (!objEn) return;
  if (!objEs) {
    console.log(`Missing key completely: ${path}`);
    hasMissing = true;
    return;
  }
  for (const k of Object.keys(objEn)) {
    if (typeof objEn[k] === "object") {
      checkKeys(objEn[k], objEs[k], `${path}.${k}`);
    } else if (objEs[k] === undefined) {
      console.log(`Missing key: ${path}.${k}`);
      hasMissing = true;
    }
  }
}

for (const k of keysToCheck) {
  checkKeys(en[k], es[k], k);
}
if (!hasMissing) console.log("No missing keys found in these modules.");
