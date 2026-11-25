# LDN Verifiable Market Agent — Concordium Trusted Agents Hackathon

**Project stage: functional read-only verification prototype, wallet registration pending.** The existing LuxeDigitalNest Encode Club team/project is registered. A working demonstration does not establish that LuxeDigitalNest owns a CIS-8004 agent; no on-chain token or transaction has been claimed for our project.

## Live application

[Open the original, public live verifier](https://luxedigitalnest.github.io/ldn-concordium-verifiable-market-agent/)

This is an independent educational agent-trust gate using the real [Concordium Agent Registry Indexer](https://agent-registry-indexer.concordium.com/) and the browser's Web Crypto API. It:

1. Fetches a public agent record on the selected Concordium network, rather than inventing registry status.
2. Checks the record is `Active` with a valid Concordium owner account and HTTPS Agent Card.
3. Checks the indexer's reported synchronization lag and freshness; rejects unknown/stale/offline records.
4. Fetches the actual Agent Card **raw bytes** and computes their SHA-256, requiring an exact match with the indexed on-chain `metadata_hash_hex`.
5. Unlocks an original market-breadth report only if all the checks pass. This report uses a **historical**, genuine ten-coin CoinMarketCap sample recorded **November 20, 2026**, from the separately submitted [LDN CMC Radar](https://github.com/luxedigitalnest/ldn-cmc-market-radar) project. It makes no current price, profitability, verified-identity or trading claims.

**Live positive test on November 21, 2026:** independent third-party TESTNET agent `#1375`, registered with a different owner, returned `Active`; the fetched card's SHA-256 matched the indexer hash; the report unlocked: eight non-stablecoin assets, eight declining, median 24-hour change −3.90% in the old recorded sample.

**Negative live test:** query agent `#999999` → indexer HTTP 404 → **NOT VERIFIED**, report-generation button disabled.

The positive-test agent is **not owned or operated by LuxeDigitalNest**. On-chain registration of the LuxeDigitalNest account has **not** occurred, so this is a registry-verification integration rather than complete issuer registration.

## Source and evidence

- [GitHub Actions run: 21 genuine Node tests passed, 0 failed](https://github.com/luxedigitalnest/ldn-concordium-verifiable-market-agent/actions/runs/44907614636).
- [Canonical trust policy](docs/trust.js), [browser client](docs/app.js), [read-only UI](docs/index.html), [21 negative/positive tests](tests/trust.test.mjs).
- [Actual historical CMC data source](docs/market-sample.json), with observation timestamp and original repo attribution.
- [Original LDN Agent Card pre-registration document](docs/.well-known/agent-card.json) available at [the live .well-known URL](https://luxedigitalnest.github.io/ldn-concordium-verifiable-market-agent/.well-known/agent-card.json). The public URL returned **HTTP 200** and 1,859 bytes. Downloaded SHA-256 on November 21, 2026: `f911bd86c63c42f0acdcd791ed61a2acd22bec1b56a9f8326f70fbd250425cde`.
- **Important:** This is a precursor card with explicit `registrationStatus: unregistered` and **no** Concordium badge or token address. It is **not** an anchored/verified Agent Card until registered with the wallet and on-chain hash.

## Reproduction

Node.js 22+; no API keys, tokens, wallet connection, private data or paid infrastructure:

```bash
git clone https://github.com/luxedigitalnest/ldn-concordium-verifiable-market-agent
cd ldn-concordium-verifiable-market-agent
npm test
```

Public HTTP(S) data sources: `GET https://agent-registry-indexer.concordium.com/status` and `/agents/{token}?network=testnet` plus the exact hosted Agent Card. The UI uses no-wallet, no-payments read-only `fetch`.

## Testnet registration checkpoint — November 25, 2026

The previously linked wallet is now connected to **Testnet** in the official Agent Registry. The authenticated `My Agents` filter reports no deployed agents for the existing account ending in `P3QK6x9i`. The native registration wizard was restored to **Step 4 of 4 — Link Key** using the [Testnet pre-registration card](https://raw.githubusercontent.com/luxedigitalnest/ldn-concordium-verifiable-market-agent/strict-registry-evidence-gate/docs/.well-known/testnet-agent-card-v1.json). The earlier raw-byte check recorded SHA-256 `61990913f0daf5a0fcd9bd8345d197ee875c2f37b1a20f30083cebedeffc89d8`.

**No registration transaction has been signed or confirmed.** The owner must review the actual Testnet invocation, network and fee in the wallet. The previous draft-branch trust and negative-case CI job [45511591169](https://github.com/luxedigitalnest/ldn-concordium-verifiable-market-agent/actions/runs/45511591169) completed successfully. That run is evidence for its own commit, not for subsequent revisions.

After a successful registration, independently verify the actual token, owner, status, metadata URI, raw-byte hash and explorer receipt. Update the token-bound card only using those verified values; do not substitute the historical third-party demonstration agent.

## Historical linked-wallet network mismatch (resolved for Testnet access; registration pending)

The authenticated Agent Registry dashboard showed a **connected Concordium Mainnet** account ending in `xixhX8Cj`. The `My Agents` section had **no agents** on Mainnet. The user is working toward a **free Testnet hackathon proof**, so do NOT sign a transaction on Mainnet as a substitute.

The official browser-wallet documentation says Mainnet and Testnet are **distinct wallet account/identity namespaces** and that the network must be changed under wallet extension **Menu → Network → Testnet**; the website's network selector is disabled while a wallet session is connected. The Mainnet connection did not automatically provide a Testnet account.

The original checklist below remains applicable; steps 1–2 are now verified for the existing Testnet wallet. Registration and its fee are still pending:

1. Open the official [testnet Agent Registry](https://testnet-agent-registry.concordium.com/dashboard) and connect the existing wallet on Testnet; note the new native owner address.
2. Verify `My Agents` shows no existing entry for LDN before minting, to avoid duplicates.
3. Publish a final Agent Card with the actual Testnet owner account and correct CIS-8004 extension generated using official `build_agent_card`. Register it with its exact HTTP-200 hosted raw-byte SHA-256, not the preliminary card hash above if the content changes.
4. Review the registry and wallet's real transaction network, contract, and fee; sign in the **user's wallet UI**. Do not export any secret or claim registration without an actual chain receipt.
5. Verify the resulting token ID / CIS-2 badge, owner, `Active` status, card URI and hash using the official indexer / MCP badge-check. Record Concordium testnet explorer transaction hash.
6. Produce an original ≤3-minute real demo and submit the existing registered Encode Club project with a genuinely working agent badge by **December 9, 2026, 23:59 UTC**. Checkpoint 1 previously stated no submission was needed.
7. Payment / x402 integrations are optional enhancements requiring genuine working code and network receipts, never made-up transaction IDs.

## Safety and limits

The Concordium indexer is a third-party chain-derived trust service, not direct proof validation by a node in this browser. Its reported freshness check is an additional dependency and does not certify the human's identity or the financial accuracy of reports. We do not send transactions or collect wallet keys, credentials, account secrets or passcodes. No prize, grant or judging acceptance is implied.

Original code and documentation released under Apache-2.0. See LICENSE.

## Official references

- [Concordium Agent Registry user guide](https://docs.concordium.com/en/mainnet/how-to/integrations/agent-registry.html)
- [Agent Card technical format](https://docs.concordium.com/en/mainnet/technical-reference/agent-registry/agent-card.html)
- [Concordium badge and two-pass registration](https://docs.concordium.com/en/mainnet/technical-reference/agent-registry/concordium-badge.html)
- [Wallet for Web network selection](https://docs.concordium.com/en/mainnet/docs/browser-wallet/setup-browser-wallet.html)
