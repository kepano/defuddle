// Entry point elements
// These are the elements that will be used to find the main content
export const ENTRY_POINT_ELEMENTS = [
	'article',
	'[role="article"]',
	'.post-content',
	'.article-content',
	'#article-content',
	'.content-article',
	'main',
	'[role="main"]',
	'body' // ensures there is always a match
];

export const MOBILE_WIDTH = 600;
export const BLOCK_ELEMENTS = ['div', 'section', 'article', 'main'];

// Elements that should not be unwrapped
export const PRESERVE_ELEMENTS = new Set([
	'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
	'ul', 'ol', 'li', 'dl', 'dt', 'dd',
	'figure', 'figcaption', 'picture',
	'details', 'summary',
	'blockquote',
	'form', 'fieldset'
]);

// Inline elements that should not be unwrapped
export const INLINE_ELEMENTS = new Set([
	'a', 'span', 'strong', 'em', 'i', 'b', 'u', 'code', 'br', 'small',
	'sub', 'sup', 'mark', 'del', 'ins', 'q', 'abbr', 'cite', 'time'
]);

// Hidden elements that should be removed
export const HIDDEN_ELEMENT_SELECTORS = [
	'[hidden]',
	'[aria-hidden="true"]',
//	'[style*="display: none"]', causes problems for math formulas
//	'[style*="display:none"]',
	'[style*="visibility: hidden"]',
	'[style*="visibility:hidden"]',
	'.hidden',
	'.invisible'
].join(',');

// Selectors to be removed
export const EXACT_SELECTORS = [
	// scripts, styles
	'noscript',
	'script',
	'style',

	// ads
	'.ad:not([class*="gradient"])',
	'[class^="ad-" i]',
	'[class$="-ad" i]',
	'[id^="ad-" i]',
	'[id$="-ad" i]',
	'[role="banner" i]',
	'.promo',
	'.Promo',
	'#barrier-page', // ft.com

	// comments
	'[id="comments" i]',

	// header, nav
	'header',
	'.header',
	'#header',
	'nav',
	'.navigation',
	'#navigation',
	'[role="navigation" i]',
	'[role="dialog" i]',
	'[role*="complementary" i]',
	'[class*="pagination" i]',
	'.menu',
	'#menu',
	'#siteSub',

	// metadata
	'.author',
	'.Author',
	'.contributor',
	'.date',
	'.meta',
	'.tags',
	'.toc',
	'.Toc',
	'#toc',
	'#title',
	'#Title',
	'[href*="/category"]',
	'[href*="/categories"]',
	'[href*="/tag/"]',
	'[href*="/tags/"]',
	'[href*="/topics"]',
	'[href*="author"]',
	'[href="#site-content"]',
	'[src*="author"]',

	// footer
	'footer',

	// inputs, forms, elements
	'aside',
	'button',
		// '[role="button"]', Medium images
	'canvas',
	'dialog',
	'fieldset',
	'form',
	'input:not([type="checkbox"])',
	'label',
	'link',
	'option',
	'select',
	'textarea',
	'time',

	// iframes
	'instaread-player',
	'iframe:not([src*="youtube"]):not([src*="youtu.be"]):not([src*="vimeo"]):not([src*="twitter"])',

	// logos
	'[class="logo" i]',
	'#logo',
	'#Logo',

	// newsletter
	'#newsletter',
	'#Newsletter',

	// hidden for print
	'.noprint',
	'[data-link-name*="skip" i]',
	'[data-print-layout="hide" i]',
	'[data-block="donotprint" i]',

	// footnotes, citations
	'[class*="clickable-icon" i]',
	'li span[class*="ltx_tag" i][class*="ltx_tag_item" i]',
	'a[href^="#"][class*="anchor" i]',
	'a[href^="#"][class*="ref" i]',

	// link lists
	'[data-container*="most-viewed" i]',

	// sidebar
	'.sidebar',
	'.Sidebar',
	'#sidebar',
	'#Sidebar',
	'#sitesub',
	
	// other
	'#primaryaudio', // NPR
	'#NYT_ABOVE_MAIN_CONTENT_REGION',
	'[data-testid="photoviewer-children-figure"] > span', // New York Times
	'table.infobox',
	'.pencraft:not(.pc-display-contents)', // Substack
	'[data-optimizely="related-articles-section" i]' // The Economist
];

