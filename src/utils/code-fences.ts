// A fence delimiter, after any blockquote markers and list indentation.
const FENCE_LINE = /^(?:[ \t]*>)*[ \t]*(`{3,}|~{3,})(.*)$/;

/** Marks the lines of a Markdown document that belong to fenced code blocks, delimiters included. */
export function fencedLines(lines: string[]): boolean[] {
	let openFence: string | null = null;
	return lines.map(line => {
		const match = line.match(FENCE_LINE);
		if (openFence === null) {
			// A backtick fence's info string can't hold a backtick, so "```a```" is inline code.
			if (match && !(match[1][0] === '`' && match[2].includes('`'))) {
				openFence = match[1];
			}
			return openFence !== null;
		}
		if (match && match[1][0] === openFence[0] && match[1].length >= openFence.length && !match[2].trim()) {
			openFence = null;
		}
		return true;
	});
}

/** Applies a text transform to a Markdown document without changing its fenced code blocks. */
export function transformOutsideCodeFences(markdown: string, transform: (text: string) => string): string {
	const lines = markdown.split('\n');
	const inFence = fencedLines(lines);
	if (!inFence.includes(true)) return transform(markdown);

	let marker = '';
	while (markdown.includes(marker)) marker += '';

	const blocks: string[] = [];
	const outside: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		if (!inFence[i]) {
			outside.push(lines[i]);
			continue;
		}
		const start = i;
		while (i + 1 < lines.length && inFence[i + 1]) i++;
		outside.push(`${marker}${blocks.length}${marker}`);
		blocks.push(lines.slice(start, i + 1).join('\n'));
	}

	const placeholder = new RegExp(`^${marker}(\\d+)${marker}$`);
	return transform(outside.join('\n'))
		.split('\n')
		.map(line => {
			const match = line.match(placeholder);
			return match ? blocks[Number(match[1])] : line;
		})
		.join('\n');
}
