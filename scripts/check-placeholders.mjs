import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const roots = ["src", "test"]
const terms = /TODO|FIXME|placeholder|[^a-zA-Z](mock|stub)[^a-zA-Z]/i

const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  const stat = statSync(path)
  if (stat.isDirectory()) return files(path)
  return /\.(ts|tsx|js|mjs)$/.test(path) ? [path] : []
})

const hits = roots.flatMap((root) => files(root).filter((path) => {
  return terms.test(readFileSync(path, "utf8"))
}))

if (hits.length > 0) {
  console.error(`Disallowed marker text in ${hits.join(", ")}`)
  process.exit(1)
}
