#!/bin/bash
# SkillHub API search script for skill-fetch
# Reads SKILLHUB_API_KEY from ~/.claude/skills/.fetch-config.json
# Usage: bash fetch-skillhub.sh "search query"

CONFIG="$HOME/.claude/skills/.fetch-config.json"
if [ ! -f "$CONFIG" ]; then
  echo '{"error":"config not found","hint":"Create ~/.claude/skills/.fetch-config.json with SKILLHUB_API_KEY"}'
  exit 1
fi

KEY=$(node -e "const c=require('$CONFIG');console.log(c.SKILLHUB_API_KEY||'')")
if [ -z "$KEY" ]; then
  echo '{"error":"no SKILLHUB_API_KEY in config"}'
  exit 1
fi

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://www.skillhub.club/api/v1/skills/search" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$1\", \"limit\": 5, \"method\": \"hybrid\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 400 ]; then
  echo "{\"error\":\"SkillHub API returned HTTP $HTTP_CODE\"}"
  exit 1
fi

echo "$BODY"
