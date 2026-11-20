import { describe, it, test, expect } from 'vitest';
import { MathMLToLaTeX } from './shim';

/**
 * Property-based regression test for the environment invariant: whatever the
 * input tree looks like, the converted LaTeX must never carry the alignment
 * markers `&` or `\\` outside a `\begin{...}...\end{...}` environment, since
 * those do not compile. Trees are generated from a seeded PRNG so every run
 * exercises the same cases and any failure is reproducible by its seed.
 *
 * `<mspace linebreak="newline">` is the one deliberate exception (it emits a
 * standalone `\\` line break by design) and is excluded from the vocabulary.
 */
describe('LaTeX environment invariant (property-based)', () => {
  it('never emits & or \\\\ outside an environment, for any generated tree', () => {
    const failures: { seed: number; mathml: string; latex: string }[] = [];

    for (let seed = 1; seed <= TREE_COUNT; seed++) {
      const random = lcg(seed);
      const mathml = `<math>${generateChildren(random, 4, 3)}</math>`;

      let latex: string;
      try {
        latex = MathMLToLaTeX.convert(mathml);
      } catch {
        continue; // converter arity errors are a separate, asserted behavior
      }

      if (violatesInvariant(latex)) failures.push({ seed, mathml, latex });
    }

    const report = failures
      .slice(0, 3)
      .map((failure) => `seed ${failure.seed}\n  in : ${failure.mathml}\n  out: ${failure.latex}`)
      .join('\n');
    expect(failures.length === 0 ? '' : `${failures.length} violations\n${report}`).toBe('');
  });
});

const TREE_COUNT = 500;

type Random = () => number;

/** Deterministic linear congruential generator, so failures reproduce by seed. */
const lcg = (seed: number): Random => {
  let state = seed >>> 0;
  return () => (state = (state * 1664525 + 1013904223) >>> 0) / 0x100000000;
};

const pick = <T>(random: Random, options: T[]): T => options[Math.floor(random() * options.length)];

const MI_VALUES = ['x', 'y', 'sin', 'α'];
const MN_VALUES = ['1', '42', '3.14'];
const MO_VALUES = ['+', '=', '−', '(', ')', '[', ']', '{', '}', '|', '∥', '‖', '≤', '→', '∑', ''];
const MTEXT_VALUES = ['if', 'caf', 'a b'];
const FENCE_PAIRS = [
  ['(', ')'],
  ['[', ']'],
  ['{', '}'],
  ['|', '|'],
  ['', ''],
];

const generateToken = (random: Random): string => {
  const kind = random();
  if (kind < 0.3) return `<mi>${pick(random, MI_VALUES)}</mi>`;
  if (kind < 0.6) return `<mn>${pick(random, MN_VALUES)}</mn>`;
  if (kind < 0.9) return `<mo>${pick(random, MO_VALUES)}</mo>`;
  if (kind < 0.95) return `<mtext>${pick(random, MTEXT_VALUES)}</mtext>`;
  return '<mspace width="1em"/>';
};

const generateChildren = (random: Random, depth: number, maxBreadth: number): string => {
  const count = 1 + Math.floor(random() * maxBreadth);
  let output = '';
  for (let i = 0; i < count; i++) output += generateNode(random, depth);
  return output;
};

const generateNode = (random: Random, depth: number): string => {
  if (depth <= 0) return generateToken(random);

  const kind = random();
  const next = depth - 1;

  if (kind < 0.3) return generateToken(random);
  if (kind < 0.42) return `<mrow>${generateChildren(random, next, 3)}</mrow>`;
  if (kind < 0.5) return generateTable(random, next);
  if (kind < 0.54) return `<mtr>${generateCells(random, next)}</mtr>`; // orphan row on purpose
  if (kind < 0.58) return `<mtd>${generateChildren(random, next, 2)}</mtd>`; // orphan cell on purpose
  if (kind < 0.64) return `<mfrac>${generateNode(random, next)}${generateNode(random, next)}</mfrac>`;
  if (kind < 0.68) return `<msqrt>${generateChildren(random, next, 2)}</msqrt>`;
  if (kind < 0.72) return `<msup>${generateNode(random, next)}${generateNode(random, next)}</msup>`;
  if (kind < 0.76) return `<msub>${generateNode(random, next)}${generateNode(random, next)}</msub>`;
  if (kind < 0.79) return `<munder>${generateNode(random, next)}${generateNode(random, next)}</munder>`;
  if (kind < 0.82) {
    const [open, close] = pick(random, FENCE_PAIRS);
    return `<mfenced open="${open}" close="${close}">${generateChildren(random, next, 2)}</mfenced>`;
  }
  if (kind < 0.85) return `<mstyle>${generateChildren(random, next, 2)}</mstyle>`;
  if (kind < 0.88) return `<mpadded>${generateChildren(random, next, 2)}</mpadded>`;
  if (kind < 0.91) return `<menclose notation="box">${generateChildren(random, next, 2)}</menclose>`;
  if (kind < 0.94) return `<mphantom>${generateChildren(random, next, 2)}</mphantom>`;
  if (kind < 0.97) return `<semantics>${generateChildren(random, next, 2)}</semantics>`;
  return `<unknowntag>${generateChildren(random, next, 2)}</unknowntag>`;
};

const generateCells = (random: Random, depth: number): string => {
  const count = 1 + Math.floor(random() * 3);
  let output = '';
  for (let i = 0; i < count; i++) output += `<mtd>${generateChildren(random, depth, 2)}</mtd>`;
  return output;
};

const generateTable = (random: Random, depth: number): string => {
  const attributes = random() < 0.3 ? ' columnalign="right left"' : '';
  const rowCount = 1 + Math.floor(random() * 3);

  let output = `<mtable${attributes}>`;
  for (let i = 0; i < rowCount; i++) {
    const kind = random();
    if (kind < 0.7) output += `<mtr>${generateCells(random, depth)}</mtr>`;
    else if (kind < 0.85) output += `<mlabeledtr>${generateCells(random, depth)}</mlabeledtr>`;
    else output += generateNode(random, depth); // non-row child on purpose
  }
  return `${output}</mtable>`;
};

/**
 * Strips every environment block (innermost first) and every escaped `\&`,
 * then reports whether any raw `&` or `\\` survives.
 */
const violatesInvariant = (latex: string): boolean => {
  let stripped = latex;
  const innermostEnvironment = /\\begin\{[a-zA-Z*]+\}(?:(?!\\begin\{|\\end\{)[\s\S])*\\end\{[a-zA-Z*]+\}/;
  while (innermostEnvironment.test(stripped)) stripped = stripped.replace(innermostEnvironment, '');

  stripped = stripped.replace(/\\&/g, '');
  return /&/.test(stripped) || /\\\\/.test(stripped);
};
