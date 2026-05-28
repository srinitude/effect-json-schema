# effect-json-schema

Tiny Effect Schema adapter for [Standard JSON Schema V1](https://standardschema.dev/json-schema).

`effect-json-schema` keeps the runtime surface deliberately small: pass an Effect `Schema`, receive a Standard JSON Schema object with `~standard.version`, `~standard.vendor`, `~standard.types`, and `~standard.jsonSchema.input/output`.

## Install

```sh
npm install effect-json-schema effect @standard-schema/spec
```

## Usage

```ts
import * as S from "effect/Schema"
import { toStandardJsonSchema, type InferInput, type InferOutput } from "effect-json-schema"

const Person = S.Struct({ name: S.String })
const standard = toStandardJsonSchema(Person)

const jsonSchema = standard["~standard"].jsonSchema.input({
  target: "draft-2020-12"
})

type PersonInput = InferInput<typeof standard>
type PersonOutput = InferOutput<typeof standard>
```

## Supported targets

The adapter supports every Standard JSON Schema V1 target required by the protocol:

- `draft-2020-12`
- `draft-07`
- `openapi-3.0`

Unknown target strings throw `TypeError` so future targets cannot silently produce incorrect schemas.

## Input and output schemas

Effect transforms can have different encoded input and decoded output types. The adapter preserves that distinction by using `Schema.encodedSchema` for `jsonSchema.input()` and `Schema.typeSchema` for `jsonSchema.output()`.

```ts
const TextToNumber = S.transform(S.String, S.Number, {
  strict: true,
  decode: (value) => Number(value),
  encode: (value) => String(value)
})

const standard = toStandardJsonSchema(TextToNumber)
standard["~standard"].jsonSchema.input({ target: "draft-07" })  // { type: "string" }
standard["~standard"].jsonSchema.output({ target: "draft-07" }) // { type: "number" }
```

## `libraryOptions`

`libraryOptions` are forwarded to Effect's JSON Schema generator. For example, this enables Effect's `additionalPropertiesStrategy` option:

```ts
standard["~standard"].jsonSchema.input({
  target: "draft-07",
  libraryOptions: { additionalPropertiesStrategy: "allow" }
})
```

## Quality gates

This repository is intentionally small, but CI is not minimal. Every push and pull request runs:

- TypeScript strict type-checking
- Build and declaration emit
- Vitest contract tests for the Standard JSON Schema protocol
- LOC, construct length, nesting, and marker-text gates
- Repository health checks for license, docs, templates, and workflows
- `npm pack` consumer smoke tests for runtime and type imports
- `publint` package checks

Run the full gate locally:

```sh
npm run ci
```

## License

Apache-2.0. See [LICENSE](./LICENSE).
