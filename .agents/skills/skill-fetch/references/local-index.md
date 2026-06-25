# Local Index Query — Implementation Reference

Detailed guidance for scanning locally installed skills and plugins in Step -1.

## Scan Implementation

### 1. Global Skills

Use `Glob` to find all SKILL.md files:
```
Glob("~/.claude/skills/*/SKILL.md")
```

Then `Read` the first 10 lines of each file to extract YAML frontmatter (`name` and `description` fields).

### 2. Local (Project) Skills

```
Glob(".claude/skills/*/SKILL.md")
```

Same extraction as global skills. These are project-scoped skills that travel with the repo.

### 3. Installed Plugins

Use `Read` to load `~/.claude/plugins/installed_plugins.json`. This file has structure:
```json
{
  "version": 2,
  "plugins": {
    "plugin-name@marketplace": [{
      "scope": "user",
      "installPath": "/path/to/installed/plugin",
      "version": "1.0.0",
      "installedAt": "ISO date"
    }]
  }
}
```

For each plugin entry, read its manifest to get the description:
- Primary: `Read("{installPath}/.claude-plugin/plugin.json")`
- Fallback: `Read("{installPath}/plugin.json")`

Extract `name` and `description` from the JSON.

### 4. Plugin Skills (within installed plugins)

For each installed plugin from step 3:
```
Glob("{installPath}/skills/*/SKILL.md")
```

Then `Read` the first 10 lines to extract frontmatter. Tag these matches with `plugin:{plugin-name}` source type.

### 5. Fetch Metadata

Use `Read` to load `~/.claude/skills/.fetch-metadata.json`. This contains previously installed skills with their original query, source, and path:
```json
{
  "skill-name": {
    "source": "skillsmp|github|url",
    "query": "original search terms",
    "scope": "global|local",
    "path": "/actual/install/path/",
    "installedAt": "ISO date"
  }
}
```

Match against both the skill name (key) and the original query.

## Matching Algorithm

1. **Tokenize** the search query into keywords (split by spaces, convert to lowercase)
2. For each candidate skill/plugin:
   - Lowercase the `name` and `description`
   - Check if **any keyword** appears as a substring in name OR description
   - **Score** = count of matching keywords (higher = better match)
3. **Filter**: Only include entries where score >= 1
4. **Sort** by score descending; break ties alphabetically by name
5. **Display** top 5 matches

### Example

Query: `workflow automation`
Keywords: `["workflow", "automation"]`

| Candidate | Name Match | Desc Match | Score |
|-----------|-----------|-----------|-------|
| workflow-automation | workflow, automation | workflow, automation | 4 |
| github-automation | automation | automation | 2 |
| process-optimizer | — | workflow | 1 |
| typescript | — | — | 0 (excluded) |

## Source Type Labels

| Source | Label | Example |
|--------|-------|---------|
| `~/.claude/skills/{name}/` | `global skill` | `global skill` |
| `.claude/skills/{name}/` | `local skill` | `local skill` |
| Plugin's skills directory | `plugin:{plugin-name}` | `plugin:superpowers` |
| `.fetch-metadata.json` entry | `fetch-metadata` | `fetch-metadata` |
| `installed_plugins.json` entry | `plugin` | `plugin` |

## Performance Notes

- The scan should complete in under 5 seconds for typical installations (< 100 skills)
- Use parallel `Read` calls where possible (multiple SKILL.md files can be read simultaneously)
- Skip binary files or files that fail to parse — don't let one bad file block the scan
- Cache nothing — always scan fresh to reflect latest installations
