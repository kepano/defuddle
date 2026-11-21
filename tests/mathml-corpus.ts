import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseLinkedomHTML } from '../src/utils/linkedom-compat';

export interface MathMLCase {
	id: string;
	category: string;
	html: string;
	/** When set, documents an intentional difference where our converter improves on mathml-to-latex 1.8.0. */
	expectedDiff?: {
		ours: string;
		theirs: string;
		reason: string;
	};
	/** When true, both converters are expected to throw InvalidNumberOfChildrenError. */
	expectThrow?: boolean;
}

const FIXTURES_DIR = join(__dirname, 'fixtures');

/** Extract every `<math>` element from all HTML fixtures in `tests/fixtures/`. */
export function getFixtureMathMLCases(): MathMLCase[] {
	const cases: MathMLCase[] = [];
	const files = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.html')).sort();
	for (const file of files) {
		const html = readFileSync(join(FIXTURES_DIR, file), 'utf8');
		if (!html.includes('<math')) continue;
		const doc = parseLinkedomHTML(html);
		const maths = Array.from(doc.querySelectorAll('math'));
		maths.forEach((m, i) => {
			cases.push({
				id: `fixture:${file}[${i}]`,
				category: 'fixture',
				html: m.outerHTML,
			});
		});
	}
	return cases;
}

