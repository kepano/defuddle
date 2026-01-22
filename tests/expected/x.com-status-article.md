```json
{
  "title": "The Shorthand Guide to Everything Claude Code",
  "author": "cogsec (@affaanmustafa)",
  "site": "",
  "published": ""
}
```

Here's my complete setup after 10 months of daily use: skills, hooks, subagents, MCPs, plugins, and what actually works.

Been an avid Claude Code user since the experimental rollout in Feb, and won the Anthropic x Forum Ventures hackathon with [Zenith](https://zenith.chat) alongside [@DRodriguezFX](https://x.com/@DRodriguezFX) completely using Claude Code.

> cogsec @affaanmustafa
> 
> took the W at the @AnthropicAI x @forumventures hackathon in NYC

## Skills and Commands

Skills operate like rules, constricted to certain scopes and workflows. They're shorthand to prompts when you need to execute a particular workflow.

Run **/refactor-clean** . Need testing? **/tdd**

```
# Example skill structure
~/.claude/skills/
  pmx-guidelines.md
  coding-standards.md
```

![chaining commands together](https://pbs.twimg.com/media/G-0-_fZagAA9Kqk?format=jpg&name=large)

## Hooks

Hooks are trigger-based automations that fire on specific events.