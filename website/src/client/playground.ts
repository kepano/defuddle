import { createEditor } from './editor';
import { createParser, type ParseResult } from './parser';
import { setupPlaygroundColumns } from './columns';
import { setupPlaygroundTabs } from './tabs';
import { setupSettings } from './settings';
import { setupCopy } from './copy';
import { formatHTML } from './format-html';
import { setupSearch } from './search';

const root = document.querySelector<HTMLElement>('.playground')!;
// Prevent iOS from zooming when an editor gains focus.
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
	|| (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
if (isIOS) {
	const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
	if (viewport) viewport.content += ', maximum-scale=1';
}
const wrapButton = document.querySelector<HTMLButtonElement>('#wrap-lines')!;
const inputStatus = document.getElementById('input-status')!;
const outputStatus = document.getElementById('output-status')!;
const wrapStorageKey = 'defuddle:playground:wrap';
let wrap = window.matchMedia('(max-width: 760px)').matches;
try {
	const saved = localStorage.getItem(wrapStorageKey);
	if (saved === 'true' || saved === 'false') wrap = saved === 'true';
} catch { /* Use the viewport default when storage is unavailable. */ }

const input = createEditor('input', 'html', wrap);
const output = createEditor('output', 'markdown', wrap);
const initialInput = input.value;
const inputCopy = setupCopy('input', () => input.value);
const outputCopy = setupCopy('output', () => output.value);
let format: 'markdown' | 'html' | 'metadata' = 'markdown';
let result: ParseResult | null = null;
let formattedHTML = '';
let timer: number | undefined;
let fileRevision = 0;

function setStatus(element: HTMLElement, message: string, state = '') {
	element.textContent = message;
	element.dataset.state = state;
}
function showOutput() {
	const { content = '', contentHtml, ...properties } = result ?? {};
	const value = format === 'metadata' ? (result ? JSON.stringify(properties, null, 2) : '') : format === 'markdown' ? content : formattedHTML;
	output.setValue(value);
	output.element.setAttribute('aria-label', format === 'metadata' ? 'Metadata JSON' : format === 'markdown' ? 'Markdown output' : 'HTML output');
	outputCopy.refresh();
	setStatus(outputStatus, format === 'metadata' ? (result ? `${Object.keys(properties).length} properties` : '') : `${output.value.length.toLocaleString()} characters`);
}
const parser = createParser({
	onResult(value) {
		result = value;
		formattedHTML = value?.contentHtml ? formatHTML(value.contentHtml) : '';
		showOutput();
	},
	onState(state, message) {
		const loading = state === 'loading';
		output.element.setAttribute('aria-busy', String(loading));
		if (loading) setStatus(outputStatus, 'Parsing…', 'loading');
		else if (state === 'error') setStatus(outputStatus, message ?? 'Unable to parse HTML.', 'error');
	},
});
function refreshInput() {
	inputCopy.refresh();
	setStatus(inputStatus, '');
}
function parseNow() {
	window.clearTimeout(timer);
	refreshInput();
	void parser.parse(input.value);
}
function scheduleParse() {
	fileRevision++;
	window.clearTimeout(timer);
	parser.cancel();
	refreshInput();
	if (!input.value.trim()) { parser.clear(); return; }
	setStatus(outputStatus, 'Updating…', 'loading');
	timer = window.setTimeout(parseNow, 250);
}
input.onChange(scheduleParse);

const formatButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-format]')];
formatButtons.forEach(button => button.addEventListener('click', () => {
	const state = outputStatus.dataset.state;
	const message = outputStatus.textContent ?? '';
	format = button.dataset.format as typeof format;
	formatButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
	output.setLanguage(format === 'metadata' ? 'json' : format);
	showOutput();
	if (state === 'error' || state === 'loading') setStatus(outputStatus, message, state);
}));
formatButtons.forEach((button, index) => button.addEventListener('keydown', event => {
	const next = event.key === 'ArrowRight' ? (index + 1) % formatButtons.length : event.key === 'ArrowLeft' ? (index + formatButtons.length - 1) % formatButtons.length : event.key === 'Home' ? 0 : event.key === 'End' ? formatButtons.length - 1 : -1;
	if (next < 0) return;
	event.preventDefault();
	formatButtons[next].click();
	formatButtons[next].focus();
}));
wrapButton.setAttribute('aria-checked', String(wrap));
wrapButton.addEventListener('click', () => {
	wrap = !wrap;
	wrapButton.setAttribute('aria-checked', String(wrap));
	for (const editor of [input, output]) editor.setWrap(wrap);
	try { localStorage.setItem(wrapStorageKey, String(wrap)); } catch { /* Keep the in-memory preference. */ }
});
document.getElementById('reset-example')!.addEventListener('click', () => {
	fileRevision++;
	input.setValue(initialInput);
	parseNow();
});
document.getElementById('clear-playground')!.addEventListener('click', () => {
	fileRevision++;
	window.clearTimeout(timer);
	input.setValue('');
	parser.clear();
	refreshInput();
});
const fileInput = document.querySelector<HTMLInputElement>('#html-file')!;
document.getElementById('open-file')!.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
	const file = fileInput.files?.[0];
	fileInput.value = '';
	if (!file) return;
	const revision = ++fileRevision;
	try {
		const text = await file.text();
		if (revision !== fileRevision) return;
		input.setValue(text);
		document.querySelector<HTMLButtonElement>('[data-playground-tab="input"]')!.click();
		parseNow();
	} catch {
		if (revision === fileRevision) setStatus(inputStatus, 'Unable to read this file.', 'error');
	}
});
setupPlaygroundColumns();
setupPlaygroundTabs();
setupSettings();
setupSearch();
root.querySelectorAll('[data-playground-tab]').forEach(tab => tab.addEventListener('click', () => {
	for (const editor of [input, output]) editor.measure();
}));
void document.fonts.ready.then(() => {
	for (const editor of [input, output]) editor.measure();
});
parseNow();