export function getGeneratedMathMLCases(): MathMLCase[] {
	const cases: MathMLCase[] = [];
	const add = (
		id: string,
		category: string,
		html: string,
		extra?: Pick<MathMLCase, 'expectedDiff' | 'expectThrow'>
	) => {
		cases.push({ id, category, html, ...extra });
	};

	// --- Basic tokens: mi, mo, mn, mtext, mspace ---
	add('mi:plain', 'tokens', '<math><mi>x</mi></math>');
	add('mi:multi-char', 'tokens', '<math><mi>sin</mi><mo>(</mo><mi>x</mi><mo>)</mo></math>');
	add('mi:space-only', 'tokens', '<math><mi> </mi></math>');
	add('mi:nbsp', 'tokens', '<math><mi>&#xA0;</mi></math>');
	add('mi:whitespace-trim', 'tokens', '<math><mi>  x  </mi><mo> + </mo><mn> 42 </mn></math>');
	add('mi:prototype-keys', 'tokens', '<math><mi>constructor</mi><mo>toString</mo><mn>__proto__</mn></math>');
	add('mn:decimal', 'tokens', '<math><mn>3.14159</mn></math>');
	add('mn:sub-sup-digits', 'tokens', '<math><mn>₀</mn><mn>₅</mn><mn>₉</mn><mn>⁰</mn><mn>¹</mn><mn>²</mn><mn>³</mn><mn>⁴</mn><mn>⁹</mn><mn>ⁿ</mn><mn>ₙ</mn></math>');
	add('mn:circled', 'tokens', '<math><mn>⓪</mn><mn>①</mn><mn>⑩</mn><mn>⑳</mn><mn>㉑</mn><mn>㉟</mn><mn>㊱</mn><mn>㊿</mn></math>');
	add('mn:vulgar-fractions', 'tokens', '<math><mn>½</mn><mn>⅓</mn><mn>⅔</mn><mn>¼</mn><mn>¾</mn><mn>⅕</mn><mn>⅙</mn><mn>⅐</mn><mn>⅛</mn><mn>⅑</mn><mn>⅒</mn></math>');

	// All mi mathvariant values
	const miVariants = [
		'normal', 'bold', 'italic', 'bold-italic', 'double-struck', 'bold-fraktur',
		'script', 'bold-script', 'fraktur', 'sans-serif', 'bold-sans-serif',
		'sans-serif-italic', 'sans-serif-bold-italic', 'monospace', 'unknown-variant'
	];
	for (const v of miVariants) {
		add(`mi:mathvariant:${v}`, 'mathvariant', `<math><mi mathvariant="${v}">x</mi></math>`);
	}
	add('mi:mathvariant-with-unicode-bb', 'mathvariant', '<math><mi mathvariant="bold">ℝ</mi></math>');

	// All mtext mathvariant values + mixed punctuation/symbols/nbsp
	const mtextVariants = ['normal', 'bold', 'italic', 'bold-italic', 'double-struck', 'monospace', 'fraktur', 'bold-fraktur', 'sans-serif'];
	for (const v of mtextVariants) {
		add(`mtext:mathvariant:${v}`, 'mtext', `<math><mtext mathvariant="${v}">Hello 123</mtext></math>`);
	}
	add('mtext:mixed-symbols', 'mtext', '<math><mtext>a, b. (c) α + 1</mtext></math>');
	add('mtext:nbsp', 'mtext', '<math><mtext>the&#xA0;number&#xA0;of&#xA0;items</mtext></math>');
	add('mtext:empty', 'mtext', '<math><mtext></mtext></math>');

	// mspace
	add('mspace:default', 'mspace', '<math><mi>a</mi><mspace width="2em"/><mi>b</mi></math>');
	add('mspace:newline', 'mspace', '<math><mi>a</mi><mspace linebreak="newline"/><mi>b</mi></math>');
	add('mspace:auto', 'mspace', '<math><mi>a</mi><mspace linebreak="auto"/><mi>b</mi></math>');

	// --- Fractions (mfrac) ---
	add('mfrac:basic', 'mfrac', '<math><mfrac><mi>a</mi><mi>b</mi></mfrac></math>');
	add('mfrac:nested', 'mfrac', '<math><mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo><mfrac><mn>1</mn><mi>x</mi></mfrac></mrow></mfrac></math>');
	add('mfrac:bevelled-single', 'mfrac', '<math><mfrac bevelled="true"><mi>a</mi><mi>b</mi></mfrac></math>');
	add('mfrac:bevelled-multi', 'mfrac', '<math><mfrac bevelled="true"><mrow><mi>a</mi><mo>+</mo><mn>1</mn></mrow><mrow><mi>b</mi><mo>-</mo><mn>2</mn></mrow></mfrac></math>');
	add('mfrac:bevelled-false', 'mfrac', '<math><mfrac bevelled="false"><mi>a</mi><mi>b</mi></mfrac></math>', {
		expectedDiff: {
			ours: '\\frac{a}{b}',
			theirs: 'a/b',
			reason: 'MathML bevelled="false" requests a standard horizontal fraction bar; mathml-to-latex checks truthiness of the string "false".',
		},
	});
	const thicknesses = ['0', '0pt', '0px', 'medium', 'thin', 'thick', '1', '2', '0.5', '2pt', '3px', '50%', '150%', '0.2em', '1mm', '1.5ex', 'bogus', '2foo'];
	for (const lt of thicknesses) {
		add(`mfrac:linethickness:${lt}`, 'mfrac', `<math><mfrac linethickness="${lt}"><mi>n</mi><mi>k</mi></mfrac></math>`);
	}
	add('mfrac:binomial', 'mfrac', '<math><mo>(</mo><mfrac linethickness="0"><mi>n</mi><mi>k</mi></mfrac><mo>)</mo></math>');

	// --- Roots (msqrt, mroot) ---
	add('msqrt:single', 'roots', '<math><msqrt><mn>2</mn></msqrt></math>');
	add('msqrt:multi', 'roots', '<math><msqrt><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup></msqrt></math>');
	add('msqrt:empty', 'roots', '<math><msqrt></msqrt></math>');
	add('mroot:cube', 'roots', '<math><mroot><mn>8</mn><mn>3</mn></mroot></math>');
	add('mroot:complex', 'roots', '<math><mroot><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mi>n</mi></mroot></math>');

	// --- Scripts (msub, msup, msubsup, mmultiscripts) ---
	add('msub:simple', 'scripts', '<math><msub><mi>x</mi><mn>1</mn></msub></math>');
	add('msub:mrow-single', 'scripts', '<math><msub><mrow><mi>x</mi></mrow><mn>1</mn></msub></math>');
	add('msub:mrow-multi', 'scripts', '<math><msub><mrow><mi>x</mi><mo>+</mo><mi>y</mi></mrow><mi>i</mi></msub></math>');
	add('msup:simple', 'scripts', '<math><msup><mi>x</mi><mn>2</mn></msup></math>');
	add('msup:mrow-multi', 'scripts', '<math><msup><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mi>n</mi></msup></math>');
	add('msup:nested', 'scripts', '<math><msup><mi>e</mi><msup><mi>x</mi><mn>2</mn></msup></msup></math>');
	add('msubsup:simple', 'scripts', '<math><msubsup><mi>x</mi><mi>i</mi><mn>2</mn></msubsup></math>');
	add('msubsup:integral', 'scripts', '<math><msubsup><mo>∫</mo><mn>0</mn><mo>∞</mo></msubsup><msup><mi>e</mi><mrow><mo>-</mo><mi>x</mi></mrow></msup><mi>d</mi><mi>x</mi></math>');
	add('msubsup:mrow-multi', 'scripts', '<math><msubsup><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mn>0</mn><mn>1</mn></msubsup></math>');
	add('mmultiscripts:prescripts', 'scripts', '<math><mmultiscripts><mi>X</mi><mprescripts/><mn>1</mn><mn>2</mn></mmultiscripts></math>');
	add('mmultiscripts:post-and-pre', 'scripts', '<math><mmultiscripts><mi>F</mi><mn>1</mn><mn>2</mn><mprescripts/><mn>3</mn><none/></mmultiscripts></math>');
	add('mmultiscripts:multi-pairs', 'scripts', '<math><mmultiscripts><mi>F</mi><mn>1</mn><mn>2</mn><mn>3</mn><mn>4</mn></mmultiscripts></math>');
	add('mmultiscripts:none-pair', 'scripts', '<math><mmultiscripts><mi>R</mi><none/><mi>i</mi><mi>j</mi><none/><none/><none/></mmultiscripts></math>');
	add('mmultiscripts:empty-base', 'scripts', '<math><mmultiscripts><mrow></mrow><mi>a</mi><mi>b</mi></mmultiscripts></math>');
	add('mmultiscripts:multi-char-base', 'scripts', '<math><mmultiscripts><mrow><mi>A</mi><mo>+</mo><mi>B</mi></mrow><mn>1</mn><mn>2</mn></mmultiscripts></math>');
	add('mmultiscripts:odd-trailing', 'scripts', '<math><mmultiscripts><mi>X</mi><mn>1</mn></mmultiscripts></math>');

	// --- Accents and limits (munder, mover, munderover) ---
	add('mover:hat-caret', 'accents', '<math><mover><mi>x</mi><mo>^</mo></mover></math>');
	add('mover:hat-modifier', 'accents', '<math><mover><mi>x</mi><mo>ˆ</mo></mover></math>');
	add('mover:hat-combining', 'accents', '<math><mover><mi>x</mi><mo>&#x302;</mo></mover></math>', {
		expectedDiff: {
			ours: '\\hat{x}',
			theirs: '\\overset{̂}{x}',
			reason: 'U+0302 combining circumflex was only in mathml-to-latex ByChar (&#x302;), never decoded in ByGlyph; ours emits \\hat{x}.',
		},
	});
	add('mover:bar-macron', 'accents', '<math><mover><mi>x</mi><mo>¯</mo></mover></math>');
	add('mover:overline-u203e', 'accents', '<math><mover><mi>x</mi><mo>‾</mo></mover></math>', {
		expectedDiff: {
			ours: '\\overline{x}',
			theirs: '\\overset{\\overline}{x}',
			reason: '\\overset{\\overline}{x} fails in KaTeX/MathJax/Temml because \\overline requires an argument; ours emits valid \\overline{x}.',
		},
	});
	add('mover:overbrace', 'accents', '<math><mover><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo>⏞</mo></mover></math>');
	add('mover:tilde', 'accents', '<math><mover><mi>x</mi><mo>~</mo></mover></math>');
	add('mover:arrow', 'accents', '<math><mover><mi>v</mi><mo>→</mo></mover></math>');
	add('munder:underbrace', 'accents', '<math><munder><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mo>⏟</mo></munder></math>');
	add('munder:underline', 'accents', '<math><munder><mi>x</mi><mo>_</mo></munder></math>', {
		expectedDiff: {
			ours: '\\underline{x}',
			theirs: '\\underset{\\underline}{x}',
			reason: '\\underset{\\underline}{x} fails in KaTeX/MathJax/Temml because \\underline requires an argument; ours emits valid \\underline{x}.',
		},
	});
	add('munder:lim', 'accents', '<math><munder><mo>lim</mo><mrow><mi>x</mi><mo>→</mo><mn>0</mn></mrow></munder><mfrac><mrow><mi>sin</mi><mi>x</mi></mrow><mi>x</mi></mfrac></math>');
	add('munder:plus', 'accents', '<math><munder><mi>x</mi><mo>+</mo></munder></math>');
	add('munderover:sum', 'accents', '<math><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><msub><mi>a</mi><mi>i</mi></msub></math>');
	add('munderover:prod', 'accents', '<math><munderover><mo>∏</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mo>∞</mo></munderover><msub><mi>p</mi><mi>k</mi></msub></math>');
	add('munderover:int', 'accents', '<math><munderover><mo>∫</mo><mi>a</mi><mi>b</mi></munderover><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo></math>');

	// --- Fences (mfenced and FenceNormalizer) ---
	add('mfenced:default', 'fences', '<math><mfenced><mi>a</mi><mi>b</mi></mfenced></math>');
	add('mfenced:open-close', 'fences', '<math><mfenced open="[" close="]"><mi>a</mi><mi>b</mi><mi>c</mi></mfenced></math>');
	add('mfenced:braces', 'fences', '<math><mfenced open="{" close="}"><mi>x</mi><mi>y</mi></mfenced></math>');
	add('mfenced:empty-separators', 'fences', '<math><mfenced open="(" close=")" separators=""><mi>a</mi><mi>b</mi></mfenced></math>');
	add('mfenced:multi-separators', 'fences', '<math><mfenced open="(" close=")" separators=",;"><mi>a</mi><mi>b</mi><mi>c</mi><mi>d</mi></mfenced></math>');
	add('mfenced:asymmetric', 'fences', '<math><mfenced open="[" close=")"><mn>0</mn><mn>1</mn></mfenced></math>');
	add('mfenced:bars', 'fences', '<math><mfenced open="|" close="|"><mi>x</mi></mfenced></math>');
	add('mfenced:double-bars-ascii', 'fences', '<math><mfenced open="||" close="||"><mi>x</mi></mfenced></math>');
	add('mfenced:double-bars-u2016', 'fences', '<math><mfenced open="‖" close="‖"><mi>x</mi></mfenced></math>');
	add('mfenced:double-bars-u2225', 'fences', '<math><mfenced open="∥" close="∥"><mi>x</mi></mfenced></math>');
	add('mfenced:empty', 'fences', '<math><mfenced></mfenced></math>');
	add('fence-norm:parens', 'fences', '<math><mo>(</mo><mi>a</mi><mo>+</mo><mi>b</mi><mo>)</mo></math>');
	add('fence-norm:nested', 'fences', '<math><mo>[</mo><mi>a</mi><mo>+</mo><mo>(</mo><mi>b</mi><mo>+</mo><mi>c</mi><mo>)</mo><mo>]</mo></math>');
	add('fence-norm:asymmetric', 'fences', '<math><mo>[</mo><mn>0</mn><mo>,</mo><mn>1</mn><mo>)</mo></math>');
	add('fence-norm:empty-pair', 'fences', '<math><mo>(</mo><mo>)</mo></math>');
	add('fence-norm:abs', 'fences', '<math><mo>|</mo><mi>x</mi><mo>-</mo><mi>y</mi><mo>|</mo></math>');
	add('fence-norm:norm-u2225', 'fences', '<math><mo>∥</mo><mi>v</mi><mo>∥</mo></math>');
	add('fence-norm:scripted-norm-msubsup', 'fences', '<math><mo>∥</mo><mi>P</mi><msubsup><mrow><mo>∥</mo></mrow><mi>F</mi><mn>2</mn></msubsup></math>');
	add('fence-norm:scripted-norm-msup', 'fences', '<math><mo>‖</mo><mi>x</mi><mo>-</mo><mi>y</mi><msup><mo>‖</mo><mn>2</mn></msup></math>');
	add('fence-norm:unmatched-opener', 'fences', '<math><mo>(</mo><mi>x</mi><mo>+</mo><mn>1</mn></math>');
	add('fence-norm:unmatched-closer', 'fences', '<math><mi>x</mi><mo>)</mo></math>');
	add('fence-norm:unmatched-bar', 'fences', '<math><mi>P</mi><mo>(</mo><mi>A</mi><mo>|</mo><mi>B</mi><mo>)</mo></math>');
	add('fence-norm:two-norms', 'fences', '<math><mo>∥</mo><mi>x</mi><msup><mo>∥</mo><mn>2</mn></msup><mo>+</mo><mo>∥</mo><mi>y</mi><msup><mo>∥</mo><mn>2</mn></msup></math>');

	// --- Tables & matrices (mtable, mtr, mtd, cases) ---
	const table2x2 = '<mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr></mtable>';
	add('mtable:bare', 'tables', `<math>${table2x2}</math>`);
	add('mtable:pmatrix-mo', 'tables', `<math><mo>(</mo>${table2x2}<mo>)</mo></math>`);
	add('mtable:bmatrix-mo', 'tables', `<math><mo>[</mo>${table2x2}<mo>]</mo></math>`);
	add('mtable:Bmatrix-mo', 'tables', `<math><mo>{</mo>${table2x2}<mo>}</mo></math>`);
	add('mtable:vmatrix-mo', 'tables', `<math><mo>|</mo>${table2x2}<mo>|</mo></math>`);
	add('mtable:Vmatrix-mo', 'tables', `<math><mo>‖</mo>${table2x2}<mo>‖</mo></math>`);
	add('mtable:mfenced-paren', 'tables', `<math><mfenced open="(" close=")">${table2x2}</mfenced></math>`);
	add('mtable:mfenced-bracket', 'tables', `<math><mfenced open="[" close="]">${table2x2}</mfenced></math>`);
	add('mtable:mfenced-asymmetric', 'tables', `<math><mfenced open="[" close=")">${table2x2}</mfenced></math>`);
	add('mtable:mfenced-empty-open-close', 'tables', `<math><mfenced open="" close="">${table2x2}</mfenced></math>`);
	add('mtable:nested', 'tables', `<math><mo>(</mo><mtable><mtr><mtd>${table2x2}</mtd><mtd><mn>0</mn></mtd></mtr></mtable><mo>)</mo></math>`);
	add('mtable:bare-row', 'tables', '<math><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr></math>');
	add('mtable:aligned-table-attr', 'tables', '<math><mtable columnalign="right left"><mtr><mtd><mi>x</mi></mtd><mtd><mo>=</mo><mn>1</mn></mtd></mtr><mtr><mtd><mi>y</mi></mtd><mtd><mo>=</mo><mn>2</mn></mtd></mtr></mtable></math>');
	add('mtable:aligned-cell-attr', 'tables', '<math><mtable><mtr><mtd columnalign="right"><mi>x</mi></mtd><mtd columnalign="left"><mo>=</mo><mn>1</mn></mtd></mtr></mtable></math>');
	add('mtable:aligned-center-only', 'tables', '<math><mtable columnalign="center center"><mtr><mtd><mi>a</mi></mtd><mtd><mi>b</mi></mtd></mtr></mtable></math>');
	add('mtable:cases-2child', 'tables', '<math><mrow><mo>{</mo><mtable><mtr><mtd><mi>x</mi></mtd><mtd><mtext>if </mtext><mi>x</mi><mo>&gt;</mo><mn>0</mn></mtd></mtr><mtr><mtd><mn>0</mn></mtd><mtd><mtext>otherwise</mtext></mtd></mtr></mtable></mrow></math>');
	add('mtable:cases-3child', 'tables', '<math><mrow><mo>{</mo><mtable><mtr><mtd><mn>1</mn></mtd></mtr><mtr><mtd><mn>2</mn></mtd></mtr></mtable><mo></mo></mrow></math>');

	// --- menclose (all notations) ---
	const notations = [
		'', 'longdiv', 'actuarial', 'radical', 'box', 'roundedbox', 'circle',
		'left', 'right', 'top', 'bottom', 'updiagonalstrike', 'downdiagonalstrike',
		'updiagonalarrow', 'verticalstrike', 'horizontalstrike', 'madruwb', 'phasorangle', 'unknown'
	];
	for (const n of notations) {
		const attr = n ? ` notation="${n}"` : '';
		add(`menclose:${n || 'default'}`, 'menclose', `<math><menclose${attr}><mi>x</mi><mo>+</mo><mn>1</mn></menclose></math>`);
	}

	// --- maction, merror, mphantom, mpadded, mstyle, semantics, unknown ---
	add('maction:default', 'other-elements', '<math><maction><mi>a</mi><mi>b</mi></maction></math>');
	add('maction:toggle', 'other-elements', '<math><maction actiontype="toggle"><mi>a</mi><mi>b</mi><mi>c</mi></maction></math>');
	add('maction:tooltip', 'other-elements', '<math><maction actiontype="tooltip"><mi>x</mi><mtext>tip</mtext></maction></math>');
	add('maction:tooltip-empty', 'other-elements', '<math><maction actiontype="tooltip"></maction></math>');
	add('merror:basic', 'other-elements', '<math><merror><mi>x</mi><mo>+</mo><mn>1</mn></merror></math>');
	add('mphantom:basic', 'other-elements', '<math><mi>a</mi><mphantom><mi>b</mi></mphantom><mi>c</mi></math>');
	add('mpadded:basic', 'other-elements', '<math><mpadded width="+2px"><mi>x</mi><mo>+</mo><mn>1</mn></mpadded></math>');
	add('mstyle:basic', 'other-elements', '<math><mstyle displaystyle="true"><mfrac><mi>a</mi><mi>b</mi></mfrac></mstyle></math>');
	add('semantics:annotation-tex', 'semantics', '<math><semantics><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><annotation encoding="application/x-tex">x+1</annotation></semantics></math>');
	add('semantics:annotation-xml-content', 'semantics', '<math><semantics><mfrac><mi>a</mi><mi>b</mi></mfrac><annotation-xml encoding="MathML-Content"><apply><divide/><ci>a</ci><ci>b</ci></apply></annotation-xml></semantics></math>');
	add('semantics:annotation-xml-presentation', 'semantics', '<math><semantics><mfrac><mi>a</mi><mi>b</mi></mfrac><annotation-xml encoding="MathML-Presentation"><mi>alt</mi></annotation-xml></semantics></math>', {
		expectedDiff: {
			ours: '\\frac{a}{b}',
			theirs: '\\frac{a}{b} alt',
			reason: 'Per MathML spec <semantics> renders only its first child; mathml-to-latex falls through to GenericSpacingWrapper and leaks presentation elements inside <annotation-xml>.',
		},
	});
	add('semantics:multiple-children', 'semantics', '<math><semantics><mi>x</mi><mo>+</mo><mn>1</mn><annotation encoding="application/x-tex">x+1</annotation></semantics></math>');
	add('semantics:annotation-first', 'semantics', '<math><semantics><annotation encoding="application/x-tex">x</annotation><mrow><mi>x</mi></mrow></semantics></math>');
	add('semantics:content-with-presentation', 'semantics', '<math><semantics><apply><plus/><ci>a</ci><ci>b</ci></apply><annotation-xml encoding="application/mathml-presentation+xml"><mi>a</mi><mo>+</mo><mi>b</mi></annotation-xml></semantics></math>');
	add('semantics:ci-with-presentation', 'semantics', '<math><semantics><ci>x</ci><annotation-xml encoding="MathML-Presentation"><mi>x</mi></annotation-xml></semantics></math>');
	add('unknown:wrapper', 'other-elements', '<math><mcustom><mi>a</mi><mo>+</mo><mi>b</mi></mcustom></math>');
	add('unknown:leaf', 'other-elements', '<math><mcustom>ignored</mcustom></math>');
	add('empty:math', 'empty', '<math></math>');
	add('empty:mrow', 'empty', '<math><mrow></mrow></math>');
	add('empty:mfrac-children', 'empty', '<math><mfrac><mrow></mrow><mrow></mrow></mfrac></math>');
	add('comment:inside-mi', 'edge', '<math><mi><!-- note -->x</mi></math>', {
		expectedDiff: {
			ours: 'x',
			theirs: '',
			reason: 'mathml-to-latex treats #comment as a non-text element child and discards the token text; ours checks nodeType === 1.',
		},
	});

	// --- MS Word malformed MathML ---
	add('msword:mml-prefix', 'msword', '<mml:math xmlns:mml="http://www.w3.org/1998/Math/MathML"><mml:mfrac><mml:mi>a</mml:mi><mml:mi>b</mml:mi></mml:mfrac></mml:math>');
	add('msword:valueless-close-eq', 'msword', '<math><mfenced open="{" close= ><mi>x</mi></mfenced></math>');
	add('msword:valueless-close', 'msword', '<math><mfenced open="{" close ><mi>x</mi></mfenced></math>');
	add('msword:valueless-matrix', 'msword', `<math><mfenced open="[" close= >${table2x2}</mfenced></math>`);
	add('msword:unquoted-bevelled', 'msword', '<math><mfrac bevelled=true><mi>a</mi><mi>b</mi></mfrac></math>');
	add('msword:unquoted-linethickness', 'msword', '<math><mfrac linethickness=0><mi>n</mi><mi>k</mi></mfrac></math>');
	add('msword:line-breaks', 'msword', '<math>\r\n  <mi>a</mi>\n  <mo>+</mo>\r\n  <mtext>hello\nworld</mtext>\n</math>');

	// --- Entities & Unicode symbols/operators/accents/special fonts ---
	add('entities:xml-basic', 'entities', '<math><mo>&amp;</mo><mo>&lt;</mo><mo>&gt;</mo><mo>&lt;=</mo><mo>&gt;=</mo><mo>&amp;&amp;</mo></math>');
	add('entities:numeric-hex', 'entities', '<math><mo>&#x2211;</mo><mi>&#x03B1;</mi><mo>&#x2061;</mo><mo>&#x222B;</mo><mi>&#x221E;</mi></math>');
	add('entities:html-named', 'entities', '<math><mi>&alpha;</mi><mo>&plusmn;</mo><mi>&infin;</mi><mo>&le;</mo><mo>&ge;</mo></math>');
	add('symbols:greek-lower', 'symbols', '<math><mi>α</mi><mi>β</mi><mi>γ</mi><mi>δ</mi><mi>ε</mi><mi>ζ</mi><mi>η</mi><mi>θ</mi><mi>ι</mi><mi>κ</mi><mi>λ</mi><mi>μ</mi><mi>ν</mi><mi>ξ</mi><mi>ο</mi><mi>π</mi><mi>ρ</mi><mi>σ</mi><mi>τ</mi><mi>υ</mi><mi>φ</mi><mi>χ</mi><mi>ψ</mi><mi>ω</mi></math>');
	add('symbols:greek-upper-standard', 'symbols', '<math><mi>Γ</mi><mi>Δ</mi><mi>Θ</mi><mi>Λ</mi><mi>Ξ</mi><mi>Π</mi><mi>Σ</mi><mi>Φ</mi><mi>Ψ</mi><mi>Ω</mi><mi>Ρ</mi><mi>Υ</mi></math>');
	add('symbols:greek-upper-latin-lookalikes', 'symbols', '<math><mi>Ζ</mi><mi>Η</mi><mi>Μ</mi><mi>Ν</mi><mi>Ο</mi><mi>Τ</mi></math>', {
		expectedDiff: {
			ours: 'Z H M N O T',
			theirs: 'Ζ Η Μ \\nu Ο Τ',
			reason: 'LaTeX has no commands for Greek capitals that look like Latin letters, so ours writes the Latin letter; mathml-to-latex leaves most as Unicode, which pdfLaTeX rejects, and turns capital Nu into lowercase \\nu.',
		},
	});
	add('symbols:greek-upper-homoglyphs', 'symbols', '<math><mi>Α</mi><mi>Β</mi><mi>Ε</mi><mi>Ι</mi><mi>Κ</mi><mi>Χ</mi></math>', {
		expectedDiff: {
			ours: 'A B E I K X',
			theirs: '\\mathsf{A} \\mathsf{B} \\mathbf{E} \\mathit{I} \\mathsf{K} \\mathsf{X}',
			reason: 'LaTeX has no commands for Greek capitals that look like Latin letters, so ours writes the Latin letter; mathml-to-latex lists them as special font characters and changes their style (Epsilon becomes a bold E).',
		},
	});
	add('operators:relations-and-arrows', 'operators', '<math><mo>≤</mo><mo>≥</mo><mo>≠</mo><mo>≈</mo><mo>≡</mo><mo>∈</mo><mo>∉</mo><mo>⊂</mo><mo>⊃</mo><mo>⊆</mo><mo>⊇</mo><mo>→</mo><mo>←</mo><mo>↔</mo><mo>⇒</mo><mo>⇐</mo><mo>⇔</mo><mo>↦</mo></math>');
	add('operators:calculus-and-logic', 'operators', '<math><mo>∑</mo><mo>∏</mo><mo>∫</mo><mo>∬</mo><mo>∭</mo><mo>∮</mo><mo>∂</mo><mo>∇</mo><mo>∀</mo><mo>∃</mo><mo>¬</mo><mo>∧</mo><mo>∨</mo><mo>⊕</mo><mo>⊗</mo><mo>⊥</mo><mo>±</mo><mo>×</mo><mo>÷</mo><mo>·</mo></math>');
	add('operators:invisible', 'operators', '<math><mi>f</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo><mo>&#x2062;</mo><mi>y</mi><mo>&#x2063;</mo><mi>z</mi><mo>&#x2064;</mo><mn>1</mn></math>');
	add('operators:multi-char', 'operators', '<math><mo>**</mo><mo>|||</mo><mo>/=</mo><mo>...</mo><mo>≫̸</mo><mo>≪̸</mo><mo>⊂⃒</mo><mo>⊃⃒</mo></math>');
	add('accents:vowels', 'symbols', '<math><mi>á</mi><mi>è</mi><mi>î</mi><mi>õ</mi><mi>ü</mi><mi>å</mi><mi>ñ</mi><mi>Ž</mi><mi>ẑ</mi></math>');
	add('fonts:unicode-math-alnum', 'symbols', '<math><mi>𝐀</mi><mi>𝐙</mi><mi>𝟎</mi><mi>𝟗</mi><mi>𝐴</mi><mi>𝑍</mi><mi>𝔸</mi><mi>ℂ</mi><mi>ℍ</mi><mi>ℕ</mi><mi>ℙ</mi><mi>ℚ</mi><mi>ℝ</mi><mi>ℤ</mi><mi>𝟘</mi><mi>𝟡</mi><mi>𝒜</mi><mi>ℬ</mi><mi>ℒ</mi><mi>𝔄</mi><mi>ℜ</mi><mi>ℑ</mi><mi>𝖠</mi><mi>𝖹</mi></math>');
	add('fonts:bold-greek', 'symbols', '<math><mi>𝚨</mi><mi>𝚫</mi><mi>𝚭</mi><mi>𝚵</mi><mi>𝚺</mi><mi>𝛀</mi></math>', {
		expectedDiff: {
			ours: '\\mathbf{A} \\mathbf{\\Delta} \\mathbf{Z} \\mathbf{\\Xi} \\mathbf{\\Sigma} \\mathbf{\\Omega}',
			theirs: '\\mathtt{A} \\mathtt{\\Delta} \\mathtt{F} \\Xi \\mathtt{S} \\mathtt{\\Omega}',
			reason: 'U+1D6A8–U+1D6C0 are Mathematical Bold Capital Greek; mathml-to-latex mapped them to \\mathtt with wrong letters (Zeta->F, Sigma->S) and non-bold \\Xi.',
		},
	});

	// --- Realistic complex equations ---
	add('real:quadratic', 'complex', '<math><mi>x</mi><mo>=</mo><mfrac><mrow><mo>-</mo><mi>b</mi><mo>±</mo><msqrt><msup><mi>b</mi><mn>2</mn></msup><mo>-</mo><mn>4</mn><mi>a</mi><mi>c</mi></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math>');
	add('real:bayes', 'complex', '<math><mi>P</mi><mo>(</mo><mi>A</mi><mo>|</mo><mi>B</mi><mo>)</mo><mo>=</mo><mfrac><mrow><mi>P</mi><mo>(</mo><mi>B</mi><mo>|</mo><mi>A</mi><mo>)</mo><mi>P</mi><mo>(</mo><mi>A</mi><mo>)</mo></mrow><mrow><mi>P</mi><mo>(</mo><mi>B</mi><mo>)</mo></mrow></mfrac></math>');
	add('real:taylor', 'complex', '<math><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><munderover><mo>∑</mo><mrow><mi>n</mi><mo>=</mo><mn>0</mn></mrow><mo>∞</mo></munderover><mfrac><mrow><msup><mi>f</mi><mrow><mo>(</mo><mi>n</mi><mo>)</mo></mrow></msup><mo>(</mo><mi>a</mi><mo>)</mo></mrow><mrow><mi>n</mi><mo>!</mo></mrow></mfrac><msup><mrow><mo>(</mo><mi>x</mi><mo>-</mo><mi>a</mi><mo>)</mo></mrow><mi>n</mi></msup></math>');
	add('real:gaussian-integral', 'complex', '<math><msubsup><mo>∫</mo><mrow><mo>-</mo><mo>∞</mo></mrow><mo>∞</mo></msubsup><msup><mi>e</mi><mrow><mo>-</mo><msup><mi>x</mi><mn>2</mn></msup></mrow></msup><mi>d</mi><mi>x</mi><mo>=</mo><msqrt><mi>π</mi></msqrt></math>');
	add('real:cauchy-schwarz', 'complex', '<math><mo>|</mo><mo>⟨</mo><mi>u</mi><mo>,</mo><mi>v</mi><mo>⟩</mo><msup><mo>|</mo><mn>2</mn></msup><mo>≤</mo><mo>‖</mo><mi>u</mi><msup><mo>‖</mo><mn>2</mn></msup><mo>‖</mo><mi>v</mi><msup><mo>‖</mo><mn>2</mn></msup></math>');
	add('real:matrix-eig', 'complex', '<math><mo>det</mo><mo>(</mo><mi>A</mi><mo>-</mo><mi>λ</mi><mi>I</mi><mo>)</mo><mo>=</mo><mo>|</mo><mtable><mtr><mtd><msub><mi>a</mi><mn>11</mn></msub><mo>-</mo><mi>λ</mi></mtd><mtd><msub><mi>a</mi><mn>12</mn></msub></mtd></mtr><mtr><mtd><msub><mi>a</mi><mn>21</mn></msub></mtd><mtd><msub><mi>a</mi><mn>22</mn></msub><mo>-</mo><mi>λ</mi></mtd></mtr></mtable><mo>|</mo><mo>=</mo><mn>0</mn></math>');
	add('real:maxwell-curl', 'complex', '<math><mo>∇</mo><mo>×</mo><mi mathvariant="bold">E</mi><mo>=</mo><mo>-</mo><mfrac><mrow><mo>∂</mo><mi mathvariant="bold">B</mi></mrow><mrow><mo>∂</mo><mi>t</mi></mrow></mfrac></math>');
	add('real:binomial-theorem', 'complex', '<math><msup><mrow><mo>(</mo><mi>x</mi><mo>+</mo><mi>y</mi><mo>)</mo></mrow><mi>n</mi></msup><mo>=</mo><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>0</mn></mrow><mi>n</mi></munderover><mo>(</mo><mfrac linethickness="0"><mi>n</mi><mi>k</mi></mfrac><mo>)</mo><msup><mi>x</mi><mrow><mi>n</mi><mo>-</mo><mi>k</mi></mrow></msup><msup><mi>y</mi><mi>k</mi></msup></math>');

	// --- Deep nesting (stack safety) ---
	let deep = '<mi>x</mi>';
	for (let i = 0; i < 200; i++) deep = `<mrow>${deep}</mrow>`;
	add('nested:deep-mrow-200', 'nested', `<math>${deep}</math>`);

	let deepFrac = '<mi>x</mi>';
	for (let i = 0; i < 25; i++) deepFrac = `<mfrac><mn>1</mn><mrow><mn>1</mn><mo>+</mo>${deepFrac}</mrow></mfrac>`;
	add('nested:continued-fraction-25', 'nested', `<math>${deepFrac}</math>`);

	// --- Invalid child counts (both throw InvalidNumberOfChildrenError) ---
	add('error:mfrac-1', 'errors', '<math><mfrac><mi>a</mi></mfrac></math>', { expectThrow: true });
	add('error:mfrac-3', 'errors', '<math><mfrac><mi>a</mi><mi>b</mi><mi>c</mi></mfrac></math>', { expectThrow: true });
	add('error:mroot-1', 'errors', '<math><mroot><mi>a</mi></mroot></math>', { expectThrow: true });
	add('error:msub-1', 'errors', '<math><msub><mi>a</mi></msub></math>', { expectThrow: true });
	add('error:msup-1', 'errors', '<math><msup><mi>a</mi></msup></math>', { expectThrow: true });
	add('error:msubsup-2', 'errors', '<math><msubsup><mi>a</mi><mi>b</mi></msubsup></math>', { expectThrow: true });
	add('error:munder-1', 'errors', '<math><munder><mi>a</mi></munder></math>', { expectThrow: true });
	add('error:mover-1', 'errors', '<math><mover><mi>a</mi></mover></math>', { expectThrow: true });
	add('error:munderover-2', 'errors', '<math><munderover><mi>a</mi><mi>b</mi></munderover></math>', { expectThrow: true });
	add('error:mmultiscripts-0', 'errors', '<math><mmultiscripts></mmultiscripts></math>', { expectThrow: true });

	return cases;
}

export function getFullMathMLCorpus(): MathMLCase[] {
	return [...getFixtureMathMLCases(), ...getGeneratedMathMLCases()];
}
