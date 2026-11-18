const fs = require("fs");
const path = require("path");

const source = require.resolve("@supabase/supabase-js/dist/umd/supabase.js");
const destination = path.resolve(__dirname, "..", "web", "vendor", "supabase.js");

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
console.log("Prepared the Supabase browser client.");
