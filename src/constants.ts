// Entry point elements
// These are the elements that will be used to find the main content
export const ENTRY_POINT_ELEMENTS = [
	'#post',
	'.post-content',
	'.post-body',
	'.article-content',
	'#article-content',
	'.article_post',
	'.article-wrapper',
	'.entry-content',
	'.content-article',
	'.instapaper_body',
	'.post',
	'.markdown-body',
	'article',
	'[role="article"]',
	'main',
	'[role="main"]',
	'.article-body',
	'#content',
	'body' // ensures there is always a match
];

export const MOBILE_WIDTH = 600;
export const BLOCK_ELEMENTS = ['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav', 'content'];
export const BLOCK_ELEMENTS_SELECTOR = BLOCK_ELEMENTS.join(',');
export const BLOCK_ELEMENTS_SET = new Set(BLOCK_ELEMENTS);

// All block-level HTML elements (includes BLOCK_ELEMENTS + semantic content blocks)
export const BLOCK_LEVEL_ELEMENTS = new Set([
	...BLOCK_ELEMENTS,
	'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'ul', 'ol', 'li', 'dl', 'dt', 'dd',
	'pre', 'blockquote', 'figure', 'figcaption',
	'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
	'details', 'summary', 'address', 'hr',
	'form', 'fieldset'
]);

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
	'sub', 'sup', 'mark', 'date', 'del', 'ins', 'q', 'abbr', 'cite', 'relative-time', 'time',
	'font'
]);

// Content element selectors — elements whose presence indicates real article
// content rather than navigation, promotional, or decorative material.
// Used to protect legitimate content from removal by scoring, content pattern
// detection, and other heuristics.
export const CONTENT_ELEMENT_SELECTOR = [
	'math', '[data-mathml]',
	'.katex', '.katex-mathml', '.katex-display',
	'.MathJax', '.MathJax_Display', '.MathJax_SVG',
	'mjx-container',
	'pre', 'code',
	'table',
	'img', 'picture', 'video',
	'blockquote',
	'figure',
].join(', ');

// Selectors to be removed
const HIDDEN_EXACT_SKIP_SELECTORS = [
	'[hidden]',
	'[aria-hidden="true"]',
	'.hidden',
	'.invisible',
];

const HIDDEN_EXACT_SELECTORS = HIDDEN_EXACT_SKIP_SELECTORS.map(s =>
	s === '[aria-hidden="true"]' ? '[aria-hidden="true"]:not([class*="math"])' : s
);

// Pre-joined selector strings (these arrays are constant)
export const HIDDEN_EXACT_SELECTOR = HIDDEN_EXACT_SELECTORS.join(',');
export const HIDDEN_EXACT_SKIP_SELECTOR = HIDDEN_EXACT_SKIP_SELECTORS.join(',');

