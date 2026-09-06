const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || "C:\\Users\\Dell", "AppData", "Local");
const candidates = [
  path.join(localAppData, "Programs", "Python", "Python312", "python.exe"),
  path.join(localAppData, "Programs", "Python", "Python313", "python.exe"),
  path.join(localAppData, "Programs", "Python", "Python311", "python.exe"),
  "C:\\Program Files\\Python312\\python.exe",
  "C:\\Program Files\\Python311\\python.exe",
  "python",
  "py"
];

let selectedPython = "python";
for (const candidate of candidates) {
  if (candidate.includes(path.sep)) {
    if (fs.existsSync(candidate)) {
      selectedPython = candidate;
      break;
    }
  }
}

console.log(`Starting Smart Market Watchlist using: ${selectedPython}`);
const child = spawn(selectedPython, ["-m", "backend.server"], {
  stdio: "inherit",
  shell: false,
  cwd: __dirname
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
