# Security

## Reporting

Do not open public issues with private Notion URLs, credentials, or workspace data. Share the minimum reproducible input needed to diagnose renderer behavior.

## Private Data Policy

Sample notes, generated HTML, docs, screenshots, and packaged archives must not contain private Notion page URLs, workspace links, credentials, API keys, or unpublished source material.

Keep `metadata.sourceUrl` blank for private pages and public sample material. Public citation links belong in citation records and Sources when they verify factual claims.

Before publishing a branch or package, run:

```bash
npm run privacy:scan
```

If the scan finds a private URL or secret-like value, remove it from the source JSON first, regenerate the HTML, and rerun the scan.
