const fs = require("fs");
const path = require("path");
const resolveSupabaseBundle = require("./supabase-bundle");
const source = resolveSupabaseBundle();

const destination = path.resolve(__dirname, "..", "web", "vendor", "supabase.js");

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
console.log("Prepared the Supabase browser client.");
