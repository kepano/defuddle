import { maxHighlightLineLength } from './limits';
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Tag } from '@lezer/highlight';
import { highlightLine } from './highlight';

interface HighlightRange { from: number; to: number; className: string | null }

export function editorHighlightRanges(line: string, language: 'json' | 'md', frontmatter = false): HighlightRange[] {
  if (line.length > maxHighlightLineLength) return [{ from: 0, to: line.length, className: null }];
  const html = highlightLine(line, language, frontmatter);
  const classes: string[] = [];
  const ranges: HighlightRange[] = [];
  const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
  let offset = 0;
  for (const match of html.matchAll(/<span class="([\w-]+)">|<\/span>|([^<]+)/g)) {
    if (match[1]) classes.push(match[1]);
    else if (match[2]) {
      const text = match[2].replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => entities[entity]);
      ranges.push({ from: offset, to: offset + text.length, className: classes.at(-1) ?? null });
      offset += text.length;
    } else classes.pop();
  }
  return ranges;
}

const tokenTable = Object.fromEntries([
  'syn-language', 'syn-punctuation', 'syn-string', 'syn-number', 'syn-import',
  'syn-constant', 'syn-keyword', 'syn-variable', 'syn-filter', 'syn-function',
  'syn-md-heading', 'syn-yaml-key', 'syn-md-link',
].map((name) => [name, Tag.define()]));

export const editorHighlightStyle = HighlightStyle.define(
  Object.entries(tokenTable).map(([className, tag]) => ({ tag, class: className })),
);

export function editorLanguage(language: 'json' | 'md') {
  return StreamLanguage.define({
    startState: () => ({ firstLine: true, frontmatter: false, ranges: [] as HighlightRange[], index: 0 }),
    blankLine(state) { state.firstLine = false; },
    token(stream, state) {
      if (stream.sol()) {
        state.ranges = editorHighlightRanges(stream.string, language, state.frontmatter);
        state.index = 0;
        if (state.firstLine && /^---\s*$/.test(stream.string)) state.frontmatter = true;
        else if (state.frontmatter && /^(?:---|\.\.\.)\s*$/.test(stream.string)) state.frontmatter = false;
        state.firstLine = false;
      }
      const range = state.ranges[state.index++];
      if (!range) { stream.skipToEnd(); return null; }
      stream.pos = range.to;
      return range.className;
    },
    tokenTable,
  });
}

export const editorHighlighting = (language: 'json' | 'md') => [
  editorLanguage(language), syntaxHighlighting(editorHighlightStyle),
];
