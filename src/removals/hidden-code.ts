function hasMeaningfulCodeText(element: Element): boolean {
	const text = element.textContent || '';
	const trimmedText = text.trim();
	const hasEnoughText = trimmedText.length >= 20;
	const hasCodeCharacters = /[A-Za-z0-9_$]/.test(trimmedText);

	return hasEnoughText && hasCodeCharacters;
}

function findCodeSampleContainer(element: Element): Element | null {
	const ownContainer = element.closest('.code-sample, [data-code-sample], [role="tabpanel"]');
	const childContainer = element.querySelector('.code-sample, [data-code-sample], [role="tabpanel"]');

	return ownContainer || childContainer;
}

function findCodeCarrier(element: Element): Element | null {
	const isCarrier = element.matches('.code-block, [role="tabpanel"], pre, code');
	const directCarrier = isCarrier ? element : null;
	const childCarrier = element.querySelector('.code-block, [role="tabpanel"], pre, code');

	return directCarrier || childCarrier;
}

export function shouldPreserveHiddenCodeSample(element: Element): boolean {
	const codeSampleContainer = findCodeSampleContainer(element);
	if (!codeSampleContainer) {
		return false;
	}

	const codeCarrier = findCodeCarrier(element);
	if (!codeCarrier) {
		return false;
	}

	const hasMeaningfulCode = hasMeaningfulCodeText(codeCarrier);
	if (!hasMeaningfulCode) {
		return false;
	}

	const isTabbedCodeBlock = codeCarrier.matches('.code-block, [role="tabpanel"]');
	const isTabbedCodeDescendant = codeCarrier.closest('.code-block, [role="tabpanel"]') !== null;

	return isTabbedCodeBlock || isTabbedCodeDescendant;
}
