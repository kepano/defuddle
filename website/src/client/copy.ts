export function setupCopy(name: string, getValue: () => string, label = `Copy ${name}`) {
	const button = document.querySelector<HTMLButtonElement>(`#copy-${name}`)!;
	const copyIcon = button.firstElementChild!.cloneNode(true);
	let timer: number | undefined;
	let revision = 0;
	let previous = '';
	const reset = () => {
		window.clearTimeout(timer);
		delete button.dataset.copied;
		button.title = label;
		button.setAttribute('aria-label', label);
		button.replaceChildren(copyIcon.cloneNode(true));
	};
	const refresh = () => {
		const value = getValue();
		button.disabled = !value;
		if (value !== previous) { previous = value; revision++; reset(); }
	};
	button.addEventListener('click', async () => {
		const value = getValue();
		const current = ++revision;
		reset();
		try {
			await navigator.clipboard.writeText(value);
			if (current !== revision || getValue() !== value) return;
			button.dataset.copied = '';
			button.title = 'Copied';
			button.setAttribute('aria-label', 'Copied');
			const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			for (const [key, value] of Object.entries({ 'aria-hidden': 'true', width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) icon.setAttribute(key, value);
			const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttribute('d', 'M20 6 9 17l-5-5');
			icon.append(path);
			button.replaceChildren(icon);
		} catch {
			if (current !== revision) return;
			button.title = 'Copy failed';
			button.setAttribute('aria-label', 'Copy failed');
		}
		timer = window.setTimeout(reset, 2000);
	});
	refresh();
	return { refresh };
}

export function setupCodeCopy() {
	document.querySelectorAll<HTMLButtonElement>('[data-copy-code]').forEach((button, index) => {
		const name = `code-${index}`;
		button.id = `copy-${name}`;
		setupCopy(name, () => [...button.closest('[data-code-block]')!.querySelectorAll('.doc-code-source')].map(line => line.textContent ?? '').join('\n'), 'Copy code');
	});
}