export const EXACT_SELECTORS = [
	// scripts, styles
	'noscript',
	'script:not([type^="math/"])',
	'style',
	'meta',
	'link',

	// empty media elements (src set by JS at runtime, not in raw HTML)
	'audio:not([src])',

	// ads
	'.ad:not([class*="gradient"])',
	'[class^="ad-" i]',
	'[class$="-ad" i]',
	'[id^="ad-" i]',
	'[id$="-ad" i]',
	'[role="banner" i]',
	'[alt*="advert" i]',
	'.promo',
	'.Promo',
	'#barrier-page', // ft.com
	'.alert',

	// comments
	'[id="comments" i]',
	'[id="comment" i]',

	// cover images
	'div[class*="cover-"]',
	'div[id*="cover-"]',

	// breadcrumbs (custom web component tag)
	'ads-breadcrumbs',

	// header, nav
	// Exclude headers that contain paragraph text — some sites (e.g. Webflow blogs)
	// use <header> as the main content wrapper rather than a navigation container.
	'header:not(:has(p))',
	'.header:not(.banner)',
	'#header',
	'#Header',
	'#banner',
	'#Banner',
	'nav',
	'.navigation',
	'#navigation',
	// '.hero', // see issue #132
	'[role="navigation" i]',
	'[role="dialog" i]',
	'[role*="complementary" i]',
	'[class*="pagination" i]',
	'.menu',
	// '#menu', // see issue #106
	'#siteSub',
	// '.fixed', see issue #44
	'.previous',

	// metadata
	'.author',
	'.Author',
	'[class$="_bio"]',
	'#categories',
	'.contributor',
	'.date',
	'#date',
	'[data-date]',
	'.entry-meta',
	'.meta',
	'.tags',
	'#tags',
	'[rel="tag"]',
	'.toc',
	'.Toc',
	'#toc',
	'.headline',
	'#headline',
	'#title',
	'#Title',
	'#articleTag',
	// '[href*="/category"]', // see issue #131
	// '[href*="/categories"]', // see issue #131
	'[href*="/tag/"]',
	'[href*="/tags/"]',
	// '[href*="/topics"]', // see issue #131
	'[href*="/author/"]',
	'[href*="/author?"]',
	'[href$="/author"]',
	'a[href*="copyright.com"]',
	'a[href*="google.com/preferences"]',
	'[href*="#toc"]',
	'[href="#top"]',
	'[href="#Top"]',
	'[href="#page-header"]',
	'[href="#content"]',
	'[href="#site-content"]',
	'[href="#main-content"]',
	'[href^="#main"]',
	'[src*="author"]',

	// footer
	'footer',

	// inputs, forms, elements
	'.aside',
	'aside:not([class*="callout"])',
	'button',
		// '[role="button"]', Medium images
	'canvas',
	'date',
	'dialog',
	'fieldset',
	'form',
	'input:not([type="checkbox"])',
	'label',
	'option',
	'select',
	'[role="listbox"]',
	'[role="option"]',
	'textarea',
	// 'time', // see issue #136
	// 'relative-time', // see issue #136

	// hidden
	...HIDDEN_EXACT_SELECTORS,
	// Note: [style*="display: none"] removed — substring match causes false positives
	// with CSS custom properties like --footer-display: none. The removeHiddenElements
	// step handles inline style detection with a proper regex.

	// iframes
	'instaread-player',
	'iframe:not([src])',

	// logos
	'[class="logo" i]',
	'#logo',
	'#Logo',

	// newsletter
	'#newsletter',
	'#Newsletter',
	'.subscribe',

	// hidden for print
	'.noprint',
	'[data-print-layout="hide" i]',
	'[data-block="donotprint" i]',

	// footnotes, citations
	'[class*="clickable-icon" i]',
	'li span[class*="ltx_tag" i][class*="ltx_tag_item" i]',
	'a[href^="#"][class*="anchor" i]',
	'a[href^="#"][class*="ref" i]:not(.ltx_ref)',

	// link lists
	'[data-container*="most-viewed" i]',

	// sidebar
	'.sidebar',
	'.Sidebar',
	'#sidebar',
	'#Sidebar',
	'#side-bar',
	'#secondary',
	'#sitesub',

	// skip links
	'[data-link-name*="skip" i]',
	'[aria-label*="skip" i]',

	// other
	'.copyright',
	'#copyright',
	'.licensebox',
	'#page-info',
	'#rss',
	'#feed',
	'.gutter',
	'#primaryaudio', // NPR
	'#NYT_ABOVE_MAIN_CONTENT_REGION',
	'[data-testid="photoviewer-children-figure"] > span', // New York Times
	'table.infobox',
	'[data-optimizely="related-articles-section" i]', // The Economist
	'[data-orientation="vertical"]',
	'.gh-header-sticky', // GitHub
	'[data-testid="issue-metadata-sticky"]', // GitHub
];

export const EXACT_SELECTORS_JOINED = EXACT_SELECTORS.join(',');

// Attributes to test against for partial matches
export const TEST_ATTRIBUTES = [
	'class',
	'id',
	'data-component',
	'data-test',
	'data-testid',
	'data-test-id',
	'data-qa',
	'data-cy'
];

