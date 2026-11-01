# Typed Intent

**Inspect what an EIP-712 message actually commits to.** Typed Intent is a small offline Node CLI for structured wallet-signature requests. It calculates the domain hash, message hash, and final digest, and explains the fields of a request with the exact ERC-2612 Permit shape.

This complements [Calldata Lens](https://github.com/shelbygrayman/calldata-lens): calldata is submitted to a contract, while EIP-712 describes structured data to be signed. No wallet connection, private key, signing, RPC endpoint, telemetry, or network is used when inspecting a file.

## Quick start

Requires Node 20+ and npm. Dependency installation uses the network; inspection itself is offline.

```sh
npm ci
node cli.mjs fixtures/mail.json
node cli.mjs fixtures/permit.json
npm test
node benchmark.mjs my-benchmark.json
```

Input is a JSON object with exactly `types`, `primaryType`, `domain` and `message`. The `types` may include a canonical `EIP712Domain` declaration. Unknown fields, mismatched domain declarations, duplicate type fields, unsafe JavaScript numeric values and unsupported domain fields are rejected. Use decimal strings for large integers. The CLI accepts at most 1 MB of UTF-8 JSON.

## Evidence

- The official EIP-712 Mail example produces digest `0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2`, with independently specified domain and message hashes.
- Tests compare nested structs, arrays and an ERC-2612-shaped request with [viem](https://viem.sh/), an independently implemented typed-data encoder. Ethers is the runtime encoder; viem is a development-only comparison dependency.
- The [recorded benchmark](benchmark-results.json) checked 1,000 synthetic variations of one Permit schema against viem: 1,000 digests matched. It records warm timing and hardware. This is not broad protocol coverage or a security audit.

## Boundaries

This is an early developer tool, **not a transaction simulator, phishing detector, contract verifier, signature verifier or safety verdict**. A domain is a claim provided in the input: the tool does not prove the contract or chain is authentic. Unknown message types are left unclassified. An ERC-2612-shaped struct may be used by a nonstandard or malicious contract; the shape does not establish behavior. The permit deadline controls submission of a signature and does not necessarily expire the allowance it creates. Token amounts are raw integers; the tool does not guess token decimals or prices.

JSON parsing uses JavaScript's `JSON.parse`, which accepts duplicate object keys and keeps the last one. Inspect the original request and avoid ambiguous JSON; duplicate-key detection is not implemented. Input can contain sensitive details: use only information you are comfortable processing, and review output before sharing. Displayed data and hashes do not prove authorship or intent.

## Standards and prior art

- [EIP-712](https://eips.ethereum.org/EIPS/eip-712), [ERC-2612](https://eips.ethereum.org/EIPS/eip-2612), and the [official Mail test vector](https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.sol).
- [ethers TypedDataEncoder](https://docs.ethers.org/v6/api/hashing/), used for cryptographic encoding.
- [Cyfrin clearsig](https://github.com/Cyfrin/clearsig) is an existing, broader clear-signing project. Typed Intent is a small independent inspector and does not claim feature parity or superiority.

MIT. Third-party dependencies retain their own licences.
