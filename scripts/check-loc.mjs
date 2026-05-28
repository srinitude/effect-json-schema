import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const roots = ["src", "test", "scripts"]
const sourceExt = /\.(ts|tsx|js|mjs)$/

const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name)
  const stat = statSync(path)
  if (stat.isDirectory()) return files(path)
  return sourceExt.test(path) ? [path] : []
})

const codeLines = (text) => text.split(/\r?\n/).filter((line) => {
  const trimmed = line.trim()
  return trimmed.length > 0 && !trimmed.startsWith("//")
})

const scan = (path) => {
  const lines = readFileSync(path, "utf8").split(/\r?\n/)
  const physical = codeLines(lines.join("\n")).length
  const issues = physical > 200 ? [path + ": " + physical + " lines"] : []
  let start = 0
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*(export\s+)?(const|function|class|interface|type)\b/.test(lines[i])) {
      const result = measure(lines, i)
      if (result.lines > 30) issues.push(path + ":" + (i + 1) + " construct has " + result.lines + " lines")
      if (result.depth > 3) issues.push(path + ":" + (i + 1) + " nesting depth is " + result.depth)
      start = result.end
      i = Math.max(i, start)
    }
  }
  return issues
}

const count = (line, char) => Array.from(line).filter((item) => item === char).length

const measure = (lines, start) => {
  let brace = 0
  let max = 0
  let seen = false
  let end = start
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i]
    const opens = count(line, "{")
    seen = seen || opens > 0
    brace += opens
    max = Math.max(max, brace)
    brace -= count(line, "}")
    end = i
    if ((seen && brace <= 0) || (!seen && /[;,]$/.test(line.trim()))) break
  }
  const chunk = lines.slice(start, end + 1).join("\n")
  return { end, lines: codeLines(chunk).length, depth: seen ? Math.max(0, max - 1) : 0 }
}

const issues = roots.flatMap(files).flatMap(scan)
if (issues.length > 0) {
  console.error(issues.join("\n"))
  process.exit(1)
}
