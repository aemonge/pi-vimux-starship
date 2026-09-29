# cockpit-telemetry

Test-only RED contracts for the cockpit telemetry sink. The production module
(`index.ts`, `src/sink.ts`) does not exist yet by design: every contract in
this suite must fail for its discriminating expected reason (missing
production module) before the GREEN Step lands the minimum sink.