// Removal patterns tested against attributes: class, id, data-testid, and data-qa
// Case insensitive, partial matches allowed
export const PARTIAL_SELECTORS = [
	'access-wall',
	'activitypub',
	'actioncall',
	'appendix',
	'avatar',
	'advert',
	'-ad-',
	'_ad_',
	'allterms',
	'around-the-web',
	'article-bottom-section',
	'article__copy',
	'article_date',
	'article-end ',
	'article_header',
	'article__header',
	'article__info',
	'article-info',
	'article__meta',
	'article-subject',
	'article_subject',
	'article-snippet',
	'article-separator',
	'article--share',
	'article--topics',
	'articletags',
	'article-tags',
	'article_tags',
	'article-title',
	'article_title',
	'articletopics',
	'article-topics',
	'article-type',
	'article--lede', // The Verge
	'articlewell',
	'associated-people',
	'audio-card',
//	'author', Gwern
	'authored-by',
	'author-box',
	'author-name',
	'author-bio',
	'author-mini-bio',
	'back-to-top',
	'backlinks-section',
	'banner',
	'bio-block',
	'blog-pager',
	'bookmark-',
	'-bookmark',
	'bottom-of-article',
	'brand-bar',
	'breadcrumb',
	'button-wrapper',
	'btn-',
	'-btn',
	'byline',
	'captcha',
	'card-text',
	'card-media',
	'cat_header',
	'catlinks',
	'chapter-list', // The Economist
	'collections',
	'comments',
//	'-comment', Syntax highlighting
	'commentbox',
	'comment-count',
	'comment-content',
	'comment-form',
	'comment-number',
	'comment-respond',
	'comment-thread',
	'complementary',
	'consent',
	'content-card', // The Verge
	'content-topics',
	'contentpromo',
	'context-widget', // Reuters
	'core-collateral',
	'_cta',
	'-cta',
	'cta-',
	'cta_',
	'current-issue', // The Nation
	'custom-list-number',
	'dateline',
	'dateheader',
	'date-header',
	'date_header-',
//	'dialog',
	'disclaimer',
	'disclosure',
	'discussion',
	'discuss_',
	'disqus',
	'donate',
	'dropdown', // Ars Technica
	'eletters',
	'emailsignup',
	'engagement-widget',
	'entry-author-info',
	'entry-categories',
	'entry-date',
	'entry-meta',
	'entry-title',
	'entry-utility',
	'eyebrow',
	'expand-reduce',
	'externallinkembedwrapper', // The New Yorker
	'extra-services',
	'extra-title',
	'facebook',
	'favorite',
	'feedback',
	'feed-links',
	'field-site-sections',
	'fixed',
	'floating-vid',
	'follow',
	'footer',
	'footnote-back',
	'footnoteback',
	'for-you',
	'frontmatter',
	'further-reading',
	'gist-meta',
//	'global',
	'google',
	'goog-',
	'graph-view',
	'header-logo',
	'header-pattern', // The Verge
	'hero-list',
	'hide-for-print',
	'hide-print',
	'hide-when-no-script',
	'hidden-sidenote',
	'interlude',
	'interaction',
	'jumplink',
	'jump-to-',
//	'keyword', // used in syntax highlighting
	'kicker',
	'labstab', // Arxiv
	'-labels',
	'language-name',
	'latest-content',
	'-ledes-', // The Verge
	'-license',
	'link-box',
	'links-grid', // BBC
	'links-title', // BBC
	'listing-dynamic-terms', // Boston Review
	'list-tags',
	'loading',
	'loa-info',
	'logo_container',
	'ltx_role_refnum', // Arxiv
	'ltx_tag_bibitem',
	'ltx_error',
	'marketing',
	'media-inquiry',
	'menu-',
	'meta-',
	'metadata',
	'might-like',
	'_modal',
	'-modal',
	'more-',
	'morenews',
	'morestories',
	'move-helper',
	'mw-editsection',
	'mw-cite-backlink',
	'mw-indicators',
	'mw-jump-link',
	'nav-',
	'nav_',
	'navbar',
//	'navigation',
	'next-',
	'news-story-title',
//	'newsletter', used on Substack
	'newsletter_',
	'newsletter-signup',
	'newslettersignup',
	'newsletterwidget',
	'newsletterwrapper',
	'not-found',
	'nomobile',
	'noprint',
	'originally-published', // Mercury News
	'outline-view',
	'overlay',
	'page-title',
	'-partners',
	'plea',
	'popular',
//	'popup', Gwern
	'pop-up',
	'popover',
	'post-bottom',
	'post__category',
	'postcomment',
	'postdate',
	'post-author',
	'post-date',
	'post_date',
	'post-feeds',
	'postinfo',
	'post-info',
	'post_info',
	'post-inline-date',
	'post-links',
	'post-meta',
	'postmeta',
	'postsnippet',
	'post_snippet',
	'post-snippet',
	'posttitle',
	'post-title',
	'post_title',
	'posttax',
	'post-tax',
	'post_tax',
	'posttag',
	'post_tag',
	'post-tag',
//	'preview', used on Obsidian Publish
	'prevnext',
	'previousnext',
	'press-inquiries',
	'print-none',
	'print-header',
	'profile',
//	'promo',
	'promo-box',
	'pubdate',
	'pub_date',
	'pub-date',
	'publication-date',
	'publicationName', // Medium
	'qr-code',
	'qr_code',
	'_rail',
	'readmore',
	'read-next',
	'read_next',
	'read_time',
	'read-time',
	'reading_time',
	'reading-time',
	'reading-list',
	'recentpost',
	'recent_post',
	'recent-post',
	'recommend',
	'redirectedfrom',
	'recirc',
	'register',
	'related',
	'relevant',
	'reversefootnote',
	'screen-reader-text',
//	'share',
//	'-share', scitechdaily.com
	'share-box',
	'sharedaddy',
	'share-icons',
	'sharelinks',
	'share-section',
	'sidebartitle',
	'sidebar_',
	'sidebar-content',
	'similar-',
	'similar_',
	'similars-',
	'sideitems',
	'side-box',
	'site-index',
	'site-header',
	'site-logo',
	'site-name',
//	'skip-',
//	'skip-link', TechCrunch
	'_skip-link',
	'slug-wrap',
	'social',
	'speechify-ignore',
	'sponsor',
	'springercitation',
//	'-stats',
	'_stats',
	'sticky',
	'storyreadtime', // Medium
	'storypublishdate', // Medium
	'subject-label',
	'subscribe',
	'_tags',
	'tags__item',
	'tag_list',
	'taxonomy',
	'table-of-contents',
	'tabs-',
//	'teaser', Nature
	'terminaltout',
	'time-rubric',
	'timestamp',
	'tip_off',
	'tiptout',
	'-tout-',
	'-toc',
	'toggle-caption',
	'topic-list',
	'toolbar',
	'tooltip',
	'top-wrapper',
	'tree-item',
	'trending',
	'trust-feat',
	'trust-badge',
	'twitter',
	'visually-hidden',
	'welcomebox'
//	'widget-'
];

