import { describe, test, expect } from 'vitest';
import { createMarkdownContent } from '../src/markdown';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

describe('Markdown conversion', () => {
	describe('links with spaces', () => {
		test('should wrap link destinations containing spaces in angle brackets', () => {
			const markdown = createMarkdownContent(
				'<article><p><a href="myapp:open shared page">Open page</a></p></article>',
				'https://example.com'
			);

			expect(markdown).toContain('[Open page](<myapp:open shared page>)');
		});

		test('should keep normal link destinations unchanged', () => {
			const markdown = createMarkdownContent(
				'<article><p><a href="https://example.com/page">Open page</a></p></article>',
				'https://example.com'
			);

			expect(markdown).toContain('[Open page](https://example.com/page)');
		});

		test('should preserve existing parenthesis escaping for normal link destinations', () => {
			const markdown = createMarkdownContent(
				'<article><p><a href="https://example.com/page(1)">Open page</a></p></article>',
				'https://example.com'
			);

			expect(markdown).toContain('[Open page](https://example.com/page\\(1\\))');
		});

		test('should preserve titles on link destinations containing spaces', () => {
			const markdown = createMarkdownContent(
				'<article><p><a href="myapp:open shared page" title="Shared page">Open page</a></p></article>',
				'https://example.com'
			);

			expect(markdown).toContain('[Open page](<myapp:open shared page> "Shared page")');
		});
	});

	describe('exclamation mark before image', () => {
		test('should add space between ! and image syntax', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Yey!<img src="https://example.com/img.png" alt="IMG"></p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			// The ! from "Yey!" should be separated from ![IMG](...) with a space
			expect(result.contentMarkdown).toContain('! ![IMG]');
			expect(result.contentMarkdown).not.toMatch(/!!\[/);
		});

		test('should add space between ! and linked image', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Hello!<a href="https://example.com"><img src="https://example.com/img.png" alt="photo"></a></p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			expect(result.contentMarkdown).toContain('! [![photo]');
			expect(result.contentMarkdown).not.toMatch(/!\[!\[/);
		});

		test('should not affect normal image syntax', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Hello world</p><img src="https://example.com/img.png" alt="photo"></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			// Normal image syntax should remain untouched
			expect(result.contentMarkdown).toContain('![photo](https://example.com/img.png)');
		});

		test('should not add space to ! that is not before image syntax', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Hello! This is great!</p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			expect(result.contentMarkdown).toContain('Hello! This is great!');
		});
	});

	describe('base href resolution', () => {
		test('should resolve relative URLs against base href', async () => {
			const html = `<html><head><title>Test</title><base href="/html/2312.00752v2/"></head><body><article><p>Content</p><img src="x1.png"></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://arxiv.org/html/2312.00752'), 'https://arxiv.org/html/2312.00752', { separateMarkdown: true });

			expect(result.content).toContain('https://arxiv.org/html/2312.00752v2/x1.png');
		});

		test('should fall back to document URL when no base href', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Content</p><img src="x1.png"></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://arxiv.org/html/2312.00752'), 'https://arxiv.org/html/2312.00752', { separateMarkdown: true });

			expect(result.content).toContain('https://arxiv.org/html/x1.png');
		});
	});

	describe('wbr tag handling', () => {
		test('should remove wbr tags without adding spaces', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p>Super<wbr>cali<wbr>fragilistic</p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			expect(result.contentMarkdown).toContain('Supercalifragilistic');
		});

		test('should handle wbr inside links', async () => {
			const html = `<html><head><title>Test</title></head><body><article><p><a href="https://example.com">long<wbr>word</a></p></article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			expect(result.contentMarkdown).toContain('longword');
		});
	});

	describe('ragged table columns', () => {
		test('should preserve trailing columns when body rows are wider than header', async () => {
			const html = `<html><head><title>Test</title></head><body><article>
				<table>
					<tr><th>A</th><th>B</th></tr>
					<tr><td>1</td><td>2</td><td>3</td></tr>
					<tr><td>4</td><td>5</td><td>6</td></tr>
				</table>
			</article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			// The table should expand to 3 columns, padding the header with an empty cell
			expect(result.contentMarkdown).toContain('| A | B |  |');
			expect(result.contentMarkdown).toContain('| --- | --- | --- |');
			expect(result.contentMarkdown).toContain('| 1 | 2 | 3 |');
			expect(result.contentMarkdown).toContain('| 4 | 5 | 6 |');
		});

		test('should pad short rows when header is wider than body', async () => {
			const html = `<html><head><title>Test</title></head><body><article>
				<table>
					<tr><th>A</th><th>B</th><th>C</th></tr>
					<tr><td>1</td><td>2</td></tr>
					<tr><td>3</td></tr>
				</table>
			</article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			// Short rows should be padded with empty cells
			expect(result.contentMarkdown).toContain('| A | B | C |');
			expect(result.contentMarkdown).toContain('| --- | --- | --- |');
			expect(result.contentMarkdown).toContain('| 1 | 2 |  |');
			expect(result.contentMarkdown).toContain('| 3 |  |  |');
		});

		test('should handle tables starting with an empty or narrow row', async () => {
			const html = `<html><head><title>Test</title></head><body><article>
				<table>
					<tr><th></th></tr>
					<tr><td>1</td><td>2</td></tr>
				</table>
			</article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			// The first row should be padded to match the widest row
			expect(result.contentMarkdown).toContain('|  |  |');
			expect(result.contentMarkdown).toContain('| --- | --- |');
			expect(result.contentMarkdown).toContain('| 1 | 2 |');
		});

		test('should not miscount columns when cells contain escaped pipes', async () => {
			// The escaped pipe must live in the header row: the old separator
			// count came from splitting the rendered first row on '|', so only a
			// pipe there triggers the miscount.
			const html = `<html><head><title>Test</title></head><body><article>
				<table>
					<tr><th>A | B</th><th>Example</th></tr>
					<tr><td>OR</td><td>value</td></tr>
				</table>
			</article></body></html>`;
			const result = await Defuddle(parseDocument(html, 'https://example.com'), 'https://example.com', { separateMarkdown: true });

			// The pipe inside "A | B" should be escaped, and the table should have exactly 2 columns
			expect(result.contentMarkdown).toContain('| --- | --- |');
			expect(result.contentMarkdown).toContain('A \\| B');
			// Should NOT have 3 or more separator columns
			expect(result.contentMarkdown).not.toContain('| --- | --- | --- |');
		});
	});

	describe('math conversion', () => {
		test('should prefer MathML over degraded data-latex', () => {
			const markdown = createMarkdownContent(`
				<p>
					Test
					<math data-latex="fan-outfan-in">
						<mrow>
							<msqrt><mi>x</mi></msqrt>
							<mo>&#x2190;</mo>
							<mi>y</mi>
						</mrow>
					</math>
				</p>
			`, 'https://example.com');

			expect(markdown).toContain('\\sqrt');
			expect(markdown).toContain('\\leftarrow');
			expect(markdown).not.toContain('fan-outfan-in');
		});

		test('should prefer complex MathML over rendered text data-latex', () => {
			const markdown = createMarkdownContent(`
				<p>
					<math display="inline" data-latex="rt(θ)=πθ(at|st)πθold(at|st)">
						<mrow>
							<msub><mi>r</mi><mi>t</mi></msub>
							<mo stretchy="false">(</mo><mi>θ</mi><mo stretchy="false">)</mo>
							<mo>=</mo>
							<mfrac>
								<mrow>
									<msub><mi>π</mi><mrow><mi>θ</mi></mrow></msub>
									<mo stretchy="false">(</mo>
									<msub><mi>a</mi><mi>t</mi></msub>
									<mo stretchy="false">|</mo>
									<msub><mi>s</mi><mi>t</mi></msub>
									<mo stretchy="false">)</mo>
								</mrow>
								<mrow>
									<msub>
										<mi>π</mi>
										<mrow><msub><mi>θ</mi><mrow><mtext>old</mtext></mrow></msub></mrow>
									</msub>
									<mo stretchy="false">(</mo>
									<msub><mi>a</mi><mi>t</mi></msub>
									<mo stretchy="false">|</mo>
									<msub><mi>s</mi><mi>t</mi></msub>
									<mo stretchy="false">)</mo>
								</mrow>
							</mfrac>
						</mrow>
					</math>
				</p>
			`, 'https://example.com');

			expect(markdown).toContain('$$');
			expect(markdown).toContain('\\frac');
			expect(markdown).toContain('r_{t}');
			expect(markdown).toContain('\\pi_{\\theta}');
			expect(markdown).toContain('\\theta_{\\text{old}}');
			expect(markdown).not.toContain('rt(θ)=πθ(at|st)πθold(at|st)');
		});

		test('should wrap block aligned MathML in an aligned environment', () => {
			const markdown = createMarkdownContent(`
				<p>
					<math display="block">
						<mtable>
							<mtr>
								<mtd><mi>a</mi></mtd>
								<mtd><mo>=</mo></mtd>
								<mtd><mi>b</mi></mtd>
							</mtr>
							<mtr>
								<mtd><mi>c</mi></mtd>
								<mtd><mo>=</mo></mtd>
								<mtd><mi>d</mi></mtd>
							</mtr>
						</mtable>
					</math>
				</p>
			`, 'https://example.com');

			expect(markdown).toContain('$$');
			expect(markdown).toContain('\\begin{aligned}');
			expect(markdown).toContain('&');
			expect(markdown).toContain('\\\\');
			expect(markdown).toContain('\\end{aligned}');
		});

		test('should treat paragraph-only inline math as block math', () => {
			const markdown = createMarkdownContent(`
				<p><math display="inline" data-latex="x^2">x2</math></p>
			`, 'https://example.com');

			expect(markdown.trim()).toBe('$$\nx^2\n$$');
		});

		test('should preserve valid inline data-latex without MathML', () => {
			const markdown = createMarkdownContent(`
				<p>Value <math data-latex="x^2">x2</math> now.</p>
			`, 'https://example.com');

			expect(markdown).toContain('Value $x^2$ now.');
		});

		test('should not double-wrap existing LaTeX environments', () => {
			const latex = '\\begin{align*}a&=b\\\\c&=d\\end{align*}';
			const markdown = createMarkdownContent(`
				<p><math data-latex="${latex}">${latex}</math></p>
			`, 'https://example.com');

			expect(markdown).toContain('\\begin{align*}');
			expect(markdown).toContain('\\end{align*}');
			expect(markdown).not.toContain('\\begin{aligned}');
		});
	});
});