// Removal patterns tested against attributes above
// Case insensitive, partial matches allowed
export const PARTIAL_SELECTORS = [
	'a-statement',
	'(?<!main-)access-wall', // avoid matching data-test="main-access-wall" (content container)
	'activitypub',
	'actioncall',
	'addcomment',
	'addtoany',
	'advert',
//	'-ad-', howtogeek.com
	'adlayout',
	'ad-tldr',
	'ad-placement',
	'ads-container',
	'_ad_',
	'AdBlock_',
	'AdUnit',
	'after_content',
	'after_main_article',
	'afterpost',
	'allterms',
	'-alert-',
	'alert-box',
//	'appendix',
	'_archive',
	'around-the-web',
	'aroundpages',
	'article-author',
	'article-badges',
	'article-banner',
	'article-bottom-section',
	'article-bottom',
	'article-category',
	'article-card',
	'article-citation',
	'article__copy',
	'article_date',
	'article-date',
	'article-end ',
	'article_header',
	'article-header',
	'article__header',
	'article__hero',
	'article__info',
	'article-info',
	'article-meta',
	'article_meta',
	'article__meta',
	'articlename',
	'article-subject',
	'article_subject',
	'article-snippet',
	'article-separator',
	'article--share',
	'article-share',
	'article--topics',
	'articletags',
	'article-tags',
	'article_tags',
	'articletitle',
	'article-title',
	'article_title',
	'articletopics',
	'article-topics',
//	'article-type',
	'article-actions',
	'article--lede', // The Verge
	'articlewell',
	'associated-people',
	'ambient-video__button',
	'audio-card',
//	'author', Gwern
//	'-author',
	'author-bio',
	'author-box',
	'author-info',
	'author_info',
	'authorm',
	'author-mini-bio',
	'author-name',
	'author-publish-info',
	'authored-by',
	'avatar',

	'back-to-top',
	'backlink_container',
	'backlinks-section',
//	'banner',
	'bio-block',
	'biobox',
	'blog-pager',
	'bookmark-',
	'-bookmark',
	'bottominfo',
	'bottomnav',
	'bottom-of-article',
	'bottom-wrapper',
	'brand-bar',
	'bcrumb',
	'breadcrumb',
	'brdcrumb',
	'button-wrapper',
	'buttons-container',
	'btn-',
	'-btn',
	'byline',

	'captcha',
	'card-text',
	'card-media',
	'card-post',
//	'carousel',
	'carouselcontainer',
	'carousel-container',
	'cat_header',
	'catlinks',
	'_categories',
	'card-author',
	'card-content',
	'chapter-list', // The Economist
	'collections',
	'comments',
	'-comment', // comments in code blocks are skipped in removeBySelector
	'commentbox',
	'comment-button',
	'commentcomp',
	'comment-content',
	'comment-count',
	'comment-form',
	'comment-number',
	'comment-respond',
	'comment-thread',
	'comment-wrap',
	'complementary',
	'consent',
	'contact-',
	'content-card', // The Verge
	'copycontent',
	'content-topics',
	'contentpromo',
	'context-bar',
	'context-widget', // Reuters
	'core-collateral',
	'cover-image',
	'cover-photo',
	'cover-wrap',
	'created-date',
	'creative-commons_',
	'c-subscribe',
	'_cta',
	'-cta',
	'cta-',
	'cta_',
	'current-issue', // The Nation
	'custom-list-number',

	'dateline',
	'dateheader',
	'date-header',
	'date-pub',
//	'dialog',
	'disclaimer',
	'disclosure',
	'discussion',
	'discuss_',
	'-dismiss',
	'disqus',
	'donate',
	'donation',
	'dropdown', // Ars Technica

	'editorial_contact',
	'editorial-contact',
	'element-invisible',
	'elementor-shortcode',
	'eletters',
	'emailsignup',
	'emoji-bar',
	'engagement-widget',
	'enhancement-',
	'entry-author-info',
	'entry-categories',
	'entry-date',
//	'entry-meta',
	'entry-title',
	'entry-utility',
	'-error',
	'error-',
	'eyebrow',
	'expand-reduce',
	'external-anchor',
	'externallinkembedwrapper', // The New Yorker
	'extra-services',
	'extra-title',
	
	'facebook',
	'fancy-box',
	'favorite',
	'featured-content',
	'feature_feed',
	'feedback',
	'feed-links',
	'field-site-sections',
	'fixheader',
	'floating-vid',
//	'follow',
	'follower',
	'footer',
	'footnote-back',
	'footnoteback',
	'form-group',
	'for-you',
	'frontmatter',
	'further-reading',
	'fullbleedheader',
	
	'gallery-count',
	'gated-',
	'gh-feed',
	'gist-meta',
//	'global',
//	'google',
	'goog-',
	'graph-view',

	'hamburger',
	'header_logo',
	'header-logo',
	'header-pattern', // The Verge
//	'headlines', Mercurynews
	'hero-list',
//	'-hidden',
	'hide-for-print',
	'hide-print',
	'hide-when-no-script',
	'hidden-print',
	'hidden-sidenote',
	'hidden-accessibility',

	'infoline',
	'inline-topic',
	'instacartIntegration',
	'interlude',
	'interaction',
	'itemendrow',
	'intro-date',
	'invisible',

	'jp-no-solution',
	'jp-relatedposts',
	'jswarning',
	'js-warning',
	'jumplink',
	'jumpto',
	'jump-to-',
	'js-skip-to-content',

	'keepreading',
	'keep-reading',
	'keep_reading',
//	'keyword', // used in syntax highlighting
	'keyword_wrap',
	'kicker',

	'labstab', // Arxiv
	'-labels',
	'language-name',
	'lastupdated',
	'latest-content',
	'-ledes-', // The Verge
	'-license',
	'license-',
	'lightbox-popup',
	'like-button',
	'link-box',
	'links-grid', // BBC
	'links-title', // BBC
	'listing-dynamic-terms', // Boston Review
	'list-tags',
	'listinks',
	'loading',
	'loa-info',
	'logo_container',
	'ltx_role_refnum', // Arxiv
	'ltx_tag_bibitem',
	'ltx_error',

	'masthead',
	'marketing',
	'media-inquiry',
	'-menu',
	'menu-',
//	'meta-', syntax highlighting
	'metadata',
	'meta-bottom',
	'meta-date',
	'meta-row',
	'might-like',
	'minibio',
	'more-about',
	'mod-paywall',
	'_modal',
	'-modal',
	'more-',
	'morenews',
	'morestories',
	'more_wrapper',
	'most-read',
	'move-helper',
	'mw-editsection',
	'mw-cite-backlink',
	'mw-indicators',
	'mw-jump-link',

	'nav-',
	'nav_',
//	'navbar',
//	'navigation',
	'navigation-post',
	'next-',
	'next_prev',
	'no-script',
	'newsgallery',
	'news-story-title',
//	'newsletter', used on Substack
	'newsletter_',
	'newsletterbanner',
	'newslettercontainer',
	'newsletter-form',
	'newsletter-signup',
	'newslettersignup',
	'newsletterwidget',
	'newsletterwrapper',
	'not-found',
	'notessection',
	'nomobile',
	'noprint',

	'open-slideshow',
	'originally-published', // Mercury News
	'other-blogs',
	'outline-view',
//	'overlay',

	'pagehead',
	'page-header',
	'page-title',
	'paywall_message',
	'-partners',
	'permission-',
	'plea',
	'popular',
//	'popup', Gwern
	'popup_links',
//	'popover',
	'pop_stories',
	'pop-up',
	'post__author',
	'post-author',
	'post-bottom',
	'post__category',
	'postcomment',
	'postdate',
	'post-date',
	'post_date',
	'post-details',
	'post-feeds',
	'postinfo',
	'post-info',
	'post_info',
	'post-inline-date',
	'post-links',
	'postlist',
	'post_list',
	'post_meta',
	'post-meta',
	'postmeta',
	'post_more',
	'postnavi',
	'post-navigation',
	'postpath',
	'post-preview',
	'postsnippet',
	'post_snippet',
	'post-snippet',
	'post-subject',
	'posttax',
	'post-tax',
	'post_tax',
	'posttag',
	'post_tag',
	'post-tag',
	'post_time',
	'posttitle',
	'post-title',
	'post_title',
	'post__title',
	'post-ufi-button',
//	'preview', used on Obsidian Publish
	'prev-post',
	'prevnext',
	'prev_next',
	'prev-next',
	'previousnext',
	'press-inquiries',
	'print-none',
	'print-header',
	'print:hidden',
	'privacy-notice',
	'privacy-settings',
	'profile',
//	'promo',
	'promo_article',
	'promo-bar',
	'promo-box',
	'pubdate',
	'pub_date',
	'pub-date',
	'publish_date',
	'publish-date',
	'publication-date',
	'publicationName', // Medium

	'qr-code',
	'qr_code',
	'quick_up',

	'_rail',
	'ratingssection',
	'read_also',
	'readmore',
	'read-next',
	'read_next',
	'read_time',
	'read-time',
	'reading_time',
	'reading-time',
	'reading-list',
	'recent-',
	'recent-articles',
	'recentpost',
	'recent_post',
	'recent-post',
	'recommend',
	'redirectedfrom',
	'recirc',
	'register',
	'(?<!h[1-6]-)related',
	'relevant',
	'reversefootnote',
	'robots-nocontent',
	'_rss',
	'rss-link',

	'screen-reader-text',
	'scroll_to',
	'scroll-to',
	'_search',
	'-search',
	'section-nav',
	'series-banner',
//	'share',
//	'-share', scitechdaily.com
	'share-box',
	'sharedaddy',
	'share-icons',
	'sharelinks',
	'share-post',
	'share-print',
	'share-section',
	'sharing_',
	'shariff-',
	'show-for-print',
	'sidebartitle',
//	'sidebar_',
	'sidebar-content',
	'sidebar-wrapper',
	'sideitems',
	'sidebar-author',
	'sidebar-item',
	'side-box',
	'side-logo',
	'sign-in-gate',
	'similar-',
	'similar_',
	'similars-',
	'site-index',
	'site-header',
	'siteheader',
	'site-logo',
	'site-name',
	'site-wordpress',
//	'skip-',
	'skip-content',
	'skip-to-content',
	'skip-link',
	'c-skip-link',
	'_skip-link',
	'-slider',
	'slug-wrap',
//	'social',
	'social-author',
	'social-button',
	'social-shar',
	'social-date',
	'speechify-ignore',
	'speedbump',
	'sponsor',
	'springercitation',
	'sr-only',
//	'-stats',
	'_stats',
//	'sticky',
	'story-date',
	'story-navigation',
	'storyreadtime', // Medium
	'storysmall',
	'storypublishdate', // Medium
	'subject-label',
	'subhead',
	'submenu',
//	'subscribe',
	'-subscribe-',
	'subscriber-drive',
	'subscription-',

	'_tags',
	'tags__item',
	'tag_list',
	'tag-list',
	'taxonomy',
//	'table-content',
	'table-of-contents',
	'tblc',
	'tabs-',
//	'teaser', Nature
	'terminaltout',
	'time-rubric',
	'timestamp',
	'time-read',
	'time-to-read',
	'tip_off',
	'tiptout',
	'-tout-',
//	'-toc',
	'toc-container',
	'toggle-caption',
//	'toolbar', prism.js
	'tooltip-content',
	'topbar',
	'subnavbar',
	'topic-authors',
	'topic-footer',
	'topic-list',
	'topic-subnav',
//	'top-section',
	'top-wrapper',
	'tree-item',
	'trending',
	'trust-feat',
	'trust-badge',
	'trust-project',
	'chakra-badge',
	'twitter',
	'twiblock',

	'u-hide',
	'upsell',

	'viewbottom',
	'view-language',
	'yarpp-related',
	'visually-hidden',
	'welcomebox',
	'widget_pages',
//	'widget-'
	// Webflow form state messages — shown after form submit, never article content
	'w-form-done',
	'w-form-fail',
];

