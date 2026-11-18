const fs = require("fs");
const path = require("path");

function findJavaScriptFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).reduce((files, entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return files.concat(findJavaScriptFiles(entryPath));
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
    return files;
  }, []);
}

function resolveSupabaseBundle() {
  const packageJson = require.resolve("@supabase/supabase-js/package.json");
  const packageRoot = path.dirname(packageJson);
  const supabasePackage = JSON.parse(fs.readFileSync(packageJson, "utf8"));
  const distRoot = path.resolve(packageRoot, "dist");
  const isInsideDist = (filePath) => {
    const relativePath = path.relative(distRoot, filePath);
    return relativePath &&
      relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath);
  };

  const declaredBundles = [supabasePackage.jsdelivr, supabasePackage.unpkg]
    .filter((bundlePath) => typeof bundlePath === "string")
    .map((bundlePath) => path.resolve(packageRoot, bundlePath))
    .filter((bundlePath) => isInsideDist(bundlePath) && fs.existsSync(bundlePath));
  const umdBundles = findJavaScriptFiles(distRoot)
    .filter((filePath) => {
      const relativePath = path.relative(distRoot, filePath);
      return relativePath.split(path.sep).some((segment) => segment.toLowerCase() === "umd")
        || /\.umd\.js$/i.test(filePath);
    })
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
  const source = [...new Set([...declaredBundles, ...umdBundles])][0];

  if (!source) {
    throw new Error(`Supabase browser UMD bundle not found under ${distRoot}`);
  }
  return source;
}

module.exports = resolveSupabaseBundle;