// Selectors for footnotes and citations
export const FOOTNOTE_INLINE_REFERENCES = [
	'sup.reference',
	'cite.ltx_cite',
	'sup[id^="fnr"]',
	'sup[id^="fnref:"]',
	'span.footnote-link',
	'a.citation',
	'a[id^="ref-link"]',
	'a[href^="#fn"]',
	'a[href^="#cite"]',
	'a[href^="#reference"]',
	'a[href^="#footnote"]',
	'a[href^="#r"]', // Common in academic papers
	'a[href^="#b"]', // Common for bibliography references
	'a[href*="cite_note"]',
	'a[href*="cite_ref"]',
	'a.footnote-anchor', // Substack
	'span.footnote-hovercard-target a', // Substack
	'a[role="doc-biblioref"]', // Science.org
	'a[id^="fnref"]',
	'a[id^="ref-link"]', // Nature.com
].join(',');

export const FOOTNOTE_LIST_SELECTORS = [
	'div.footnote ol',
	'div.footnotes ol',
	'div[role="doc-endnotes"]',
	'div[role="doc-footnotes"]',
	'ol.footnotes-list',
	'ol.footnotes',
	'ol.references',
	'ol[class*="article-references"]',
	'section.footnotes ol',
	'section[role="doc-endnotes"]',
	'section[role="doc-footnotes"]',
	'section[role="doc-bibliography"]',
	'ul.footnotes-list',
	'ul.ltx_biblist',
	'div.footnote[data-component-name="FootnoteToDOM"]' // Substack
].join(',');

