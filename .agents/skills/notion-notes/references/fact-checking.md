# Fact-Checking Guide

Use cited verification by default.

## Source Priority

1. Official documentation, standards, language docs, package docs, vendor docs, and source repositories.
2. Primary project docs or maintainer-written references.
3. Established technical references from reputable publishers.
4. Secondary explainers only when primary sources are unavailable or unclear.

Avoid relying on blogs, forums, summaries, or model memory for final factual claims when official sources are available.

## Verification Workflow

- Extract factual claims from the rough Notion page: definitions, commands, package behavior, dates, version behavior, protocols, acronyms, and best practices.
- Search or browse for official sources before drafting corrected claims.
- Record a compact citation for each verified cluster of claims.
- If a claim is uncertain and cannot be verified, write "Needs verification" and explain what is missing.
- If a source conflicts with the rough note, prefer the source and phrase the correction plainly.

## Citation Style

Use compact source records in the JSON:

```json
{
  "id": "src-python-pyproject",
  "label": "Python Packaging User Guide",
  "url": "https://packaging.python.org/...",
  "note": "Verifies pyproject.toml build-system and project metadata."
}
```

Inside note sections, reference citation IDs instead of repeating URLs. The HTML builder renders the source list.

## Source Rendering Rules

- Keep `metadata.sourceUrl` blank for private Notion pages and public samples.
- Do not render a visible "Original Notion page" link in the hero or page meta area.
- Use public factual citation records for claims that need support.
- Render private Notion source links nowhere.
- Source notes should explain what the citation verifies, not repeat entire excerpts.

## High-Risk Claims

Always verify:

- Tool behavior and command flags.
- Packaging, dependency, and build-system details.
- Security, secrets, credentials, deployment, and rollback claims.
- Database migrations and schema compatibility.
- Monitoring metrics, Prometheus data types, and alerting behavior.
- Language/runtime behavior such as typing, imports, memory model, or annotations.

## Unverified Claims

Do not hide uncertainty. Use one of these forms:

- "Needs verification: ..."
- "The source notes suggest ..., but no reliable source was confirmed."
- "This appears to be project-specific; verify against the repository before relying on it."
