import { Annotation, Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection, placeholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { html } from '@codemirror/lang-html';
import { syntaxHighlighting } from '@codemirror/language';
import { htmlHighlightStyle } from './html-highlighting';
import { editorHighlighting } from './editor-highlighting';

const htmlHighlighting = syntaxHighlighting(htmlHighlightStyle);
export type EditorLanguage = 'html' | 'markdown' | 'json';
const language = (name: EditorLanguage): Extension => name === 'html'
	? [html(), htmlHighlighting]
	: editorHighlighting(name === 'markdown' ? 'md' : 'json');
const silentChange = Annotation.define<boolean>();

export function createEditor(name: 'input' | 'output', mode: EditorLanguage, wrap: boolean) {
	const root = document.querySelector<HTMLElement>(`[data-editor="${name}"]`)!;
	const initialValue = root.querySelector('textarea')!.value;
	const readonly = name !== 'input';
	const wrapping = new Compartment();
	const syntax = new Compartment();
	const listeners: (() => void)[] = [];
	root.replaceChildren();
	const view = new EditorView({
		parent: root,
		state: EditorState.create({
			doc: initialValue,
			extensions: [
				syntax.of(language(mode)),
				lineNumbers(), drawSelection(),
				wrapping.of(wrap ? EditorView.lineWrapping : []),
				EditorState.tabSize.of(2),
				EditorState.readOnly.of(readonly), EditorView.editable.of(!readonly),
				readonly ? keymap.of(defaultKeymap) : [
					history(), autocompletion({ icons: false }),
					keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
					placeholder('Paste your HTML here…'),
				],
				EditorView.contentAttributes.of({
					id: `playground-${name}`, 'aria-label': name === 'input' ? 'Input HTML' : 'Output',
					'aria-describedby': `${name}-status`, role: 'textbox', 'aria-readonly': String(readonly),
					tabindex: '0', spellcheck: 'false', autocapitalize: 'off',
				}),
				EditorView.updateListener.of(update => {
					if (update.docChanged && !update.transactions.every(transaction => transaction.annotation(silentChange))) listeners.forEach(listener => listener());
				}),
			],
		}),
	});
	return {
		element: view.contentDOM,
		get value() { return view.state.doc.toString(); },
		setValue(value: string) {
			const previous = view.state.doc.toString();
			if (value === previous) return;
			// Update only the changed range to preserve selections and scroll position.
			let from = 0, to = previous.length, end = value.length;
			while (from < to && from < end && previous[from] === value[from]) from++;
			while (to > from && end > from && previous[to - 1] === value[end - 1]) { to--; end--; }
			const changes = view.state.changes({ from, to, insert: value.slice(from, end) });
			view.dispatch({ changes, effects: view.scrollSnapshot().map(changes) ?? [], annotations: silentChange.of(true) });
		},
		setLanguage(mode: EditorLanguage) { view.dispatch({ effects: syntax.reconfigure(language(mode)) }); },
		setWrap(enabled: boolean) { view.dispatch({ effects: wrapping.reconfigure(enabled ? EditorView.lineWrapping : []) }); },
		onChange(listener: () => void) { listeners.push(listener); },
		focus: () => view.focus(),
		measure: () => view.requestMeasure(),
	};
}
