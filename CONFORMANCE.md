# Typed Intent conformance benchmark

Protocol fixed before the first run, 6 November 2026.

## Research and purpose

The existing benchmark varies 1,000 values of one Permit schema. It does not establish coverage of EIP-712's type system. This build adds a reproducible differential harness to the existing inspector rather than another decoder product.

Primary references:

- https://eips.ethereum.org/EIPS/eip-712 — encoding, arrays, structs, domain separation, official Mail vector.
- https://docs.ethers.org/v6/api/hashing/ — runtime encoder; not an independent comparator.
- https://viem.sh/docs/utilities/hashTypedData — independent final-digest comparison.
- https://github.com/Cyfrin/clearsig — existing broader clear-signing tooling; no novelty or superiority claim over it.
- https://www.rfc-editor.org/rfc/rfc8259 — duplicate JSON names are an interoperability concern. Raw JSON parsing remains outside this object-level harness.

## Fixed corpus

100 deterministic variations in each of ten families: unsigned boundaries, signed boundaries, booleans, Unicode strings, dynamic bytes, fixed bytes, dynamic arrays, fixed arrays, nested structs, nested arrays. Add the official Mail vector and existing Permit fixture. All inputs are synthetic or the attributed standard example. No private signing requests.

Also run independently specified invalid inputs: extra/missing fields, wrong primary type, unsafe numbers, invalid addresses, integer overflow, negative unsigned values, wrong fixed-array length, unsupported domain fields, and inconsistent domain declarations. These are inspector policy checks, not a claim that viem must reject identical inputs.

Metamorphic checks change a declared field, domain chainId, and object key order. Changed signed values must change digests; reordered object keys must preserve them.

## Measurements and gates

- Every valid case must produce exactly the same final digest as viem. The official Mail case must additionally match the published digest.
- Every invalid case must be rejected by the inspector.
- Every metamorphic relation must hold.
- Preserve every row, including errors and mismatches. Write the report before returning a failing exit code. Existing output files must not be overwritten.
- Report each implementation's warm p50/p95 independently after 100 warmups, with 3 timed repetitions per case and alternating implementation order. No speed gate or superiority claim: the inspector performs additional validation and interpretation.
- Record Node, OS, CPU, dependency versions, Git HEAD, dirty status, source hashes, corpus hash and full inputs. Report timing dispersion across repeats.

## Reproduce

```sh
npm ci --ignore-scripts
npm test
node conformance.mjs conformance-results.json
```

This is synthetic differential evidence, not an audit, browser benchmark, proof of safety, or exhaustive EIP-712 compliance. Agreement can miss shared bugs. No live chain, signing, wallet interaction, or browser performance is measured. Unsupported recursive schemas and resource exhaustion need separate evaluation. A correctness failure blocks claims of a successful build; timings never excuse it.
