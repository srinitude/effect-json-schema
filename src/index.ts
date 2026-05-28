import * as JSONSchema from "effect/JSONSchema"
import * as Schema from "effect/Schema"
import type { StandardJSONSchemaV1 } from "@standard-schema/spec"

export type { StandardJSONSchemaV1 }
export type InferInput<T extends StandardJSONSchemaV1> = StandardJSONSchemaV1.InferInput<T>
export type InferOutput<T extends StandardJSONSchemaV1> = StandardJSONSchemaV1.InferOutput<T>
export type StandardEffectSchema<S extends Schema.Schema.Any> = StandardJSONSchemaV1<
  Schema.Schema.Encoded<S>,
  Schema.Schema.Type<S>
>

type EffectTarget = NonNullable<Parameters<typeof JSONSchema.make>[1]>["target"]
type EffectOptions = Parameters<typeof JSONSchema.fromAST>[1]
type LibraryOptions = Partial<Omit<EffectOptions, "definitions" | "target">>
type JsonRecord = Record<string, unknown>

const vendor = "effect-json-schema"

export const toStandardJsonSchema = <S extends Schema.Schema.Any>(schema: S): StandardEffectSchema<S> => ({
  "~standard": {
    version: 1,
    vendor,
    types: undefined as StandardJSONSchemaV1.Types<Schema.Schema.Encoded<S>, Schema.Schema.Type<S>> | undefined,
    jsonSchema: {
      input: (options) => emit(Schema.encodedSchema(schema), options),
      output: (options) => emit(Schema.typeSchema(schema), options)
    }
  }
})

const emit = (schema: Schema.Schema.Any, options: StandardJSONSchemaV1.Options): JsonRecord => {
  const target = targetFor(options.target)
  const result = makeRoot(schema, target, options.libraryOptions)
  return options.target === "openapi-3.0" ? toOpenApi(result) : result
}

const targetFor = (target: StandardJSONSchemaV1.Target): EffectTarget => {
  if (target === "draft-2020-12") return "jsonSchema2020-12"
  if (target === "draft-07" || target === "openapi-3.0") return "jsonSchema7"
  throw new TypeError("Unsupported Standard JSON Schema target: " + target)
}

const makeRoot = (
  schema: Schema.Schema.Any,
  target: EffectTarget,
  libraryOptions: StandardJSONSchemaV1.Options["libraryOptions"]
): JsonRecord => {
  const definitions: Record<string, JSONSchema.JsonSchema7> = {}
  const schemaBody = JSONSchema.fromAST(schema.ast, {
    ...(libraryOptions as LibraryOptions | undefined),
    definitions,
    target
  })
  const root: JsonRecord = { $schema: metaSchemaUri(target), ...schemaBody }
  if (Object.keys(definitions).length > 0) root.$defs = definitions
  return root
}

const isRecord = (value: unknown): value is JsonRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const metaSchemaUri = (target: EffectTarget): string => {
  if (target === "jsonSchema2020-12") return "https://json-schema.org/draft/2020-12/schema"
  return "http://json-schema.org/draft-07/schema#"
}

const toOpenApi = (value: unknown): JsonRecord => {
  if (!isRecord(value)) return {}
  const entries = Object.entries(value).filter(([key]) => key !== "$schema")
  const converted = Object.fromEntries(entries.map(([key, item]) => [key, convertOpenApi(item)]))
  const anyOf = converted.anyOf
  if (!Array.isArray(anyOf)) return converted
  const nonNull = anyOf.filter((item) => !isNullSchema(item))
  if (nonNull.length !== 1 || nonNull.length === anyOf.length) return converted
  return { ...(nonNull[0] as JsonRecord), nullable: true }
}

const convertOpenApi = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(convertOpenApi)
  if (!isRecord(value)) return value
  return toOpenApi(value)
}

const isNullSchema = (value: unknown): boolean => isRecord(value) && value.type === "null"
