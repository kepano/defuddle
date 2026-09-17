import { maxHighlightLineLength } from './limits';
import { markdownPunctuationAt } from './markdown-punctuation';

export type CodeLanguage = 'knap' | 'ts' | 'shell' | 'md' | 'json';

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const span = (className: string | undefined, value: string) => className
  ? `<span class="${className}">${escapeHtml(value)}</span>`
  : escapeHtml(value);

function tokenClass(token: string, language: CodeLanguage) {
  if (/^(\{\{|\}\}|\{%|%\})$/.test(token)) return 'syn-language';
  if (/^(===|!==|==|!=|=>|<=|>=|&&|\|\||\?\?|[{}()[\].,:;=+\-*/<>!?|])$/.test(token)) return 'syn-punctuation';
  if (/^['"`]/.test(token)) return 'syn-string';
  if (/^\d/.test(token)) return 'syn-number';
  if (language === 'ts' && /^(import|from)$/.test(token)) return 'syn-import';
  if (/^(true|false|null|undefined)$/.test(token)) return 'syn-constant';
  if (/^(if|elseif|else|endif|for|in|endfor|set|and|or|not|contains)$/.test(token)) return 'syn-keyword';
  if (language === 'ts' && /^(const|let|type|async|await|return|new|throw|export)$/.test(token)) return 'syn-keyword';
  if (/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*$/.test(token)) return 'syn-variable';
  return undefined;
}

function highlightMarkdownInline(value: string) {
  const parts = value.split(/(\[[^\]\n]+\]\([^)\n]+\)|\[\^[^\]\n]+\])/g).filter(Boolean);
  let offset = 0;
  return parts.map((part) => {
    const start = offset;
    offset += part.length;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return `${span('syn-punctuation', '[')}${span('syn-md-link', link[1])}${span('syn-punctuation', '](')}${span('syn-md-link', link[2])}${span('syn-punctuation', ')')}`;
    if (/^\[\^[^\]]+\]$/.test(part)) return span('syn-punctuation', part);
    let highlighted = '';
    for (let index = 0; index < part.length;) {
      const length = markdownPunctuationAt(value, start + index);
      if (length) {
        highlighted += span('syn-punctuation', part.slice(index, index + length));
        index += length;
      } else {
        highlighted += escapeHtml(part[index++]);
      }
    }
    return highlighted;
  }).join('');
}

