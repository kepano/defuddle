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
		'base-url',
		'base-url-base-element',
		'base-url-base-element-relative',
		'blogger',
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
		note: 'Defuddle drops leading site chrome or keeps title/deck details in metadata instead of duplicating them inside the article body.'
	}),
	'ars-1': {
		content: 'actual-contains-expected-text',
		porting: 'structural-subset',
		note: 'Defuddle keeps the article body and lead image in content, while the Ars section label and lower-deck remain in metadata instead of being duplicated in-body.',
		expectedSelectorsToRemove: ['header']
	},
	'bbc-1': {
		content: 'actual-contains-expected-text',
		porting: 'structural-superset',
		note: 'Defuddle preserves BBC inline video embeds, media captions, and one live-updates link that Mozilla omits, while stripping decorative separator images.',
		expectedSelectorsToRemove: ['img[alt="line"]']
	},
	'breitbart': {
		content: 'expected-contains-actual-text',
		porting: 'structural-subset',
		note: 'Defuddle keeps the Breitbart article body while dropping the hero image, duplicated date line, newsletter prompt, and noisy inline byline blob that Mozilla preserved.',
		skipByline: true
	},
	'buzzfeed-1': {
		content: 'actual-contains-expected-text',
		porting: 'structural-superset',
		note: 'Defuddle keeps the BuzzFeed article body while preserving the intro blurb and hero image block that Mozilla omitted, after stripping the post-article bio/share/next modules.'
	},
	'citylab-1': {
		content: 'expected-contains-actual-text',
		porting: 'structural-subset',
		note: 'Defuddle keeps the CityLab article body while leaving the author/date in metadata and stripping newsletter/about-author blocks from the body.',
		titleAlternatives: ['A Brief History of Neon Signage']
	},
	'cnn': {
		content: 'expected-contains-actual-text',
		porting: 'structural-subset',
		note: 'Defuddle keeps the CNN article body while stripping the inline SmartAsset embed, paid-partner rail modules, and footer timestamp that Mozilla preserved.'
	},
	'dropbox-blog': {
		porting: 'metadata-variant',
		note: 'Defuddle keeps the full Dropbox article body and byline, but preserves the page-title variant with a colon instead of Mozilla’s typographic apostrophe-plus-dash title.',
		titleAlternatives: ['How we designed Dropbox ATF: an async task framework']
	},
	'videos-2': {
		content: 'expected-contains-actual-text',
		porting: 'metadata-variant',
		note: 'Defuddle keeps the multi-author byline in metadata instead of duplicating the author names at the tail of the article body.'
	},
	'bug-1255978': {
		content: 'expected-contains-actual-text',
		porting: 'structural-subset',
		note: 'Defuddle keeps the Independent article body while stripping inline related-list/gallery/ad modules plus video/reuse chrome that Mozilla preserved.',
		titleAlternatives: ["The seven secrets that hotel owners don't want you to know"]
	},
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
