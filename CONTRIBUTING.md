# Contributing

Thanks for improving `effect-json-schema`.

## Local setup

```sh
pnpm install
npm run ci
```

The public verification command is `npm run ci`. It must pass before a pull request is ready.

## Development rules

- Keep the library tiny and Effect-based. Build on `effect/Schema` and `effect/JSONSchema` instead of hand-rolling a JSON Schema emitter.
- Add or update a contract test before changing behavior.
- Preserve the Standard JSON Schema V1 surface: `version`, `vendor`, `types`, `jsonSchema.input`, `jsonSchema.output`, all documented targets, and throw-on-unknown-target behavior.
- Keep files under the repository limits enforced by `npm run check:loc`.
- Do not add generated code, marker comments, or unused scaffolding.

## Pull requests

A useful pull request includes:

1. A short problem statement.
2. The user-facing behavior changed.
3. Tests or smoke checks that fail without the change.
4. The exact local command output for `npm run ci`.

## Releases

Releases are cut from GitHub releases. The publish workflow runs the full CI gate and publishes to npm with provenance.