function highlightMarkdownLine(line: string, inFrontmatter = false) {
  if (/^\s*---\s*$/.test(line)) return span('syn-punctuation', line);

  if (inFrontmatter) {
    const item = line.match(/^(\s*)(-)(\s+)(?:"((?:\\.|[^"\\])*)"|'((?:''|[^'])*)')(\s*)$/);
    if (item) {
      const quote = item[4] !== undefined ? '"' : "'";
      return escapeHtml(item[1]) + span('syn-punctuation', item[2]) + escapeHtml(item[3])
        + span('syn-punctuation', quote) + span('syn-string', item[4] ?? item[5])
        + span('syn-punctuation', quote) + escapeHtml(item[6]);
    }
  }

  const heading = line.match(/^(#{1,6})(\s+)(.*)$/);
  if (heading) return `${span('syn-punctuation', heading[1])}${escapeHtml(heading[2])}<span class="syn-md-heading">${highlightMarkdownInline(heading[3])}</span>`;

  const blockquote = line.match(/^(\s*)(>)(\s?)(.*)$/);
  if (blockquote) return `${escapeHtml(blockquote[1])}${span('syn-punctuation', blockquote[2])}${escapeHtml(blockquote[3])}${highlightMarkdownInline(blockquote[4])}`;

  const footnote = line.match(/^(\[\^[^\]]+\])(:)(\s*)(.*)$/);
  if (footnote) return `${span('syn-punctuation', footnote[1] + footnote[2])}${escapeHtml(footnote[3])}${highlightMarkdownInline(footnote[4])}`;

  const yaml = line.match(/^([A-Za-z][\w-]*)(:)(\s*)(.*)$/);
  if (yaml) {
    const quoted = yaml[4].match(/^(["'])(.*)\1$/);
    let value = span('syn-string', yaml[4]);
    if (quoted) value = `${span('syn-punctuation', quoted[1])}${span('syn-string', quoted[2])}${span('syn-punctuation', quoted[1])}`;
    else if (/^(?:true|false|null|~)$/.test(yaml[4])) value = span('syn-constant', yaml[4]);
    else if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(yaml[4])) value = span('syn-number', yaml[4]);
    return `${span('syn-yaml-key', yaml[1])}${span('syn-punctuation', yaml[2])}${escapeHtml(yaml[3])}${value}`;
  }

  if (/^\s*\|.*\|\s*$/.test(line)) {
    return line.split(/(\||:?-+:?)/g).filter(Boolean).map((part) => span(/^(?:\||:?-+:?)$/.test(part) ? 'syn-punctuation' : undefined, part)).join('');
  }

  return highlightMarkdownInline(line);
}

interface ShellHighlightState {
  expectsCommand: boolean;
  expectsRedirect: boolean;
  expectsPath: boolean;
}

const shellHighlightState = (): ShellHighlightState => ({ expectsCommand: true, expectsRedirect: false, expectsPath: false });

function highlightShellLine(line: string, state = shellHighlightState()) {
  // Keep shell words intact: paths, flags, and URLs are not identifiers.
  const tokens = line.match(/\s+|#.*$|&&|\|\||[|;&<>]+|\\$|(?:\\.|"(?:\\.|[^"\\])*"|'[^']*'|[^\s|;&<>"'\\])+|./g) ?? [];
  let { expectsCommand, expectsRedirect, expectsPath } = state;
  let continued = false;

  const highlighted = tokens.map((token) => {
    if (/^\s+$/.test(token)) return escapeHtml(token);
    if (token.startsWith('#')) return span('syn-comment', token);
    continued = false;
    if (/^[|;&]+$/.test(token)) {
      expectsCommand = true;
      expectsPath = false;
      expectsRedirect = false;
      continued = /^(?:\||\|\||&&)$/.test(token);
      return span('syn-punctuation', token);
    }
    if (/^[<>]+$/.test(token)) {
      expectsRedirect = true;
      return span('syn-punctuation', token);
    }
    if (token === '\\') {
      continued = true;
      return span('syn-punctuation', token);
    }

    const assignment = token.match(/^(?:[A-Za-z_][\w]*|--[\w-]+)=/)?.[0];
    const command = expectsCommand && !expectsRedirect && !expectsPath && !assignment && !token.startsWith('-');
    const path = !command && !assignment && !token.startsWith('-')
      && (expectsPath || expectsRedirect || token.includes('/') || /^\.?[\w-]+(?:\.[\w-]+)+$/.test(token));
    expectsPath = /^(?:--data|--output|--output-dir|-d|-o)$/.test(token);
    if (!assignment && !expectsRedirect && !token.startsWith('-')) expectsCommand = command && token === 'npx';
    expectsRedirect = false;

    const value = assignment ? token.slice(assignment.length) : token;
    return escapeHtml(assignment ?? '') + value.split(/("(?:\\.|[^"\\])*"|'[^']*'|\$\{[^}]+\}|\$[A-Za-z_][\w]*)/g).filter(Boolean).map((part) => {
      if (/^(['"])[\s\S]*\1$/.test(part)) {
        return span('syn-punctuation', part[0]) + span('syn-string', part.slice(1, -1)) + span('syn-punctuation', part.at(-1)!);
      }
      if (part.startsWith('$')) return span('syn-variable', part);
      return span(command ? 'syn-command' : path || assignment ? 'syn-string' : undefined, part);
    }).join('');
  }).join('');
  Object.assign(state, continued ? { expectsCommand, expectsRedirect, expectsPath } : shellHighlightState());
  return highlighted;
}

function highlightTokenLine(line: string, language: Exclude<CodeLanguage, 'md' | 'shell'>, constrainKnapToTags = true) {
  const pattern = /(\{\{|\}\}|\{%|%\}|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|===|!==|==|!=|=>|<=|>=|&&|\|\||\?\?|[{}()[\].,:;=+\-*/<>!?|]|\b(?:if|elseif|else|endif|for|in|endfor|set|and|or|not|contains|true|false|null|undefined|import|from|const|let|type|async|await|return|new|throw|export|pnpm|npm|npx)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*)/g;
  const tokens = line.split(pattern).filter(Boolean);
  let expectsFilter = false;
  let inKnapExpression = false;
  let currentFilter: string | undefined;
  let inFilterArguments = false;

  return tokens.map((token, index) => {
    let className = tokenClass(token, language);

    if (language === 'knap' && constrainKnapToTags) {
      if (/^(\{\{|\{%)$/.test(token)) inKnapExpression = true;
      else if (/^(\}\}|%\})$/.test(token)) inKnapExpression = false;
      else if (!inKnapExpression) className = undefined;
    }

    if (token === '|' && language === 'knap' && inKnapExpression) {
      expectsFilter = true;
      currentFilter = undefined;
      inFilterArguments = false;
    }
    else if (expectsFilter && /^\s+$/.test(token)) { /* keep waiting */ }
    else if (expectsFilter) {
      className = 'syn-filter';
      currentFilter = token;
      expectsFilter = false;
    }

    if (token === ':' && currentFilter) inFilterArguments = true;
    if (language === 'knap' && inKnapExpression && inFilterArguments && currentFilter !== 'map' && className === 'syn-variable') {
      className = 'syn-string';
    }

    if ((language === 'ts' || language === 'json') && className === 'syn-variable') {
      const nextToken = tokens.slice(index + 1).find((candidate) => !/^\s+$/.test(candidate));
      if (nextToken === '(') className = 'syn-function';
    }

    const quoted = className === 'syn-string' ? token.match(/^(['"`])([\s\S]*)\1$/) : null;
    if (quoted) {
      const isJsonKey = language === 'json' && tokens.slice(index + 1).find((candidate) => !/^\s+$/.test(candidate)) === ':';
      return `${span('syn-punctuation', quoted[1])}${span(isJsonKey ? 'syn-variable' : 'syn-string', quoted[2])}${span('syn-punctuation', quoted[1])}`;
    }
    return span(className, token);
  }).join('');
}

export function highlightInlineKnap(value: string) {
  // Inline CLI options are prose references, not Knap expressions.
  if (/^\s*--?[A-Za-z]/.test(value)) return undefined;
  const isKnapSyntax = /(\{\{|\}\}|\{%|%\}|\?\?|\b(?:if|elseif|else|endif|for|in|endfor|set|and|or|not|contains)\b)/.test(value)
    || /(?:==|!=|>=|<=|&&|\|\|)/.test(value)
    || /(?:^|\s)[<>!](?:\s|$)/.test(value)
    || /^loop\.(?:index|index0|first|last|length)$/.test(value)
    || value === 'item_index';
  return isKnapSyntax ? highlightTokenLine(value, 'knap', false) : undefined;
}

function highlightKnapLine(line: string) {
  return line.split(/(\{\{.*?\}\}|\{%.*?%\}|(?:\{\{|\{%).*?$)/g).filter(Boolean).map((segment) =>
    /^(?:\{\{|\{%)/.test(segment)
      ? highlightTokenLine(segment, 'knap')
      : highlightMarkdownLine(segment)
  ).join('');
}

// Identify comments outside quoted strings before applying the token highlighter.
// Processing the whole block keeps multiline comments quiet on every line.
function highlightTypeScript(code: string): string[] {
  const lines = [''];
  const append = (value: string, comment = false) => {
    value.split('\n').forEach((line, index) => {
      if (index) lines.push('');
      lines[lines.length - 1] += comment ? span('syn-comment', line) : highlightTokenLine(line, 'ts');
    });
  };
  let offset = 0;
  const tokens = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/g;
  for (const match of code.matchAll(tokens)) {
    if (!match[0].startsWith('//') && !match[0].startsWith('/*')) continue;
    append(code.slice(offset, match.index));
    append(match[0], true);
    offset = match.index! + match[0].length;
  }
  append(code.slice(offset));
  return lines;
}

export function highlightLine(line: string, language: CodeLanguage, inFrontmatter = false) {
  if (line.length > maxHighlightLineLength) return escapeHtml(line);
  if (language === 'ts') return highlightTypeScript(line)[0];
  if (language === 'shell') return highlightShellLine(line);
  if (language === 'md') return highlightMarkdownLine(line, inFrontmatter);
  if (language === 'knap') return highlightKnapLine(line);
  return highlightTokenLine(line, language);
}

export function highlightLines(lines: string[], language: CodeLanguage) {
  if (language === 'ts') return highlightTypeScript(lines.join('\n'));
  if (language === 'shell') {
    const state = shellHighlightState();
    return lines.map((line) => highlightShellLine(line, state));
  }
  let inFrontmatter = false;
  return lines.map((line, index) => {
    const highlighted = highlightLine(line, language, inFrontmatter);
    if (index === 0 && /^---\s*$/.test(line)) inFrontmatter = true;
    else if (inFrontmatter && /^(?:---|\.\.\.)\s*$/.test(line)) inFrontmatter = false;
    return highlighted;
  });
}

export function highlightCode(code: string, language: CodeLanguage, showLineNumbers = false) {
  const normalized = code.replace(/^\n|\n$/g, '');
  return highlightLines(normalized.split('\n'), language).map((line, index) => `<span class="doc-code-line"><span class="doc-line-number"${showLineNumbers ? '' : ' hidden'}>${index + 1}</span><span class="doc-code-source">${line}</span></span>`).join('');
}