// Elements that are allowed to be empty
// These are not removed even if they have no content
export const ALLOWED_EMPTY_ELEMENTS = new Set([
	'area',
	'audio',
	'base',
	'br',
	'circle',
	'col',
	'defs',
	'ellipse',
	'embed',
	'figure',
	'g',
	'hr',
	'iframe',
	'img',
	'input',
	'line',
	'link',
	'mask',
	'meta',
	'object',
	'param',
	'path',
	'pattern',
	'picture',
	'polygon',
	'polyline',
	'rect',
	'source',
	'stop',
	'svg',
	'td',
	'th',
	'track',
	'use',
	'video',
	'wbr'
]);

// Attributes to keep
export const ALLOWED_ATTRIBUTES = new Set([
	'alt',
	'allow',
	'allowfullscreen',
	'aria-label',
	'checked',
	'colspan',
	'controls',
	'data-src',
	'data-srcset',
	'data-lang',
    'data-latex',
	'dir',
    'display',
	'frameborder',
	'headers',
	'height',
	'href',
	'lang',
	'role',
	'rowspan',
	'src',
	'srcset',
	'title',
	'type',
	'width'
]);
export const ALLOWED_ATTRIBUTES_DEBUG = new Set([
	'class',
	'id',
]);

// Supported languages for code blocks
export const SUPPORTED_LANGUAGES = new Set([
	// Markup & Web
	'markup', 'html', 'xml', 'svg', 'mathml', 'ssml', 'atom', 'rss',
	'javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx',
	'webassembly', 'wasm',
	
	// Common Programming Languages
	'python',
	'java',
	'csharp', 'cs', 'dotnet', 'aspnet',
	'cpp', 'c++', 'c', 'objc',
	'ruby', 'rb',
	'php',
	'golang',
	'rust',
	'swift',
	'kotlin',
	'scala',
	'dart',
	
	// Shell & Scripting
	'bash', 'shell', 'sh',
	'powershell',
	'batch',
	
	// Data & Config
	'json', 'jsonp',
	'yaml', 'yml',
	'toml',
	'dockerfile',
	'gitignore',
	
	// Query Languages
	'sql', 'mysql', 'postgresql',
	'graphql',
	'mongodb',
	'sparql',
	
	// Markup & Documentation
	'markdown', 'md',
	'latex', 'tex',
	'asciidoc', 'adoc',
	'jsdoc',
	
	// Functional Languages
	'haskell', 'hs',
	'elm',
	'elixir',
	'erlang',
	'ocaml',
	'fsharp',
	'scheme',
	'lisp', 'elisp',
	'clojure',
	
	// Other Languages
	'matlab',
	'fortran',
	'cobol',
	'pascal',
	'perl',
	'lua',
	'julia',
	'groovy',
	'crystal',
	'nim',
	'zig',
	
	// Domain Specific
	'regex',
	'gradle',
	'cmake',
	'makefile',
	'nix',
	'terraform',
	'solidity',
	'glsl',
	'hlsl',
	
	// Assembly
	'nasm',
	'masm',
	'armasm',
	
	// Game Development
	'gdscript',
	'unrealscript',
	
	// Others
	'abap',
	'actionscript',
	'ada',
	'agda',
	'antlr4',
	'applescript',
	'arduino',
	'coffeescript',
	'django',
	'erlang',
	'fortran',
	'haxe',
	'idris',
	'kotlin',
	'livescript',
	'matlab',
	'nginx',
	'pascal',
	'prolog',
	'puppet',
	'scala',
	'scheme',
	'tcl',
	'verilog',
	'vhdl'
]);

