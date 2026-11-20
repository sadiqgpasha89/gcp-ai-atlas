# Known limitations

1. **No Google product fact is verified.** All 73 service records are `needs-verification` with lifecycle `unknown`. Verification was blocked because Google documentation could not be fetched when this was built. Previous-name entries for seven services are not verified.
2. **Labs are local and mock.** They show engineering controls on a synthetic corpus and mock tools. They are not benchmarks and say nothing about Google services' accuracy, latency or cost.
3. **Calculator prices are yours.** It contains no price data, and its output is an estimate. Uncertainty is stated, not quantified.
4. **No accessibility or responsive testing** has been run with tooling or assistive technology. Some accessible markup was added; the result is unmeasured.
5. **No external link check** was run.
6. **Large parts of the plan are not done:** manager cockpit, competency tracking, most tool upgrades, data-engineering playbooks, advanced RAG pattern guides, migration of existing labs and playbooks to common templates. See `implementation-status.md` for each task.
7. **The autonomy levels (L0 to L5) are an Atlas framework**, not a Google standard.
8. The legacy "what each lever would do" table in the calculator still uses the original formula; the scenario model below it is the extended one.
