import { describe, expect, expectTypeOf, it } from "vitest"
import * as S from "effect/Schema"
import {
  type InferInput,
  type InferOutput,
  toStandardJsonSchema
} from "../src/index.js"

const person = S.Struct({ name: S.String })
const textToNumber = S.transform(S.String, S.Number, {
  strict: true,
  decode: (value) => Number(value),
  encode: (value) => String(value)
})

const makePerson = () => toStandardJsonSchema(person)
const makeTransform = () => toStandardJsonSchema(textToNumber)

describe("Standard JSON Schema V1 adapter", () => {
  it("exposes version vendor types and conversion functions", () => {
    const standard = makePerson()["~standard"]
    expect(standard.version).toBe(1)
    expect(standard.vendor).toBe("effect-json-schema")
    expect(typeof standard.vendor).toBe("string")
    expect(standard.vendor.length).toBeGreaterThan(0)
    expect(typeof standard.jsonSchema.input).toBe("function")
    expect(typeof standard.jsonSchema.output).toBe("function")
  })

  it("emits draft-2020-12 input schema records", () => {
    const schema = makePerson()["~standard"].jsonSchema.input({ target: "draft-2020-12" })
    expect(schema).toMatchObject({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["name"],
      properties: { name: { type: "string" } }
    })
  })

  it("emits draft-07 output schema records", () => {
    const schema = makePerson()["~standard"].jsonSchema.output({ target: "draft-07" })
    expect(schema).toMatchObject({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      required: ["name"],
      properties: { name: { type: "string" } }
    })
  })

  it("emits openapi-3.0 nullable schema records", () => {
    const nullableText = toStandardJsonSchema(S.Union(S.String, S.Null))
    const schema = nullableText["~standard"].jsonSchema.input({ target: "openapi-3.0" })
    expect(schema).toEqual({ type: "string", nullable: true })
  })

  it("throws a TypeError for an unknown target", () => {
    const convert = () => makePerson()["~standard"].jsonSchema.input({ target: "future-target" })
    expect(convert).toThrow(/Unsupported Standard JSON Schema target: future-target/)
  })

  it("keeps input and output schemas distinct for transforms", () => {
    const standard = makeTransform()["~standard"].jsonSchema
    expect(standard.input({ target: "draft-07" })).toMatchObject({ type: "string" })
    expect(standard.output({ target: "draft-07" })).toMatchObject({ type: "number" })
    expect(standard.input({ target: "draft-07" })).not.toEqual(standard.output({ target: "draft-07" }))
  })

  it("threads libraryOptions into Effect JSON Schema generation", () => {
    const schema = makePerson()["~standard"].jsonSchema.input({
      target: "draft-07",
      libraryOptions: { additionalPropertiesStrategy: "allow" }
    })
    expect(schema).toHaveProperty("additionalProperties", true)
  })
})

const typed = null as unknown as ReturnType<typeof makeTransform>
type TypedInput = InferInput<typeof typed>
type TypedOutput = InferOutput<typeof typed>
expectTypeOf<TypedInput>().toEqualTypeOf<string>()
expectTypeOf<TypedOutput>().toEqualTypeOf<number>()