// Pre-compiled combined regex for PARTIAL_SELECTORS — avoids rebuilding on every parse
export const PARTIAL_SELECTORS_REGEX = new RegExp(PARTIAL_SELECTORS.join('|'), 'i');

// Attribute selector for elements we test partial matches against
export const TEST_ATTRIBUTES_SELECTOR = TEST_ATTRIBUTES.map(attr => `[${attr}]`).join(',');

// Selectors for footnotes and citations
export const FOOTNOTE_INLINE_REFERENCES = [
	'sup.reference',
	'cite.ltx_cite',
	'sup[id^="fnr"]',
	'span[id^="fnr"]',
	'span[class*="footnote_ref"]',
	'span[class*="footnote-ref"]',
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
	'sup.footnoteref', // Wikidot
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
	'div.footnote[data-component-name="FootnoteToDOM"]', // Substack
	'div.footnotes-footer', // Wikidot
	'div.footnote-definitions',
	'#footnotes' // standardizeFootnotes output container
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
	'data-latex',
	'data-src',
	'data-srcset',
	'data-callout',
	'data-callout-title',
	'data-lang',
	'dir',
	'display',
	'frameborder',
	'headers',
	'height',
	'href',
	'kind',
	'label',
	'lang',
	'role',
	'rowspan',
	'src',
	'srclang',
	'srcset',
	'title',
	'type',
	'width',

	// MathML attributes
	'accent',
	'accentunder',
	'align',
	'columnalign',
	'columnlines',
	'columnspacing',
	'columnspan',
	'data-mjx-texclass',
	'depth',
	'displaystyle',
	'fence',
	'frame',
	'framespacing',
	'linethickness',
	'lspace',
	'mathsize',
	'mathvariant',
	'maxsize',
	'minsize',
	'movablelimits',
	'notation',
	'rowalign',
	'rowlines',
	'rowspacing',
	'rowspan',
	'rspace',
	'scriptlevel',
	'separator',
	'stretchy',
	'symmetric',
	'voffset',
	'xmlns'
]);
export const ALLOWED_ATTRIBUTES_DEBUG = new Set([
	'class',
	'id',
]);
