# Conformance results, 6 November 2026

Local Linux x64 validation on Node 24.22.1. Protocol: [CONFORMANCE.md](CONFORMANCE.md). Run `npm run conformance` to retain the complete per-case JSON. Subsequent [CI runs](https://github.com/shelbygrayman/typed-intent/actions) attach raw benchmark evidence as downloadable artifacts. The measurements below describe the first local run, not CI-host timings.

| Check | Passed / total |
| --- | --- |
| Final digests compared with viem | 1,002 / 1,002 |
| Deliberately invalid inputs rejected | 11 / 11 |
| Message, chain and key-order relations | 3 / 3 |
| Inspector and harness regression tests | 13 / 13 |

The valid corpus includes 100 variations in each of ten families plus the existing Mail and Permit fixtures. Repeated boundary values are intentional; the count does not imply 1,002 unique schemas. Harness tests inject wrong digests, comparator exceptions and false acceptance to verify that failures cannot become passes.

Warm inspector median was 0.289–0.311 ms and p95 was 0.547–0.609 ms across three repetitions. viem hash-only median was 0.107–0.114 ms and p95 was 0.206–0.251 ms. These measure different work: the inspector validates, hashes and interprets; the comparator hashes. They are diagnostic measurements on one host, not a product speed ranking. See raw per-case times for dispersion and outliers.

## Remaining gaps

Raw JSON duplicate-key detection, ambiguous numeric tokens, recursive schema policy, adversarial resource limits, additional integer/bytes widths, real public protocol fixtures and browser measurements remain unmeasured here. The canonical Mail digest supplies a standard reference; agreement with viem on synthetic inputs alone is not proof of correctness. No security audit or transaction-safety conclusion follows.

## Portfolio review

All nine existing tool regression suites were run from their current main commits before these changes, with 162 tests passing in total:

| Repository | Tests passed | Evidence reviewed / next gap |
| --- | ---: | --- |
| Typed Intent | 9 | Existing benchmark only varied one Permit schema; this build adds broader shapes. |
| Read Before Sign | 22 | MCP SDK interoperability and ethers comparisons; needs a separately measured briefing corpus and false-positive analysis. |
| Approval Lens | 20 | Deterministic RPC fixtures; needs measured scan workloads and public-network cost/latency separately. |
| Calldata Lens | 16 | Decoder microbenchmark exists; add broader independent ABI encoding comparisons. |
| Loudness Lens | 22 | Standard-inspired signals and ffmpeg comparison; real music and browser codec evaluation remain gaps. |
| EvidenceBench | 15 | Full SciFact lexical evaluation and small semantic subset; broaden semantic evaluation without tuning on test labels. |
| Sourcekeep | 12 | Browser development fixture and external keyword evaluation; independent browser corpus and device matrix remain gaps. |
| RPC Crucible | 28 | Pinned-block differential capture and replay; a broader provider sample is needed for availability claims. |
| EVM Wallet Lens | 18 | Deterministic wallet fixtures and documented historical live checks; no current live latency benchmark established. |

This review reran regression tests, not all historic benchmarks or live network checks. Those distinctions should remain visible in portfolio claims.

## Standard for subsequent builds

Before implementation: identify the problem, existing alternatives, scope, fixed evaluation corpus, baseline and acceptance criteria. Before release: run correctness and relevant workload measurements, retain raw results and failures, record environment and source identities, and document what the evidence cannot establish. Performance-only projects need quality gates; correctness-focused projects need independent references. Passing tests alone is not a benchmark.
