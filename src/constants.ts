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
	s === '[aria-hidden="true"]' ? '[aria-hidden="true"]:not([class*="math"]):not(svg)' : s
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
	'[data-ad-wrapper]',
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
	// Exclude headers that contain multiple paragraphs — some sites (e.g. Webflow blogs)
	// use <header> as the main content wrapper rather than a navigation container.
	// A single <p> (subtitle/deck) is still a page header, not article content.
	'header:not(:has(p + p))',
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
	'.headline',
	'#headline',
	'#title',
	'#Title',
	'#articleTag',
	// '[href*="/category"]', // see issue #131
	// '[href*="/categories"]', // see issue #131
	// '[href*="/tag/"]',
	// '[href*="/tags/"]',
	// '[href*="/topics"]', // see issue #131
	'[href*="/author/"]',
	'[href*="/author?"]',
	'[href$="/author"]',
	'a[href*="copyright.com"]',
	'a[href*="google.com/preferences"]',
	'[href="#top"]',
	'[href="#Top"]',
	'[href="#page-header"]',
	'[href="#content"]',
	'[href="#site-content"]',
	'[href="#main-content"]',
	'[href^="#main"]',
	'[src*="author"]',

	// table of contents
	'.toc',
	'.Toc',
	'#toc',
	'[href*="#toc"]',

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

	// Substack inline clutter
	'[data-component-name="ButtonCreateButton"]',
	'[data-component-name="DigestPostEmbed"]',
	'[data-component-name="SubscribeWidgetToDOM"]',
	'[class*="digestPostEmbed"]', // class has hash suffix in browser-rendered DOM

	// hidden for print
	'.noprint',
	'[data-print-layout="hide" i]',
	'[data-block="donotprint" i]',

	// footnotes, citations
	'[class*="clickable-icon" i]',
	'li span[class*="ltx_tag" i][class*="ltx_tag_item" i]',
	'a[href^="#"][class*="anchor" i]',
	'a[href^="#"][class*="ref" i]:not(.ltx_ref):not(.footnote-backref)',

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

	// sitemap
	'[href*="/sitemap/sitemap.xml"]', // Medium.com

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
	'article-tools',
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
	'home-link',

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

	'onward-journey', // FT.com
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
//	'post_tag', https://opexnews.fr
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
	'tag-module',
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
	'-ticker',
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
	'sup[data-fn] > a[href^="#"]', // WordPress block editor footnotes
	'sup[id^="ftnt_ref"] a[href^="#ftnt"]', // Google Docs/Sites
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
	'ol.wp-block-footnotes', // WordPress block editor footnotes
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
	'data-callout-fold',
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

