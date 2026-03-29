const CODE_CONTENT_SELECTOR = 'pre, code';
const HIDDEN_STYLE_PATTERN = /(?:^|;\s*)(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)(?:\s*;|\s*$)/i;

function hasMeaningfulCodeText(element: Element): boolean {
	const text = element.textContent || '';
	const trimmedText = text.trim();
	const hasEnoughText = trimmedText.length >= 20;
	const hasCodeCharacters = /[A-Za-z0-9_$]/.test(trimmedText);

	return hasEnoughText && hasCodeCharacters;
}

function findCodeCarrier(element: Element): Element | null {
	const isCodeCarrier = element.matches(CODE_CONTENT_SELECTOR);
	const directCarrier = isCodeCarrier ? element : null;
	const nestedCarrier = element.querySelector(CODE_CONTENT_SELECTOR);

	return directCarrier || nestedCarrier;
}

function isHiddenToken(token: string): boolean {
	const isHiddenClass = token === 'hidden' || token.endsWith(':hidden');
	const isInvisibleClass = token === 'invisible' || token.endsWith(':invisible');

	return isHiddenClass || isInvisibleClass;
}

function isMarkedHidden(element: Element): boolean {
	if (element.hasAttribute('hidden')) {
		return true;
	}

	const ariaHidden = (element.getAttribute('aria-hidden') || '').toLowerCase();
	if (ariaHidden === 'true') {
		return true;
	}

	const style = element.getAttribute('style') || '';
	const hasHiddenStyle = HIDDEN_STYLE_PATTERN.test(style);
	if (hasHiddenStyle) {
		return true;
	}

	const className = element.getAttribute('class') || '';
	const classTokens = className.split(/\s+/).filter(Boolean);
	const hasHiddenClass = classTokens.some(token => isHiddenToken(token));

	return hasHiddenClass;
}

function findVariantGroup(element: Element): { group: Element; branch: Element } | null {
	let currentBranch: Element | null = element;

	while (currentBranch && currentBranch.parentElement) {
		const group = currentBranch.parentElement;
		const childElements = Array.from(group.children);
		const codeBranches = childElements.filter(child => {
			const codeCarrier = findCodeCarrier(child);
			if (!codeCarrier) {
				return false;
			}

			return hasMeaningfulCodeText(codeCarrier);
		});

		const branchCount = codeBranches.length;
		const hasMultipleBranches = branchCount >= 2;
		if (!hasMultipleBranches) {
			currentBranch = group;
			continue;
		}

		const branch = codeBranches.find(child => child === currentBranch || child.contains(currentBranch));
		if (!branch) {
			currentBranch = group;
			continue;
		}

		return { group, branch };
	}

	return null;
}

function hasVisibleSiblingCodeBranch(group: Element, branch: Element): boolean {
	const siblingElements = Array.from(group.children);

	return siblingElements.some(sibling => {
		if (sibling === branch) {
			return false;
		}

		const codeCarrier = findCodeCarrier(sibling);
		if (!codeCarrier) {
			return false;
		}

		const hasMeaningfulCode = hasMeaningfulCodeText(codeCarrier);
		if (!hasMeaningfulCode) {
			return false;
		}

		return !isMarkedHidden(sibling);
	});
}

export function shouldPreserveHiddenCodeSample(element: Element): boolean {
	const codeCarrier = findCodeCarrier(element);
	if (!codeCarrier) {
		return false;
	}

	const hasMeaningfulCode = hasMeaningfulCodeText(codeCarrier);
	if (!hasMeaningfulCode) {
		return false;
	}

	const variantGroup = findVariantGroup(element);
	if (!variantGroup) {
		return false;
	}

	const { group, branch } = variantGroup;
	const branchIsHidden = isMarkedHidden(branch);
	if (!branchIsHidden) {
		return false;
	}

	return hasVisibleSiblingCodeBranch(group, branch);
}
