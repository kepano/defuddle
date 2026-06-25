#!/bin/bash
# Skills Directory API search script for skill-fetch
# Reads SKILLS_DIRECTORY_API_KEY from ~/.claude/skills/.fetch-config.json
# Usage: bash fetch-skills-directory.sh "search query with spaces"

CONFIG="$HOME/.claude/skills/.fetch-config.json"
if [ ! -f "$CONFIG" ]; then
  echo '{"data":[],"error":"config not found","hint":"Create ~/.claude/skills/.fetch-config.json with SKILLS_DIRECTORY_API_KEY"}'
  exit 1
fi

KEY=$(node -e "const c=require('$CONFIG');console.log(c.SKILLS_DIRECTORY_API_KEY||'')")
if [ -z "$KEY" ]; then
  echo '{"data":[],"error":"no SKILLS_DIRECTORY_API_KEY in config"}'
  exit 1
fi

# URL-encode query (try node first, fallback to python3)
ENCODED_QUERY=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$1" 2>/dev/null)
if [ -z "$ENCODED_QUERY" ]; then
  ENCODED_QUERY=$(printf '%s' "$1" | python3 -c "import sys,urllib.parse;print(urllib.parse.quote(sys.stdin.read().strip()))" 2>/dev/null)
fi
if [ -z "$ENCODED_QUERY" ]; then
  # Last resort: replace spaces with +
  ENCODED_QUERY=$(printf '%s' "$1" | tr ' ' '+')
fi

RESPONSE=$(curl -s -w "\n%{http_code}" "https://www.skillsdirectory.com/api/v1/skills?q=${ENCODED_QUERY}&limit=5&securityGrade=A" \
  -H "x-api-key: $KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 400 ]; then
  echo "{\"data\":[],\"error\":\"Skills Directory API returned HTTP $HTTP_CODE\"}"
  exit 1
fi

echo "$BODY"
