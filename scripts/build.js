const fs = require("fs");
const path = require("path");

const packageJson = require.resolve("@supabase/supabase-js/package.json");
const packageRoot = path.dirname(packageJson);
const supabasePackage = JSON.parse(fs.readFileSync(packageJson, "utf8"));
if (typeof supabasePackage.jsdelivr !== "string") {
  throw new Error("@supabase/supabase-js does not declare a browser bundle.");
}

const source = path.resolve(packageRoot, supabasePackage.jsdelivr);
if (!fs.existsSync(source)) {
  throw new Error(`Supabase browser bundle not found: ${source}`);
}

const destination = path.resolve(__dirname, "..", "web", "vendor", "supabase.js");

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
console.log("Prepared the Supabase browser client.");
