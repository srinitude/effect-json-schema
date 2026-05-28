# Security Policy

## Supported versions

Security fixes are accepted for the latest released minor version.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability. Use GitHub's private vulnerability reporting for `srinitude/effect-json-schema` when available, or email the repository owner through the contact information on the GitHub profile.

Include:

- A description of the issue and impact.
- A minimal reproduction.
- Affected versions.
- Any known workarounds.

The maintainer will acknowledge valid reports, investigate, and coordinate a fix and release before public disclosure when appropriate.

## Supply chain posture

- CI runs package smoke tests against the packed tarball.
- npm publishing uses provenance from GitHub Actions.
- Dependency and GitHub Actions updates are tracked by Dependabot.
- OpenSSF Scorecard runs on a schedule and on demand.
