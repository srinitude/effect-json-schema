import { existsSync, readFileSync } from "node:fs"

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))
const read = (path) => existsSync(path) ? readFileSync(path, "utf8") : ""
const failures = []
const check = (ok, message) => {
  if (!ok) failures.push(message)
}

const pkg = readJson("package.json")
const requiredFiles = [
  "LICENSE",
  "README.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  ".github/CODEOWNERS",
  ".github/dependabot.yml",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/pull_request_template.md",
  ".github/workflows/ci.yml",
  ".github/workflows/publish.yml",
  ".github/workflows/scorecard.yml"
]

check(pkg.version === "0.1.0", "package version must be 0.1.0")
check(pkg.license === "Apache-2.0", "package license must be Apache-2.0")
check(pkg.sideEffects === false, "package must declare sideEffects=false")
check(pkg.repository?.url?.includes("srinitude/effect-json-schema"), "repository URL must target srinitude/effect-json-schema")
check(pkg.bugs?.url?.includes("/issues"), "bugs URL must point to GitHub issues")
check(pkg.exports?.["."]?.types === "./dist/index.d.ts", "exports must expose declarations")
check(pkg.files?.includes("LICENSE"), "published files must include LICENSE")
for (const file of requiredFiles) check(existsSync(file), `${file} must exist`)

const readme = read("README.md")
check(readme.includes("toStandardJsonSchema"), "README must show the public API")
check(readme.includes("draft-2020-12"), "README must document Standard JSON Schema targets")
check(read("LICENSE").includes("Apache License"), "LICENSE must contain Apache License text")
check(pkg.scripts?.ci?.includes("check:pack"), "CI script must run package smoke tests")
check(read(".github/workflows/publish.yml").includes("--provenance"), "publish workflow must use npm provenance")

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exit(1)
}
console.log("repository health checks passed")
