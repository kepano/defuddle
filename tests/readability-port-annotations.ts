export type ContentExpectationMode =
	| 'canonical-markdown'
	| 'semantic-text'
	| 'actual-contains-expected-text'
	| 'expected-contains-actual-text';

export type ReadabilityPortAnnotation = {
	content?: ContentExpectationMode;
	porting: 'baseline' | 'semantic-text' | 'structural-superset' | 'structural-subset' | 'metadata-variant';
	note: string;
	skipByline?: boolean;
	titleAlternatives?: string[];
	expectedSelectorsToRemove?: string[];
	expectedTextSnippetsToRemove?: string[];
};

function annotate(
	fixtures: string[],
	annotation: ReadabilityPortAnnotation
): Record<string, ReadabilityPortAnnotation> {
	return Object.fromEntries(fixtures.map(name => [name, annotation]));
}

export const READABILITY_PORT_ANNOTATIONS: Record<string, ReadabilityPortAnnotation> = {
	...annotate([
		'002',
		'003-metadata-preferred',
		'004-metadata-space-separated-properties',
		'article-author-tag',
		'base-url-base-element',
		'base-url-base-element-relative',
		'daringfireball-1',
		'data-url-image',
		'lazy-image-3',
		'lwn-1',
		'metadata-content-missing',
		'seattletimes-1',
		'table-style-attributes',
		'theverge',
		'toc-missing',
		'v8-blog',
		'videos-2',
		'wordpress',
	], {
		content: 'semantic-text',
		porting: 'semantic-text',
		note: 'Defuddle keeps the extracted article text but normalizes markdown differently from Readability.'
	}),
	...annotate([
		'aclu',
		'comment-inside-script-parsing',
		'embedded-videos',
		'gmw',
		'basic-tags-cleaning',
		'mathjax',
		'quanta-1',
		'remove-aria-hidden',
		'remove-extra-brs',
		'remove-extra-paragraphs',
		'remove-script-tags',
		'replace-brs',
		'videos-1',
	], {
		content: 'actual-contains-expected-text',
		porting: 'structural-superset',
		note: 'Defuddle keeps the article text but preserves extra headings, hero media, or media labels.'
	}),
	...annotate([
		'clean-links',
		'qq',
	], {
		content: 'expected-contains-actual-text',
		porting: 'structural-subset',
		note: 'Defuddle drops leading site chrome or share/footer clutter that Readability keeps in the expected fixture.'
	}),
	'yahoo-3': {
		content: 'expected-contains-actual-text',
		porting: 'structural-subset',
		note: 'Defuddle keeps the article body and byline but omits the non-article cookie-search teaser that Readability preserved.'
	},
	'yahoo-2': {
		content: 'expected-contains-actual-text',
		porting: 'metadata-variant',
		note: 'Defuddle keeps the AP story body while omitting the non-article gallery counter and preserving the article title instead of Yahoo’s generic portal title.',
		titleAlternatives: ['Russia: Space ship malfunctions, breaks up over Siberia']
	},
	'yahoo-4': {
		porting: 'metadata-variant',
		note: 'Defuddle strips the Yahoo page chrome and keeps the article title variant; Mozilla’s byline here points to the Yahoo "個人" nav label rather than an author.',
		skipByline: true,
		titleAlternatives: ['トレンドマイクロ、公衆無線LANを安全に使うためのアプリ「フリーWi-Fiプロテクション」 （CNET Japan）']
	},
	'seattletimes-1': {
		content: 'semantic-text',
		porting: 'metadata-variant',
		note: 'Readability stores a publish/update timestamp as the byline here; Defuddle prefers the author name.',
		skipByline: true
	},
	'v8-blog': {
		content: 'semantic-text',
		porting: 'metadata-variant',
		note: 'Defuddle keeps the article title variant instead of Readability’s site-suffixed title.',
		titleAlternatives: ['Outside the web: standalone WebAssembly binaries using Emscripten']
	},
	'videos-1': {
		content: 'actual-contains-expected-text',
		porting: 'metadata-variant',
		note: 'Defuddle keeps the article title variant and a hero image/caption block that Readability omits.',
		titleAlternatives: ['The 21 best movies of 2017']
	},
	'aktualne': {
		content: 'actual-contains-expected-text',
		porting: 'structural-superset',
		note: 'Defuddle retains the article deck and removes inline related/typo modules, but keeps the lead and inline photo/caption blocks that Readability omits.',
		expectedTextSnippetsToRemove: [
			'Pokud jste v článku zaznamenali chybu nebo překlep'
		]
	}
};
