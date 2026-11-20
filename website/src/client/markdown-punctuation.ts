export function markdownPunctuationAt(line: string, position: number): number {
  if (!/[-+*_=#>`|\d]/.test(line[position] ?? '')) return 0;
  const rest = line.slice(position);
  const before = line.slice(0, position);
  let escapes = 0;
  for (let index = position - 1; index >= 0 && line[index] === '\\'; index--) escapes++;
  if (escapes % 2) return 0;

  if (/^[\t ]*(?:>[\t ]*)*$/.test(before)) {
    const block = rest.match(/^(?:(?:-[\t ]*){3,}|(?:\*[\t ]*){3,}|(?:_[\t ]*){3,}|={3,})$/)
      ?? rest.match(/^(?:#{1,6}(?=\s|$)|[-+*](?=\s)|\d{1,9}[.)](?=\s)|>)/);
    if (block) return block[0].length;
  }

  // Hashtag prefixes, including a tag supplied by a Knap expression.
  // Keep hashes inside words and URL fragments as ordinary text.
  if ((!before || /\s$/.test(before)) && /^#(?=[\p{L}\p{N}_/]|\{\{|$)/u.test(rest)) return 1;

  const inline = rest.match(/^(?:\*{1,3}|_{1,3}|~~|==|`+|\|)/)?.[0];
  if (!inline) return 0;
  // Underscores inside identifiers are plain text, e.g. movie_title.
  if (inline.startsWith('_') && /[\p{L}\p{N}]/u.test(before.slice(-1)) && /^[\p{L}\p{N}]/u.test(rest.slice(inline.length))) return 0;
  return inline.length;
}
