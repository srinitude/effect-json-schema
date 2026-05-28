import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"

const root = process.cwd()
const tmp = mkdtempSync(join(tmpdir(), "effect-json-schema-pack-"))

const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" })
  if (result.status !== 0) {
    console.error(result.stdout)
    console.error(result.stderr)
    throw new Error(`${command} ${args.join(" ")} failed`)
  }
  return result.stdout
}

const writeConsumer = () => {
  writeFileSync(join(tmp, "package.json"), JSON.stringify({ type: "module" }))
  writeFileSync(join(tmp, "runtime.mjs"), runtimeSource())
  writeFileSync(join(tmp, "types.ts"), typeSource())
}

const runtimeSource = () => [
  "import * as S from 'effect/Schema'",
  "import { toStandardJsonSchema } from 'effect-json-schema'",
  "const standard = toStandardJsonSchema(S.Struct({ name: S.String }))['~standard']",
  "const schema = standard.jsonSchema.input({ target: 'draft-2020-12' })",
  "if (standard.version !== 1) throw new Error('bad version')",
  "if (schema.type !== 'object') throw new Error('bad schema')"
].join("\n")

const typeSource = () => [
  "import * as S from 'effect/Schema'",
  "import { type InferInput, toStandardJsonSchema } from 'effect-json-schema'",
  "const schema = toStandardJsonSchema(S.Struct({ name: S.String }))",
  "const value: InferInput<typeof schema> = { name: 'Ada' }",
  "value.name satisfies string"
].join("\n")

try {
  run("npm", ["run", "build"])
  const packed = JSON.parse(run("npm", ["pack", "--pack-destination", tmp, "--json"]))
  const tarball = join(tmp, packed[0].filename)
  if (!existsSync(tarball)) throw new Error("npm pack did not create a tarball")
  writeConsumer()
  run("npm", ["install", "--silent", tarball], tmp)
  run("node", ["runtime.mjs"], tmp)
  const tsc = resolve(root, "node_modules/typescript/bin/tsc")
  run(process.execPath, [tsc, "--module", "NodeNext", "--moduleResolution", "NodeNext", "--target", "ES2022", "--strict", "--noEmit", "types.ts"], tmp)
  console.log("package smoke checks passed")
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