// Tailwind default color palette
export const TAILWIND_COLORS: Record<string, Record<string, string>> = {
	slate:   { '50':'#f8fafc','100':'#f1f5f9','200':'#e2e8f0','300':'#cbd5e1','400':'#94a3b8','500':'#64748b','600':'#475569','700':'#334155','800':'#1e293b','900':'#0f172a','950':'#020617' },
	gray:    { '50':'#f9fafb','100':'#f3f4f6','200':'#e5e7eb','300':'#d1d5db','400':'#9ca3af','500':'#6b7280','600':'#4b5563','700':'#374151','800':'#1f2937','900':'#111827','950':'#030712' },
	zinc:    { '50':'#fafafa','100':'#f4f4f5','200':'#e4e4e7','300':'#d4d4d8','400':'#a1a1aa','500':'#71717a','600':'#52525b','700':'#3f3f46','800':'#27272a','900':'#18181b','950':'#09090b' },
	neutral: { '50':'#fafafa','100':'#f5f5f5','200':'#e5e5e5','300':'#d4d4d4','400':'#a3a3a3','500':'#737373','600':'#525252','700':'#404040','800':'#262626','900':'#171717','950':'#0a0a0a' },
	stone:   { '50':'#fafaf9','100':'#f5f5f4','200':'#e7e5e4','300':'#d6d3d1','400':'#a8a29e','500':'#78716c','600':'#57534e','700':'#44403c','800':'#292524','900':'#1c1917','950':'#0c0a09' },
	red:     { '50':'#fef2f2','100':'#fee2e2','200':'#fecaca','300':'#fca5a5','400':'#f87171','500':'#ef4444','600':'#dc2626','700':'#b91c1c','800':'#991b1b','900':'#7f1d1d','950':'#450a0a' },
	orange:  { '50':'#fff7ed','100':'#ffedd5','200':'#fed7aa','300':'#fdba74','400':'#fb923c','500':'#f97316','600':'#ea580c','700':'#c2410c','800':'#9a3412','900':'#7c2d12','950':'#431407' },
	amber:   { '50':'#fffbeb','100':'#fef3c7','200':'#fde68a','300':'#fcd34d','400':'#fbbf24','500':'#f59e0b','600':'#d97706','700':'#b45309','800':'#92400e','900':'#78350f','950':'#451a03' },
	yellow:  { '50':'#fefce8','100':'#fef9c3','200':'#fef08a','300':'#fde047','400':'#facc15','500':'#eab308','600':'#ca8a04','700':'#a16207','800':'#854d0e','900':'#713f12','950':'#422006' },
	lime:    { '50':'#f7fee7','100':'#ecfccb','200':'#d9f99d','300':'#bef264','400':'#a3e635','500':'#84cc16','600':'#65a30d','700':'#4d7c0f','800':'#3f6212','900':'#365314','950':'#1a2e05' },
	green:   { '50':'#f0fdf4','100':'#dcfce7','200':'#bbf7d0','300':'#86efac','400':'#4ade80','500':'#22c55e','600':'#16a34a','700':'#15803d','800':'#166534','900':'#14532d','950':'#052e16' },
	emerald: { '50':'#ecfdf5','100':'#d1fae5','200':'#a7f3d0','300':'#6ee7b7','400':'#34d399','500':'#10b981','600':'#059669','700':'#047857','800':'#065f46','900':'#064e3b','950':'#022c22' },
	teal:    { '50':'#f0fdfa','100':'#ccfbf1','200':'#99f6e4','300':'#5eead4','400':'#2dd4bf','500':'#14b8a6','600':'#0d9488','700':'#0f766e','800':'#115e59','900':'#134e4a','950':'#042f2e' },
	cyan:    { '50':'#ecfeff','100':'#cffafe','200':'#a5f3fc','300':'#67e8f9','400':'#22d3ee','500':'#06b6d4','600':'#0891b2','700':'#0e7490','800':'#155e75','900':'#164e63','950':'#083344' },
	sky:     { '50':'#f0f9ff','100':'#e0f2fe','200':'#bae6fd','300':'#7dd3fc','400':'#38bdf8','500':'#0ea5e9','600':'#0284c7','700':'#0369a1','800':'#075985','900':'#0c4a6e','950':'#082f49' },
	blue:    { '50':'#eff6ff','100':'#dbeafe','200':'#bfdbfe','300':'#93c5fd','400':'#60a5fa','500':'#3b82f6','600':'#2563eb','700':'#1d4ed8','800':'#1e40af','900':'#1e3a8a','950':'#172554' },
	indigo:  { '50':'#eef2ff','100':'#e0e7ff','200':'#c7d2fe','300':'#a5b4fc','400':'#818cf8','500':'#6366f1','600':'#4f46e5','700':'#4338ca','800':'#3730a3','900':'#312e81','950':'#1e1b4b' },
	violet:  { '50':'#f5f3ff','100':'#ede9fe','200':'#ddd6fe','300':'#c4b5fd','400':'#a78bfa','500':'#8b5cf6','600':'#7c3aed','700':'#6d28d9','800':'#5b21b6','900':'#4c1d95','950':'#2e1065' },
	purple:  { '50':'#faf5ff','100':'#f3e8ff','200':'#e9d5ff','300':'#d8b4fe','400':'#c084fc','500':'#a855f7','600':'#9333ea','700':'#7e22ce','800':'#6b21a8','900':'#581c87','950':'#3b0764' },
	fuchsia: { '50':'#fdf4ff','100':'#fae8ff','200':'#f5d0fe','300':'#f0abfc','400':'#e879f9','500':'#d946ef','600':'#c026d3','700':'#a21caf','800':'#86198f','900':'#701a75','950':'#4a044e' },
	pink:    { '50':'#fdf2f8','100':'#fce7f3','200':'#fbcfe8','300':'#f9a8d4','400':'#f472b6','500':'#ec4899','600':'#db2777','700':'#be185d','800':'#9d174d','900':'#831843','950':'#500724' },
	rose:    { '50':'#fff1f2','100':'#ffe4e6','200':'#fecdd3','300':'#fda4af','400':'#fb7185','500':'#f43f5e','600':'#e11d48','700':'#be123c','800':'#9f1239','900':'#881337','950':'#4c0519' },
};
export const TAILWIND_SPECIAL: Record<string, string> = {
	black: '#000', white: '#fff', transparent: 'transparent', current: 'currentColor',
};
export const TW_COLOR_CLASS_RE = /^(fill|stroke)-([a-z]+)-(\d{2,3})(?:\/(\d+))?$/;
export const TW_SPECIAL_CLASS_RE = /^(fill|stroke)-(black|white|transparent|current)$/;
export const TW_ARBITRARY_RE = /^text-\[(.+)\]$/;
