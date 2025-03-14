(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Defuddle"] = factory();
	else
		root["Defuddle"] = factory();
})(typeof self !== "undefined" ? self : this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 608:
/*!*************************!*\
  !*** ./src/metadata.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetadataExtractor = void 0;
class MetadataExtractor {
    static extract(doc, schemaOrgData) {
        var _a, _b;
        let domain = '';
        let url = '';
        try {
            // Try to get URL from document location
            url = ((_a = doc.location) === null || _a === void 0 ? void 0 : _a.href) || '';
            // If no URL from location, try other sources
            if (!url) {
                url = this.getMetaContent(doc, "property", "og:url") ||
                    this.getMetaContent(doc, "property", "twitter:url") ||
                    this.getSchemaProperty(doc, schemaOrgData, 'url') ||
                    this.getSchemaProperty(doc, schemaOrgData, 'mainEntityOfPage.url') ||
                    this.getSchemaProperty(doc, schemaOrgData, 'mainEntity.url') ||
                    this.getSchemaProperty(doc, schemaOrgData, 'WebSite.url') ||
                    ((_b = doc.querySelector('link[rel="canonical"]')) === null || _b === void 0 ? void 0 : _b.getAttribute('href')) || '';
            }
            if (url) {
                domain = new URL(url).hostname.replace(/^www\./, '');
            }
        }
        catch (e) {
            // If URL parsing fails, try to get from base tag
            const baseTag = doc.querySelector('base[href]');
            if (baseTag) {
                try {
                    url = baseTag.getAttribute('href') || '';
                    domain = new URL(url).hostname.replace(/^www\./, '');
                }
                catch (e) {
                    console.warn('Failed to parse base URL:', e);
                }
            }
        }
        return {
            title: this.getTitle(doc, schemaOrgData),
            description: this.getDescription(doc, schemaOrgData),
            domain,
            favicon: this.getFavicon(doc, url),
            image: this.getImage(doc, schemaOrgData),
            published: this.getPublished(doc, schemaOrgData),
            author: this.getAuthor(doc, schemaOrgData),
            site: this.getSite(doc, schemaOrgData),
            schemaOrgData,
            wordCount: 0,
            parseTime: 0
        };
    }
    static getAuthor(doc, schemaOrgData) {
        return (this.getMetaContent(doc, "name", "sailthru.author") ||
            this.getSchemaProperty(doc, schemaOrgData, 'author.name') ||
            this.getMetaContent(doc, "property", "author") ||
            this.getMetaContent(doc, "name", "byl") ||
            this.getMetaContent(doc, "name", "author") ||
            this.getMetaContent(doc, "name", "authorList") ||
            this.getMetaContent(doc, "name", "copyright") ||
            this.getSchemaProperty(doc, schemaOrgData, 'copyrightHolder.name') ||
            this.getMetaContent(doc, "property", "og:site_name") ||
            this.getSchemaProperty(doc, schemaOrgData, 'publisher.name') ||
            this.getSchemaProperty(doc, schemaOrgData, 'sourceOrganization.name') ||
            this.getSchemaProperty(doc, schemaOrgData, 'isPartOf.name') ||
            this.getMetaContent(doc, "name", "twitter:creator") ||
            this.getMetaContent(doc, "name", "application-name") ||
            '');
    }
    static getSite(doc, schemaOrgData) {
        return (this.getSchemaProperty(doc, schemaOrgData, 'publisher.name') ||
            this.getMetaContent(doc, "property", "og:site_name") ||
            this.getSchemaProperty(doc, schemaOrgData, 'WebSite.name') ||
            this.getSchemaProperty(doc, schemaOrgData, 'sourceOrganization.name') ||
            this.getMetaContent(doc, "name", "copyright") ||
            this.getSchemaProperty(doc, schemaOrgData, 'copyrightHolder.name') ||
            this.getSchemaProperty(doc, schemaOrgData, 'isPartOf.name') ||
            this.getMetaContent(doc, "name", "application-name") ||
            this.getAuthor(doc, schemaOrgData) ||
            '');
    }
    static getTitle(doc, schemaOrgData) {
        var _a, _b;
        const rawTitle = (this.getMetaContent(doc, "property", "og:title") ||
            this.getMetaContent(doc, "name", "twitter:title") ||
            this.getSchemaProperty(doc, schemaOrgData, 'headline') ||
            this.getMetaContent(doc, "name", "title") ||
            this.getMetaContent(doc, "name", "sailthru.title") ||
            ((_b = (_a = doc.querySelector('title')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) ||
            '');
        return this.cleanTitle(rawTitle, this.getSite(doc, schemaOrgData));
    }
    static cleanTitle(title, siteName) {
        if (!title || !siteName)
            return title;
        // Remove site name if it exists
        const siteNameEscaped = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patterns = [
            `\\s*[\\|\\-–—]\\s*${siteNameEscaped}\\s*$`, // Title | Site Name
            `^\\s*${siteNameEscaped}\\s*[\\|\\-–—]\\s*`, // Site Name | Title
        ];
        for (const pattern of patterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(title)) {
                title = title.replace(regex, '');
                break;
            }
        }
        return title.trim();
    }
    static getDescription(doc, schemaOrgData) {
        return (this.getMetaContent(doc, "name", "description") ||
            this.getMetaContent(doc, "property", "description") ||
            this.getMetaContent(doc, "property", "og:description") ||
            this.getSchemaProperty(doc, schemaOrgData, 'description') ||
            this.getMetaContent(doc, "name", "twitter:description") ||
            this.getMetaContent(doc, "name", "sailthru.description") ||
            '');
    }
    static getImage(doc, schemaOrgData) {
        return (this.getMetaContent(doc, "property", "og:image") ||
            this.getMetaContent(doc, "name", "twitter:image") ||
            this.getSchemaProperty(doc, schemaOrgData, 'image.url') ||
            this.getMetaContent(doc, "name", "sailthru.image.full") ||
            '');
    }
    static getFavicon(doc, baseUrl) {
        var _a, _b;
        const iconFromMeta = this.getMetaContent(doc, "property", "og:image:favicon");
        if (iconFromMeta)
            return iconFromMeta;
        const iconLink = (_a = doc.querySelector("link[rel='icon']")) === null || _a === void 0 ? void 0 : _a.getAttribute("href");
        if (iconLink)
            return iconLink;
        const shortcutLink = (_b = doc.querySelector("link[rel='shortcut icon']")) === null || _b === void 0 ? void 0 : _b.getAttribute("href");
        if (shortcutLink)
            return shortcutLink;
        // Only try to construct favicon URL if we have a valid base URL
        if (baseUrl) {
            try {
                return new URL("/favicon.ico", baseUrl).href;
            }
            catch (e) {
                console.warn('Failed to construct favicon URL:', e);
            }
        }
        return '';
    }
    static getPublished(doc, schemaOrgData) {
        return (this.getSchemaProperty(doc, schemaOrgData, 'datePublished') ||
            this.getMetaContent(doc, "name", "publishDate") ||
            this.getMetaContent(doc, "property", "article:published_time") ||
            this.getTimeElement(doc) ||
            this.getMetaContent(doc, "name", "sailthru.date") ||
            '');
    }
    static getMetaContent(doc, attr, value) {
        var _a, _b;
        const selector = `meta[${attr}]`;
        const element = Array.from(doc.querySelectorAll(selector))
            .find(el => { var _a; return ((_a = el.getAttribute(attr)) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === value.toLowerCase(); });
        const content = element ? (_b = (_a = element.getAttribute("content")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "" : "";
        return this.decodeHTMLEntities(content, doc);
    }
    static getTimeElement(doc) {
        var _a, _b, _c, _d;
        const selector = `time`;
        const element = Array.from(doc.querySelectorAll(selector))[0];
        const content = element ? ((_d = (_b = (_a = element.getAttribute("datetime")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : (_c = element.textContent) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "") : "";
        return this.decodeHTMLEntities(content, doc);
    }
    static decodeHTMLEntities(text, doc) {
        const textarea = doc.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }
    static getSchemaProperty(doc, schemaOrgData, property, defaultValue = '') {
        if (!schemaOrgData)
            return defaultValue;
        const searchSchema = (data, props, fullPath, isExactMatch = true) => {
            if (typeof data === 'string') {
                return props.length === 0 ? [data] : [];
            }
            if (!data || typeof data !== 'object') {
                return [];
            }
            if (Array.isArray(data)) {
                const currentProp = props[0];
                if (/^\[\d+\]$/.test(currentProp)) {
                    const index = parseInt(currentProp.slice(1, -1));
                    if (data[index]) {
                        return searchSchema(data[index], props.slice(1), fullPath, isExactMatch);
                    }
                    return [];
                }
                if (props.length === 0 && data.every(item => typeof item === 'string' || typeof item === 'number')) {
                    return data.map(String);
                }
                return data.flatMap(item => searchSchema(item, props, fullPath, isExactMatch));
            }
            const [currentProp, ...remainingProps] = props;
            if (!currentProp) {
                if (typeof data === 'string')
                    return [data];
                if (typeof data === 'object' && data.name) {
                    return [data.name];
                }
                return [];
            }
            if (data.hasOwnProperty(currentProp)) {
                return searchSchema(data[currentProp], remainingProps, fullPath ? `${fullPath}.${currentProp}` : currentProp, true);
            }
            if (!isExactMatch) {
                const nestedResults = [];
                for (const key in data) {
                    if (typeof data[key] === 'object') {
                        const results = searchSchema(data[key], props, fullPath ? `${fullPath}.${key}` : key, false);
                        nestedResults.push(...results);
                    }
                }
                if (nestedResults.length > 0) {
                    return nestedResults;
                }
            }
            return [];
        };
        try {
            let results = searchSchema(schemaOrgData, property.split('.'), '', true);
            if (results.length === 0) {
                results = searchSchema(schemaOrgData, property.split('.'), '', false);
            }
            const result = results.length > 0 ? results.filter(Boolean).join(', ') : defaultValue;
            return this.decodeHTMLEntities(result, doc);
        }
        catch (error) {
            console.error(`Error in getSchemaProperty for ${property}:`, error);
            return defaultValue;
        }
    }
    static extractSchemaOrgData(doc) {
        const schemaScripts = doc.querySelectorAll('script[type="application/ld+json"]');
        const schemaData = [];
        schemaScripts.forEach(script => {
            let jsonContent = script.textContent || '';
            try {
                jsonContent = jsonContent
                    .replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '')
                    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
                    .replace(/^\s*(\*\/|\/\*)\s*|\s*(\*\/|\/\*)\s*$/g, '')
                    .trim();
                const jsonData = JSON.parse(jsonContent);
                if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
                    schemaData.push(...jsonData['@graph']);
                }
                else {
                    schemaData.push(jsonData);
                }
            }
            catch (error) {
                console.error('Error parsing schema.org data:', error);
                console.error('Problematic JSON content:', jsonContent);
            }
        });
        return schemaData;
    }
}
exports.MetadataExtractor = MetadataExtractor;


/***/ }),

/***/ 628:
/*!*************************!*\
  !*** ./src/defuddle.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Defuddle = void 0;
const metadata_1 = __webpack_require__(/*! ./metadata */ 608);
// Entry point elements
// These are the elements that will be used to find the main content
const ENTRY_POINT_ELEMENTS = [
    'article',
    '[role="article"]',
    '[itemprop="articleBody"]',
    '.post-content',
    '.article-content',
    '#article-content',
    '.content-article',
    'main',
    '[role="main"]',
    'body' // ensures there is always a match
];
const MOBILE_WIDTH = 600;
const BLOCK_ELEMENTS = ['div', 'section', 'article', 'main'];
// Hidden elements that should be removed
const HIDDEN_ELEMENT_SELECTORS = [
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
const EXACT_SELECTORS = [
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
    '#NYT_ABOVE_MAIN_CONTENT_REGION',
    '[data-testid="photoviewer-children-figure"] > span', // New York Times
    'table.infobox',
    '.pencraft:not(.pc-display-contents)', // Substack
    '[data-optimizely="related-articles-section" i]' // The Economist
];
// Removal patterns tested against attributes: class, id, data-testid, and data-qa
// Case insensitive, partial matches allowed
const PARTIAL_SELECTORS = [
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
    'article-tags',
    'article_tags',
    'article-title',
    'article_title',
    'articletopics',
    'article-topics',
    'article-type',
    'article--lede', // The Verge
    'associated-people',
    //	'author', Gwern
    'author-name',
    'back-to-top',
    'backlinks-section',
    'banner',
    'bio-block',
    'blog-pager',
    'bottom-of-article',
    'brand-bar',
    'breadcrumb',
    'button-wrapper',
    'btn-',
    '-btn',
    'byline',
    'captcha',
    'cat_header',
    'catlinks',
    'chapter-list', // The Economist
    'collections',
    'comments',
    //	'-comment', Syntax highlighting
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
    'hidden-sidenote',
    'interlude',
    'interaction',
    'jumplink',
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
    'share-icons',
    'sharelinks',
    'share-section',
    'sidebartitle',
    'sidebar_',
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
    'social',
    'speechify-ignore',
    'sponsor',
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
];
// Selectors for footnotes and citations
const FOOTNOTE_INLINE_REFERENCES = [
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
const FOOTNOTE_LIST_SELECTORS = [
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
const ALLOWED_EMPTY_ELEMENTS = new Set([
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
const ALLOWED_ATTRIBUTES = new Set([
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
    'dir',
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
// Supported languages for code blocks
const SUPPORTED_LANGUAGES = new Set([
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
const ELEMENT_STANDARDIZATION_RULES = [
    // Code blocks
    {
        selector: 'pre',
        element: 'pre',
        transform: (el) => {
            if (!(el instanceof HTMLElement))
                return el;
            // Function to get language from class
            const getLanguageFromClass = (element) => {
                // Check data-lang attribute first
                const dataLang = element.getAttribute('data-lang');
                if (dataLang) {
                    return dataLang.toLowerCase();
                }
                // Define language patterns
                const languagePatterns = [
                    /^language-(\w+)$/, // language-javascript
                    /^lang-(\w+)$/, // lang-javascript
                    /^(\w+)-code$/, // javascript-code
                    /^code-(\w+)$/, // code-javascript
                    /^syntax-(\w+)$/, // syntax-javascript
                    /^code-snippet__(\w+)$/, // code-snippet__javascript
                    /^highlight-(\w+)$/, // highlight-javascript
                    /^(\w+)-snippet$/ // javascript-snippet
                ];
                // Then check the class attribute for patterns
                if (element.className && typeof element.className === 'string') {
                    for (const pattern of languagePatterns) {
                        const match = element.className.toLowerCase().match(pattern);
                        if (match) {
                            return match[1].toLowerCase();
                        }
                    }
                    // Then check for supported language
                    if (SUPPORTED_LANGUAGES.has(element.className.toLowerCase())) {
                        return element.className.toLowerCase();
                    }
                }
                const classNames = Array.from(element.classList);
                for (const className of classNames) {
                    // Check patterns first
                    for (const pattern of languagePatterns) {
                        const match = className.match(pattern);
                        if (match) {
                            return match[1].toLowerCase();
                        }
                    }
                }
                // Only check bare language names if no patterns were found
                for (const className of classNames) {
                    if (SUPPORTED_LANGUAGES.has(className.toLowerCase())) {
                        return className.toLowerCase();
                    }
                }
                return '';
            };
            // Try to get the language from the element and its ancestors
            let language = '';
            let currentElement = el;
            while (currentElement && !language) {
                language = getLanguageFromClass(currentElement);
                // Also check for code elements within the current element
                if (!language && currentElement.querySelector('code')) {
                    language = getLanguageFromClass(currentElement.querySelector('code'));
                }
                currentElement = currentElement.parentElement;
            }
            // Function to recursively extract text content while preserving structure
            const extractStructuredText = (element) => {
                if (element.nodeType === Node.TEXT_NODE) {
                    return element.textContent || '';
                }
                let text = '';
                if (element instanceof HTMLElement) {
                    // Handle line breaks
                    if (element.tagName === 'BR') {
                        return '\n';
                    }
                    // Handle code elements and their children
                    element.childNodes.forEach(child => {
                        text += extractStructuredText(child);
                    });
                    // Add newline after each code element
                    if (element.tagName === 'CODE') {
                        text += '\n';
                    }
                }
                return text;
            };
            // Extract all text content
            let codeContent = extractStructuredText(el);
            // Clean up the content
            codeContent = codeContent
                // Remove any extra newlines at the start
                .replace(/^\n+/, '')
                // Remove any extra newlines at the end
                .replace(/\n+$/, '')
                // Replace multiple consecutive newlines with a single newline
                .replace(/\n{3,}/g, '\n\n');
            // Create new pre element
            const newPre = document.createElement('pre');
            // Copy allowed attributes
            Array.from(el.attributes).forEach(attr => {
                if (ALLOWED_ATTRIBUTES.has(attr.name)) {
                    newPre.setAttribute(attr.name, attr.value);
                }
            });
            // Create code element
            const code = document.createElement('code');
            if (language) {
                code.setAttribute('data-lang', language);
                code.setAttribute('class', `language-${language}`);
            }
            code.textContent = codeContent;
            newPre.appendChild(code);
            return newPre;
        }
    },
    // Simplify headings by removing internal navigation elements
    {
        selector: 'h1, h2, h3, h4, h5, h6',
        element: 'keep',
        transform: (el) => {
            var _a, _b, _c, _d, _e;
            // If heading only contains a single anchor with internal link
            if (el.children.length === 1 &&
                ((_a = el.firstElementChild) === null || _a === void 0 ? void 0 : _a.tagName) === 'A' &&
                (((_b = el.firstElementChild.getAttribute('href')) === null || _b === void 0 ? void 0 : _b.includes('#')) ||
                    ((_c = el.firstElementChild.getAttribute('href')) === null || _c === void 0 ? void 0 : _c.startsWith('#')))) {
                // Create new heading of same level
                const newHeading = document.createElement(el.tagName);
                // Copy allowed attributes from original heading
                Array.from(el.attributes).forEach(attr => {
                    if (ALLOWED_ATTRIBUTES.has(attr.name)) {
                        newHeading.setAttribute(attr.name, attr.value);
                    }
                });
                // Just use the text content
                newHeading.textContent = ((_d = el.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
                return newHeading;
            }
            // If heading contains navigation buttons or other utility elements
            const buttons = el.querySelectorAll('button');
            if (buttons.length > 0) {
                const newHeading = document.createElement(el.tagName);
                // Copy allowed attributes
                Array.from(el.attributes).forEach(attr => {
                    if (ALLOWED_ATTRIBUTES.has(attr.name)) {
                        newHeading.setAttribute(attr.name, attr.value);
                    }
                });
                // Just use the text content
                newHeading.textContent = ((_e = el.textContent) === null || _e === void 0 ? void 0 : _e.trim()) || '';
                return newHeading;
            }
            return el;
        }
    },
    // Convert divs with paragraph role to actual paragraphs
    {
        selector: 'div[data-testid^="paragraph"], div[role="paragraph"]',
        element: 'p',
        transform: (el) => {
            const p = document.createElement('p');
            // Copy innerHTML
            p.innerHTML = el.innerHTML;
            // Copy allowed attributes
            Array.from(el.attributes).forEach(attr => {
                if (ALLOWED_ATTRIBUTES.has(attr.name)) {
                    p.setAttribute(attr.name, attr.value);
                }
            });
            return p;
        }
    },
    // Convert divs with list roles to actual lists
    {
        selector: 'div[role="list"]',
        element: 'ul',
        // Custom handler for list type detection and transformation
        transform: (el) => {
            var _a;
            // First determine if this is an ordered list
            const firstItem = el.querySelector('div[role="listitem"] .label');
            const label = ((_a = firstItem === null || firstItem === void 0 ? void 0 : firstItem.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            const isOrdered = label.match(/^\d+\)/);
            // Create the appropriate list type
            const list = document.createElement(isOrdered ? 'ol' : 'ul');
            // Process each list item
            const items = el.querySelectorAll('div[role="listitem"]');
            items.forEach(item => {
                const li = document.createElement('li');
                const content = item.querySelector('.content');
                if (content) {
                    // Convert any paragraph divs inside content
                    const paragraphDivs = content.querySelectorAll('div[role="paragraph"]');
                    paragraphDivs.forEach(div => {
                        const p = document.createElement('p');
                        p.innerHTML = div.innerHTML;
                        div.replaceWith(p);
                    });
                    // Convert any nested lists recursively
                    const nestedLists = content.querySelectorAll('div[role="list"]');
                    nestedLists.forEach(nestedList => {
                        var _a;
                        const firstNestedItem = nestedList.querySelector('div[role="listitem"] .label');
                        const nestedLabel = ((_a = firstNestedItem === null || firstNestedItem === void 0 ? void 0 : firstNestedItem.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                        const isNestedOrdered = nestedLabel.match(/^\d+\)/);
                        const newNestedList = document.createElement(isNestedOrdered ? 'ol' : 'ul');
                        // Process nested items
                        const nestedItems = nestedList.querySelectorAll('div[role="listitem"]');
                        nestedItems.forEach(nestedItem => {
                            const nestedLi = document.createElement('li');
                            const nestedContent = nestedItem.querySelector('.content');
                            if (nestedContent) {
                                // Convert paragraph divs in nested items
                                const nestedParagraphs = nestedContent.querySelectorAll('div[role="paragraph"]');
                                nestedParagraphs.forEach(div => {
                                    const p = document.createElement('p');
                                    p.innerHTML = div.innerHTML;
                                    div.replaceWith(p);
                                });
                                nestedLi.innerHTML = nestedContent.innerHTML;
                            }
                            newNestedList.appendChild(nestedLi);
                        });
                        nestedList.replaceWith(newNestedList);
                    });
                    li.innerHTML = content.innerHTML;
                }
                list.appendChild(li);
            });
            return list;
        }
    },
    {
        selector: 'div[role="listitem"]',
        element: 'li',
        // Custom handler for list item content
        transform: (el) => {
            const content = el.querySelector('.content');
            if (!content)
                return el;
            // Convert any paragraph divs inside content
            const paragraphDivs = content.querySelectorAll('div[role="paragraph"]');
            paragraphDivs.forEach(div => {
                const p = document.createElement('p');
                p.innerHTML = div.innerHTML;
                div.replaceWith(p);
            });
            return content;
        }
    },
    // Code blocks with syntax highlighting
    {
        selector: '.wp-block-syntaxhighlighter-code, .syntaxhighlighter, .highlight, .highlight-source, .wp-block-code, pre[class*="language-"], pre[class*="brush:"]',
        element: 'pre',
        transform: (el) => {
            if (!(el instanceof HTMLElement))
                return el;
            // Create new pre element
            const newPre = document.createElement('pre');
            // Try to detect language
            let language = '';
            // Check for WordPress syntax highlighter specific format
            const syntaxEl = el.querySelector('.syntaxhighlighter');
            if (syntaxEl) {
                // Get language from syntaxhighlighter class
                const classes = Array.from(syntaxEl.classList);
                const langClass = classes.find(c => !['syntaxhighlighter', 'nogutter'].includes(c));
                if (langClass && SUPPORTED_LANGUAGES.has(langClass.toLowerCase())) {
                    language = langClass.toLowerCase();
                }
            }
            // If no language found yet, check other common patterns
            if (!language) {
                const classNames = Array.from(el.classList);
                const languagePatterns = [
                    /(?:^|\s)(?:language|lang|brush|syntax)-(\w+)(?:\s|$)/i,
                    /(?:^|\s)(\w+)(?:\s|$)/i
                ];
                for (const className of classNames) {
                    for (const pattern of languagePatterns) {
                        const match = className.match(pattern);
                        if (match && match[1] && SUPPORTED_LANGUAGES.has(match[1].toLowerCase())) {
                            language = match[1].toLowerCase();
                            break;
                        }
                    }
                    if (language)
                        break;
                }
            }
            // Extract code content, handling various formats
            let codeContent = '';
            // Handle WordPress syntax highlighter table format
            const codeContainer = el.querySelector('.syntaxhighlighter table .code .container');
            if (codeContainer) {
                // Process each line
                const lines = Array.from(codeContainer.children);
                codeContent = lines
                    .map(line => {
                    // Get all code elements in this line
                    const codeParts = Array.from(line.querySelectorAll('code'))
                        .map(code => {
                        // Get the text content, preserving spaces
                        let text = code.textContent || '';
                        // If this is a 'spaces' class element, convert to actual spaces
                        if (code.classList.contains('spaces')) {
                            text = ' '.repeat(text.length);
                        }
                        return text;
                    })
                        .join('');
                    return codeParts || line.textContent || '';
                })
                    .join('\n');
            }
            else {
                // Handle WordPress syntax highlighter non-table format
                const codeLines = el.querySelectorAll('.code .line');
                if (codeLines.length > 0) {
                    codeContent = Array.from(codeLines)
                        .map(line => {
                        const codeParts = Array.from(line.querySelectorAll('code'))
                            .map(code => code.textContent || '')
                            .join('');
                        return codeParts || line.textContent || '';
                    })
                        .join('\n');
                }
                else {
                    // Fallback to regular text content
                    codeContent = el.textContent || '';
                }
            }
            // Clean up the content
            codeContent = codeContent
                .replace(/^\s+|\s+$/g, '') // Trim start/end whitespace
                .replace(/\t/g, '    ') // Convert tabs to spaces
                .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
                .replace(/\u00a0/g, ' '); // Replace non-breaking spaces with regular spaces
            // Create code element with language class if detected
            const code = document.createElement('code');
            if (language) {
                code.setAttribute('data-lang', language);
                code.setAttribute('class', `language-${language}`);
            }
            code.textContent = codeContent;
            newPre.appendChild(code);
            return newPre;
        }
    }
];
class Defuddle {
    /**
     * Create a new Defuddle instance
     * @param doc - The document to parse
     * @param options - Options for parsing
     */
    constructor(doc, options = {}) {
        this.doc = doc;
        this.options = options;
        this.debug = options.debug || false;
    }
    /**
     * Parse the document and extract its main content
     */
    parse() {
        const startTime = performance.now();
        // Extract metadata first since we'll need it in multiple places
        const schemaOrgData = metadata_1.MetadataExtractor.extractSchemaOrgData(this.doc);
        const metadata = metadata_1.MetadataExtractor.extract(this.doc, schemaOrgData);
        try {
            // Evaluate styles and sizes on original document
            const mobileStyles = this._evaluateMediaQueries(this.doc);
            // Check for small images in original document, excluding lazy-loaded ones
            const smallImages = this.findSmallImages(this.doc);
            // Clone document
            const clone = this.doc.cloneNode(true);
            // Apply mobile style to clone
            this.applyMobileStyles(clone, mobileStyles);
            // Find main content
            const mainContent = this.findMainContent(clone);
            if (!mainContent) {
                const endTime = performance.now();
                return Object.assign(Object.assign({ content: this.doc.body.innerHTML }, metadata), { wordCount: this.countWords(this.doc.body.innerHTML), parseTime: Math.round(endTime - startTime) });
            }
            // Remove small images identified from original document
            this.removeSmallImages(clone, smallImages);
            // Perform other destructive operations on the clone
            this.removeHiddenElements(clone);
            this.removeClutter(clone);
            // Clean up the main content
            this.cleanContent(mainContent, metadata);
            const content = mainContent ? mainContent.outerHTML : this.doc.body.innerHTML;
            const endTime = performance.now();
            return Object.assign(Object.assign({ content }, metadata), { wordCount: this.countWords(content), parseTime: Math.round(endTime - startTime) });
        }
        catch (error) {
            console.error('Defuddle', 'Error processing document:', error);
            const endTime = performance.now();
            return Object.assign(Object.assign({ content: this.doc.body.innerHTML }, metadata), { wordCount: this.countWords(this.doc.body.innerHTML), parseTime: Math.round(endTime - startTime) });
        }
    }
    countWords(content) {
        // Create a temporary div to parse HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        // Get text content, removing extra whitespace
        const text = tempDiv.textContent || '';
        const words = text
            .trim()
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .split(' ')
            .filter(word => word.length > 0); // Filter out empty strings
        return words.length;
    }
    // Make all other methods private by removing the static keyword and using private
    _log(...args) {
        if (this.debug) {
            console.log('Defuddle:', ...args);
        }
    }
    _evaluateMediaQueries(doc) {
        const mobileStyles = [];
        const maxWidthRegex = /max-width[^:]*:\s*(\d+)/;
        try {
            // Get all styles, including inline styles
            const sheets = Array.from(doc.styleSheets).filter(sheet => {
                try {
                    // Access rules once to check validity
                    sheet.cssRules;
                    return true;
                }
                catch (e) {
                    // Expected error for cross-origin stylesheets
                    if (e instanceof DOMException && e.name === 'SecurityError') {
                        return false;
                    }
                    throw e;
                }
            });
            // Process all sheets in a single pass
            const mediaRules = sheets.flatMap(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .filter((rule) => rule instanceof CSSMediaRule &&
                        rule.conditionText.includes('max-width'));
                }
                catch (e) {
                    if (this.debug) {
                        console.warn('Defuddle: Failed to process stylesheet:', e);
                    }
                    return [];
                }
            });
            // Process all media rules in a single pass
            mediaRules.forEach(rule => {
                const match = rule.conditionText.match(maxWidthRegex);
                if (match) {
                    const maxWidth = parseInt(match[1]);
                    if (MOBILE_WIDTH <= maxWidth) {
                        // Batch process all style rules
                        const styleRules = Array.from(rule.cssRules)
                            .filter((r) => r instanceof CSSStyleRule);
                        styleRules.forEach(cssRule => {
                            try {
                                mobileStyles.push({
                                    selector: cssRule.selectorText,
                                    styles: cssRule.style.cssText
                                });
                            }
                            catch (e) {
                                if (this.debug) {
                                    console.warn('Defuddle: Failed to process CSS rule:', e);
                                }
                            }
                        });
                    }
                }
            });
        }
        catch (e) {
            console.error('Defuddle: Error evaluating media queries:', e);
        }
        return mobileStyles;
    }
    applyMobileStyles(doc, mobileStyles) {
        let appliedCount = 0;
        mobileStyles.forEach(({ selector, styles }) => {
            try {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(element => {
                    element.setAttribute('style', (element.getAttribute('style') || '') + styles);
                    appliedCount++;
                });
            }
            catch (e) {
                console.error('Defuddle', 'Error applying styles for selector:', selector, e);
            }
        });
    }
    removeHiddenElements(doc) {
        let count = 0;
        const elementsToRemove = new Set();
        // First pass: Get all elements matching hidden selectors
        const hiddenElements = doc.querySelectorAll(HIDDEN_ELEMENT_SELECTORS);
        hiddenElements.forEach(el => elementsToRemove.add(el));
        count += hiddenElements.length;
        // Second pass: Use TreeWalker for efficient traversal
        const treeWalker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
                // Skip elements already marked for removal
                if (elementsToRemove.has(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        // Batch style computations
        const elements = [];
        let currentNode;
        while (currentNode = treeWalker.nextNode()) {
            elements.push(currentNode);
        }
        // Process styles in batches to minimize layout thrashing
        const BATCH_SIZE = 100;
        for (let i = 0; i < elements.length; i += BATCH_SIZE) {
            const batch = elements.slice(i, i + BATCH_SIZE);
            // Read phase - gather all computedStyles
            const styles = batch.map(el => window.getComputedStyle(el));
            // Write phase - mark elements for removal
            batch.forEach((element, index) => {
                const computedStyle = styles[index];
                if (computedStyle.display === 'none' ||
                    computedStyle.visibility === 'hidden' ||
                    computedStyle.opacity === '0') {
                    elementsToRemove.add(element);
                    count++;
                }
            });
        }
        // Final pass: Batch remove all hidden elements
        elementsToRemove.forEach(el => el.remove());
        this._log('Removed hidden elements:', count);
    }
    removeClutter(doc) {
        const startTime = performance.now();
        let exactSelectorCount = 0;
        let partialSelectorCount = 0;
        // Track all elements to be removed
        const elementsToRemove = new Set();
        // First collect elements matching exact selectors
        const exactElements = doc.querySelectorAll(EXACT_SELECTORS.join(','));
        exactElements.forEach(el => {
            if (el === null || el === void 0 ? void 0 : el.parentNode) {
                elementsToRemove.add(el);
                exactSelectorCount++;
            }
        });
        // Pre-compile regexes and combine into a single regex for better performance
        const combinedPattern = PARTIAL_SELECTORS.join('|');
        const partialRegex = new RegExp(combinedPattern, 'i');
        // Create an efficient attribute selector for elements we care about
        const attributeSelector = '[class],[id],[data-testid],[data-qa],[data-cy]';
        const allElements = doc.querySelectorAll(attributeSelector);
        // Process elements for partial matches
        allElements.forEach(el => {
            // Skip if already marked for removal
            if (elementsToRemove.has(el)) {
                return;
            }
            // Get all relevant attributes and combine into a single string
            const attrs = [
                el.className && typeof el.className === 'string' ? el.className : '',
                el.id || '',
                el.getAttribute('data-testid') || '',
                el.getAttribute('data-qa') || '',
                el.getAttribute('data-cy') || ''
            ].join(' ').toLowerCase();
            // Skip if no attributes to check
            if (!attrs.trim()) {
                return;
            }
            // Check for partial match using single regex test
            if (partialRegex.test(attrs)) {
                elementsToRemove.add(el);
                partialSelectorCount++;
            }
        });
        // Remove all collected elements in a single pass
        elementsToRemove.forEach(el => el.remove());
        const endTime = performance.now();
        this._log('Removed clutter elements:', {
            exactSelectors: exactSelectorCount,
            partialSelectors: partialSelectorCount,
            total: elementsToRemove.size,
            processingTime: `${(endTime - startTime).toFixed(2)}ms`
        });
    }
    flattenDivs(element) {
        let processedCount = 0;
        const startTime = performance.now();
        // Process in batches to maintain performance
        const BATCH_SIZE = 100;
        let keepProcessing = true;
        // Elements that should not be unwrapped
        const PRESERVE_ELEMENTS = new Set([
            'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
            'ul', 'ol', 'li', 'dl', 'dt', 'dd',
            'figure', 'figcaption',
            'details', 'summary',
            'blockquote',
            'form', 'fieldset'
        ]);
        // Inline elements that should not be unwrapped
        const INLINE_ELEMENTS = new Set([
            'a', 'span', 'strong', 'em', 'i', 'b', 'u', 'code', 'br', 'small',
            'sub', 'sup', 'mark', 'del', 'ins', 'q', 'abbr', 'cite', 'time'
        ]);
        const shouldPreserveElement = (el) => {
            const tagName = el.tagName.toLowerCase();
            // Check if element should be preserved
            if (PRESERVE_ELEMENTS.has(tagName))
                return true;
            // Check for semantic roles
            const role = el.getAttribute('role');
            if (role && ['article', 'main', 'navigation', 'banner', 'contentinfo'].includes(role)) {
                return true;
            }
            // Check for semantic classes
            const className = el.className.toLowerCase();
            if (className.match(/(?:article|main|content|footnote|reference|bibliography)/)) {
                return true;
            }
            return false;
        };
        while (keepProcessing) {
            keepProcessing = false;
            const divs = Array.from(element.getElementsByTagName('div'));
            // Process divs in batches
            for (let i = 0; i < divs.length; i += BATCH_SIZE) {
                const batch = divs.slice(i, i + BATCH_SIZE);
                let batchModified = false;
                batch.forEach(div => {
                    var _a, _b, _c;
                    // Skip processing if div has been removed or should be preserved
                    if (!div.isConnected || shouldPreserveElement(div))
                        return;
                    // Case 1: Empty div or div with only whitespace
                    if (!div.hasChildNodes() || !((_a = div.textContent) === null || _a === void 0 ? void 0 : _a.trim())) {
                        div.remove();
                        processedCount++;
                        batchModified = true;
                        return;
                    }
                    // Case 2: Div only contains text content - convert to paragraph
                    if (!div.children.length && ((_b = div.textContent) === null || _b === void 0 ? void 0 : _b.trim())) {
                        const p = document.createElement('p');
                        p.textContent = div.textContent;
                        div.replaceWith(p);
                        processedCount++;
                        batchModified = true;
                        return;
                    }
                    // Case 3: Div has single child
                    if (div.children.length === 1) {
                        const child = div.firstElementChild;
                        const childTag = child.tagName.toLowerCase();
                        // Don't unwrap if child is inline or should be preserved
                        if (!INLINE_ELEMENTS.has(childTag) && !shouldPreserveElement(child)) {
                            div.replaceWith(child);
                            processedCount++;
                            batchModified = true;
                            return;
                        }
                    }
                    // Case 4: Div only contains other divs - merge up
                    const children = Array.from(div.children);
                    const onlyDivs = children.every(child => child.tagName.toLowerCase() === 'div' &&
                        !shouldPreserveElement(child));
                    if (onlyDivs && children.length > 0) {
                        const fragment = document.createDocumentFragment();
                        while (div.firstChild) {
                            // If child is a div, move its children instead
                            const child = div.firstChild;
                            if (child instanceof Element && child.tagName.toLowerCase() === 'div') {
                                while (child.firstChild) {
                                    fragment.appendChild(child.firstChild);
                                }
                                child.remove();
                            }
                            else {
                                fragment.appendChild(child);
                            }
                        }
                        div.replaceWith(fragment);
                        processedCount++;
                        batchModified = true;
                        return;
                    }
                    // Case 5: Div is purely for layout - merge children up if no semantic value
                    const style = window.getComputedStyle(div);
                    const isLayoutDiv = (div.className.match(/(?:grid|flex|layout|container|wrapper|row|col|section)/i) ||
                        style.display === 'grid' ||
                        style.display === 'flex' ||
                        (div.children.length > 0 && !((_c = div.textContent) === null || _c === void 0 ? void 0 : _c.trim())) // Empty parent with children
                    );
                    if (isLayoutDiv && div.children.length > 0) {
                        const fragment = document.createDocumentFragment();
                        while (div.firstChild) {
                            fragment.appendChild(div.firstChild);
                        }
                        div.replaceWith(fragment);
                        processedCount++;
                        batchModified = true;
                    }
                });
                if (batchModified) {
                    keepProcessing = true;
                }
            }
        }
        const endTime = performance.now();
        this._log('Flattened divs:', {
            count: processedCount,
            processingTime: `${(endTime - startTime).toFixed(2)}ms`
        });
    }
    cleanContent(element, metadata) {
        // Remove HTML comments
        this.removeHtmlComments(element);
        // Handle H1 elements - remove first one and convert others to H2
        this.handleHeadings(element, metadata.title);
        // Standardize footnotes and citations
        this.standardizeFootnotes(element);
        // Handle lazy-loaded images
        this.handleLazyImages(element);
        // Convert embedded content to standard formats
        this.standardizeElements(element);
        // Strip unwanted attributes
        this.stripUnwantedAttributes(element);
        // Remove empty elements
        this.removeEmptyElements(element);
        // Flatten unnecessary div elements
        this.flattenDivs(element);
        // Remove trailing headings
        this.removeTrailingHeadings(element);
    }
    removeTrailingHeadings(element) {
        let removedCount = 0;
        const hasContentAfter = (el) => {
            // Check if there's any meaningful content after this element
            let nextContent = '';
            let sibling = el.nextSibling;
            // First check direct siblings
            while (sibling) {
                if (sibling.nodeType === Node.TEXT_NODE) {
                    nextContent += sibling.textContent || '';
                }
                else if (sibling.nodeType === Node.ELEMENT_NODE) {
                    // If we find an element sibling, check its content
                    nextContent += sibling.textContent || '';
                }
                sibling = sibling.nextSibling;
            }
            // If we found meaningful content at this level, return true
            if (nextContent.trim()) {
                return true;
            }
            // If no content found at this level and we have a parent,
            // check for content after the parent
            const parent = el.parentElement;
            if (parent && parent !== element) {
                return hasContentAfter(parent);
            }
            return false;
        };
        // Process all headings from bottom to top
        const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .reverse();
        headings.forEach(heading => {
            if (!hasContentAfter(heading)) {
                heading.remove();
                removedCount++;
            }
            else {
                // Stop processing once we find a heading with content after it
                return;
            }
        });
        if (removedCount > 0) {
            this._log('Removed trailing headings:', removedCount);
        }
    }
    handleHeadings(element, title) {
        var _a;
        const h1s = element.getElementsByTagName('h1');
        Array.from(h1s).forEach(h1 => {
            var _a;
            const h2 = document.createElement('h2');
            h2.innerHTML = h1.innerHTML;
            // Copy allowed attributes
            Array.from(h1.attributes).forEach(attr => {
                if (ALLOWED_ATTRIBUTES.has(attr.name)) {
                    h2.setAttribute(attr.name, attr.value);
                }
            });
            (_a = h1.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(h2, h1);
        });
        // Remove first H2 if it matches title
        const h2s = element.getElementsByTagName('h2');
        if (h2s.length > 0) {
            const firstH2 = h2s[0];
            const firstH2Text = ((_a = firstH2.textContent) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) || '';
            const normalizedTitle = title.toLowerCase().trim();
            if (normalizedTitle && normalizedTitle === firstH2Text) {
                firstH2.remove();
            }
        }
    }
    removeHtmlComments(element) {
        const comments = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_COMMENT, null);
        let node;
        while (node = walker.nextNode()) {
            comments.push(node);
        }
        comments.forEach(comment => {
            comment.remove();
        });
        this._log('Removed HTML comments:', comments.length);
    }
    stripUnwantedAttributes(element) {
        let attributeCount = 0;
        const processElement = (el) => {
            // Skip SVG elements - preserve all their attributes
            if (el instanceof SVGElement) {
                return;
            }
            const attributes = Array.from(el.attributes);
            attributes.forEach(attr => {
                const attrName = attr.name.toLowerCase();
                if (!ALLOWED_ATTRIBUTES.has(attrName)) {
                    el.removeAttribute(attr.name);
                    attributeCount++;
                }
            });
        };
        processElement(element);
        element.querySelectorAll('*').forEach(processElement);
        this._log('Stripped attributes:', attributeCount);
    }
    removeEmptyElements(element) {
        let removedCount = 0;
        let iterations = 0;
        let keepRemoving = true;
        while (keepRemoving) {
            iterations++;
            keepRemoving = false;
            // Get all elements without children, working from deepest first
            const emptyElements = Array.from(element.getElementsByTagName('*')).filter(el => {
                if (ALLOWED_EMPTY_ELEMENTS.has(el.tagName.toLowerCase())) {
                    return false;
                }
                // Check if element has only whitespace or &nbsp;
                const textContent = el.textContent || '';
                const hasOnlyWhitespace = textContent.trim().length === 0;
                const hasNbsp = textContent.includes('\u00A0'); // Unicode non-breaking space
                // Check if element has no meaningful children
                const hasNoChildren = !el.hasChildNodes() ||
                    (Array.from(el.childNodes).every(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const nodeText = node.textContent || '';
                            return nodeText.trim().length === 0 && !nodeText.includes('\u00A0');
                        }
                        return false;
                    }));
                return hasOnlyWhitespace && !hasNbsp && hasNoChildren;
            });
            if (emptyElements.length > 0) {
                emptyElements.forEach(el => {
                    el.remove();
                    removedCount++;
                });
                keepRemoving = true;
            }
        }
        this._log('Removed empty elements:', {
            count: removedCount,
            iterations
        });
    }
    createFootnoteItem(footnoteNumber, content, refs) {
        const newItem = document.createElement('li');
        newItem.className = 'footnote';
        newItem.id = `fn:${footnoteNumber}`;
        // Handle content
        if (typeof content === 'string') {
            const paragraph = document.createElement('p');
            paragraph.innerHTML = content;
            newItem.appendChild(paragraph);
        }
        else {
            // Get all paragraphs from the content
            const paragraphs = Array.from(content.querySelectorAll('p'));
            if (paragraphs.length === 0) {
                // If no paragraphs, wrap content in a paragraph
                const paragraph = document.createElement('p');
                paragraph.innerHTML = content.innerHTML;
                newItem.appendChild(paragraph);
            }
            else {
                // Copy existing paragraphs
                paragraphs.forEach(p => {
                    const newP = document.createElement('p');
                    newP.innerHTML = p.innerHTML;
                    newItem.appendChild(newP);
                });
            }
        }
        // Add backlink(s) to the last paragraph
        const lastParagraph = newItem.querySelector('p:last-of-type') || newItem;
        refs.forEach((refId, index) => {
            const backlink = document.createElement('a');
            backlink.href = `#${refId}`;
            backlink.title = 'return to article';
            backlink.className = 'footnote-backref';
            backlink.innerHTML = '↩';
            if (index < refs.length - 1) {
                backlink.innerHTML += ' ';
            }
            lastParagraph.appendChild(backlink);
        });
        return newItem;
    }
    collectFootnotes(element) {
        const footnotes = {};
        let footnoteCount = 1;
        const processedIds = new Set(); // Track processed IDs
        // Collect all footnotes and their IDs from footnote lists
        const footnoteLists = element.querySelectorAll(FOOTNOTE_LIST_SELECTORS);
        footnoteLists.forEach(list => {
            // Substack has individual footnote divs with no parent
            if (list.matches('div.footnote[data-component-name="FootnoteToDOM"]')) {
                const anchor = list.querySelector('a.footnote-number');
                const content = list.querySelector('.footnote-content');
                if (anchor && content) {
                    const id = anchor.id.replace('footnote-', '').toLowerCase();
                    if (id && !processedIds.has(id)) {
                        footnotes[footnoteCount] = {
                            content: content,
                            originalId: id,
                            refs: []
                        };
                        processedIds.add(id);
                        footnoteCount++;
                    }
                }
                return;
            }
            // Common format using OL/UL and LI elements
            const items = list.querySelectorAll('li, div[role="listitem"]');
            items.forEach(li => {
                var _a, _b, _c, _d;
                let id = '';
                let content = null;
                // Handle citations with .citations class
                const citationsDiv = li.querySelector('.citations');
                if ((_a = citationsDiv === null || citationsDiv === void 0 ? void 0 : citationsDiv.id) === null || _a === void 0 ? void 0 : _a.toLowerCase().startsWith('r')) {
                    id = citationsDiv.id.toLowerCase();
                    // Look for citation content within the citations div
                    const citationContent = citationsDiv.querySelector('.citation-content');
                    if (citationContent) {
                        content = citationContent;
                    }
                }
                else {
                    // Extract ID from various formats
                    if (li.id.toLowerCase().startsWith('bib.bib')) {
                        id = li.id.replace('bib.bib', '').toLowerCase();
                    }
                    else if (li.id.toLowerCase().startsWith('fn:')) {
                        id = li.id.replace('fn:', '').toLowerCase();
                    }
                    else if (li.id.toLowerCase().startsWith('fn')) {
                        id = li.id.replace('fn', '').toLowerCase();
                        // Nature.com
                    }
                    else if (li.hasAttribute('data-counter')) {
                        id = ((_c = (_b = li.getAttribute('data-counter')) === null || _b === void 0 ? void 0 : _b.replace(/\.$/, '')) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || '';
                    }
                    else {
                        const match = (_d = li.id.split('/').pop()) === null || _d === void 0 ? void 0 : _d.match(/cite_note-(.+)/);
                        id = match ? match[1].toLowerCase() : li.id.toLowerCase();
                    }
                    content = li;
                }
                if (id && !processedIds.has(id)) {
                    footnotes[footnoteCount] = {
                        content: content || li,
                        originalId: id,
                        refs: []
                    };
                    processedIds.add(id);
                    footnoteCount++;
                }
            });
        });
        return footnotes;
    }
    findOuterFootnoteContainer(el) {
        let current = el;
        let parent = el.parentElement;
        // Keep going up until we find an element that's not a span or sup
        while (parent && (parent.tagName.toLowerCase() === 'span' ||
            parent.tagName.toLowerCase() === 'sup')) {
            current = parent;
            parent = parent.parentElement;
        }
        return current;
    }
    // Every footnote reference should be a sup element with an anchor inside
    // e.g. <sup id="fnref:1"><a href="#fn:1">1</a></sup>
    createFootnoteReference(footnoteNumber, refId) {
        const sup = document.createElement('sup');
        sup.id = refId;
        const link = document.createElement('a');
        link.href = `#fn:${footnoteNumber}`;
        link.textContent = footnoteNumber;
        sup.appendChild(link);
        return sup;
    }
    standardizeFootnotes(element) {
        const footnotes = this.collectFootnotes(element);
        // Standardize inline footnotes using the collected IDs
        const footnoteInlineReferences = element.querySelectorAll(FOOTNOTE_INLINE_REFERENCES);
        // Group references by their parent sup element
        const supGroups = new Map();
        footnoteInlineReferences.forEach(el => {
            var _a, _b, _c, _d;
            if (!(el instanceof HTMLElement))
                return;
            let footnoteId = '';
            let footnoteContent = '';
            // Extract footnote ID based on element type
            // Nature.com
            if (el.matches('a[id^="ref-link"]')) {
                footnoteId = ((_a = el.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                // Science.org
            }
            else if (el.matches('a[role="doc-biblioref"]')) {
                const xmlRid = el.getAttribute('data-xml-rid');
                if (xmlRid) {
                    footnoteId = xmlRid;
                }
                else {
                    const href = el.getAttribute('href');
                    if (href === null || href === void 0 ? void 0 : href.startsWith('#core-R')) {
                        footnoteId = href.replace('#core-', '');
                    }
                }
                // Substack
            }
            else if (el.matches('a.footnote-anchor, span.footnote-hovercard-target a')) {
                const id = ((_b = el.id) === null || _b === void 0 ? void 0 : _b.replace('footnote-anchor-', '')) || '';
                if (id) {
                    footnoteId = id.toLowerCase();
                }
                // Arxiv
            }
            else if (el.matches('cite.ltx_cite')) {
                const link = el.querySelector('a');
                if (link) {
                    const href = link.getAttribute('href');
                    if (href) {
                        const match = (_c = href.split('/').pop()) === null || _c === void 0 ? void 0 : _c.match(/bib\.bib(\d+)/);
                        if (match) {
                            footnoteId = match[1].toLowerCase();
                        }
                    }
                }
            }
            else if (el.matches('sup.reference')) {
                const links = el.querySelectorAll('a');
                Array.from(links).forEach(link => {
                    var _a;
                    const href = link.getAttribute('href');
                    if (href) {
                        const match = (_a = href.split('/').pop()) === null || _a === void 0 ? void 0 : _a.match(/(?:cite_note|cite_ref)-(.+)/);
                        if (match) {
                            footnoteId = match[1].toLowerCase();
                        }
                    }
                });
            }
            else if (el.matches('sup[id^="fnref:"]')) {
                footnoteId = el.id.replace('fnref:', '').toLowerCase();
            }
            else if (el.matches('sup[id^="fnr"]')) {
                footnoteId = el.id.replace('fnr', '').toLowerCase();
            }
            else if (el.matches('span.footnote-reference')) {
                footnoteId = el.getAttribute('data-footnote-id') || '';
            }
            else if (el.matches('span.footnote-link')) {
                footnoteId = el.getAttribute('data-footnote-id') || '';
                footnoteContent = el.getAttribute('data-footnote-content') || '';
            }
            else if (el.matches('a.citation')) {
                footnoteId = ((_d = el.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || '';
                footnoteContent = el.getAttribute('href') || '';
            }
            else if (el.matches('a[id^="fnref"]')) {
                footnoteId = el.id.replace('fnref', '').toLowerCase();
            }
            else {
                // Other citation types
                const href = el.getAttribute('href');
                if (href) {
                    const id = href.replace(/^[#]/, '');
                    footnoteId = id.toLowerCase();
                }
            }
            if (footnoteId) {
                // Find the footnote number by matching the original ID
                const footnoteEntry = Object.entries(footnotes).find(([_, data]) => data.originalId === footnoteId.toLowerCase());
                if (footnoteEntry) {
                    const [footnoteNumber, footnoteData] = footnoteEntry;
                    // Create footnote reference ID
                    const refId = footnoteData.refs.length > 0 ?
                        `fnref:${footnoteNumber}-${footnoteData.refs.length + 1}` :
                        `fnref:${footnoteNumber}`;
                    footnoteData.refs.push(refId);
                    // Find the outermost container (span or sup)
                    const container = this.findOuterFootnoteContainer(el);
                    // If container is a sup, group references
                    if (container.tagName.toLowerCase() === 'sup') {
                        if (!supGroups.has(container)) {
                            supGroups.set(container, []);
                        }
                        const group = supGroups.get(container);
                        group.push(this.createFootnoteReference(footnoteNumber, refId));
                    }
                    else {
                        // Replace the container directly
                        container.replaceWith(this.createFootnoteReference(footnoteNumber, refId));
                    }
                }
            }
        });
        // Handle grouped references
        supGroups.forEach((references, container) => {
            if (references.length > 0) {
                // Create a document fragment to hold all the references
                const fragment = document.createDocumentFragment();
                // Add each reference as its own sup element
                references.forEach((ref, index) => {
                    const link = ref.querySelector('a');
                    if (link) {
                        const sup = document.createElement('sup');
                        sup.id = ref.id;
                        sup.appendChild(link.cloneNode(true));
                        fragment.appendChild(sup);
                    }
                });
                container.replaceWith(fragment);
            }
        });
        // Create the standardized footnote list
        const newList = document.createElement('footnotes');
        newList.className = 'footnotes';
        const orderedList = document.createElement('ol');
        // Create footnote items in order
        Object.entries(footnotes).forEach(([number, data]) => {
            const newItem = this.createFootnoteItem(parseInt(number), data.content, data.refs);
            orderedList.appendChild(newItem);
        });
        // Remove original footnote lists
        const footnoteLists = element.querySelectorAll(FOOTNOTE_LIST_SELECTORS);
        footnoteLists.forEach(list => list.remove());
        // If we have any footnotes, add the new list to the document
        if (orderedList.children.length > 0) {
            newList.appendChild(orderedList);
            element.appendChild(newList);
        }
    }
    handleLazyImages(element) {
        let processedCount = 0;
        const lazyImages = element.querySelectorAll('img[data-src], img[data-srcset]');
        lazyImages.forEach(img => {
            if (!(img instanceof HTMLImageElement))
                return;
            // Handle data-src
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc && !img.src) {
                img.src = dataSrc;
                processedCount++;
            }
            // Handle data-srcset
            const dataSrcset = img.getAttribute('data-srcset');
            if (dataSrcset && !img.srcset) {
                img.srcset = dataSrcset;
                processedCount++;
            }
            // Remove lazy loading related classes and attributes
            img.classList.remove('lazy', 'lazyload');
            img.removeAttribute('data-ll-status');
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
        });
        this._log('Processed lazy images:', processedCount);
    }
    standardizeElements(element) {
        let processedCount = 0;
        // Convert elements based on standardization rules
        ELEMENT_STANDARDIZATION_RULES.forEach(rule => {
            const elements = element.querySelectorAll(rule.selector);
            elements.forEach(el => {
                if (rule.transform) {
                    // If there's a transform function, use it to create the new element
                    const transformed = rule.transform(el);
                    el.replaceWith(transformed);
                    processedCount++;
                }
            });
        });
        // Convert lite-youtube elements
        const liteYoutubeElements = element.querySelectorAll('lite-youtube');
        liteYoutubeElements.forEach(el => {
            const videoId = el.getAttribute('videoid');
            if (!videoId)
                return;
            const iframe = document.createElement('iframe');
            iframe.width = '560';
            iframe.height = '315';
            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            iframe.title = el.getAttribute('videotitle') || 'YouTube video player';
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.setAttribute('allowfullscreen', '');
            el.replaceWith(iframe);
            processedCount++;
        });
        // Add future embed conversions (Twitter, Instagram, etc.)
        this._log('Converted embedded elements:', processedCount);
    }
    // Find small IMG and SVG elements
    findSmallImages(doc) {
        const MIN_DIMENSION = 33;
        const smallImages = new Set();
        const transformRegex = /scale\(([\d.]+)\)/;
        const startTime = performance.now();
        let processedCount = 0;
        // 1. Read phase - Gather all elements in a single pass
        const elements = [
            ...Array.from(doc.getElementsByTagName('img')),
            ...Array.from(doc.getElementsByTagName('svg'))
        ].filter(element => {
            // Skip lazy-loaded images that haven't been processed yet
            if (element instanceof HTMLImageElement) {
                const isLazy = element.classList.contains('lazy') ||
                    element.classList.contains('lazyload') ||
                    element.hasAttribute('data-src') ||
                    element.hasAttribute('data-srcset');
                return !isLazy;
            }
            return true;
        });
        if (elements.length === 0) {
            return smallImages;
        }
        // 2. Batch process - Collect all measurements in one go
        const measurements = elements.map(element => ({
            element,
            // Static attributes (no reflow)
            naturalWidth: element instanceof HTMLImageElement ? element.naturalWidth : 0,
            naturalHeight: element instanceof HTMLImageElement ? element.naturalHeight : 0,
            attrWidth: parseInt(element.getAttribute('width') || '0'),
            attrHeight: parseInt(element.getAttribute('height') || '0')
        }));
        // 3. Batch compute styles - Process in chunks to avoid long tasks
        const BATCH_SIZE = 50;
        for (let i = 0; i < measurements.length; i += BATCH_SIZE) {
            const batch = measurements.slice(i, i + BATCH_SIZE);
            try {
                // Read phase - compute all styles at once
                const styles = batch.map(({ element }) => window.getComputedStyle(element));
                const rects = batch.map(({ element }) => element.getBoundingClientRect());
                // Process phase - no DOM operations
                batch.forEach((measurement, index) => {
                    var _a;
                    try {
                        const style = styles[index];
                        const rect = rects[index];
                        // Get transform scale in the same batch
                        const transform = style.transform;
                        const scale = transform ?
                            parseFloat(((_a = transform.match(transformRegex)) === null || _a === void 0 ? void 0 : _a[1]) || '1') : 1;
                        // Calculate effective dimensions
                        const widths = [
                            measurement.naturalWidth,
                            measurement.attrWidth,
                            parseInt(style.width) || 0,
                            rect.width * scale
                        ].filter(dim => typeof dim === 'number' && dim > 0);
                        const heights = [
                            measurement.naturalHeight,
                            measurement.attrHeight,
                            parseInt(style.height) || 0,
                            rect.height * scale
                        ].filter(dim => typeof dim === 'number' && dim > 0);
                        // Decision phase - no DOM operations
                        if (widths.length > 0 && heights.length > 0) {
                            const effectiveWidth = Math.min(...widths);
                            const effectiveHeight = Math.min(...heights);
                            if (effectiveWidth < MIN_DIMENSION || effectiveHeight < MIN_DIMENSION) {
                                const identifier = this.getElementIdentifier(measurement.element);
                                if (identifier) {
                                    smallImages.add(identifier);
                                    processedCount++;
                                }
                            }
                        }
                    }
                    catch (e) {
                        if (this.debug) {
                            console.warn('Defuddle: Failed to process element dimensions:', e);
                        }
                    }
                });
            }
            catch (e) {
                if (this.debug) {
                    console.warn('Defuddle: Failed to process batch:', e);
                }
            }
        }
        const endTime = performance.now();
        this._log('Found small elements:', {
            count: processedCount,
            totalElements: elements.length,
            processingTime: `${(endTime - startTime).toFixed(2)}ms`
        });
        return smallImages;
    }
    removeSmallImages(doc, smallImages) {
        let removedCount = 0;
        ['img', 'svg'].forEach(tag => {
            const elements = doc.getElementsByTagName(tag);
            Array.from(elements).forEach(element => {
                const identifier = this.getElementIdentifier(element);
                if (identifier && smallImages.has(identifier)) {
                    element.remove();
                    removedCount++;
                }
            });
        });
        this._log('Removed small elements:', removedCount);
    }
    getElementIdentifier(element) {
        // Try to create a unique identifier using various attributes
        if (element instanceof HTMLImageElement) {
            // For lazy-loaded images, use data-src as identifier if available
            const dataSrc = element.getAttribute('data-src');
            if (dataSrc)
                return `src:${dataSrc}`;
            const src = element.src || '';
            const srcset = element.srcset || '';
            const dataSrcset = element.getAttribute('data-srcset');
            if (src)
                return `src:${src}`;
            if (srcset)
                return `srcset:${srcset}`;
            if (dataSrcset)
                return `srcset:${dataSrcset}`;
        }
        const id = element.id || '';
        const className = element.className || '';
        const viewBox = element instanceof SVGElement ? element.getAttribute('viewBox') || '' : '';
        if (id)
            return `id:${id}`;
        if (viewBox)
            return `viewBox:${viewBox}`;
        if (className)
            return `class:${className}`;
        return null;
    }
    findMainContent(doc) {
        // Find all potential content containers
        const candidates = [];
        ENTRY_POINT_ELEMENTS.forEach((selector, index) => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(element => {
                // Base score from selector priority (earlier = higher)
                let score = (ENTRY_POINT_ELEMENTS.length - index) * 10;
                // Add score based on content analysis
                score += this.scoreElement(element);
                candidates.push({ element, score });
            });
        });
        if (candidates.length === 0) {
            // Fall back to scoring block elements
            // Currently <body> element is used as the fallback, so this is not used
            return this.findContentByScoring(doc);
        }
        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);
        if (this.debug) {
            this._log('Content candidates:', candidates.map(c => ({
                element: c.element.tagName,
                selector: this.getElementSelector(c.element),
                score: c.score
            })));
        }
        return candidates[0].element;
    }
    findContentByScoring(doc) {
        const candidates = this.scoreElements(doc);
        return candidates.length > 0 ? candidates[0].element : null;
    }
    getElementSelector(element) {
        const parts = [];
        let current = element;
        while (current && current !== this.doc.documentElement) {
            let selector = current.tagName.toLowerCase();
            if (current.id) {
                selector += '#' + current.id;
            }
            else if (current.className && typeof current.className === 'string') {
                selector += '.' + current.className.trim().split(/\s+/).join('.');
            }
            parts.unshift(selector);
            current = current.parentElement;
        }
        return parts.join(' > ');
    }
    scoreElements(doc) {
        const candidates = [];
        BLOCK_ELEMENTS.forEach((tag) => {
            Array.from(doc.getElementsByTagName(tag)).forEach((element) => {
                const score = this.scoreElement(element);
                if (score > 0) {
                    candidates.push({ score, element });
                }
            });
        });
        return candidates.sort((a, b) => b.score - a.score);
    }
    scoreElement(element) {
        let score = 0;
        // Score based on element properties
        const className = element.className && typeof element.className === 'string' ?
            element.className.toLowerCase() : '';
        const id = element.id ? element.id.toLowerCase() : '';
        // Score based on content
        const text = element.textContent || '';
        const words = text.split(/\s+/).length;
        score += Math.min(Math.floor(words / 100), 3);
        // Score based on link density
        const links = element.getElementsByTagName('a');
        const linkText = Array.from(links).reduce((acc, link) => { var _a; return acc + (((_a = link.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        const linkDensity = text.length ? linkText / text.length : 0;
        if (linkDensity > 0.5) {
            score -= 10;
        }
        // Score based on presence of meaningful elements
        const paragraphs = element.getElementsByTagName('p').length;
        score += paragraphs;
        const images = element.getElementsByTagName('img').length;
        score += Math.min(images * 3, 9);
        return score;
    }
}
exports.Defuddle = Defuddle;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Defuddle = void 0;
var defuddle_1 = __webpack_require__(/*! ./defuddle */ 628);
Object.defineProperty(exports, "Defuddle", ({ enumerable: true, get: function () { return defuddle_1.Defuddle; } }));

})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ozs7OztBQ3RCQSw0REFBc0M7QUFBN0IsNkdBQVEiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9EZWZ1ZGRsZS93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vRGVmdWRkbGUvLi9zcmMvbWV0YWRhdGEudHMiLCJ3ZWJwYWNrOi8vRGVmdWRkbGUvLi9zcmMvZGVmdWRkbGUudHMiLCJ3ZWJwYWNrOi8vRGVmdWRkbGUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vRGVmdWRkbGUvLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiRGVmdWRkbGVcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiRGVmdWRkbGVcIl0gPSBmYWN0b3J5KCk7XG59KSh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0aGlzLCAoKSA9PiB7XG5yZXR1cm4gIiwiaW1wb3J0IHsgRGVmdWRkbGVNZXRhZGF0YSB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWV0YWRhdGFFeHRyYWN0b3Ige1xuXHRzdGF0aWMgZXh0cmFjdChkb2M6IERvY3VtZW50LCBzY2hlbWFPcmdEYXRhOiBhbnkpOiBEZWZ1ZGRsZU1ldGFkYXRhIHtcblx0XHRsZXQgZG9tYWluID0gJyc7XG5cdFx0bGV0IHVybCA9ICcnO1xuXG5cdFx0dHJ5IHtcblx0XHRcdC8vIFRyeSB0byBnZXQgVVJMIGZyb20gZG9jdW1lbnQgbG9jYXRpb25cblx0XHRcdHVybCA9IGRvYy5sb2NhdGlvbj8uaHJlZiB8fCAnJztcblx0XHRcdFxuXHRcdFx0Ly8gSWYgbm8gVVJMIGZyb20gbG9jYXRpb24sIHRyeSBvdGhlciBzb3VyY2VzXG5cdFx0XHRpZiAoIXVybCkge1xuXHRcdFx0XHR1cmwgPSB0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcIm9nOnVybFwiKSB8fFxuXHRcdFx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwidHdpdHRlcjp1cmxcIikgfHxcblx0XHRcdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ3VybCcpIHx8XG5cdFx0XHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdtYWluRW50aXR5T2ZQYWdlLnVybCcpIHx8XG5cdFx0XHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdtYWluRW50aXR5LnVybCcpIHx8XG5cdFx0XHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdXZWJTaXRlLnVybCcpIHx8XG5cdFx0XHRcdFx0ZG9jLnF1ZXJ5U2VsZWN0b3IoJ2xpbmtbcmVsPVwiY2Fub25pY2FsXCJdJyk/LmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodXJsKSB7XG5cdFx0XHRcdGRvbWFpbiA9IG5ldyBVUkwodXJsKS5ob3N0bmFtZS5yZXBsYWNlKC9ed3d3XFwuLywgJycpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdC8vIElmIFVSTCBwYXJzaW5nIGZhaWxzLCB0cnkgdG8gZ2V0IGZyb20gYmFzZSB0YWdcblx0XHRcdGNvbnN0IGJhc2VUYWcgPSBkb2MucXVlcnlTZWxlY3RvcignYmFzZVtocmVmXScpO1xuXHRcdFx0aWYgKGJhc2VUYWcpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR1cmwgPSBiYXNlVGFnLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnO1xuXHRcdFx0XHRcdGRvbWFpbiA9IG5ldyBVUkwodXJsKS5ob3N0bmFtZS5yZXBsYWNlKC9ed3d3XFwuLywgJycpO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKCdGYWlsZWQgdG8gcGFyc2UgYmFzZSBVUkw6JywgZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dGl0bGU6IHRoaXMuZ2V0VGl0bGUoZG9jLCBzY2hlbWFPcmdEYXRhKSxcblx0XHRcdGRlc2NyaXB0aW9uOiB0aGlzLmdldERlc2NyaXB0aW9uKGRvYywgc2NoZW1hT3JnRGF0YSksXG5cdFx0XHRkb21haW4sXG5cdFx0XHRmYXZpY29uOiB0aGlzLmdldEZhdmljb24oZG9jLCB1cmwpLFxuXHRcdFx0aW1hZ2U6IHRoaXMuZ2V0SW1hZ2UoZG9jLCBzY2hlbWFPcmdEYXRhKSxcblx0XHRcdHB1Ymxpc2hlZDogdGhpcy5nZXRQdWJsaXNoZWQoZG9jLCBzY2hlbWFPcmdEYXRhKSxcblx0XHRcdGF1dGhvcjogdGhpcy5nZXRBdXRob3IoZG9jLCBzY2hlbWFPcmdEYXRhKSxcblx0XHRcdHNpdGU6IHRoaXMuZ2V0U2l0ZShkb2MsIHNjaGVtYU9yZ0RhdGEpLFxuXHRcdFx0c2NoZW1hT3JnRGF0YSxcblx0XHRcdHdvcmRDb3VudDogMCxcblx0XHRcdHBhcnNlVGltZTogMFxuXHRcdH07XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRBdXRob3IoZG9jOiBEb2N1bWVudCwgc2NoZW1hT3JnRGF0YTogYW55KTogc3RyaW5nIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInNhaWx0aHJ1LmF1dGhvclwiKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdhdXRob3IubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcImF1dGhvclwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcImJ5bFwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcImF1dGhvclwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcImF1dGhvckxpc3RcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJjb3B5cmlnaHRcIikgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnY29weXJpZ2h0SG9sZGVyLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJvZzpzaXRlX25hbWVcIikgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAncHVibGlzaGVyLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdzb3VyY2VPcmdhbml6YXRpb24ubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2lzUGFydE9mLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInR3aXR0ZXI6Y3JlYXRvclwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcImFwcGxpY2F0aW9uLW5hbWVcIikgfHxcblx0XHRcdCcnXG5cdFx0KTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldFNpdGUoZG9jOiBEb2N1bWVudCwgc2NoZW1hT3JnRGF0YTogYW55KTogc3RyaW5nIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdwdWJsaXNoZXIubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcIm9nOnNpdGVfbmFtZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdXZWJTaXRlLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdzb3VyY2VPcmdhbml6YXRpb24ubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwiY29weXJpZ2h0XCIpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2NvcHlyaWdodEhvbGRlci5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnaXNQYXJ0T2YubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwiYXBwbGljYXRpb24tbmFtZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRBdXRob3IoZG9jLCBzY2hlbWFPcmdEYXRhKSB8fFxuXHRcdFx0Jydcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0VGl0bGUoZG9jOiBEb2N1bWVudCwgc2NoZW1hT3JnRGF0YTogYW55KTogc3RyaW5nIHtcblx0XHRjb25zdCByYXdUaXRsZSA9IChcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwib2c6dGl0bGVcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJ0d2l0dGVyOnRpdGxlXCIpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2hlYWRsaW5lJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJ0aXRsZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInNhaWx0aHJ1LnRpdGxlXCIpIHx8XG5cdFx0XHRkb2MucXVlcnlTZWxlY3RvcigndGl0bGUnKT8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fFxuXHRcdFx0Jydcblx0XHQpO1xuXG5cdFx0cmV0dXJuIHRoaXMuY2xlYW5UaXRsZShyYXdUaXRsZSwgdGhpcy5nZXRTaXRlKGRvYywgc2NoZW1hT3JnRGF0YSkpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgY2xlYW5UaXRsZSh0aXRsZTogc3RyaW5nLCBzaXRlTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblx0XHRpZiAoIXRpdGxlIHx8ICFzaXRlTmFtZSkgcmV0dXJuIHRpdGxlO1xuXG5cdFx0Ly8gUmVtb3ZlIHNpdGUgbmFtZSBpZiBpdCBleGlzdHNcblx0XHRjb25zdCBzaXRlTmFtZUVzY2FwZWQgPSBzaXRlTmFtZS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpO1xuXHRcdGNvbnN0IHBhdHRlcm5zID0gW1xuXHRcdFx0YFxcXFxzKltcXFxcfFxcXFwt4oCT4oCUXVxcXFxzKiR7c2l0ZU5hbWVFc2NhcGVkfVxcXFxzKiRgLCAvLyBUaXRsZSB8IFNpdGUgTmFtZVxuXHRcdFx0YF5cXFxccyoke3NpdGVOYW1lRXNjYXBlZH1cXFxccypbXFxcXHxcXFxcLeKAk+KAlF1cXFxccypgLCAvLyBTaXRlIE5hbWUgfCBUaXRsZVxuXHRcdF07XG5cdFx0XG5cdFx0Zm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG5cdFx0XHRjb25zdCByZWdleCA9IG5ldyBSZWdFeHAocGF0dGVybiwgJ2knKTtcblx0XHRcdGlmIChyZWdleC50ZXN0KHRpdGxlKSkge1xuXHRcdFx0XHR0aXRsZSA9IHRpdGxlLnJlcGxhY2UocmVnZXgsICcnKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRpdGxlLnRyaW0oKTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldERlc2NyaXB0aW9uKGRvYzogRG9jdW1lbnQsIHNjaGVtYU9yZ0RhdGE6IGFueSk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIChcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJkZXNjcmlwdGlvblwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJkZXNjcmlwdGlvblwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJvZzpkZXNjcmlwdGlvblwiKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdkZXNjcmlwdGlvbicpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwidHdpdHRlcjpkZXNjcmlwdGlvblwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInNhaWx0aHJ1LmRlc2NyaXB0aW9uXCIpIHx8XG5cdFx0XHQnJ1xuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRJbWFnZShkb2M6IERvY3VtZW50LCBzY2hlbWFPcmdEYXRhOiBhbnkpOiBzdHJpbmcge1xuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcIm9nOmltYWdlXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwidHdpdHRlcjppbWFnZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdpbWFnZS51cmwnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInNhaWx0aHJ1LmltYWdlLmZ1bGxcIikgfHxcblx0XHRcdCcnXG5cdFx0KTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldEZhdmljb24oZG9jOiBEb2N1bWVudCwgYmFzZVVybDogc3RyaW5nKTogc3RyaW5nIHtcblx0XHRjb25zdCBpY29uRnJvbU1ldGEgPSB0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcIm9nOmltYWdlOmZhdmljb25cIik7XG5cdFx0aWYgKGljb25Gcm9tTWV0YSkgcmV0dXJuIGljb25Gcm9tTWV0YTtcblxuXHRcdGNvbnN0IGljb25MaW5rID0gZG9jLnF1ZXJ5U2VsZWN0b3IoXCJsaW5rW3JlbD0naWNvbiddXCIpPy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuXHRcdGlmIChpY29uTGluaykgcmV0dXJuIGljb25MaW5rO1xuXG5cdFx0Y29uc3Qgc2hvcnRjdXRMaW5rID0gZG9jLnF1ZXJ5U2VsZWN0b3IoXCJsaW5rW3JlbD0nc2hvcnRjdXQgaWNvbiddXCIpPy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpO1xuXHRcdGlmIChzaG9ydGN1dExpbmspIHJldHVybiBzaG9ydGN1dExpbms7XG5cblx0XHQvLyBPbmx5IHRyeSB0byBjb25zdHJ1Y3QgZmF2aWNvbiBVUkwgaWYgd2UgaGF2ZSBhIHZhbGlkIGJhc2UgVVJMXG5cdFx0aWYgKGJhc2VVcmwpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiBuZXcgVVJMKFwiL2Zhdmljb24uaWNvXCIsIGJhc2VVcmwpLmhyZWY7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybignRmFpbGVkIHRvIGNvbnN0cnVjdCBmYXZpY29uIFVSTDonLCBlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gJyc7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRQdWJsaXNoZWQoZG9jOiBEb2N1bWVudCwgc2NoZW1hT3JnRGF0YTogYW55KTogc3RyaW5nIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdkYXRlUHVibGlzaGVkJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJwdWJsaXNoRGF0ZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJhcnRpY2xlOnB1Ymxpc2hlZF90aW1lXCIpIHx8XG5cdFx0XHR0aGlzLmdldFRpbWVFbGVtZW50KGRvYykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJzYWlsdGhydS5kYXRlXCIpIHx8XG5cdFx0XHQnJ1xuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRNZXRhQ29udGVudChkb2M6IERvY3VtZW50LCBhdHRyOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdGNvbnN0IHNlbGVjdG9yID0gYG1ldGFbJHthdHRyfV1gO1xuXHRcdGNvbnN0IGVsZW1lbnQgPSBBcnJheS5mcm9tKGRvYy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSlcblx0XHRcdC5maW5kKGVsID0+IGVsLmdldEF0dHJpYnV0ZShhdHRyKT8udG9Mb3dlckNhc2UoKSA9PT0gdmFsdWUudG9Mb3dlckNhc2UoKSk7XG5cdFx0Y29uc3QgY29udGVudCA9IGVsZW1lbnQgPyBlbGVtZW50LmdldEF0dHJpYnV0ZShcImNvbnRlbnRcIik/LnRyaW0oKSA/PyBcIlwiIDogXCJcIjtcblx0XHRyZXR1cm4gdGhpcy5kZWNvZGVIVE1MRW50aXRpZXMoY29udGVudCwgZG9jKTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldFRpbWVFbGVtZW50KGRvYzogRG9jdW1lbnQpOiBzdHJpbmcge1xuXHRcdGNvbnN0IHNlbGVjdG9yID0gYHRpbWVgO1xuXHRcdGNvbnN0IGVsZW1lbnQgPSBBcnJheS5mcm9tKGRvYy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSlbMF07XG5cdFx0Y29uc3QgY29udGVudCA9IGVsZW1lbnQgPyAoZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJkYXRldGltZVwiKT8udHJpbSgpID8/IGVsZW1lbnQudGV4dENvbnRlbnQ/LnRyaW0oKSA/PyBcIlwiKSA6IFwiXCI7XG5cdFx0cmV0dXJuIHRoaXMuZGVjb2RlSFRNTEVudGl0aWVzKGNvbnRlbnQsIGRvYyk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBkZWNvZGVIVE1MRW50aXRpZXModGV4dDogc3RyaW5nLCBkb2M6IERvY3VtZW50KTogc3RyaW5nIHtcblx0XHRjb25zdCB0ZXh0YXJlYSA9IGRvYy5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuXHRcdHRleHRhcmVhLmlubmVySFRNTCA9IHRleHQ7XG5cdFx0cmV0dXJuIHRleHRhcmVhLnZhbHVlO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0U2NoZW1hUHJvcGVydHkoZG9jOiBEb2N1bWVudCwgc2NoZW1hT3JnRGF0YTogYW55LCBwcm9wZXJ0eTogc3RyaW5nLCBkZWZhdWx0VmFsdWU6IHN0cmluZyA9ICcnKTogc3RyaW5nIHtcblx0XHRpZiAoIXNjaGVtYU9yZ0RhdGEpIHJldHVybiBkZWZhdWx0VmFsdWU7XG5cblx0XHRjb25zdCBzZWFyY2hTY2hlbWEgPSAoZGF0YTogYW55LCBwcm9wczogc3RyaW5nW10sIGZ1bGxQYXRoOiBzdHJpbmcsIGlzRXhhY3RNYXRjaDogYm9vbGVhbiA9IHRydWUpOiBzdHJpbmdbXSA9PiB7XG5cdFx0XHRpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHJldHVybiBwcm9wcy5sZW5ndGggPT09IDAgPyBbZGF0YV0gOiBbXTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHR9XG5cblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG5cdFx0XHRcdGNvbnN0IGN1cnJlbnRQcm9wID0gcHJvcHNbMF07XG5cdFx0XHRcdGlmICgvXlxcW1xcZCtcXF0kLy50ZXN0KGN1cnJlbnRQcm9wKSkge1xuXHRcdFx0XHRcdGNvbnN0IGluZGV4ID0gcGFyc2VJbnQoY3VycmVudFByb3Auc2xpY2UoMSwgLTEpKTtcblx0XHRcdFx0XHRpZiAoZGF0YVtpbmRleF0pIHtcblx0XHRcdFx0XHRcdHJldHVybiBzZWFyY2hTY2hlbWEoZGF0YVtpbmRleF0sIHByb3BzLnNsaWNlKDEpLCBmdWxsUGF0aCwgaXNFeGFjdE1hdGNoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAocHJvcHMubGVuZ3RoID09PSAwICYmIGRhdGEuZXZlcnkoaXRlbSA9PiB0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSkge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhLm1hcChTdHJpbmcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gZGF0YS5mbGF0TWFwKGl0ZW0gPT4gc2VhcmNoU2NoZW1hKGl0ZW0sIHByb3BzLCBmdWxsUGF0aCwgaXNFeGFjdE1hdGNoKSk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IFtjdXJyZW50UHJvcCwgLi4ucmVtYWluaW5nUHJvcHNdID0gcHJvcHM7XG5cdFx0XHRcblx0XHRcdGlmICghY3VycmVudFByb3ApIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykgcmV0dXJuIFtkYXRhXTtcblx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0JyAmJiBkYXRhLm5hbWUpIHtcblx0XHRcdFx0XHRyZXR1cm4gW2RhdGEubmFtZV07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShjdXJyZW50UHJvcCkpIHtcblx0XHRcdFx0cmV0dXJuIHNlYXJjaFNjaGVtYShkYXRhW2N1cnJlbnRQcm9wXSwgcmVtYWluaW5nUHJvcHMsIFxuXHRcdFx0XHRcdGZ1bGxQYXRoID8gYCR7ZnVsbFBhdGh9LiR7Y3VycmVudFByb3B9YCA6IGN1cnJlbnRQcm9wLCB0cnVlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFpc0V4YWN0TWF0Y2gpIHtcblx0XHRcdFx0Y29uc3QgbmVzdGVkUmVzdWx0czogc3RyaW5nW10gPSBbXTtcblx0XHRcdFx0Zm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgZGF0YVtrZXldID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0cyA9IHNlYXJjaFNjaGVtYShkYXRhW2tleV0sIHByb3BzLCBcblx0XHRcdFx0XHRcdFx0ZnVsbFBhdGggPyBgJHtmdWxsUGF0aH0uJHtrZXl9YCA6IGtleSwgZmFsc2UpO1xuXHRcdFx0XHRcdFx0bmVzdGVkUmVzdWx0cy5wdXNoKC4uLnJlc3VsdHMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAobmVzdGVkUmVzdWx0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG5lc3RlZFJlc3VsdHM7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH07XG5cblx0XHR0cnkge1xuXHRcdFx0bGV0IHJlc3VsdHMgPSBzZWFyY2hTY2hlbWEoc2NoZW1hT3JnRGF0YSwgcHJvcGVydHkuc3BsaXQoJy4nKSwgJycsIHRydWUpO1xuXHRcdFx0aWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHJlc3VsdHMgPSBzZWFyY2hTY2hlbWEoc2NoZW1hT3JnRGF0YSwgcHJvcGVydHkuc3BsaXQoJy4nKSwgJycsIGZhbHNlKTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID4gMCA/IHJlc3VsdHMuZmlsdGVyKEJvb2xlYW4pLmpvaW4oJywgJykgOiBkZWZhdWx0VmFsdWU7XG5cdFx0XHRyZXR1cm4gdGhpcy5kZWNvZGVIVE1MRW50aXRpZXMocmVzdWx0LCBkb2MpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBFcnJvciBpbiBnZXRTY2hlbWFQcm9wZXJ0eSBmb3IgJHtwcm9wZXJ0eX06YCwgZXJyb3IpO1xuXHRcdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZTtcblx0XHR9XG5cdH1cblxuXHRzdGF0aWMgZXh0cmFjdFNjaGVtYU9yZ0RhdGEoZG9jOiBEb2N1bWVudCk6IGFueSB7XG5cdFx0Y29uc3Qgc2NoZW1hU2NyaXB0cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKCdzY3JpcHRbdHlwZT1cImFwcGxpY2F0aW9uL2xkK2pzb25cIl0nKTtcblx0XHRjb25zdCBzY2hlbWFEYXRhOiBhbnlbXSA9IFtdO1xuXG5cdFx0c2NoZW1hU2NyaXB0cy5mb3JFYWNoKHNjcmlwdCA9PiB7XG5cdFx0XHRsZXQganNvbkNvbnRlbnQgPSBzY3JpcHQudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0XHRcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGpzb25Db250ZW50ID0ganNvbkNvbnRlbnRcblx0XHRcdFx0XHQucmVwbGFjZSgvXFwvXFwqW1xcc1xcU10qP1xcKlxcL3xeXFxzKlxcL1xcLy4qJC9nbSwgJycpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL15cXHMqPCFcXFtDREFUQVxcWyhbXFxzXFxTXSo/KVxcXVxcXT5cXHMqJC8sICckMScpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL15cXHMqKFxcKlxcL3xcXC9cXCopXFxzKnxcXHMqKFxcKlxcL3xcXC9cXCopXFxzKiQvZywgJycpXG5cdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0Y29uc3QganNvbkRhdGEgPSBKU09OLnBhcnNlKGpzb25Db250ZW50KTtcblxuXHRcdFx0XHRpZiAoanNvbkRhdGFbJ0BncmFwaCddICYmIEFycmF5LmlzQXJyYXkoanNvbkRhdGFbJ0BncmFwaCddKSkge1xuXHRcdFx0XHRcdHNjaGVtYURhdGEucHVzaCguLi5qc29uRGF0YVsnQGdyYXBoJ10pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNjaGVtYURhdGEucHVzaChqc29uRGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBhcnNpbmcgc2NoZW1hLm9yZyBkYXRhOicsIGVycm9yKTtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignUHJvYmxlbWF0aWMgSlNPTiBjb250ZW50OicsIGpzb25Db250ZW50KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBzY2hlbWFEYXRhO1xuXHR9XG59IiwiaW1wb3J0IHsgTWV0YWRhdGFFeHRyYWN0b3IgfSBmcm9tICcuL21ldGFkYXRhJztcbmltcG9ydCB7IERlZnVkZGxlT3B0aW9ucywgRGVmdWRkbGVSZXNwb25zZSwgRGVmdWRkbGVNZXRhZGF0YSB9IGZyb20gJy4vdHlwZXMnO1xuXG4vLyBFbnRyeSBwb2ludCBlbGVtZW50c1xuLy8gVGhlc2UgYXJlIHRoZSBlbGVtZW50cyB0aGF0IHdpbGwgYmUgdXNlZCB0byBmaW5kIHRoZSBtYWluIGNvbnRlbnRcbmNvbnN0IEVOVFJZX1BPSU5UX0VMRU1FTlRTID0gW1xuXHQnYXJ0aWNsZScsXG5cdCdbcm9sZT1cImFydGljbGVcIl0nLFxuXHQnW2l0ZW1wcm9wPVwiYXJ0aWNsZUJvZHlcIl0nLFxuXHQnLnBvc3QtY29udGVudCcsXG5cdCcuYXJ0aWNsZS1jb250ZW50Jyxcblx0JyNhcnRpY2xlLWNvbnRlbnQnLFxuXHQnLmNvbnRlbnQtYXJ0aWNsZScsXG5cdCdtYWluJyxcblx0J1tyb2xlPVwibWFpblwiXScsXG5cdCdib2R5JyAvLyBlbnN1cmVzIHRoZXJlIGlzIGFsd2F5cyBhIG1hdGNoXG5dO1xuXG5jb25zdCBNT0JJTEVfV0lEVEggPSA2MDA7XG5jb25zdCBCTE9DS19FTEVNRU5UUyA9IFsnZGl2JywgJ3NlY3Rpb24nLCAnYXJ0aWNsZScsICdtYWluJ107XG5cbi8vIEhpZGRlbiBlbGVtZW50cyB0aGF0IHNob3VsZCBiZSByZW1vdmVkXG5jb25zdCBISURERU5fRUxFTUVOVF9TRUxFQ1RPUlMgPSBbXG5cdCdbaGlkZGVuXScsXG5cdCdbYXJpYS1oaWRkZW49XCJ0cnVlXCJdJyxcbi8vXHQnW3N0eWxlKj1cImRpc3BsYXk6IG5vbmVcIl0nLCBjYXVzZXMgcHJvYmxlbXMgZm9yIG1hdGggZm9ybXVsYXNcbi8vXHQnW3N0eWxlKj1cImRpc3BsYXk6bm9uZVwiXScsXG5cdCdbc3R5bGUqPVwidmlzaWJpbGl0eTogaGlkZGVuXCJdJyxcblx0J1tzdHlsZSo9XCJ2aXNpYmlsaXR5OmhpZGRlblwiXScsXG5cdCcuaGlkZGVuJyxcblx0Jy5pbnZpc2libGUnXG5dLmpvaW4oJywnKTtcblxuLy8gU2VsZWN0b3JzIHRvIGJlIHJlbW92ZWRcbmNvbnN0IEVYQUNUX1NFTEVDVE9SUyA9IFtcblx0Ly8gc2NyaXB0cywgc3R5bGVzXG5cdCdub3NjcmlwdCcsXG5cdCdzY3JpcHQnLFxuXHQnc3R5bGUnLFxuXG5cdC8vIGFkc1xuXHQnLmFkOm5vdChbY2xhc3MqPVwiZ3JhZGllbnRcIl0pJyxcblx0J1tjbGFzc149XCJhZC1cIiBpXScsXG5cdCdbY2xhc3MkPVwiLWFkXCIgaV0nLFxuXHQnW2lkXj1cImFkLVwiIGldJyxcblx0J1tpZCQ9XCItYWRcIiBpXScsXG5cdCdbcm9sZT1cImJhbm5lclwiIGldJyxcblx0Jy5wcm9tbycsXG5cdCcuUHJvbW8nLFxuXG5cdC8vIGNvbW1lbnRzXG5cdCdbaWQ9XCJjb21tZW50c1wiIGldJyxcblxuXHQvLyBoZWFkZXIsIG5hdlxuXHQnaGVhZGVyJyxcblx0Jy5oZWFkZXInLFxuXHQnI2hlYWRlcicsXG5cdCduYXYnLFxuXHQnLm5hdmlnYXRpb24nLFxuXHQnI25hdmlnYXRpb24nLFxuXHQnW3JvbGU9XCJuYXZpZ2F0aW9uXCIgaV0nLFxuXHQnW3JvbGU9XCJkaWFsb2dcIiBpXScsXG5cdCdbcm9sZSo9XCJjb21wbGVtZW50YXJ5XCIgaV0nLFxuXHQnW2NsYXNzKj1cInBhZ2luYXRpb25cIiBpXScsXG5cdCcubWVudScsXG5cdCcjbWVudScsXG5cblx0Ly8gbWV0YWRhdGFcblx0Jy5hdXRob3InLFxuXHQnLkF1dGhvcicsXG5cdCcuY29udHJpYnV0b3InLFxuXHQnLmRhdGUnLFxuXHQnLm1ldGEnLFxuXHQnLnRhZ3MnLFxuXHQnLnRvYycsXG5cdCcuVG9jJyxcblx0JyN0b2MnLFxuXHQnI3RpdGxlJyxcblx0JyNUaXRsZScsXG5cdCdbaHJlZio9XCIvY2F0ZWdvcnlcIl0nLFxuXHQnW2hyZWYqPVwiL2NhdGVnb3JpZXNcIl0nLFxuXHQnW2hyZWYqPVwiL3RhZy9cIl0nLFxuXHQnW2hyZWYqPVwiL3RhZ3MvXCJdJyxcblx0J1tocmVmKj1cIi90b3BpY3NcIl0nLFxuXHQnW2hyZWYqPVwiYXV0aG9yXCJdJyxcblx0J1tocmVmPVwiI3NpdGUtY29udGVudFwiXScsXG5cdCdbc3JjKj1cImF1dGhvclwiXScsXG5cblx0Ly8gZm9vdGVyXG5cdCdmb290ZXInLFxuXG5cdC8vIGlucHV0cywgZm9ybXMsIGVsZW1lbnRzXG5cdCdhc2lkZScsXG5cdCdidXR0b24nLFxuXHRcdC8vICdbcm9sZT1cImJ1dHRvblwiXScsIE1lZGl1bSBpbWFnZXNcblx0J2NhbnZhcycsXG5cdCdkaWFsb2cnLFxuXHQnZmllbGRzZXQnLFxuXHQnZm9ybScsXG5cdCdpbnB1dDpub3QoW3R5cGU9XCJjaGVja2JveFwiXSknLFxuXHQnbGFiZWwnLFxuXHQnbGluaycsXG5cdCdvcHRpb24nLFxuXHQnc2VsZWN0Jyxcblx0J3RleHRhcmVhJyxcblx0J3RpbWUnLFxuXG5cdC8vIGlmcmFtZXNcblx0J2luc3RhcmVhZC1wbGF5ZXInLFxuXHQnaWZyYW1lOm5vdChbc3JjKj1cInlvdXR1YmVcIl0pOm5vdChbc3JjKj1cInlvdXR1LmJlXCJdKTpub3QoW3NyYyo9XCJ2aW1lb1wiXSk6bm90KFtzcmMqPVwidHdpdHRlclwiXSknLFxuXG5cdC8vIGxvZ29zXG5cdCdbY2xhc3M9XCJsb2dvXCIgaV0nLFxuXHQnI2xvZ28nLFxuXHQnI0xvZ28nLFxuXG5cdC8vIG5ld3NsZXR0ZXJcblx0JyNuZXdzbGV0dGVyJyxcblx0JyNOZXdzbGV0dGVyJyxcblxuXHQvLyBoaWRkZW4gZm9yIHByaW50XG5cdCcubm9wcmludCcsXG5cdCdbZGF0YS1saW5rLW5hbWUqPVwic2tpcFwiIGldJyxcblx0J1tkYXRhLXByaW50LWxheW91dD1cImhpZGVcIiBpXScsXG5cdCdbZGF0YS1ibG9jaz1cImRvbm90cHJpbnRcIiBpXScsXG5cblx0Ly8gZm9vdG5vdGVzLCBjaXRhdGlvbnNcblx0J1tjbGFzcyo9XCJjbGlja2FibGUtaWNvblwiIGldJyxcblx0J2xpIHNwYW5bY2xhc3MqPVwibHR4X3RhZ1wiIGldW2NsYXNzKj1cImx0eF90YWdfaXRlbVwiIGldJyxcblx0J2FbaHJlZl49XCIjXCJdW2NsYXNzKj1cImFuY2hvclwiIGldJyxcblx0J2FbaHJlZl49XCIjXCJdW2NsYXNzKj1cInJlZlwiIGldJyxcblxuXHQvLyBsaW5rIGxpc3RzXG5cdCdbZGF0YS1jb250YWluZXIqPVwibW9zdC12aWV3ZWRcIiBpXScsXG5cblx0Ly8gc2lkZWJhclxuXHQnLnNpZGViYXInLFxuXHQnLlNpZGViYXInLFxuXHQnI3NpZGViYXInLFxuXHQnI1NpZGViYXInLFxuXHQnI3NpdGVzdWInLFxuXHRcblx0Ly8gb3RoZXJcblx0JyNOWVRfQUJPVkVfTUFJTl9DT05URU5UX1JFR0lPTicsXG5cdCdbZGF0YS10ZXN0aWQ9XCJwaG90b3ZpZXdlci1jaGlsZHJlbi1maWd1cmVcIl0gPiBzcGFuJywgLy8gTmV3IFlvcmsgVGltZXNcblx0J3RhYmxlLmluZm9ib3gnLFxuXHQnLnBlbmNyYWZ0Om5vdCgucGMtZGlzcGxheS1jb250ZW50cyknLCAvLyBTdWJzdGFja1xuXHQnW2RhdGEtb3B0aW1pemVseT1cInJlbGF0ZWQtYXJ0aWNsZXMtc2VjdGlvblwiIGldJyAvLyBUaGUgRWNvbm9taXN0XG5dO1xuXG4vLyBSZW1vdmFsIHBhdHRlcm5zIHRlc3RlZCBhZ2FpbnN0IGF0dHJpYnV0ZXM6IGNsYXNzLCBpZCwgZGF0YS10ZXN0aWQsIGFuZCBkYXRhLXFhXG4vLyBDYXNlIGluc2Vuc2l0aXZlLCBwYXJ0aWFsIG1hdGNoZXMgYWxsb3dlZFxuY29uc3QgUEFSVElBTF9TRUxFQ1RPUlMgPSBbXG5cdCdhY2Nlc3Mtd2FsbCcsXG5cdCdhY3Rpdml0eXB1YicsXG5cdCdhY3Rpb25jYWxsJyxcblx0J2FwcGVuZGl4Jyxcblx0J2F2YXRhcicsXG5cdCdhZHZlcnQnLFxuXHQnLWFkLScsXG5cdCdfYWRfJyxcblx0J2FsbHRlcm1zJyxcblx0J2Fyb3VuZC10aGUtd2ViJyxcblx0J2FydGljbGUtYm90dG9tLXNlY3Rpb24nLFxuXHQnYXJ0aWNsZV9fY29weScsXG5cdCdhcnRpY2xlX2RhdGUnLFxuXHQnYXJ0aWNsZS1lbmQgJyxcblx0J2FydGljbGVfaGVhZGVyJyxcblx0J2FydGljbGVfX2hlYWRlcicsXG5cdCdhcnRpY2xlX19pbmZvJyxcblx0J2FydGljbGUtaW5mbycsXG5cdCdhcnRpY2xlX19tZXRhJyxcblx0J2FydGljbGUtc3ViamVjdCcsXG5cdCdhcnRpY2xlX3N1YmplY3QnLFxuXHQnYXJ0aWNsZS1zbmlwcGV0Jyxcblx0J2FydGljbGUtc2VwYXJhdG9yJyxcblx0J2FydGljbGUtdGFncycsXG5cdCdhcnRpY2xlX3RhZ3MnLFxuXHQnYXJ0aWNsZS10aXRsZScsXG5cdCdhcnRpY2xlX3RpdGxlJyxcblx0J2FydGljbGV0b3BpY3MnLFxuXHQnYXJ0aWNsZS10b3BpY3MnLFxuXHQnYXJ0aWNsZS10eXBlJyxcblx0J2FydGljbGUtLWxlZGUnLCAvLyBUaGUgVmVyZ2Vcblx0J2Fzc29jaWF0ZWQtcGVvcGxlJyxcbi8vXHQnYXV0aG9yJywgR3dlcm5cblx0J2F1dGhvci1uYW1lJyxcblx0J2JhY2stdG8tdG9wJyxcblx0J2JhY2tsaW5rcy1zZWN0aW9uJyxcblx0J2Jhbm5lcicsXG5cdCdiaW8tYmxvY2snLFxuXHQnYmxvZy1wYWdlcicsXG5cdCdib3R0b20tb2YtYXJ0aWNsZScsXG5cdCdicmFuZC1iYXInLFxuXHQnYnJlYWRjcnVtYicsXG5cdCdidXR0b24td3JhcHBlcicsXG5cdCdidG4tJyxcblx0Jy1idG4nLFxuXHQnYnlsaW5lJyxcblx0J2NhcHRjaGEnLFxuXHQnY2F0X2hlYWRlcicsXG5cdCdjYXRsaW5rcycsXG5cdCdjaGFwdGVyLWxpc3QnLCAvLyBUaGUgRWNvbm9taXN0XG5cdCdjb2xsZWN0aW9ucycsXG5cdCdjb21tZW50cycsXG4vL1x0Jy1jb21tZW50JywgU3ludGF4IGhpZ2hsaWdodGluZ1xuXHQnY29tbWVudC1jb3VudCcsXG5cdCdjb21tZW50LWNvbnRlbnQnLFxuXHQnY29tbWVudC1mb3JtJyxcblx0J2NvbW1lbnQtbnVtYmVyJyxcblx0J2NvbW1lbnQtcmVzcG9uZCcsXG5cdCdjb21tZW50LXRocmVhZCcsXG5cdCdjb21wbGVtZW50YXJ5Jyxcblx0J2NvbnNlbnQnLFxuXHQnY29udGVudC1jYXJkJywgLy8gVGhlIFZlcmdlXG5cdCdjb250ZW50LXRvcGljcycsXG5cdCdjb250ZW50cHJvbW8nLFxuXHQnY29udGV4dC13aWRnZXQnLCAvLyBSZXV0ZXJzXG5cdCdjb3JlLWNvbGxhdGVyYWwnLFxuXHQnX2N0YScsXG5cdCctY3RhJyxcblx0J2N0YS0nLFxuXHQnY3RhXycsXG5cdCdjdXJyZW50LWlzc3VlJywgLy8gVGhlIE5hdGlvblxuXHQnY3VzdG9tLWxpc3QtbnVtYmVyJyxcblx0J2RhdGVsaW5lJyxcblx0J2RhdGVoZWFkZXInLFxuXHQnZGF0ZS1oZWFkZXInLFxuXHQnZGF0ZV9oZWFkZXItJyxcbi8vXHQnZGlhbG9nJyxcblx0J2Rpc2NsYWltZXInLFxuXHQnZGlzY2xvc3VyZScsXG5cdCdkaXNjdXNzaW9uJyxcblx0J2Rpc2N1c3NfJyxcblx0J2Rpc3F1cycsXG5cdCdkb25hdGUnLFxuXHQnZHJvcGRvd24nLCAvLyBBcnMgVGVjaG5pY2Fcblx0J2VsZXR0ZXJzJyxcblx0J2VtYWlsc2lnbnVwJyxcblx0J2VuZ2FnZW1lbnQtd2lkZ2V0Jyxcblx0J2VudHJ5LWF1dGhvci1pbmZvJyxcblx0J2VudHJ5LWNhdGVnb3JpZXMnLFxuXHQnZW50cnktZGF0ZScsXG5cdCdlbnRyeS1tZXRhJyxcblx0J2VudHJ5LXRpdGxlJyxcblx0J2VudHJ5LXV0aWxpdHknLFxuXHQnZXllYnJvdycsXG5cdCdleHBhbmQtcmVkdWNlJyxcblx0J2V4dGVybmFsbGlua2VtYmVkd3JhcHBlcicsIC8vIFRoZSBOZXcgWW9ya2VyXG5cdCdleHRyYS1zZXJ2aWNlcycsXG5cdCdleHRyYS10aXRsZScsXG5cdCdmYWNlYm9vaycsXG5cdCdmYXZvcml0ZScsXG5cdCdmZWVkYmFjaycsXG5cdCdmZWVkLWxpbmtzJyxcblx0J2ZpZWxkLXNpdGUtc2VjdGlvbnMnLFxuXHQnZml4ZWQnLFxuXHQnZmxvYXRpbmctdmlkJyxcblx0J2ZvbGxvdycsXG5cdCdmb290ZXInLFxuXHQnZm9vdG5vdGUtYmFjaycsXG5cdCdmb290bm90ZWJhY2snLFxuXHQnZm9yLXlvdScsXG5cdCdmcm9udG1hdHRlcicsXG5cdCdmdXJ0aGVyLXJlYWRpbmcnLFxuXHQnZ2lzdC1tZXRhJyxcbi8vXHQnZ2xvYmFsJyxcblx0J2dvb2dsZScsXG5cdCdnb29nLScsXG5cdCdncmFwaC12aWV3Jyxcblx0J2hlYWRlci1sb2dvJyxcblx0J2hlYWRlci1wYXR0ZXJuJywgLy8gVGhlIFZlcmdlXG5cdCdoZXJvLWxpc3QnLFxuXHQnaGlkZS1mb3ItcHJpbnQnLFxuXHQnaGlkZS1wcmludCcsXG5cdCdoaWRkZW4tc2lkZW5vdGUnLFxuXHQnaW50ZXJsdWRlJyxcblx0J2ludGVyYWN0aW9uJyxcblx0J2p1bXBsaW5rJyxcbi8vXHQna2V5d29yZCcsIC8vIHVzZWQgaW4gc3ludGF4IGhpZ2hsaWdodGluZ1xuXHQna2lja2VyJyxcblx0J2xhYnN0YWInLCAvLyBBcnhpdlxuXHQnLWxhYmVscycsXG5cdCdsYW5ndWFnZS1uYW1lJyxcblx0J2xhdGVzdC1jb250ZW50Jyxcblx0Jy1sZWRlcy0nLCAvLyBUaGUgVmVyZ2Vcblx0Jy1saWNlbnNlJyxcblx0J2xpbmstYm94Jyxcblx0J2xpbmtzLWdyaWQnLCAvLyBCQkNcblx0J2xpbmtzLXRpdGxlJywgLy8gQkJDXG5cdCdsaXN0aW5nLWR5bmFtaWMtdGVybXMnLCAvLyBCb3N0b24gUmV2aWV3XG5cdCdsaXN0LXRhZ3MnLFxuXHQnbG9hZGluZycsXG5cdCdsb2EtaW5mbycsXG5cdCdsb2dvX2NvbnRhaW5lcicsXG5cdCdsdHhfcm9sZV9yZWZudW0nLCAvLyBBcnhpdlxuXHQnbHR4X3RhZ19iaWJpdGVtJyxcblx0J2x0eF9lcnJvcicsXG5cdCdtYXJrZXRpbmcnLFxuXHQnbWVkaWEtaW5xdWlyeScsXG5cdCdtZW51LScsXG5cdCdtZXRhLScsXG5cdCdtZXRhZGF0YScsXG5cdCdtaWdodC1saWtlJyxcblx0J19tb2RhbCcsXG5cdCctbW9kYWwnLFxuXHQnbW9yZS0nLFxuXHQnbW9yZW5ld3MnLFxuXHQnbW9yZXN0b3JpZXMnLFxuXHQnbW92ZS1oZWxwZXInLFxuXHQnbXctZWRpdHNlY3Rpb24nLFxuXHQnbXctY2l0ZS1iYWNrbGluaycsXG5cdCdtdy1pbmRpY2F0b3JzJyxcblx0J213LWp1bXAtbGluaycsXG5cdCduYXYtJyxcblx0J25hdl8nLFxuXHQnbmF2YmFyJyxcbi8vXHQnbmF2aWdhdGlvbicsXG5cdCduZXh0LScsXG5cdCduZXdzLXN0b3J5LXRpdGxlJyxcbi8vXHQnbmV3c2xldHRlcicsIHVzZWQgb24gU3Vic3RhY2tcblx0J25ld3NsZXR0ZXJfJyxcblx0J25ld3NsZXR0ZXItc2lnbnVwJyxcblx0J25ld3NsZXR0ZXJzaWdudXAnLFxuXHQnbmV3c2xldHRlcndpZGdldCcsXG5cdCduZXdzbGV0dGVyd3JhcHBlcicsXG5cdCdub3QtZm91bmQnLFxuXHQnbm9tb2JpbGUnLFxuXHQnbm9wcmludCcsXG5cdCdvcmlnaW5hbGx5LXB1Ymxpc2hlZCcsIC8vIE1lcmN1cnkgTmV3c1xuXHQnb3V0bGluZS12aWV3Jyxcblx0J292ZXJsYXknLFxuXHQncGFnZS10aXRsZScsXG5cdCctcGFydG5lcnMnLFxuXHQncGxlYScsXG5cdCdwb3B1bGFyJyxcbi8vXHQncG9wdXAnLCBHd2VyblxuXHQncG9wLXVwJyxcblx0J3BvcG92ZXInLFxuXHQncG9zdC1ib3R0b20nLFxuXHQncG9zdF9fY2F0ZWdvcnknLFxuXHQncG9zdGNvbW1lbnQnLFxuXHQncG9zdGRhdGUnLFxuXHQncG9zdC1hdXRob3InLFxuXHQncG9zdC1kYXRlJyxcblx0J3Bvc3RfZGF0ZScsXG5cdCdwb3N0LWZlZWRzJyxcblx0J3Bvc3RpbmZvJyxcblx0J3Bvc3QtaW5mbycsXG5cdCdwb3N0X2luZm8nLFxuXHQncG9zdC1pbmxpbmUtZGF0ZScsXG5cdCdwb3N0LWxpbmtzJyxcblx0J3Bvc3QtbWV0YScsXG5cdCdwb3N0bWV0YScsXG5cdCdwb3N0c25pcHBldCcsXG5cdCdwb3N0X3NuaXBwZXQnLFxuXHQncG9zdC1zbmlwcGV0Jyxcblx0J3Bvc3R0aXRsZScsXG5cdCdwb3N0LXRpdGxlJyxcblx0J3Bvc3RfdGl0bGUnLFxuXHQncG9zdHRheCcsXG5cdCdwb3N0LXRheCcsXG5cdCdwb3N0X3RheCcsXG5cdCdwb3N0dGFnJyxcblx0J3Bvc3RfdGFnJyxcblx0J3Bvc3QtdGFnJyxcbi8vXHQncHJldmlldycsIHVzZWQgb24gT2JzaWRpYW4gUHVibGlzaFxuXHQncHJldm5leHQnLFxuXHQncHJldmlvdXNuZXh0Jyxcblx0J3ByaW50LW5vbmUnLFxuXHQncHJpbnQtaGVhZGVyJyxcblx0J3Byb2ZpbGUnLFxuLy9cdCdwcm9tbycsXG5cdCdwcm9tby1ib3gnLFxuXHQncHViZGF0ZScsXG5cdCdwdWJfZGF0ZScsXG5cdCdwdWItZGF0ZScsXG5cdCdwdWJsaWNhdGlvbi1kYXRlJyxcblx0J3B1YmxpY2F0aW9uTmFtZScsIC8vIE1lZGl1bVxuXHQncXItY29kZScsXG5cdCdxcl9jb2RlJyxcblx0J19yYWlsJyxcblx0J3JlYWRtb3JlJyxcblx0J3JlYWQtbmV4dCcsXG5cdCdyZWFkX25leHQnLFxuXHQncmVhZF90aW1lJyxcblx0J3JlYWQtdGltZScsXG5cdCdyZWFkaW5nX3RpbWUnLFxuXHQncmVhZGluZy10aW1lJyxcblx0J3JlYWRpbmctbGlzdCcsXG5cdCdyZWNlbnRwb3N0Jyxcblx0J3JlY2VudF9wb3N0Jyxcblx0J3JlY2VudC1wb3N0Jyxcblx0J3JlY29tbWVuZCcsXG5cdCdyZWRpcmVjdGVkZnJvbScsXG5cdCdyZWNpcmMnLFxuXHQncmVnaXN0ZXInLFxuXHQncmVsYXRlZCcsXG5cdCdyZWxldmFudCcsXG5cdCdyZXZlcnNlZm9vdG5vdGUnLFxuXHQnc2NyZWVuLXJlYWRlci10ZXh0Jyxcbi8vXHQnc2hhcmUnLFxuLy9cdCctc2hhcmUnLCBzY2l0ZWNoZGFpbHkuY29tXG5cdCdzaGFyZS1ib3gnLFxuXHQnc2hhcmUtaWNvbnMnLFxuXHQnc2hhcmVsaW5rcycsXG5cdCdzaGFyZS1zZWN0aW9uJyxcblx0J3NpZGViYXJ0aXRsZScsXG5cdCdzaWRlYmFyXycsXG5cdCdzaW1pbGFyLScsXG5cdCdzaW1pbGFyXycsXG5cdCdzaW1pbGFycy0nLFxuXHQnc2lkZWl0ZW1zJyxcblx0J3NpZGUtYm94Jyxcblx0J3NpdGUtaW5kZXgnLFxuXHQnc2l0ZS1oZWFkZXInLFxuXHQnc2l0ZS1sb2dvJyxcblx0J3NpdGUtbmFtZScsXG4vL1x0J3NraXAtJyxcbi8vXHQnc2tpcC1saW5rJywgVGVjaENydW5jaFxuXHQnc29jaWFsJyxcblx0J3NwZWVjaGlmeS1pZ25vcmUnLFxuXHQnc3BvbnNvcicsXG4vL1x0Jy1zdGF0cycsXG5cdCdfc3RhdHMnLFxuXHQnc3RpY2t5Jyxcblx0J3N0b3J5cmVhZHRpbWUnLCAvLyBNZWRpdW1cblx0J3N0b3J5cHVibGlzaGRhdGUnLCAvLyBNZWRpdW1cblx0J3N1YmplY3QtbGFiZWwnLFxuXHQnc3Vic2NyaWJlJyxcblx0J190YWdzJyxcblx0J3RhZ3NfX2l0ZW0nLFxuXHQndGFnX2xpc3QnLFxuXHQndGF4b25vbXknLFxuXHQndGFibGUtb2YtY29udGVudHMnLFxuXHQndGFicy0nLFxuLy9cdCd0ZWFzZXInLCBOYXR1cmVcblx0J3Rlcm1pbmFsdG91dCcsXG5cdCd0aW1lLXJ1YnJpYycsXG5cdCd0aW1lc3RhbXAnLFxuXHQndGlwX29mZicsXG5cdCd0aXB0b3V0Jyxcblx0Jy10b3V0LScsXG5cdCctdG9jJyxcblx0J3RvcGljLWxpc3QnLFxuXHQndG9vbGJhcicsXG5cdCd0b29sdGlwJyxcblx0J3RvcC13cmFwcGVyJyxcblx0J3RyZWUtaXRlbScsXG5cdCd0cmVuZGluZycsXG5cdCd0cnVzdC1mZWF0Jyxcblx0J3RydXN0LWJhZGdlJyxcblx0J3R3aXR0ZXInLFxuXHQndmlzdWFsbHktaGlkZGVuJyxcblx0J3dlbGNvbWVib3gnXG5dO1xuXG4vLyBTZWxlY3RvcnMgZm9yIGZvb3Rub3RlcyBhbmQgY2l0YXRpb25zXG5jb25zdCBGT09UTk9URV9JTkxJTkVfUkVGRVJFTkNFUyA9IFtcblx0J3N1cC5yZWZlcmVuY2UnLFxuXHQnY2l0ZS5sdHhfY2l0ZScsXG5cdCdzdXBbaWRePVwiZm5yXCJdJyxcblx0J3N1cFtpZF49XCJmbnJlZjpcIl0nLFxuXHQnc3Bhbi5mb290bm90ZS1saW5rJyxcblx0J2EuY2l0YXRpb24nLFxuXHQnYVtpZF49XCJyZWYtbGlua1wiXScsXG5cdCdhW2hyZWZePVwiI2ZuXCJdJyxcblx0J2FbaHJlZl49XCIjY2l0ZVwiXScsXG5cdCdhW2hyZWZePVwiI3JlZmVyZW5jZVwiXScsXG5cdCdhW2hyZWZePVwiI2Zvb3Rub3RlXCJdJyxcblx0J2FbaHJlZl49XCIjclwiXScsIC8vIENvbW1vbiBpbiBhY2FkZW1pYyBwYXBlcnNcblx0J2FbaHJlZl49XCIjYlwiXScsIC8vIENvbW1vbiBmb3IgYmlibGlvZ3JhcGh5IHJlZmVyZW5jZXNcblx0J2FbaHJlZio9XCJjaXRlX25vdGVcIl0nLFxuXHQnYVtocmVmKj1cImNpdGVfcmVmXCJdJyxcblx0J2EuZm9vdG5vdGUtYW5jaG9yJywgLy8gU3Vic3RhY2tcblx0J3NwYW4uZm9vdG5vdGUtaG92ZXJjYXJkLXRhcmdldCBhJywgLy8gU3Vic3RhY2tcblx0J2Fbcm9sZT1cImRvYy1iaWJsaW9yZWZcIl0nLCAvLyBTY2llbmNlLm9yZ1xuXHQnYVtpZF49XCJmbnJlZlwiXScsXG5cdCdhW2lkXj1cInJlZi1saW5rXCJdJywgLy8gTmF0dXJlLmNvbVxuXS5qb2luKCcsJyk7XG5cbmNvbnN0IEZPT1ROT1RFX0xJU1RfU0VMRUNUT1JTID0gW1xuXHQnZGl2LmZvb3Rub3RlIG9sJyxcblx0J2Rpdi5mb290bm90ZXMgb2wnLFxuXHQnZGl2W3JvbGU9XCJkb2MtZW5kbm90ZXNcIl0nLFxuXHQnZGl2W3JvbGU9XCJkb2MtZm9vdG5vdGVzXCJdJyxcblx0J29sLmZvb3Rub3Rlcy1saXN0Jyxcblx0J29sLmZvb3Rub3RlcycsXG5cdCdvbC5yZWZlcmVuY2VzJyxcblx0J29sW2NsYXNzKj1cImFydGljbGUtcmVmZXJlbmNlc1wiXScsXG5cdCdzZWN0aW9uLmZvb3Rub3RlcyBvbCcsXG5cdCdzZWN0aW9uW3JvbGU9XCJkb2MtZW5kbm90ZXNcIl0nLFxuXHQnc2VjdGlvbltyb2xlPVwiZG9jLWZvb3Rub3Rlc1wiXScsXG5cdCdzZWN0aW9uW3JvbGU9XCJkb2MtYmlibGlvZ3JhcGh5XCJdJyxcblx0J3VsLmZvb3Rub3Rlcy1saXN0Jyxcblx0J3VsLmx0eF9iaWJsaXN0Jyxcblx0J2Rpdi5mb290bm90ZVtkYXRhLWNvbXBvbmVudC1uYW1lPVwiRm9vdG5vdGVUb0RPTVwiXScgLy8gU3Vic3RhY2tcbl0uam9pbignLCcpO1xuXG4vLyBFbGVtZW50cyB0aGF0IGFyZSBhbGxvd2VkIHRvIGJlIGVtcHR5XG4vLyBUaGVzZSBhcmUgbm90IHJlbW92ZWQgZXZlbiBpZiB0aGV5IGhhdmUgbm8gY29udGVudFxuY29uc3QgQUxMT1dFRF9FTVBUWV9FTEVNRU5UUyA9IG5ldyBTZXQoW1xuXHQnYXJlYScsXG5cdCdhdWRpbycsXG5cdCdiYXNlJyxcblx0J2JyJyxcblx0J2NpcmNsZScsXG5cdCdjb2wnLFxuXHQnZGVmcycsXG5cdCdlbGxpcHNlJyxcblx0J2VtYmVkJyxcblx0J2ZpZ3VyZScsXG5cdCdnJyxcblx0J2hyJyxcblx0J2lmcmFtZScsXG5cdCdpbWcnLFxuXHQnaW5wdXQnLFxuXHQnbGluZScsXG5cdCdsaW5rJyxcblx0J21hc2snLFxuXHQnbWV0YScsXG5cdCdvYmplY3QnLFxuXHQncGFyYW0nLFxuXHQncGF0aCcsXG5cdCdwYXR0ZXJuJyxcblx0J3BpY3R1cmUnLFxuXHQncG9seWdvbicsXG5cdCdwb2x5bGluZScsXG5cdCdyZWN0Jyxcblx0J3NvdXJjZScsXG5cdCdzdG9wJyxcblx0J3N2ZycsXG5cdCd0ZCcsXG5cdCd0aCcsXG5cdCd0cmFjaycsXG5cdCd1c2UnLFxuXHQndmlkZW8nLFxuXHQnd2JyJ1xuXSk7XG5cbi8vIEF0dHJpYnV0ZXMgdG8ga2VlcFxuY29uc3QgQUxMT1dFRF9BVFRSSUJVVEVTID0gbmV3IFNldChbXG5cdCdhbHQnLFxuXHQnYWxsb3cnLFxuXHQnYWxsb3dmdWxsc2NyZWVuJyxcblx0J2FyaWEtbGFiZWwnLFxuXHQnY2hlY2tlZCcsXG5cdCdjb2xzcGFuJyxcblx0J2NvbnRyb2xzJyxcblx0J2RhdGEtc3JjJyxcblx0J2RhdGEtc3Jjc2V0Jyxcblx0J2RhdGEtbGFuZycsXG5cdCdkaXInLFxuXHQnZnJhbWVib3JkZXInLFxuXHQnaGVhZGVycycsXG5cdCdoZWlnaHQnLFxuXHQnaHJlZicsXG5cdCdsYW5nJyxcblx0J3JvbGUnLFxuXHQncm93c3BhbicsXG5cdCdzcmMnLFxuXHQnc3Jjc2V0Jyxcblx0J3RpdGxlJyxcblx0J3R5cGUnLFxuXHQnd2lkdGgnXG5dKTtcblxuLy8gU3VwcG9ydGVkIGxhbmd1YWdlcyBmb3IgY29kZSBibG9ja3NcbmNvbnN0IFNVUFBPUlRFRF9MQU5HVUFHRVMgPSBuZXcgU2V0KFtcblx0Ly8gTWFya3VwICYgV2ViXG5cdCdtYXJrdXAnLCAnaHRtbCcsICd4bWwnLCAnc3ZnJywgJ21hdGhtbCcsICdzc21sJywgJ2F0b20nLCAncnNzJyxcblx0J2phdmFzY3JpcHQnLCAnanMnLCAnanN4JywgJ3R5cGVzY3JpcHQnLCAndHMnLCAndHN4Jyxcblx0J3dlYmFzc2VtYmx5JywgJ3dhc20nLFxuXHRcblx0Ly8gQ29tbW9uIFByb2dyYW1taW5nIExhbmd1YWdlc1xuXHQncHl0aG9uJyxcblx0J2phdmEnLFxuXHQnY3NoYXJwJywgJ2NzJywgJ2RvdG5ldCcsICdhc3BuZXQnLFxuXHQnY3BwJywgJ2MrKycsICdjJywgJ29iamMnLFxuXHQncnVieScsICdyYicsXG5cdCdwaHAnLFxuXHQnZ29sYW5nJyxcblx0J3J1c3QnLFxuXHQnc3dpZnQnLFxuXHQna290bGluJyxcblx0J3NjYWxhJyxcblx0J2RhcnQnLFxuXHRcblx0Ly8gU2hlbGwgJiBTY3JpcHRpbmdcblx0J2Jhc2gnLCAnc2hlbGwnLCAnc2gnLFxuXHQncG93ZXJzaGVsbCcsXG5cdCdiYXRjaCcsXG5cdFxuXHQvLyBEYXRhICYgQ29uZmlnXG5cdCdqc29uJywgJ2pzb25wJyxcblx0J3lhbWwnLCAneW1sJyxcblx0J3RvbWwnLFxuXHQnZG9ja2VyZmlsZScsXG5cdCdnaXRpZ25vcmUnLFxuXHRcblx0Ly8gUXVlcnkgTGFuZ3VhZ2VzXG5cdCdzcWwnLCAnbXlzcWwnLCAncG9zdGdyZXNxbCcsXG5cdCdncmFwaHFsJyxcblx0J21vbmdvZGInLFxuXHQnc3BhcnFsJyxcblx0XG5cdC8vIE1hcmt1cCAmIERvY3VtZW50YXRpb25cblx0J21hcmtkb3duJywgJ21kJyxcblx0J2xhdGV4JywgJ3RleCcsXG5cdCdhc2NpaWRvYycsICdhZG9jJyxcblx0J2pzZG9jJyxcblx0XG5cdC8vIEZ1bmN0aW9uYWwgTGFuZ3VhZ2VzXG5cdCdoYXNrZWxsJywgJ2hzJyxcblx0J2VsbScsXG5cdCdlbGl4aXInLFxuXHQnZXJsYW5nJyxcblx0J29jYW1sJyxcblx0J2ZzaGFycCcsXG5cdCdzY2hlbWUnLFxuXHQnbGlzcCcsICdlbGlzcCcsXG5cdCdjbG9qdXJlJyxcblx0XG5cdC8vIE90aGVyIExhbmd1YWdlc1xuXHQnbWF0bGFiJyxcblx0J2ZvcnRyYW4nLFxuXHQnY29ib2wnLFxuXHQncGFzY2FsJyxcblx0J3BlcmwnLFxuXHQnbHVhJyxcblx0J2p1bGlhJyxcblx0J2dyb292eScsXG5cdCdjcnlzdGFsJyxcblx0J25pbScsXG5cdCd6aWcnLFxuXHRcblx0Ly8gRG9tYWluIFNwZWNpZmljXG5cdCdyZWdleCcsXG5cdCdncmFkbGUnLFxuXHQnY21ha2UnLFxuXHQnbWFrZWZpbGUnLFxuXHQnbml4Jyxcblx0J3RlcnJhZm9ybScsXG5cdCdzb2xpZGl0eScsXG5cdCdnbHNsJyxcblx0J2hsc2wnLFxuXHRcblx0Ly8gQXNzZW1ibHlcblx0J25hc20nLFxuXHQnbWFzbScsXG5cdCdhcm1hc20nLFxuXHRcblx0Ly8gR2FtZSBEZXZlbG9wbWVudFxuXHQnZ2RzY3JpcHQnLFxuXHQndW5yZWFsc2NyaXB0Jyxcblx0XG5cdC8vIE90aGVyc1xuXHQnYWJhcCcsXG5cdCdhY3Rpb25zY3JpcHQnLFxuXHQnYWRhJyxcblx0J2FnZGEnLFxuXHQnYW50bHI0Jyxcblx0J2FwcGxlc2NyaXB0Jyxcblx0J2FyZHVpbm8nLFxuXHQnY29mZmVlc2NyaXB0Jyxcblx0J2RqYW5nbycsXG5cdCdlcmxhbmcnLFxuXHQnZm9ydHJhbicsXG5cdCdoYXhlJyxcblx0J2lkcmlzJyxcblx0J2tvdGxpbicsXG5cdCdsaXZlc2NyaXB0Jyxcblx0J21hdGxhYicsXG5cdCduZ2lueCcsXG5cdCdwYXNjYWwnLFxuXHQncHJvbG9nJyxcblx0J3B1cHBldCcsXG5cdCdzY2FsYScsXG5cdCdzY2hlbWUnLFxuXHQndGNsJyxcblx0J3Zlcmlsb2cnLFxuXHQndmhkbCdcbl0pO1xuXG5cbi8vIEVsZW1lbnQgc3RhbmRhcmRpemF0aW9uIHJ1bGVzXG4vLyBNYXBzIHNlbGVjdG9ycyB0byB0aGVpciB0YXJnZXQgSFRNTCBlbGVtZW50IG5hbWVcbmludGVyZmFjZSBTdGFuZGFyZGl6YXRpb25SdWxlIHtcblx0c2VsZWN0b3I6IHN0cmluZztcblx0ZWxlbWVudDogc3RyaW5nO1xuXHR0cmFuc2Zvcm0/OiAoZWw6IEVsZW1lbnQpID0+IEVsZW1lbnQ7XG59XG5cbmNvbnN0IEVMRU1FTlRfU1RBTkRBUkRJWkFUSU9OX1JVTEVTOiBTdGFuZGFyZGl6YXRpb25SdWxlW10gPSBbXG5cdC8vIENvZGUgYmxvY2tzXG5cdHtcblx0XHRzZWxlY3RvcjogJ3ByZScsXG5cdFx0ZWxlbWVudDogJ3ByZScsXG5cdFx0dHJhbnNmb3JtOiAoZWw6IEVsZW1lbnQpOiBFbGVtZW50ID0+IHtcblx0XHRcdGlmICghKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm4gZWw7XG5cblx0XHRcdC8vIEZ1bmN0aW9uIHRvIGdldCBsYW5ndWFnZSBmcm9tIGNsYXNzXG5cdFx0XHRjb25zdCBnZXRMYW5ndWFnZUZyb21DbGFzcyA9IChlbGVtZW50OiBIVE1MRWxlbWVudCk6IHN0cmluZyA9PiB7XG5cdFx0XHRcdC8vIENoZWNrIGRhdGEtbGFuZyBhdHRyaWJ1dGUgZmlyc3Rcblx0XHRcdFx0Y29uc3QgZGF0YUxhbmcgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1sYW5nJyk7XG5cdFx0XHRcdGlmIChkYXRhTGFuZykge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhTGFuZy50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRGVmaW5lIGxhbmd1YWdlIHBhdHRlcm5zXG5cdFx0XHRcdGNvbnN0IGxhbmd1YWdlUGF0dGVybnMgPSBbXG5cdFx0XHRcdFx0L15sYW5ndWFnZS0oXFx3KykkLywgICAgICAgICAgLy8gbGFuZ3VhZ2UtamF2YXNjcmlwdFxuXHRcdFx0XHRcdC9ebGFuZy0oXFx3KykkLywgICAgICAgICAgICAgIC8vIGxhbmctamF2YXNjcmlwdFxuXHRcdFx0XHRcdC9eKFxcdyspLWNvZGUkLywgICAgICAgICAgICAgIC8vIGphdmFzY3JpcHQtY29kZVxuXHRcdFx0XHRcdC9eY29kZS0oXFx3KykkLywgICAgICAgICAgICAgIC8vIGNvZGUtamF2YXNjcmlwdFxuXHRcdFx0XHRcdC9ec3ludGF4LShcXHcrKSQvLCAgICAgICAgICAgIC8vIHN5bnRheC1qYXZhc2NyaXB0XG5cdFx0XHRcdFx0L15jb2RlLXNuaXBwZXRfXyhcXHcrKSQvLCAgICAgLy8gY29kZS1zbmlwcGV0X19qYXZhc2NyaXB0XG5cdFx0XHRcdFx0L15oaWdobGlnaHQtKFxcdyspJC8sICAgICAgICAgLy8gaGlnaGxpZ2h0LWphdmFzY3JpcHRcblx0XHRcdFx0XHQvXihcXHcrKS1zbmlwcGV0JC8gICAgICAgICAgICAvLyBqYXZhc2NyaXB0LXNuaXBwZXRcblx0XHRcdFx0XTtcblxuXHRcdFx0XHQvLyBUaGVuIGNoZWNrIHRoZSBjbGFzcyBhdHRyaWJ1dGUgZm9yIHBhdHRlcm5zXG5cdFx0XHRcdGlmIChlbGVtZW50LmNsYXNzTmFtZSAmJiB0eXBlb2YgZWxlbWVudC5jbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBwYXR0ZXJuIG9mIGxhbmd1YWdlUGF0dGVybnMpIHtcblx0XHRcdFx0XHRcdGNvbnN0IG1hdGNoID0gZWxlbWVudC5jbGFzc05hbWUudG9Mb3dlckNhc2UoKS5tYXRjaChwYXR0ZXJuKTtcblx0XHRcdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gVGhlbiBjaGVjayBmb3Igc3VwcG9ydGVkIGxhbmd1YWdlXG5cdFx0XHRcdFx0aWYgKFNVUFBPUlRFRF9MQU5HVUFHRVMuaGFzKGVsZW1lbnQuY2xhc3NOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudC5jbGFzc05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBjbGFzc05hbWVzID0gQXJyYXkuZnJvbShlbGVtZW50LmNsYXNzTGlzdCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBjbGFzc05hbWVzKSB7XG5cdFx0XHRcdFx0Ly8gQ2hlY2sgcGF0dGVybnMgZmlyc3Rcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHBhdHRlcm4gb2YgbGFuZ3VhZ2VQYXR0ZXJucykge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBjbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cdFx0XHRcdFx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gT25seSBjaGVjayBiYXJlIGxhbmd1YWdlIG5hbWVzIGlmIG5vIHBhdHRlcm5zIHdlcmUgZm91bmRcblx0XHRcdFx0Zm9yIChjb25zdCBjbGFzc05hbWUgb2YgY2xhc3NOYW1lcykge1xuXHRcdFx0XHRcdGlmIChTVVBQT1JURURfTEFOR1VBR0VTLmhhcyhjbGFzc05hbWUudG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBjbGFzc05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gJyc7XG5cdFx0XHR9O1xuXG5cdFx0XHQvLyBUcnkgdG8gZ2V0IHRoZSBsYW5ndWFnZSBmcm9tIHRoZSBlbGVtZW50IGFuZCBpdHMgYW5jZXN0b3JzXG5cdFx0XHRsZXQgbGFuZ3VhZ2UgPSAnJztcblx0XHRcdGxldCBjdXJyZW50RWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gZWw7XG5cdFx0XHRcblx0XHRcdHdoaWxlIChjdXJyZW50RWxlbWVudCAmJiAhbGFuZ3VhZ2UpIHtcblx0XHRcdFx0bGFuZ3VhZ2UgPSBnZXRMYW5ndWFnZUZyb21DbGFzcyhjdXJyZW50RWxlbWVudCk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBBbHNvIGNoZWNrIGZvciBjb2RlIGVsZW1lbnRzIHdpdGhpbiB0aGUgY3VycmVudCBlbGVtZW50XG5cdFx0XHRcdGlmICghbGFuZ3VhZ2UgJiYgY3VycmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcignY29kZScpKSB7XG5cdFx0XHRcdFx0bGFuZ3VhZ2UgPSBnZXRMYW5ndWFnZUZyb21DbGFzcyhjdXJyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKCdjb2RlJykhKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0Y3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBGdW5jdGlvbiB0byByZWN1cnNpdmVseSBleHRyYWN0IHRleHQgY29udGVudCB3aGlsZSBwcmVzZXJ2aW5nIHN0cnVjdHVyZVxuXHRcdFx0Y29uc3QgZXh0cmFjdFN0cnVjdHVyZWRUZXh0ID0gKGVsZW1lbnQ6IE5vZGUpOiBzdHJpbmcgPT4ge1xuXHRcdFx0XHRpZiAoZWxlbWVudC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudC50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0bGV0IHRleHQgPSAnJztcblx0XHRcdFx0aWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuXHRcdFx0XHRcdC8vIEhhbmRsZSBsaW5lIGJyZWFrc1xuXHRcdFx0XHRcdGlmIChlbGVtZW50LnRhZ05hbWUgPT09ICdCUicpIHtcblx0XHRcdFx0XHRcdHJldHVybiAnXFxuJztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gSGFuZGxlIGNvZGUgZWxlbWVudHMgYW5kIHRoZWlyIGNoaWxkcmVuXG5cdFx0XHRcdFx0ZWxlbWVudC5jaGlsZE5vZGVzLmZvckVhY2goY2hpbGQgPT4ge1xuXHRcdFx0XHRcdFx0dGV4dCArPSBleHRyYWN0U3RydWN0dXJlZFRleHQoY2hpbGQpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIEFkZCBuZXdsaW5lIGFmdGVyIGVhY2ggY29kZSBlbGVtZW50XG5cdFx0XHRcdFx0aWYgKGVsZW1lbnQudGFnTmFtZSA9PT0gJ0NPREUnKSB7XG5cdFx0XHRcdFx0XHR0ZXh0ICs9ICdcXG4nO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdGV4dDtcblx0XHRcdH07XG5cblx0XHRcdC8vIEV4dHJhY3QgYWxsIHRleHQgY29udGVudFxuXHRcdFx0bGV0IGNvZGVDb250ZW50ID0gZXh0cmFjdFN0cnVjdHVyZWRUZXh0KGVsKTtcblxuXHRcdFx0Ly8gQ2xlYW4gdXAgdGhlIGNvbnRlbnRcblx0XHRcdGNvZGVDb250ZW50ID0gY29kZUNvbnRlbnRcblx0XHRcdFx0Ly8gUmVtb3ZlIGFueSBleHRyYSBuZXdsaW5lcyBhdCB0aGUgc3RhcnRcblx0XHRcdFx0LnJlcGxhY2UoL15cXG4rLywgJycpXG5cdFx0XHRcdC8vIFJlbW92ZSBhbnkgZXh0cmEgbmV3bGluZXMgYXQgdGhlIGVuZFxuXHRcdFx0XHQucmVwbGFjZSgvXFxuKyQvLCAnJylcblx0XHRcdFx0Ly8gUmVwbGFjZSBtdWx0aXBsZSBjb25zZWN1dGl2ZSBuZXdsaW5lcyB3aXRoIGEgc2luZ2xlIG5ld2xpbmVcblx0XHRcdFx0LnJlcGxhY2UoL1xcbnszLH0vZywgJ1xcblxcbicpO1xuXG5cdFx0XHQvLyBDcmVhdGUgbmV3IHByZSBlbGVtZW50XG5cdFx0XHRjb25zdCBuZXdQcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcblx0XHRcdFxuXHRcdFx0Ly8gQ29weSBhbGxvd2VkIGF0dHJpYnV0ZXNcblx0XHRcdEFycmF5LmZyb20oZWwuYXR0cmlidXRlcykuZm9yRWFjaChhdHRyID0+IHtcblx0XHRcdFx0aWYgKEFMTE9XRURfQVRUUklCVVRFUy5oYXMoYXR0ci5uYW1lKSkge1xuXHRcdFx0XHRcdG5ld1ByZS5zZXRBdHRyaWJ1dGUoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIENyZWF0ZSBjb2RlIGVsZW1lbnRcblx0XHRcdGNvbnN0IGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjb2RlJyk7XG5cdFx0XHRpZiAobGFuZ3VhZ2UpIHtcblx0XHRcdFx0Y29kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZycsIGxhbmd1YWdlKTtcblx0XHRcdFx0Y29kZS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgYGxhbmd1YWdlLSR7bGFuZ3VhZ2V9YCk7XG5cdFx0XHR9XG5cdFx0XHRjb2RlLnRleHRDb250ZW50ID0gY29kZUNvbnRlbnQ7XG5cdFx0XHRcblx0XHRcdG5ld1ByZS5hcHBlbmRDaGlsZChjb2RlKTtcblx0XHRcdHJldHVybiBuZXdQcmU7XG5cdFx0fVxuXHR9LFxuXHQvLyBTaW1wbGlmeSBoZWFkaW5ncyBieSByZW1vdmluZyBpbnRlcm5hbCBuYXZpZ2F0aW9uIGVsZW1lbnRzXG5cdHtcblx0XHRzZWxlY3RvcjogJ2gxLCBoMiwgaDMsIGg0LCBoNSwgaDYnLFxuXHRcdGVsZW1lbnQ6ICdrZWVwJyxcblx0XHR0cmFuc2Zvcm06IChlbDogRWxlbWVudCk6IEVsZW1lbnQgPT4ge1xuXHRcdFx0Ly8gSWYgaGVhZGluZyBvbmx5IGNvbnRhaW5zIGEgc2luZ2xlIGFuY2hvciB3aXRoIGludGVybmFsIGxpbmtcblx0XHRcdGlmIChlbC5jaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgXG5cdFx0XHRcdGVsLmZpcnN0RWxlbWVudENoaWxkPy50YWdOYW1lID09PSAnQScgJiZcblx0XHRcdFx0KGVsLmZpcnN0RWxlbWVudENoaWxkLmdldEF0dHJpYnV0ZSgnaHJlZicpPy5pbmNsdWRlcygnIycpIHx8IFxuXHRcdFx0XHQgZWwuZmlyc3RFbGVtZW50Q2hpbGQuZ2V0QXR0cmlidXRlKCdocmVmJyk/LnN0YXJ0c1dpdGgoJyMnKSkpIHtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIENyZWF0ZSBuZXcgaGVhZGluZyBvZiBzYW1lIGxldmVsXG5cdFx0XHRcdGNvbnN0IG5ld0hlYWRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGVsLnRhZ05hbWUpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gQ29weSBhbGxvd2VkIGF0dHJpYnV0ZXMgZnJvbSBvcmlnaW5hbCBoZWFkaW5nXG5cdFx0XHRcdEFycmF5LmZyb20oZWwuYXR0cmlidXRlcykuZm9yRWFjaChhdHRyID0+IHtcblx0XHRcdFx0XHRpZiAoQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyLm5hbWUpKSB7XG5cdFx0XHRcdFx0XHRuZXdIZWFkaW5nLnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBKdXN0IHVzZSB0aGUgdGV4dCBjb250ZW50XG5cdFx0XHRcdG5ld0hlYWRpbmcudGV4dENvbnRlbnQgPSBlbC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuXHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIG5ld0hlYWRpbmc7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIElmIGhlYWRpbmcgY29udGFpbnMgbmF2aWdhdGlvbiBidXR0b25zIG9yIG90aGVyIHV0aWxpdHkgZWxlbWVudHNcblx0XHRcdGNvbnN0IGJ1dHRvbnMgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKCdidXR0b24nKTtcblx0XHRcdGlmIChidXR0b25zLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Y29uc3QgbmV3SGVhZGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWwudGFnTmFtZSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBDb3B5IGFsbG93ZWQgYXR0cmlidXRlc1xuXHRcdFx0XHRBcnJheS5mcm9tKGVsLmF0dHJpYnV0ZXMpLmZvckVhY2goYXR0ciA9PiB7XG5cdFx0XHRcdFx0aWYgKEFMTE9XRURfQVRUUklCVVRFUy5oYXMoYXR0ci5uYW1lKSkge1xuXHRcdFx0XHRcdFx0bmV3SGVhZGluZy5zZXRBdHRyaWJ1dGUoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gSnVzdCB1c2UgdGhlIHRleHQgY29udGVudFxuXHRcdFx0XHRuZXdIZWFkaW5nLnRleHRDb250ZW50ID0gZWwudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiBuZXdIZWFkaW5nO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gZWw7XG5cdFx0fVxuXHR9LFxuXHQvLyBDb252ZXJ0IGRpdnMgd2l0aCBwYXJhZ3JhcGggcm9sZSB0byBhY3R1YWwgcGFyYWdyYXBoc1xuXHR7IFxuXHRcdHNlbGVjdG9yOiAnZGl2W2RhdGEtdGVzdGlkXj1cInBhcmFncmFwaFwiXSwgZGl2W3JvbGU9XCJwYXJhZ3JhcGhcIl0nLCBcblx0XHRlbGVtZW50OiAncCcsXG5cdFx0dHJhbnNmb3JtOiAoZWw6IEVsZW1lbnQpOiBFbGVtZW50ID0+IHtcblx0XHRcdGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cdFx0XHRcblx0XHRcdC8vIENvcHkgaW5uZXJIVE1MXG5cdFx0XHRwLmlubmVySFRNTCA9IGVsLmlubmVySFRNTDtcblx0XHRcdFxuXHRcdFx0Ly8gQ29weSBhbGxvd2VkIGF0dHJpYnV0ZXNcblx0XHRcdEFycmF5LmZyb20oZWwuYXR0cmlidXRlcykuZm9yRWFjaChhdHRyID0+IHtcblx0XHRcdFx0aWYgKEFMTE9XRURfQVRUUklCVVRFUy5oYXMoYXR0ci5uYW1lKSkge1xuXHRcdFx0XHRcdHAuc2V0QXR0cmlidXRlKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9XG5cdH0sXG5cdC8vIENvbnZlcnQgZGl2cyB3aXRoIGxpc3Qgcm9sZXMgdG8gYWN0dWFsIGxpc3RzXG5cdHsgXG5cdFx0c2VsZWN0b3I6ICdkaXZbcm9sZT1cImxpc3RcIl0nLCBcblx0XHRlbGVtZW50OiAndWwnLFxuXHRcdC8vIEN1c3RvbSBoYW5kbGVyIGZvciBsaXN0IHR5cGUgZGV0ZWN0aW9uIGFuZCB0cmFuc2Zvcm1hdGlvblxuXHRcdHRyYW5zZm9ybTogKGVsOiBFbGVtZW50KTogRWxlbWVudCA9PiB7XG5cdFx0XHQvLyBGaXJzdCBkZXRlcm1pbmUgaWYgdGhpcyBpcyBhbiBvcmRlcmVkIGxpc3Rcblx0XHRcdGNvbnN0IGZpcnN0SXRlbSA9IGVsLnF1ZXJ5U2VsZWN0b3IoJ2Rpdltyb2xlPVwibGlzdGl0ZW1cIl0gLmxhYmVsJyk7XG5cdFx0XHRjb25zdCBsYWJlbCA9IGZpcnN0SXRlbT8udGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcblx0XHRcdGNvbnN0IGlzT3JkZXJlZCA9IGxhYmVsLm1hdGNoKC9eXFxkK1xcKS8pO1xuXHRcdFx0XG5cdFx0XHQvLyBDcmVhdGUgdGhlIGFwcHJvcHJpYXRlIGxpc3QgdHlwZVxuXHRcdFx0Y29uc3QgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaXNPcmRlcmVkID8gJ29sJyA6ICd1bCcpO1xuXHRcdFx0XG5cdFx0XHQvLyBQcm9jZXNzIGVhY2ggbGlzdCBpdGVtXG5cdFx0XHRjb25zdCBpdGVtcyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdltyb2xlPVwibGlzdGl0ZW1cIl0nKTtcblx0XHRcdGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG5cdFx0XHRcdGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblx0XHRcdFx0Y29uc3QgY29udGVudCA9IGl0ZW0ucXVlcnlTZWxlY3RvcignLmNvbnRlbnQnKTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChjb250ZW50KSB7XG5cdFx0XHRcdFx0Ly8gQ29udmVydCBhbnkgcGFyYWdyYXBoIGRpdnMgaW5zaWRlIGNvbnRlbnRcblx0XHRcdFx0XHRjb25zdCBwYXJhZ3JhcGhEaXZzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCdkaXZbcm9sZT1cInBhcmFncmFwaFwiXScpO1xuXHRcdFx0XHRcdHBhcmFncmFwaERpdnMuZm9yRWFjaChkaXYgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdFx0XHRcdHAuaW5uZXJIVE1MID0gZGl2LmlubmVySFRNTDtcblx0XHRcdFx0XHRcdGRpdi5yZXBsYWNlV2l0aChwKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBDb252ZXJ0IGFueSBuZXN0ZWQgbGlzdHMgcmVjdXJzaXZlbHlcblx0XHRcdFx0XHRjb25zdCBuZXN0ZWRMaXN0cyA9IGNvbnRlbnQucXVlcnlTZWxlY3RvckFsbCgnZGl2W3JvbGU9XCJsaXN0XCJdJyk7XG5cdFx0XHRcdFx0bmVzdGVkTGlzdHMuZm9yRWFjaChuZXN0ZWRMaXN0ID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGZpcnN0TmVzdGVkSXRlbSA9IG5lc3RlZExpc3QucXVlcnlTZWxlY3RvcignZGl2W3JvbGU9XCJsaXN0aXRlbVwiXSAubGFiZWwnKTtcblx0XHRcdFx0XHRcdGNvbnN0IG5lc3RlZExhYmVsID0gZmlyc3ROZXN0ZWRJdGVtPy50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuXHRcdFx0XHRcdFx0Y29uc3QgaXNOZXN0ZWRPcmRlcmVkID0gbmVzdGVkTGFiZWwubWF0Y2goL15cXGQrXFwpLyk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdGNvbnN0IG5ld05lc3RlZExpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGlzTmVzdGVkT3JkZXJlZCA/ICdvbCcgOiAndWwnKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly8gUHJvY2VzcyBuZXN0ZWQgaXRlbXNcblx0XHRcdFx0XHRcdGNvbnN0IG5lc3RlZEl0ZW1zID0gbmVzdGVkTGlzdC5xdWVyeVNlbGVjdG9yQWxsKCdkaXZbcm9sZT1cImxpc3RpdGVtXCJdJyk7XG5cdFx0XHRcdFx0XHRuZXN0ZWRJdGVtcy5mb3JFYWNoKG5lc3RlZEl0ZW0gPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBuZXN0ZWRMaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG5lc3RlZENvbnRlbnQgPSBuZXN0ZWRJdGVtLnF1ZXJ5U2VsZWN0b3IoJy5jb250ZW50Jyk7XG5cdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0XHRpZiAobmVzdGVkQ29udGVudCkge1xuXHRcdFx0XHRcdFx0XHRcdC8vIENvbnZlcnQgcGFyYWdyYXBoIGRpdnMgaW4gbmVzdGVkIGl0ZW1zXG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgbmVzdGVkUGFyYWdyYXBocyA9IG5lc3RlZENvbnRlbnQucXVlcnlTZWxlY3RvckFsbCgnZGl2W3JvbGU9XCJwYXJhZ3JhcGhcIl0nKTtcblx0XHRcdFx0XHRcdFx0XHRuZXN0ZWRQYXJhZ3JhcGhzLmZvckVhY2goZGl2ID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRwLmlubmVySFRNTCA9IGRpdi5pbm5lckhUTUw7XG5cdFx0XHRcdFx0XHRcdFx0XHRkaXYucmVwbGFjZVdpdGgocCk7XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0bmVzdGVkTGkuaW5uZXJIVE1MID0gbmVzdGVkQ29udGVudC5pbm5lckhUTUw7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdG5ld05lc3RlZExpc3QuYXBwZW5kQ2hpbGQobmVzdGVkTGkpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdG5lc3RlZExpc3QucmVwbGFjZVdpdGgobmV3TmVzdGVkTGlzdCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0bGkuaW5uZXJIVE1MID0gY29udGVudC5pbm5lckhUTUw7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGxpc3QuYXBwZW5kQ2hpbGQobGkpO1xuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdHJldHVybiBsaXN0O1xuXHRcdH1cblx0fSxcblx0eyBcblx0XHRzZWxlY3RvcjogJ2Rpdltyb2xlPVwibGlzdGl0ZW1cIl0nLCBcblx0XHRlbGVtZW50OiAnbGknLFxuXHRcdC8vIEN1c3RvbSBoYW5kbGVyIGZvciBsaXN0IGl0ZW0gY29udGVudFxuXHRcdHRyYW5zZm9ybTogKGVsOiBFbGVtZW50KTogRWxlbWVudCA9PiB7XG5cdFx0XHRjb25zdCBjb250ZW50ID0gZWwucXVlcnlTZWxlY3RvcignLmNvbnRlbnQnKTtcblx0XHRcdGlmICghY29udGVudCkgcmV0dXJuIGVsO1xuXHRcdFx0XG5cdFx0XHQvLyBDb252ZXJ0IGFueSBwYXJhZ3JhcGggZGl2cyBpbnNpZGUgY29udGVudFxuXHRcdFx0Y29uc3QgcGFyYWdyYXBoRGl2cyA9IGNvbnRlbnQucXVlcnlTZWxlY3RvckFsbCgnZGl2W3JvbGU9XCJwYXJhZ3JhcGhcIl0nKTtcblx0XHRcdHBhcmFncmFwaERpdnMuZm9yRWFjaChkaXYgPT4ge1xuXHRcdFx0XHRjb25zdCBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdFx0XHRwLmlubmVySFRNTCA9IGRpdi5pbm5lckhUTUw7XG5cdFx0XHRcdGRpdi5yZXBsYWNlV2l0aChwKTtcblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gY29udGVudDtcblx0XHR9XG5cdH0sXG5cdC8vIENvZGUgYmxvY2tzIHdpdGggc3ludGF4IGhpZ2hsaWdodGluZ1xuXHR7XG5cdFx0c2VsZWN0b3I6ICcud3AtYmxvY2stc3ludGF4aGlnaGxpZ2h0ZXItY29kZSwgLnN5bnRheGhpZ2hsaWdodGVyLCAuaGlnaGxpZ2h0LCAuaGlnaGxpZ2h0LXNvdXJjZSwgLndwLWJsb2NrLWNvZGUsIHByZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl0sIHByZVtjbGFzcyo9XCJicnVzaDpcIl0nLFxuXHRcdGVsZW1lbnQ6ICdwcmUnLFxuXHRcdHRyYW5zZm9ybTogKGVsOiBFbGVtZW50KTogRWxlbWVudCA9PiB7XG5cdFx0XHRpZiAoIShlbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkgcmV0dXJuIGVsO1xuXG5cdFx0XHQvLyBDcmVhdGUgbmV3IHByZSBlbGVtZW50XG5cdFx0XHRjb25zdCBuZXdQcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwcmUnKTtcblx0XHRcdFxuXHRcdFx0Ly8gVHJ5IHRvIGRldGVjdCBsYW5ndWFnZVxuXHRcdFx0bGV0IGxhbmd1YWdlID0gJyc7XG5cdFx0XHRcblx0XHRcdC8vIENoZWNrIGZvciBXb3JkUHJlc3Mgc3ludGF4IGhpZ2hsaWdodGVyIHNwZWNpZmljIGZvcm1hdFxuXHRcdFx0Y29uc3Qgc3ludGF4RWwgPSBlbC5xdWVyeVNlbGVjdG9yKCcuc3ludGF4aGlnaGxpZ2h0ZXInKTtcblx0XHRcdGlmIChzeW50YXhFbCkge1xuXHRcdFx0XHQvLyBHZXQgbGFuZ3VhZ2UgZnJvbSBzeW50YXhoaWdobGlnaHRlciBjbGFzc1xuXHRcdFx0XHRjb25zdCBjbGFzc2VzID0gQXJyYXkuZnJvbShzeW50YXhFbC5jbGFzc0xpc3QpO1xuXHRcdFx0XHRjb25zdCBsYW5nQ2xhc3MgPSBjbGFzc2VzLmZpbmQoYyA9PiAhWydzeW50YXhoaWdobGlnaHRlcicsICdub2d1dHRlciddLmluY2x1ZGVzKGMpKTtcblx0XHRcdFx0aWYgKGxhbmdDbGFzcyAmJiBTVVBQT1JURURfTEFOR1VBR0VTLmhhcyhsYW5nQ2xhc3MudG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHRsYW5ndWFnZSA9IGxhbmdDbGFzcy50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIG5vIGxhbmd1YWdlIGZvdW5kIHlldCwgY2hlY2sgb3RoZXIgY29tbW9uIHBhdHRlcm5zXG5cdFx0XHRpZiAoIWxhbmd1YWdlKSB7XG5cdFx0XHRcdGNvbnN0IGNsYXNzTmFtZXMgPSBBcnJheS5mcm9tKGVsLmNsYXNzTGlzdCk7XG5cdFx0XHRcdGNvbnN0IGxhbmd1YWdlUGF0dGVybnMgPSBbXG5cdFx0XHRcdFx0Lyg/Ol58XFxzKSg/Omxhbmd1YWdlfGxhbmd8YnJ1c2h8c3ludGF4KS0oXFx3KykoPzpcXHN8JCkvaSxcblx0XHRcdFx0XHQvKD86XnxcXHMpKFxcdyspKD86XFxzfCQpL2lcblx0XHRcdFx0XTtcblxuXHRcdFx0XHRmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBjbGFzc05hbWVzKSB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBwYXR0ZXJuIG9mIGxhbmd1YWdlUGF0dGVybnMpIHtcblx0XHRcdFx0XHRcdGNvbnN0IG1hdGNoID0gY2xhc3NOYW1lLm1hdGNoKHBhdHRlcm4pO1xuXHRcdFx0XHRcdFx0aWYgKG1hdGNoICYmIG1hdGNoWzFdICYmIFNVUFBPUlRFRF9MQU5HVUFHRVMuaGFzKG1hdGNoWzFdLnRvTG93ZXJDYXNlKCkpKSB7XG5cdFx0XHRcdFx0XHRcdGxhbmd1YWdlID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChsYW5ndWFnZSkgYnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gRXh0cmFjdCBjb2RlIGNvbnRlbnQsIGhhbmRsaW5nIHZhcmlvdXMgZm9ybWF0c1xuXHRcdFx0bGV0IGNvZGVDb250ZW50ID0gJyc7XG5cblx0XHRcdC8vIEhhbmRsZSBXb3JkUHJlc3Mgc3ludGF4IGhpZ2hsaWdodGVyIHRhYmxlIGZvcm1hdFxuXHRcdFx0Y29uc3QgY29kZUNvbnRhaW5lciA9IGVsLnF1ZXJ5U2VsZWN0b3IoJy5zeW50YXhoaWdobGlnaHRlciB0YWJsZSAuY29kZSAuY29udGFpbmVyJyk7XG5cdFx0XHRpZiAoY29kZUNvbnRhaW5lcikge1xuXHRcdFx0XHQvLyBQcm9jZXNzIGVhY2ggbGluZVxuXHRcdFx0XHRjb25zdCBsaW5lcyA9IEFycmF5LmZyb20oY29kZUNvbnRhaW5lci5jaGlsZHJlbik7XG5cdFx0XHRcdGNvZGVDb250ZW50ID0gbGluZXNcblx0XHRcdFx0XHQubWFwKGxpbmUgPT4ge1xuXHRcdFx0XHRcdFx0Ly8gR2V0IGFsbCBjb2RlIGVsZW1lbnRzIGluIHRoaXMgbGluZVxuXHRcdFx0XHRcdFx0Y29uc3QgY29kZVBhcnRzID0gQXJyYXkuZnJvbShsaW5lLnF1ZXJ5U2VsZWN0b3JBbGwoJ2NvZGUnKSlcblx0XHRcdFx0XHRcdFx0Lm1hcChjb2RlID0+IHtcblx0XHRcdFx0XHRcdFx0XHQvLyBHZXQgdGhlIHRleHQgY29udGVudCwgcHJlc2VydmluZyBzcGFjZXNcblx0XHRcdFx0XHRcdFx0XHRsZXQgdGV4dCA9IGNvZGUudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gSWYgdGhpcyBpcyBhICdzcGFjZXMnIGNsYXNzIGVsZW1lbnQsIGNvbnZlcnQgdG8gYWN0dWFsIHNwYWNlc1xuXHRcdFx0XHRcdFx0XHRcdGlmIChjb2RlLmNsYXNzTGlzdC5jb250YWlucygnc3BhY2VzJykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRleHQgPSAnICcucmVwZWF0KHRleHQubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHRleHQ7XG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdC5qb2luKCcnKTtcblx0XHRcdFx0XHRcdHJldHVybiBjb2RlUGFydHMgfHwgbGluZS50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5qb2luKCdcXG4nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIEhhbmRsZSBXb3JkUHJlc3Mgc3ludGF4IGhpZ2hsaWdodGVyIG5vbi10YWJsZSBmb3JtYXRcblx0XHRcdFx0Y29uc3QgY29kZUxpbmVzID0gZWwucXVlcnlTZWxlY3RvckFsbCgnLmNvZGUgLmxpbmUnKTtcblx0XHRcdFx0aWYgKGNvZGVMaW5lcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0Y29kZUNvbnRlbnQgPSBBcnJheS5mcm9tKGNvZGVMaW5lcylcblx0XHRcdFx0XHRcdC5tYXAobGluZSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGNvZGVQYXJ0cyA9IEFycmF5LmZyb20obGluZS5xdWVyeVNlbGVjdG9yQWxsKCdjb2RlJykpXG5cdFx0XHRcdFx0XHRcdFx0Lm1hcChjb2RlID0+IGNvZGUudGV4dENvbnRlbnQgfHwgJycpXG5cdFx0XHRcdFx0XHRcdFx0LmpvaW4oJycpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gY29kZVBhcnRzIHx8IGxpbmUudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LmpvaW4oJ1xcbicpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIEZhbGxiYWNrIHRvIHJlZ3VsYXIgdGV4dCBjb250ZW50XG5cdFx0XHRcdFx0Y29kZUNvbnRlbnQgPSBlbC50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBDbGVhbiB1cCB0aGUgY29udGVudFxuXHRcdFx0Y29kZUNvbnRlbnQgPSBjb2RlQ29udGVudFxuXHRcdFx0XHQucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpIC8vIFRyaW0gc3RhcnQvZW5kIHdoaXRlc3BhY2Vcblx0XHRcdFx0LnJlcGxhY2UoL1xcdC9nLCAnICAgICcpIC8vIENvbnZlcnQgdGFicyB0byBzcGFjZXNcblx0XHRcdFx0LnJlcGxhY2UoL1xcbnszLH0vZywgJ1xcblxcbicpIC8vIE5vcm1hbGl6ZSBtdWx0aXBsZSBuZXdsaW5lc1xuXHRcdFx0XHQucmVwbGFjZSgvXFx1MDBhMC9nLCAnICcpOyAvLyBSZXBsYWNlIG5vbi1icmVha2luZyBzcGFjZXMgd2l0aCByZWd1bGFyIHNwYWNlc1xuXG5cdFx0XHQvLyBDcmVhdGUgY29kZSBlbGVtZW50IHdpdGggbGFuZ3VhZ2UgY2xhc3MgaWYgZGV0ZWN0ZWRcblx0XHRcdGNvbnN0IGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjb2RlJyk7XG5cdFx0XHRpZiAobGFuZ3VhZ2UpIHtcblx0XHRcdFx0Y29kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtbGFuZycsIGxhbmd1YWdlKTtcblx0XHRcdFx0Y29kZS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgYGxhbmd1YWdlLSR7bGFuZ3VhZ2V9YCk7XG5cdFx0XHR9XG5cdFx0XHRjb2RlLnRleHRDb250ZW50ID0gY29kZUNvbnRlbnQ7XG5cdFx0XHRcblx0XHRcdG5ld1ByZS5hcHBlbmRDaGlsZChjb2RlKTtcblx0XHRcdHJldHVybiBuZXdQcmU7XG5cdFx0fVxuXHR9XG5dO1xuXG5pbnRlcmZhY2UgRm9vdG5vdGVEYXRhIHtcblx0Y29udGVudDogRWxlbWVudCB8IHN0cmluZztcblx0b3JpZ2luYWxJZDogc3RyaW5nO1xuXHRyZWZzOiBzdHJpbmdbXTtcbn1cblxuaW50ZXJmYWNlIEZvb3Rub3RlQ29sbGVjdGlvbiB7XG5cdFtmb290bm90ZU51bWJlcjogbnVtYmVyXTogRm9vdG5vdGVEYXRhO1xufVxuXG5pbnRlcmZhY2UgQ29udGVudFNjb3JlIHtcblx0c2NvcmU6IG51bWJlcjtcblx0ZWxlbWVudDogRWxlbWVudDtcbn1cblxuaW50ZXJmYWNlIFN0eWxlQ2hhbmdlIHtcblx0c2VsZWN0b3I6IHN0cmluZztcblx0c3R5bGVzOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWZ1ZGRsZSB7XG5cdHByaXZhdGUgZG9jOiBEb2N1bWVudDtcblx0cHJpdmF0ZSBvcHRpb25zOiBEZWZ1ZGRsZU9wdGlvbnM7XG5cdHByaXZhdGUgZGVidWc6IGJvb2xlYW47XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBhIG5ldyBEZWZ1ZGRsZSBpbnN0YW5jZVxuXHQgKiBAcGFyYW0gZG9jIC0gVGhlIGRvY3VtZW50IHRvIHBhcnNlXG5cdCAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9ucyBmb3IgcGFyc2luZ1xuXHQgKi9cblx0Y29uc3RydWN0b3IoZG9jOiBEb2N1bWVudCwgb3B0aW9uczogRGVmdWRkbGVPcHRpb25zID0ge30pIHtcblx0XHR0aGlzLmRvYyA9IGRvYztcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuZGVidWcgPSBvcHRpb25zLmRlYnVnIHx8IGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFBhcnNlIHRoZSBkb2N1bWVudCBhbmQgZXh0cmFjdCBpdHMgbWFpbiBjb250ZW50XG5cdCAqL1xuXHRwYXJzZSgpOiBEZWZ1ZGRsZVJlc3BvbnNlIHtcblx0XHRjb25zdCBzdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuXHRcdC8vIEV4dHJhY3QgbWV0YWRhdGEgZmlyc3Qgc2luY2Ugd2UnbGwgbmVlZCBpdCBpbiBtdWx0aXBsZSBwbGFjZXNcblx0XHRjb25zdCBzY2hlbWFPcmdEYXRhID0gTWV0YWRhdGFFeHRyYWN0b3IuZXh0cmFjdFNjaGVtYU9yZ0RhdGEodGhpcy5kb2MpO1xuXHRcdGNvbnN0IG1ldGFkYXRhID0gTWV0YWRhdGFFeHRyYWN0b3IuZXh0cmFjdCh0aGlzLmRvYywgc2NoZW1hT3JnRGF0YSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gRXZhbHVhdGUgc3R5bGVzIGFuZCBzaXplcyBvbiBvcmlnaW5hbCBkb2N1bWVudFxuXHRcdFx0Y29uc3QgbW9iaWxlU3R5bGVzID0gdGhpcy5fZXZhbHVhdGVNZWRpYVF1ZXJpZXModGhpcy5kb2MpO1xuXHRcdFx0XG5cdFx0XHQvLyBDaGVjayBmb3Igc21hbGwgaW1hZ2VzIGluIG9yaWdpbmFsIGRvY3VtZW50LCBleGNsdWRpbmcgbGF6eS1sb2FkZWQgb25lc1xuXHRcdFx0Y29uc3Qgc21hbGxJbWFnZXMgPSB0aGlzLmZpbmRTbWFsbEltYWdlcyh0aGlzLmRvYyk7XG5cdFx0XHRcblx0XHRcdC8vIENsb25lIGRvY3VtZW50XG5cdFx0XHRjb25zdCBjbG9uZSA9IHRoaXMuZG9jLmNsb25lTm9kZSh0cnVlKSBhcyBEb2N1bWVudDtcblx0XHRcdFxuXHRcdFx0Ly8gQXBwbHkgbW9iaWxlIHN0eWxlIHRvIGNsb25lXG5cdFx0XHR0aGlzLmFwcGx5TW9iaWxlU3R5bGVzKGNsb25lLCBtb2JpbGVTdHlsZXMpO1xuXG5cdFx0XHQvLyBGaW5kIG1haW4gY29udGVudFxuXHRcdFx0Y29uc3QgbWFpbkNvbnRlbnQgPSB0aGlzLmZpbmRNYWluQ29udGVudChjbG9uZSk7XG5cdFx0XHRpZiAoIW1haW5Db250ZW50KSB7XG5cdFx0XHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRjb250ZW50OiB0aGlzLmRvYy5ib2R5LmlubmVySFRNTCxcblx0XHRcdFx0XHQuLi5tZXRhZGF0YSxcblx0XHRcdFx0XHR3b3JkQ291bnQ6IHRoaXMuY291bnRXb3Jkcyh0aGlzLmRvYy5ib2R5LmlubmVySFRNTCksXG5cdFx0XHRcdFx0cGFyc2VUaW1lOiBNYXRoLnJvdW5kKGVuZFRpbWUgLSBzdGFydFRpbWUpXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdC8vIFJlbW92ZSBzbWFsbCBpbWFnZXMgaWRlbnRpZmllZCBmcm9tIG9yaWdpbmFsIGRvY3VtZW50XG5cdFx0XHR0aGlzLnJlbW92ZVNtYWxsSW1hZ2VzKGNsb25lLCBzbWFsbEltYWdlcyk7XG5cdFx0XHRcblx0XHRcdC8vIFBlcmZvcm0gb3RoZXIgZGVzdHJ1Y3RpdmUgb3BlcmF0aW9ucyBvbiB0aGUgY2xvbmVcblx0XHRcdHRoaXMucmVtb3ZlSGlkZGVuRWxlbWVudHMoY2xvbmUpO1xuXHRcdFx0dGhpcy5yZW1vdmVDbHV0dGVyKGNsb25lKTtcblxuXHRcdFx0Ly8gQ2xlYW4gdXAgdGhlIG1haW4gY29udGVudFxuXHRcdFx0dGhpcy5jbGVhbkNvbnRlbnQobWFpbkNvbnRlbnQsIG1ldGFkYXRhKTtcblxuXHRcdFx0Y29uc3QgY29udGVudCA9IG1haW5Db250ZW50ID8gbWFpbkNvbnRlbnQub3V0ZXJIVE1MIDogdGhpcy5kb2MuYm9keS5pbm5lckhUTUw7XG5cdFx0XHRjb25zdCBlbmRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbnRlbnQsXG5cdFx0XHRcdC4uLm1ldGFkYXRhLFxuXHRcdFx0XHR3b3JkQ291bnQ6IHRoaXMuY291bnRXb3Jkcyhjb250ZW50KSxcblx0XHRcdFx0cGFyc2VUaW1lOiBNYXRoLnJvdW5kKGVuZFRpbWUgLSBzdGFydFRpbWUpXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdEZWZ1ZGRsZScsICdFcnJvciBwcm9jZXNzaW5nIGRvY3VtZW50OicsIGVycm9yKTtcblx0XHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbnRlbnQ6IHRoaXMuZG9jLmJvZHkuaW5uZXJIVE1MLFxuXHRcdFx0XHQuLi5tZXRhZGF0YSxcblx0XHRcdFx0d29yZENvdW50OiB0aGlzLmNvdW50V29yZHModGhpcy5kb2MuYm9keS5pbm5lckhUTUwpLFxuXHRcdFx0XHRwYXJzZVRpbWU6IE1hdGgucm91bmQoZW5kVGltZSAtIHN0YXJ0VGltZSlcblx0XHRcdH07XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBjb3VudFdvcmRzKGNvbnRlbnQ6IHN0cmluZyk6IG51bWJlciB7XG5cdFx0Ly8gQ3JlYXRlIGEgdGVtcG9yYXJ5IGRpdiB0byBwYXJzZSBIVE1MIGNvbnRlbnRcblx0XHRjb25zdCB0ZW1wRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0dGVtcERpdi5pbm5lckhUTUwgPSBjb250ZW50O1xuXG5cdFx0Ly8gR2V0IHRleHQgY29udGVudCwgcmVtb3ZpbmcgZXh0cmEgd2hpdGVzcGFjZVxuXHRcdGNvbnN0IHRleHQgPSB0ZW1wRGl2LnRleHRDb250ZW50IHx8ICcnO1xuXHRcdGNvbnN0IHdvcmRzID0gdGV4dFxuXHRcdFx0LnRyaW0oKVxuXHRcdFx0LnJlcGxhY2UoL1xccysvZywgJyAnKSAvLyBSZXBsYWNlIG11bHRpcGxlIHNwYWNlcyB3aXRoIHNpbmdsZSBzcGFjZVxuXHRcdFx0LnNwbGl0KCcgJylcblx0XHRcdC5maWx0ZXIod29yZCA9PiB3b3JkLmxlbmd0aCA+IDApOyAvLyBGaWx0ZXIgb3V0IGVtcHR5IHN0cmluZ3NcblxuXHRcdHJldHVybiB3b3Jkcy5sZW5ndGg7XG5cdH1cblxuXHQvLyBNYWtlIGFsbCBvdGhlciBtZXRob2RzIHByaXZhdGUgYnkgcmVtb3ZpbmcgdGhlIHN0YXRpYyBrZXl3b3JkIGFuZCB1c2luZyBwcml2YXRlXG5cdHByaXZhdGUgX2xvZyguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuXHRcdGlmICh0aGlzLmRlYnVnKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnRGVmdWRkbGU6JywgLi4uYXJncyk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBfZXZhbHVhdGVNZWRpYVF1ZXJpZXMoZG9jOiBEb2N1bWVudCk6IFN0eWxlQ2hhbmdlW10ge1xuXHRcdGNvbnN0IG1vYmlsZVN0eWxlczogU3R5bGVDaGFuZ2VbXSA9IFtdO1xuXHRcdGNvbnN0IG1heFdpZHRoUmVnZXggPSAvbWF4LXdpZHRoW146XSo6XFxzKihcXGQrKS87XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gR2V0IGFsbCBzdHlsZXMsIGluY2x1ZGluZyBpbmxpbmUgc3R5bGVzXG5cdFx0XHRjb25zdCBzaGVldHMgPSBBcnJheS5mcm9tKGRvYy5zdHlsZVNoZWV0cykuZmlsdGVyKHNoZWV0ID0+IHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQvLyBBY2Nlc3MgcnVsZXMgb25jZSB0byBjaGVjayB2YWxpZGl0eVxuXHRcdFx0XHRcdHNoZWV0LmNzc1J1bGVzO1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0Ly8gRXhwZWN0ZWQgZXJyb3IgZm9yIGNyb3NzLW9yaWdpbiBzdHlsZXNoZWV0c1xuXHRcdFx0XHRcdGlmIChlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGUubmFtZSA9PT0gJ1NlY3VyaXR5RXJyb3InKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRocm93IGU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0XG5cdFx0XHQvLyBQcm9jZXNzIGFsbCBzaGVldHMgaW4gYSBzaW5nbGUgcGFzc1xuXHRcdFx0Y29uc3QgbWVkaWFSdWxlcyA9IHNoZWV0cy5mbGF0TWFwKHNoZWV0ID0+IHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZXR1cm4gQXJyYXkuZnJvbShzaGVldC5jc3NSdWxlcylcblx0XHRcdFx0XHRcdC5maWx0ZXIoKHJ1bGUpOiBydWxlIGlzIENTU01lZGlhUnVsZSA9PiBcblx0XHRcdFx0XHRcdFx0cnVsZSBpbnN0YW5jZW9mIENTU01lZGlhUnVsZSAmJlxuXHRcdFx0XHRcdFx0XHRydWxlLmNvbmRpdGlvblRleHQuaW5jbHVkZXMoJ21heC13aWR0aCcpXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMuZGVidWcpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignRGVmdWRkbGU6IEZhaWxlZCB0byBwcm9jZXNzIHN0eWxlc2hlZXQ6JywgZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIFByb2Nlc3MgYWxsIG1lZGlhIHJ1bGVzIGluIGEgc2luZ2xlIHBhc3Ncblx0XHRcdG1lZGlhUnVsZXMuZm9yRWFjaChydWxlID0+IHtcblx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBydWxlLmNvbmRpdGlvblRleHQubWF0Y2gobWF4V2lkdGhSZWdleCk7XG5cdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdGNvbnN0IG1heFdpZHRoID0gcGFyc2VJbnQobWF0Y2hbMV0pO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmIChNT0JJTEVfV0lEVEggPD0gbWF4V2lkdGgpIHtcblx0XHRcdFx0XHRcdC8vIEJhdGNoIHByb2Nlc3MgYWxsIHN0eWxlIHJ1bGVzXG5cdFx0XHRcdFx0XHRjb25zdCBzdHlsZVJ1bGVzID0gQXJyYXkuZnJvbShydWxlLmNzc1J1bGVzKVxuXHRcdFx0XHRcdFx0XHQuZmlsdGVyKChyKTogciBpcyBDU1NTdHlsZVJ1bGUgPT4gciBpbnN0YW5jZW9mIENTU1N0eWxlUnVsZSk7XG5cblx0XHRcdFx0XHRcdHN0eWxlUnVsZXMuZm9yRWFjaChjc3NSdWxlID0+IHtcblx0XHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0XHRtb2JpbGVTdHlsZXMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRzZWxlY3RvcjogY3NzUnVsZS5zZWxlY3RvclRleHQsXG5cdFx0XHRcdFx0XHRcdFx0XHRzdHlsZXM6IGNzc1J1bGUuc3R5bGUuY3NzVGV4dFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZGVidWcpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignRGVmdWRkbGU6IEZhaWxlZCB0byBwcm9jZXNzIENTUyBydWxlOicsIGUpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdEZWZ1ZGRsZTogRXJyb3IgZXZhbHVhdGluZyBtZWRpYSBxdWVyaWVzOicsIGUpO1xuXHRcdH1cblxuXHRcdHJldHVybiBtb2JpbGVTdHlsZXM7XG5cdH1cblxuXHRwcml2YXRlIGFwcGx5TW9iaWxlU3R5bGVzKGRvYzogRG9jdW1lbnQsIG1vYmlsZVN0eWxlczogU3R5bGVDaGFuZ2VbXSkge1xuXHRcdGxldCBhcHBsaWVkQ291bnQgPSAwO1xuXG5cdFx0bW9iaWxlU3R5bGVzLmZvckVhY2goKHtzZWxlY3Rvciwgc3R5bGVzfSkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgZWxlbWVudHMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cdFx0XHRcdGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG5cdFx0XHRcdFx0ZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgXG5cdFx0XHRcdFx0XHQoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJykgfHwgJycpICsgc3R5bGVzXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRhcHBsaWVkQ291bnQrKztcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ0RlZnVkZGxlJywgJ0Vycm9yIGFwcGx5aW5nIHN0eWxlcyBmb3Igc2VsZWN0b3I6Jywgc2VsZWN0b3IsIGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdH1cblxuXHRwcml2YXRlIHJlbW92ZUhpZGRlbkVsZW1lbnRzKGRvYzogRG9jdW1lbnQpIHtcblx0XHRsZXQgY291bnQgPSAwO1xuXHRcdGNvbnN0IGVsZW1lbnRzVG9SZW1vdmUgPSBuZXcgU2V0PEVsZW1lbnQ+KCk7XG5cblx0XHQvLyBGaXJzdCBwYXNzOiBHZXQgYWxsIGVsZW1lbnRzIG1hdGNoaW5nIGhpZGRlbiBzZWxlY3RvcnNcblx0XHRjb25zdCBoaWRkZW5FbGVtZW50cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKEhJRERFTl9FTEVNRU5UX1NFTEVDVE9SUyk7XG5cdFx0aGlkZGVuRWxlbWVudHMuZm9yRWFjaChlbCA9PiBlbGVtZW50c1RvUmVtb3ZlLmFkZChlbCkpO1xuXHRcdGNvdW50ICs9IGhpZGRlbkVsZW1lbnRzLmxlbmd0aDtcblxuXHRcdC8vIFNlY29uZCBwYXNzOiBVc2UgVHJlZVdhbGtlciBmb3IgZWZmaWNpZW50IHRyYXZlcnNhbFxuXHRcdGNvbnN0IHRyZWVXYWxrZXIgPSBkb2MuY3JlYXRlVHJlZVdhbGtlcihcblx0XHRcdGRvYy5ib2R5LFxuXHRcdFx0Tm9kZUZpbHRlci5TSE9XX0VMRU1FTlQsXG5cdFx0XHR7XG5cdFx0XHRcdGFjY2VwdE5vZGU6IChub2RlOiBFbGVtZW50KSA9PiB7XG5cdFx0XHRcdFx0Ly8gU2tpcCBlbGVtZW50cyBhbHJlYWR5IG1hcmtlZCBmb3IgcmVtb3ZhbFxuXHRcdFx0XHRcdGlmIChlbGVtZW50c1RvUmVtb3ZlLmhhcyhub2RlKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX1JFSkVDVDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX0FDQ0VQVDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdCk7XG5cblx0XHQvLyBCYXRjaCBzdHlsZSBjb21wdXRhdGlvbnNcblx0XHRjb25zdCBlbGVtZW50czogRWxlbWVudFtdID0gW107XG5cdFx0bGV0IGN1cnJlbnROb2RlOiBFbGVtZW50IHwgbnVsbDtcblx0XHR3aGlsZSAoY3VycmVudE5vZGUgPSB0cmVlV2Fsa2VyLm5leHROb2RlKCkgYXMgRWxlbWVudCkge1xuXHRcdFx0ZWxlbWVudHMucHVzaChjdXJyZW50Tm9kZSk7XG5cdFx0fVxuXG5cdFx0Ly8gUHJvY2VzcyBzdHlsZXMgaW4gYmF0Y2hlcyB0byBtaW5pbWl6ZSBsYXlvdXQgdGhyYXNoaW5nXG5cdFx0Y29uc3QgQkFUQ0hfU0laRSA9IDEwMDtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSArPSBCQVRDSF9TSVpFKSB7XG5cdFx0XHRjb25zdCBiYXRjaCA9IGVsZW1lbnRzLnNsaWNlKGksIGkgKyBCQVRDSF9TSVpFKTtcblx0XHRcdFxuXHRcdFx0Ly8gUmVhZCBwaGFzZSAtIGdhdGhlciBhbGwgY29tcHV0ZWRTdHlsZXNcblx0XHRcdGNvbnN0IHN0eWxlcyA9IGJhdGNoLm1hcChlbCA9PiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCkpO1xuXHRcdFx0XG5cdFx0XHQvLyBXcml0ZSBwaGFzZSAtIG1hcmsgZWxlbWVudHMgZm9yIHJlbW92YWxcblx0XHRcdGJhdGNoLmZvckVhY2goKGVsZW1lbnQsIGluZGV4KSA9PiB7XG5cdFx0XHRcdGNvbnN0IGNvbXB1dGVkU3R5bGUgPSBzdHlsZXNbaW5kZXhdO1xuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0Y29tcHV0ZWRTdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgfHxcblx0XHRcdFx0XHRjb21wdXRlZFN0eWxlLnZpc2liaWxpdHkgPT09ICdoaWRkZW4nIHx8XG5cdFx0XHRcdFx0Y29tcHV0ZWRTdHlsZS5vcGFjaXR5ID09PSAnMCdcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0ZWxlbWVudHNUb1JlbW92ZS5hZGQoZWxlbWVudCk7XG5cdFx0XHRcdFx0Y291bnQrKztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gRmluYWwgcGFzczogQmF0Y2ggcmVtb3ZlIGFsbCBoaWRkZW4gZWxlbWVudHNcblx0XHRlbGVtZW50c1RvUmVtb3ZlLmZvckVhY2goZWwgPT4gZWwucmVtb3ZlKCkpO1xuXG5cdFx0dGhpcy5fbG9nKCdSZW1vdmVkIGhpZGRlbiBlbGVtZW50czonLCBjb3VudCk7XG5cdH1cblxuXHRwcml2YXRlIHJlbW92ZUNsdXR0ZXIoZG9jOiBEb2N1bWVudCkge1xuXHRcdGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdGxldCBleGFjdFNlbGVjdG9yQ291bnQgPSAwO1xuXHRcdGxldCBwYXJ0aWFsU2VsZWN0b3JDb3VudCA9IDA7XG5cblx0XHQvLyBUcmFjayBhbGwgZWxlbWVudHMgdG8gYmUgcmVtb3ZlZFxuXHRcdGNvbnN0IGVsZW1lbnRzVG9SZW1vdmUgPSBuZXcgU2V0PEVsZW1lbnQ+KCk7XG5cblx0XHQvLyBGaXJzdCBjb2xsZWN0IGVsZW1lbnRzIG1hdGNoaW5nIGV4YWN0IHNlbGVjdG9yc1xuXHRcdGNvbnN0IGV4YWN0RWxlbWVudHMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChFWEFDVF9TRUxFQ1RPUlMuam9pbignLCcpKTtcblx0XHRleGFjdEVsZW1lbnRzLmZvckVhY2goZWwgPT4ge1xuXHRcdFx0aWYgKGVsPy5wYXJlbnROb2RlKSB7XG5cdFx0XHRcdGVsZW1lbnRzVG9SZW1vdmUuYWRkKGVsKTtcblx0XHRcdFx0ZXhhY3RTZWxlY3RvckNvdW50Kys7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBQcmUtY29tcGlsZSByZWdleGVzIGFuZCBjb21iaW5lIGludG8gYSBzaW5nbGUgcmVnZXggZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuXHRcdGNvbnN0IGNvbWJpbmVkUGF0dGVybiA9IFBBUlRJQUxfU0VMRUNUT1JTLmpvaW4oJ3wnKTtcblx0XHRjb25zdCBwYXJ0aWFsUmVnZXggPSBuZXcgUmVnRXhwKGNvbWJpbmVkUGF0dGVybiwgJ2knKTtcblxuXHRcdC8vIENyZWF0ZSBhbiBlZmZpY2llbnQgYXR0cmlidXRlIHNlbGVjdG9yIGZvciBlbGVtZW50cyB3ZSBjYXJlIGFib3V0XG5cdFx0Y29uc3QgYXR0cmlidXRlU2VsZWN0b3IgPSAnW2NsYXNzXSxbaWRdLFtkYXRhLXRlc3RpZF0sW2RhdGEtcWFdLFtkYXRhLWN5XSc7XG5cdFx0Y29uc3QgYWxsRWxlbWVudHMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChhdHRyaWJ1dGVTZWxlY3Rvcik7XG5cblx0XHQvLyBQcm9jZXNzIGVsZW1lbnRzIGZvciBwYXJ0aWFsIG1hdGNoZXNcblx0XHRhbGxFbGVtZW50cy5mb3JFYWNoKGVsID0+IHtcblx0XHRcdC8vIFNraXAgaWYgYWxyZWFkeSBtYXJrZWQgZm9yIHJlbW92YWxcblx0XHRcdGlmIChlbGVtZW50c1RvUmVtb3ZlLmhhcyhlbCkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBHZXQgYWxsIHJlbGV2YW50IGF0dHJpYnV0ZXMgYW5kIGNvbWJpbmUgaW50byBhIHNpbmdsZSBzdHJpbmdcblx0XHRcdGNvbnN0IGF0dHJzID0gW1xuXHRcdFx0XHRlbC5jbGFzc05hbWUgJiYgdHlwZW9mIGVsLmNsYXNzTmFtZSA9PT0gJ3N0cmluZycgPyBlbC5jbGFzc05hbWUgOiAnJyxcblx0XHRcdFx0ZWwuaWQgfHwgJycsXG5cdFx0XHRcdGVsLmdldEF0dHJpYnV0ZSgnZGF0YS10ZXN0aWQnKSB8fCAnJyxcblx0XHRcdFx0ZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXFhJykgfHwgJycsXG5cdFx0XHRcdGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1jeScpIHx8ICcnXG5cdFx0XHRdLmpvaW4oJyAnKS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0XHQvLyBTa2lwIGlmIG5vIGF0dHJpYnV0ZXMgdG8gY2hlY2tcblx0XHRcdGlmICghYXR0cnMudHJpbSgpKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHBhcnRpYWwgbWF0Y2ggdXNpbmcgc2luZ2xlIHJlZ2V4IHRlc3Rcblx0XHRcdGlmIChwYXJ0aWFsUmVnZXgudGVzdChhdHRycykpIHtcblx0XHRcdFx0ZWxlbWVudHNUb1JlbW92ZS5hZGQoZWwpO1xuXHRcdFx0XHRwYXJ0aWFsU2VsZWN0b3JDb3VudCsrO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gUmVtb3ZlIGFsbCBjb2xsZWN0ZWQgZWxlbWVudHMgaW4gYSBzaW5nbGUgcGFzc1xuXHRcdGVsZW1lbnRzVG9SZW1vdmUuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmUoKSk7XG5cblx0XHRjb25zdCBlbmRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0dGhpcy5fbG9nKCdSZW1vdmVkIGNsdXR0ZXIgZWxlbWVudHM6Jywge1xuXHRcdFx0ZXhhY3RTZWxlY3RvcnM6IGV4YWN0U2VsZWN0b3JDb3VudCxcblx0XHRcdHBhcnRpYWxTZWxlY3RvcnM6IHBhcnRpYWxTZWxlY3RvckNvdW50LFxuXHRcdFx0dG90YWw6IGVsZW1lbnRzVG9SZW1vdmUuc2l6ZSxcblx0XHRcdHByb2Nlc3NpbmdUaW1lOiBgJHsoZW5kVGltZSAtIHN0YXJ0VGltZSkudG9GaXhlZCgyKX1tc2Bcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgZmxhdHRlbkRpdnMoZWxlbWVudDogRWxlbWVudCkge1xuXHRcdGxldCBwcm9jZXNzZWRDb3VudCA9IDA7XG5cdFx0Y29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cblx0XHQvLyBQcm9jZXNzIGluIGJhdGNoZXMgdG8gbWFpbnRhaW4gcGVyZm9ybWFuY2Vcblx0XHRjb25zdCBCQVRDSF9TSVpFID0gMTAwO1xuXHRcdGxldCBrZWVwUHJvY2Vzc2luZyA9IHRydWU7XG5cblx0XHQvLyBFbGVtZW50cyB0aGF0IHNob3VsZCBub3QgYmUgdW53cmFwcGVkXG5cdFx0Y29uc3QgUFJFU0VSVkVfRUxFTUVOVFMgPSBuZXcgU2V0KFtcblx0XHRcdCdwcmUnLCAnY29kZScsICd0YWJsZScsICd0aGVhZCcsICd0Ym9keScsICd0cicsICd0ZCcsICd0aCcsXG5cdFx0XHQndWwnLCAnb2wnLCAnbGknLCAnZGwnLCAnZHQnLCAnZGQnLFxuXHRcdFx0J2ZpZ3VyZScsICdmaWdjYXB0aW9uJyxcblx0XHRcdCdkZXRhaWxzJywgJ3N1bW1hcnknLFxuXHRcdFx0J2Jsb2NrcXVvdGUnLFxuXHRcdFx0J2Zvcm0nLCAnZmllbGRzZXQnXG5cdFx0XSk7XG5cblx0XHQvLyBJbmxpbmUgZWxlbWVudHMgdGhhdCBzaG91bGQgbm90IGJlIHVud3JhcHBlZFxuXHRcdGNvbnN0IElOTElORV9FTEVNRU5UUyA9IG5ldyBTZXQoW1xuXHRcdFx0J2EnLCAnc3BhbicsICdzdHJvbmcnLCAnZW0nLCAnaScsICdiJywgJ3UnLCAnY29kZScsICdicicsICdzbWFsbCcsXG5cdFx0XHQnc3ViJywgJ3N1cCcsICdtYXJrJywgJ2RlbCcsICdpbnMnLCAncScsICdhYmJyJywgJ2NpdGUnLCAndGltZSdcblx0XHRdKTtcblxuXHRcdGNvbnN0IHNob3VsZFByZXNlcnZlRWxlbWVudCA9IChlbDogRWxlbWVudCk6IGJvb2xlYW4gPT4ge1xuXHRcdFx0Y29uc3QgdGFnTmFtZSA9IGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdFxuXHRcdFx0Ly8gQ2hlY2sgaWYgZWxlbWVudCBzaG91bGQgYmUgcHJlc2VydmVkXG5cdFx0XHRpZiAoUFJFU0VSVkVfRUxFTUVOVFMuaGFzKHRhZ05hbWUpKSByZXR1cm4gdHJ1ZTtcblx0XHRcdFxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHNlbWFudGljIHJvbGVzXG5cdFx0XHRjb25zdCByb2xlID0gZWwuZ2V0QXR0cmlidXRlKCdyb2xlJyk7XG5cdFx0XHRpZiAocm9sZSAmJiBbJ2FydGljbGUnLCAnbWFpbicsICduYXZpZ2F0aW9uJywgJ2Jhbm5lcicsICdjb250ZW50aW5mbyddLmluY2x1ZGVzKHJvbGUpKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyBDaGVjayBmb3Igc2VtYW50aWMgY2xhc3Nlc1xuXHRcdFx0Y29uc3QgY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoY2xhc3NOYW1lLm1hdGNoKC8oPzphcnRpY2xlfG1haW58Y29udGVudHxmb290bm90ZXxyZWZlcmVuY2V8YmlibGlvZ3JhcGh5KS8pKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXHRcdHdoaWxlIChrZWVwUHJvY2Vzc2luZykge1xuXHRcdFx0a2VlcFByb2Nlc3NpbmcgPSBmYWxzZTtcblx0XHRcdGNvbnN0IGRpdnMgPSBBcnJheS5mcm9tKGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpKTtcblx0XHRcdFxuXHRcdFx0Ly8gUHJvY2VzcyBkaXZzIGluIGJhdGNoZXNcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZGl2cy5sZW5ndGg7IGkgKz0gQkFUQ0hfU0laRSkge1xuXHRcdFx0XHRjb25zdCBiYXRjaCA9IGRpdnMuc2xpY2UoaSwgaSArIEJBVENIX1NJWkUpO1xuXHRcdFx0XHRsZXQgYmF0Y2hNb2RpZmllZCA9IGZhbHNlO1xuXG5cdFx0XHRcdGJhdGNoLmZvckVhY2goZGl2ID0+IHtcblx0XHRcdFx0XHQvLyBTa2lwIHByb2Nlc3NpbmcgaWYgZGl2IGhhcyBiZWVuIHJlbW92ZWQgb3Igc2hvdWxkIGJlIHByZXNlcnZlZFxuXHRcdFx0XHRcdGlmICghZGl2LmlzQ29ubmVjdGVkIHx8IHNob3VsZFByZXNlcnZlRWxlbWVudChkaXYpKSByZXR1cm47XG5cblx0XHRcdFx0XHQvLyBDYXNlIDE6IEVtcHR5IGRpdiBvciBkaXYgd2l0aCBvbmx5IHdoaXRlc3BhY2Vcblx0XHRcdFx0XHRpZiAoIWRpdi5oYXNDaGlsZE5vZGVzKCkgfHwgIWRpdi50ZXh0Q29udGVudD8udHJpbSgpKSB7XG5cdFx0XHRcdFx0XHRkaXYucmVtb3ZlKCk7XG5cdFx0XHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0XHRcdFx0YmF0Y2hNb2RpZmllZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gQ2FzZSAyOiBEaXYgb25seSBjb250YWlucyB0ZXh0IGNvbnRlbnQgLSBjb252ZXJ0IHRvIHBhcmFncmFwaFxuXHRcdFx0XHRcdGlmICghZGl2LmNoaWxkcmVuLmxlbmd0aCAmJiBkaXYudGV4dENvbnRlbnQ/LnRyaW0oKSkge1xuXHRcdFx0XHRcdFx0Y29uc3QgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdFx0XHRcdHAudGV4dENvbnRlbnQgPSBkaXYudGV4dENvbnRlbnQ7XG5cdFx0XHRcdFx0XHRkaXYucmVwbGFjZVdpdGgocCk7XG5cdFx0XHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0XHRcdFx0YmF0Y2hNb2RpZmllZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gQ2FzZSAzOiBEaXYgaGFzIHNpbmdsZSBjaGlsZFxuXHRcdFx0XHRcdGlmIChkaXYuY2hpbGRyZW4ubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBjaGlsZCA9IGRpdi5maXJzdEVsZW1lbnRDaGlsZCE7XG5cdFx0XHRcdFx0XHRjb25zdCBjaGlsZFRhZyA9IGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly8gRG9uJ3QgdW53cmFwIGlmIGNoaWxkIGlzIGlubGluZSBvciBzaG91bGQgYmUgcHJlc2VydmVkXG5cdFx0XHRcdFx0XHRpZiAoIUlOTElORV9FTEVNRU5UUy5oYXMoY2hpbGRUYWcpICYmICFzaG91bGRQcmVzZXJ2ZUVsZW1lbnQoY2hpbGQpKSB7XG5cdFx0XHRcdFx0XHRcdGRpdi5yZXBsYWNlV2l0aChjaGlsZCk7XG5cdFx0XHRcdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdFx0XHRcdGJhdGNoTW9kaWZpZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gQ2FzZSA0OiBEaXYgb25seSBjb250YWlucyBvdGhlciBkaXZzIC0gbWVyZ2UgdXBcblx0XHRcdFx0XHRjb25zdCBjaGlsZHJlbiA9IEFycmF5LmZyb20oZGl2LmNoaWxkcmVuKTtcblx0XHRcdFx0XHRjb25zdCBvbmx5RGl2cyA9IGNoaWxkcmVuLmV2ZXJ5KGNoaWxkID0+IFxuXHRcdFx0XHRcdFx0Y2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnZGl2JyAmJiBcblx0XHRcdFx0XHRcdCFzaG91bGRQcmVzZXJ2ZUVsZW1lbnQoY2hpbGQpXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdGlmIChvbmx5RGl2cyAmJiBjaGlsZHJlbi5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdFx0XHRcdHdoaWxlIChkaXYuZmlyc3RDaGlsZCkge1xuXHRcdFx0XHRcdFx0XHQvLyBJZiBjaGlsZCBpcyBhIGRpdiwgbW92ZSBpdHMgY2hpbGRyZW4gaW5zdGVhZFxuXHRcdFx0XHRcdFx0XHRjb25zdCBjaGlsZCA9IGRpdi5maXJzdENoaWxkO1xuXHRcdFx0XHRcdFx0XHRpZiAoY2hpbGQgaW5zdGFuY2VvZiBFbGVtZW50ICYmIGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2RpdicpIHtcblx0XHRcdFx0XHRcdFx0XHR3aGlsZSAoY2hpbGQuZmlyc3RDaGlsZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY2hpbGQuZmlyc3RDaGlsZCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGNoaWxkLnJlbW92ZSgpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKGZyYWdtZW50KTtcblx0XHRcdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdFx0XHRiYXRjaE1vZGlmaWVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBDYXNlIDU6IERpdiBpcyBwdXJlbHkgZm9yIGxheW91dCAtIG1lcmdlIGNoaWxkcmVuIHVwIGlmIG5vIHNlbWFudGljIHZhbHVlXG5cdFx0XHRcdFx0Y29uc3Qgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkaXYpO1xuXHRcdFx0XHRcdGNvbnN0IGlzTGF5b3V0RGl2ID0gKFxuXHRcdFx0XHRcdFx0ZGl2LmNsYXNzTmFtZS5tYXRjaCgvKD86Z3JpZHxmbGV4fGxheW91dHxjb250YWluZXJ8d3JhcHBlcnxyb3d8Y29sfHNlY3Rpb24pL2kpIHx8XG5cdFx0XHRcdFx0XHRzdHlsZS5kaXNwbGF5ID09PSAnZ3JpZCcgfHxcblx0XHRcdFx0XHRcdHN0eWxlLmRpc3BsYXkgPT09ICdmbGV4JyB8fFxuXHRcdFx0XHRcdFx0KGRpdi5jaGlsZHJlbi5sZW5ndGggPiAwICYmICFkaXYudGV4dENvbnRlbnQ/LnRyaW0oKSkgLy8gRW1wdHkgcGFyZW50IHdpdGggY2hpbGRyZW5cblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0aWYgKGlzTGF5b3V0RGl2ICYmIGRpdi5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdFx0XHRcdHdoaWxlIChkaXYuZmlyc3RDaGlsZCkge1xuXHRcdFx0XHRcdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkaXYuZmlyc3RDaGlsZCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRkaXYucmVwbGFjZVdpdGgoZnJhZ21lbnQpO1xuXHRcdFx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdFx0XHRcdGJhdGNoTW9kaWZpZWQgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYgKGJhdGNoTW9kaWZpZWQpIHtcblx0XHRcdFx0XHRrZWVwUHJvY2Vzc2luZyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBlbmRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0dGhpcy5fbG9nKCdGbGF0dGVuZWQgZGl2czonLCB7XG5cdFx0XHRjb3VudDogcHJvY2Vzc2VkQ291bnQsXG5cdFx0XHRwcm9jZXNzaW5nVGltZTogYCR7KGVuZFRpbWUgLSBzdGFydFRpbWUpLnRvRml4ZWQoMil9bXNgXG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGNsZWFuQ29udGVudChlbGVtZW50OiBFbGVtZW50LCBtZXRhZGF0YTogRGVmdWRkbGVNZXRhZGF0YSkge1xuXHRcdC8vIFJlbW92ZSBIVE1MIGNvbW1lbnRzXG5cdFx0dGhpcy5yZW1vdmVIdG1sQ29tbWVudHMoZWxlbWVudCk7XG5cdFx0XG5cdFx0Ly8gSGFuZGxlIEgxIGVsZW1lbnRzIC0gcmVtb3ZlIGZpcnN0IG9uZSBhbmQgY29udmVydCBvdGhlcnMgdG8gSDJcblx0XHR0aGlzLmhhbmRsZUhlYWRpbmdzKGVsZW1lbnQsIG1ldGFkYXRhLnRpdGxlKTtcblx0XHRcblx0XHQvLyBTdGFuZGFyZGl6ZSBmb290bm90ZXMgYW5kIGNpdGF0aW9uc1xuXHRcdHRoaXMuc3RhbmRhcmRpemVGb290bm90ZXMoZWxlbWVudCk7XG5cblx0XHQvLyBIYW5kbGUgbGF6eS1sb2FkZWQgaW1hZ2VzXG5cdFx0dGhpcy5oYW5kbGVMYXp5SW1hZ2VzKGVsZW1lbnQpO1xuXG5cdFx0Ly8gQ29udmVydCBlbWJlZGRlZCBjb250ZW50IHRvIHN0YW5kYXJkIGZvcm1hdHNcblx0XHR0aGlzLnN0YW5kYXJkaXplRWxlbWVudHMoZWxlbWVudCk7XG5cblx0XHQvLyBTdHJpcCB1bndhbnRlZCBhdHRyaWJ1dGVzXG5cdFx0dGhpcy5zdHJpcFVud2FudGVkQXR0cmlidXRlcyhlbGVtZW50KTtcblxuXHRcdC8vIFJlbW92ZSBlbXB0eSBlbGVtZW50c1xuXHRcdHRoaXMucmVtb3ZlRW1wdHlFbGVtZW50cyhlbGVtZW50KTtcblxuXHRcdC8vIEZsYXR0ZW4gdW5uZWNlc3NhcnkgZGl2IGVsZW1lbnRzXG5cdFx0dGhpcy5mbGF0dGVuRGl2cyhlbGVtZW50KTtcblxuXHRcdC8vIFJlbW92ZSB0cmFpbGluZyBoZWFkaW5nc1xuXHRcdHRoaXMucmVtb3ZlVHJhaWxpbmdIZWFkaW5ncyhlbGVtZW50KTtcblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlVHJhaWxpbmdIZWFkaW5ncyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0bGV0IHJlbW92ZWRDb3VudCA9IDA7XG5cblx0XHRjb25zdCBoYXNDb250ZW50QWZ0ZXIgPSAoZWw6IEVsZW1lbnQpOiBib29sZWFuID0+IHtcblx0XHRcdC8vIENoZWNrIGlmIHRoZXJlJ3MgYW55IG1lYW5pbmdmdWwgY29udGVudCBhZnRlciB0aGlzIGVsZW1lbnRcblx0XHRcdGxldCBuZXh0Q29udGVudCA9ICcnO1xuXHRcdFx0bGV0IHNpYmxpbmcgPSBlbC5uZXh0U2libGluZztcblxuXHRcdFx0Ly8gRmlyc3QgY2hlY2sgZGlyZWN0IHNpYmxpbmdzXG5cdFx0XHR3aGlsZSAoc2libGluZykge1xuXHRcdFx0XHRpZiAoc2libGluZy5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdFx0XHRuZXh0Q29udGVudCArPSBzaWJsaW5nLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNpYmxpbmcubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG5cdFx0XHRcdFx0Ly8gSWYgd2UgZmluZCBhbiBlbGVtZW50IHNpYmxpbmcsIGNoZWNrIGl0cyBjb250ZW50XG5cdFx0XHRcdFx0bmV4dENvbnRlbnQgKz0gKHNpYmxpbmcgYXMgRWxlbWVudCkudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0XHRcdH1cblx0XHRcdFx0c2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmc7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIHdlIGZvdW5kIG1lYW5pbmdmdWwgY29udGVudCBhdCB0aGlzIGxldmVsLCByZXR1cm4gdHJ1ZVxuXHRcdFx0aWYgKG5leHRDb250ZW50LnRyaW0oKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgbm8gY29udGVudCBmb3VuZCBhdCB0aGlzIGxldmVsIGFuZCB3ZSBoYXZlIGEgcGFyZW50LFxuXHRcdFx0Ly8gY2hlY2sgZm9yIGNvbnRlbnQgYWZ0ZXIgdGhlIHBhcmVudFxuXHRcdFx0Y29uc3QgcGFyZW50ID0gZWwucGFyZW50RWxlbWVudDtcblx0XHRcdGlmIChwYXJlbnQgJiYgcGFyZW50ICE9PSBlbGVtZW50KSB7XG5cdFx0XHRcdHJldHVybiBoYXNDb250ZW50QWZ0ZXIocGFyZW50KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblx0XHQvLyBQcm9jZXNzIGFsbCBoZWFkaW5ncyBmcm9tIGJvdHRvbSB0byB0b3Bcblx0XHRjb25zdCBoZWFkaW5ncyA9IEFycmF5LmZyb20oZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdoMSwgaDIsIGgzLCBoNCwgaDUsIGg2JykpXG5cdFx0XHQucmV2ZXJzZSgpO1xuXG5cdFx0aGVhZGluZ3MuZm9yRWFjaChoZWFkaW5nID0+IHtcblx0XHRcdGlmICghaGFzQ29udGVudEFmdGVyKGhlYWRpbmcpKSB7XG5cdFx0XHRcdGhlYWRpbmcucmVtb3ZlKCk7XG5cdFx0XHRcdHJlbW92ZWRDb3VudCsrO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gU3RvcCBwcm9jZXNzaW5nIG9uY2Ugd2UgZmluZCBhIGhlYWRpbmcgd2l0aCBjb250ZW50IGFmdGVyIGl0XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGlmIChyZW1vdmVkQ291bnQgPiAwKSB7XG5cdFx0XHR0aGlzLl9sb2coJ1JlbW92ZWQgdHJhaWxpbmcgaGVhZGluZ3M6JywgcmVtb3ZlZENvdW50KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZUhlYWRpbmdzKGVsZW1lbnQ6IEVsZW1lbnQsIHRpdGxlOiBzdHJpbmcpIHtcblx0XHRjb25zdCBoMXMgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMScpO1xuXG5cdFx0QXJyYXkuZnJvbShoMXMpLmZvckVhY2goaDEgPT4ge1xuXHRcdFx0Y29uc3QgaDIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xuXHRcdFx0aDIuaW5uZXJIVE1MID0gaDEuaW5uZXJIVE1MO1xuXHRcdFx0Ly8gQ29weSBhbGxvd2VkIGF0dHJpYnV0ZXNcblx0XHRcdEFycmF5LmZyb20oaDEuYXR0cmlidXRlcykuZm9yRWFjaChhdHRyID0+IHtcblx0XHRcdFx0aWYgKEFMTE9XRURfQVRUUklCVVRFUy5oYXMoYXR0ci5uYW1lKSkge1xuXHRcdFx0XHRcdGgyLnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdGgxLnBhcmVudE5vZGU/LnJlcGxhY2VDaGlsZChoMiwgaDEpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gUmVtb3ZlIGZpcnN0IEgyIGlmIGl0IG1hdGNoZXMgdGl0bGVcblx0XHRjb25zdCBoMnMgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoMicpO1xuXHRcdGlmIChoMnMubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgZmlyc3RIMiA9IGgyc1swXTtcblx0XHRcdGNvbnN0IGZpcnN0SDJUZXh0ID0gZmlyc3RIMi50ZXh0Q29udGVudD8udHJpbSgpLnRvTG93ZXJDYXNlKCkgfHwgJyc7XG5cdFx0XHRjb25zdCBub3JtYWxpemVkVGl0bGUgPSB0aXRsZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblx0XHRcdGlmIChub3JtYWxpemVkVGl0bGUgJiYgbm9ybWFsaXplZFRpdGxlID09PSBmaXJzdEgyVGV4dCkge1xuXHRcdFx0XHRmaXJzdEgyLnJlbW92ZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlSHRtbENvbW1lbnRzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcblx0XHRjb25zdCBjb21tZW50czogQ29tbWVudFtdID0gW107XG5cdFx0Y29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihcblx0XHRcdGVsZW1lbnQsXG5cdFx0XHROb2RlRmlsdGVyLlNIT1dfQ09NTUVOVCxcblx0XHRcdG51bGxcblx0XHQpO1xuXG5cdFx0bGV0IG5vZGU7XG5cdFx0d2hpbGUgKG5vZGUgPSB3YWxrZXIubmV4dE5vZGUoKSkge1xuXHRcdFx0Y29tbWVudHMucHVzaChub2RlIGFzIENvbW1lbnQpO1xuXHRcdH1cblxuXHRcdGNvbW1lbnRzLmZvckVhY2goY29tbWVudCA9PiB7XG5cdFx0XHRjb21tZW50LnJlbW92ZSgpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5fbG9nKCdSZW1vdmVkIEhUTUwgY29tbWVudHM6JywgY29tbWVudHMubGVuZ3RoKTtcblx0fVxuXG5cdHByaXZhdGUgc3RyaXBVbndhbnRlZEF0dHJpYnV0ZXMoZWxlbWVudDogRWxlbWVudCkge1xuXHRcdGxldCBhdHRyaWJ1dGVDb3VudCA9IDA7XG5cblx0XHRjb25zdCBwcm9jZXNzRWxlbWVudCA9IChlbDogRWxlbWVudCkgPT4ge1xuXHRcdFx0Ly8gU2tpcCBTVkcgZWxlbWVudHMgLSBwcmVzZXJ2ZSBhbGwgdGhlaXIgYXR0cmlidXRlc1xuXHRcdFx0aWYgKGVsIGluc3RhbmNlb2YgU1ZHRWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGF0dHJpYnV0ZXMgPSBBcnJheS5mcm9tKGVsLmF0dHJpYnV0ZXMpO1xuXHRcdFx0XG5cdFx0XHRhdHRyaWJ1dGVzLmZvckVhY2goYXR0ciA9PiB7XG5cdFx0XHRcdGNvbnN0IGF0dHJOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGlmICghQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyTmFtZSkpIHtcblx0XHRcdFx0XHRlbC5yZW1vdmVBdHRyaWJ1dGUoYXR0ci5uYW1lKTtcblx0XHRcdFx0XHRhdHRyaWJ1dGVDb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0cHJvY2Vzc0VsZW1lbnQoZWxlbWVudCk7XG5cdFx0ZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcqJykuZm9yRWFjaChwcm9jZXNzRWxlbWVudCk7XG5cblx0XHR0aGlzLl9sb2coJ1N0cmlwcGVkIGF0dHJpYnV0ZXM6JywgYXR0cmlidXRlQ291bnQpO1xuXHR9XG5cblx0cHJpdmF0ZSByZW1vdmVFbXB0eUVsZW1lbnRzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcblx0XHRsZXQgcmVtb3ZlZENvdW50ID0gMDtcblx0XHRsZXQgaXRlcmF0aW9ucyA9IDA7XG5cdFx0bGV0IGtlZXBSZW1vdmluZyA9IHRydWU7XG5cblx0XHR3aGlsZSAoa2VlcFJlbW92aW5nKSB7XG5cdFx0XHRpdGVyYXRpb25zKys7XG5cdFx0XHRrZWVwUmVtb3ZpbmcgPSBmYWxzZTtcblx0XHRcdC8vIEdldCBhbGwgZWxlbWVudHMgd2l0aG91dCBjaGlsZHJlbiwgd29ya2luZyBmcm9tIGRlZXBlc3QgZmlyc3Rcblx0XHRcdGNvbnN0IGVtcHR5RWxlbWVudHMgPSBBcnJheS5mcm9tKGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJyonKSkuZmlsdGVyKGVsID0+IHtcblx0XHRcdFx0aWYgKEFMTE9XRURfRU1QVFlfRUxFTUVOVFMuaGFzKGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdC8vIENoZWNrIGlmIGVsZW1lbnQgaGFzIG9ubHkgd2hpdGVzcGFjZSBvciAmbmJzcDtcblx0XHRcdFx0Y29uc3QgdGV4dENvbnRlbnQgPSBlbC50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0Y29uc3QgaGFzT25seVdoaXRlc3BhY2UgPSB0ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID09PSAwO1xuXHRcdFx0XHRjb25zdCBoYXNOYnNwID0gdGV4dENvbnRlbnQuaW5jbHVkZXMoJ1xcdTAwQTAnKTsgLy8gVW5pY29kZSBub24tYnJlYWtpbmcgc3BhY2Vcblx0XHRcdFx0XG5cdFx0XHRcdC8vIENoZWNrIGlmIGVsZW1lbnQgaGFzIG5vIG1lYW5pbmdmdWwgY2hpbGRyZW5cblx0XHRcdFx0Y29uc3QgaGFzTm9DaGlsZHJlbiA9ICFlbC5oYXNDaGlsZE5vZGVzKCkgfHwgXG5cdFx0XHRcdFx0KEFycmF5LmZyb20oZWwuY2hpbGROb2RlcykuZXZlcnkobm9kZSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3Qgbm9kZVRleHQgPSBub2RlLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbm9kZVRleHQudHJpbSgpLmxlbmd0aCA9PT0gMCAmJiAhbm9kZVRleHQuaW5jbHVkZXMoJ1xcdTAwQTAnKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0cmV0dXJuIGhhc09ubHlXaGl0ZXNwYWNlICYmICFoYXNOYnNwICYmIGhhc05vQ2hpbGRyZW47XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKGVtcHR5RWxlbWVudHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRlbXB0eUVsZW1lbnRzLmZvckVhY2goZWwgPT4ge1xuXHRcdFx0XHRcdGVsLnJlbW92ZSgpO1xuXHRcdFx0XHRcdHJlbW92ZWRDb3VudCsrO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0a2VlcFJlbW92aW5nID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLl9sb2coJ1JlbW92ZWQgZW1wdHkgZWxlbWVudHM6Jywge1xuXHRcdFx0Y291bnQ6IHJlbW92ZWRDb3VudCxcblx0XHRcdGl0ZXJhdGlvbnNcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgY3JlYXRlRm9vdG5vdGVJdGVtKFxuXHRcdGZvb3Rub3RlTnVtYmVyOiBudW1iZXIsXG5cdFx0Y29udGVudDogc3RyaW5nIHwgRWxlbWVudCxcblx0XHRyZWZzOiBzdHJpbmdbXVxuXHQpOiBIVE1MTElFbGVtZW50IHtcblx0XHRjb25zdCBuZXdJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblx0XHRuZXdJdGVtLmNsYXNzTmFtZSA9ICdmb290bm90ZSc7XG5cdFx0bmV3SXRlbS5pZCA9IGBmbjoke2Zvb3Rub3RlTnVtYmVyfWA7XG5cblx0XHQvLyBIYW5kbGUgY29udGVudFxuXHRcdGlmICh0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycpIHtcblx0XHRcdGNvbnN0IHBhcmFncmFwaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdHBhcmFncmFwaC5pbm5lckhUTUwgPSBjb250ZW50O1xuXHRcdFx0bmV3SXRlbS5hcHBlbmRDaGlsZChwYXJhZ3JhcGgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBHZXQgYWxsIHBhcmFncmFwaHMgZnJvbSB0aGUgY29udGVudFxuXHRcdFx0Y29uc3QgcGFyYWdyYXBocyA9IEFycmF5LmZyb20oY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCdwJykpO1xuXHRcdFx0aWYgKHBhcmFncmFwaHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdC8vIElmIG5vIHBhcmFncmFwaHMsIHdyYXAgY29udGVudCBpbiBhIHBhcmFncmFwaFxuXHRcdFx0XHRjb25zdCBwYXJhZ3JhcGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cdFx0XHRcdHBhcmFncmFwaC5pbm5lckhUTUwgPSBjb250ZW50LmlubmVySFRNTDtcblx0XHRcdFx0bmV3SXRlbS5hcHBlbmRDaGlsZChwYXJhZ3JhcGgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gQ29weSBleGlzdGluZyBwYXJhZ3JhcGhzXG5cdFx0XHRcdHBhcmFncmFwaHMuZm9yRWFjaChwID0+IHtcblx0XHRcdFx0XHRjb25zdCBuZXdQID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdFx0XHRcdG5ld1AuaW5uZXJIVE1MID0gcC5pbm5lckhUTUw7XG5cdFx0XHRcdFx0bmV3SXRlbS5hcHBlbmRDaGlsZChuZXdQKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gQWRkIGJhY2tsaW5rKHMpIHRvIHRoZSBsYXN0IHBhcmFncmFwaFxuXHRcdGNvbnN0IGxhc3RQYXJhZ3JhcGggPSBuZXdJdGVtLnF1ZXJ5U2VsZWN0b3IoJ3A6bGFzdC1vZi10eXBlJykgfHwgbmV3SXRlbTtcblx0XHRyZWZzLmZvckVhY2goKHJlZklkLCBpbmRleCkgPT4ge1xuXHRcdFx0Y29uc3QgYmFja2xpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cdFx0XHRiYWNrbGluay5ocmVmID0gYCMke3JlZklkfWA7XG5cdFx0XHRiYWNrbGluay50aXRsZSA9ICdyZXR1cm4gdG8gYXJ0aWNsZSc7XG5cdFx0XHRiYWNrbGluay5jbGFzc05hbWUgPSAnZm9vdG5vdGUtYmFja3JlZic7XG5cdFx0XHRiYWNrbGluay5pbm5lckhUTUwgPSAn4oapJztcblx0XHRcdGlmIChpbmRleCA8IHJlZnMubGVuZ3RoIC0gMSkge1xuXHRcdFx0XHRiYWNrbGluay5pbm5lckhUTUwgKz0gJyAnO1xuXHRcdFx0fVxuXHRcdFx0bGFzdFBhcmFncmFwaC5hcHBlbmRDaGlsZChiYWNrbGluayk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gbmV3SXRlbTtcblx0fVxuXG5cdHByaXZhdGUgY29sbGVjdEZvb3Rub3RlcyhlbGVtZW50OiBFbGVtZW50KTogRm9vdG5vdGVDb2xsZWN0aW9uIHtcblx0XHRjb25zdCBmb290bm90ZXM6IEZvb3Rub3RlQ29sbGVjdGlvbiA9IHt9O1xuXHRcdGxldCBmb290bm90ZUNvdW50ID0gMTtcblx0XHRjb25zdCBwcm9jZXNzZWRJZHMgPSBuZXcgU2V0PHN0cmluZz4oKTsgLy8gVHJhY2sgcHJvY2Vzc2VkIElEc1xuXG5cdFx0Ly8gQ29sbGVjdCBhbGwgZm9vdG5vdGVzIGFuZCB0aGVpciBJRHMgZnJvbSBmb290bm90ZSBsaXN0c1xuXHRcdGNvbnN0IGZvb3Rub3RlTGlzdHMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRk9PVE5PVEVfTElTVF9TRUxFQ1RPUlMpO1xuXHRcdGZvb3Rub3RlTGlzdHMuZm9yRWFjaChsaXN0ID0+IHtcblx0XHRcdC8vIFN1YnN0YWNrIGhhcyBpbmRpdmlkdWFsIGZvb3Rub3RlIGRpdnMgd2l0aCBubyBwYXJlbnRcblx0XHRcdGlmIChsaXN0Lm1hdGNoZXMoJ2Rpdi5mb290bm90ZVtkYXRhLWNvbXBvbmVudC1uYW1lPVwiRm9vdG5vdGVUb0RPTVwiXScpKSB7XG5cdFx0XHRcdGNvbnN0IGFuY2hvciA9IGxpc3QucXVlcnlTZWxlY3RvcignYS5mb290bm90ZS1udW1iZXInKTtcblx0XHRcdFx0Y29uc3QgY29udGVudCA9IGxpc3QucXVlcnlTZWxlY3RvcignLmZvb3Rub3RlLWNvbnRlbnQnKTtcblx0XHRcdFx0aWYgKGFuY2hvciAmJiBjb250ZW50KSB7XG5cdFx0XHRcdFx0Y29uc3QgaWQgPSBhbmNob3IuaWQucmVwbGFjZSgnZm9vdG5vdGUtJywgJycpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0aWYgKGlkICYmICFwcm9jZXNzZWRJZHMuaGFzKGlkKSkge1xuXHRcdFx0XHRcdFx0Zm9vdG5vdGVzW2Zvb3Rub3RlQ291bnRdID0ge1xuXHRcdFx0XHRcdFx0XHRjb250ZW50OiBjb250ZW50LFxuXHRcdFx0XHRcdFx0XHRvcmlnaW5hbElkOiBpZCxcblx0XHRcdFx0XHRcdFx0cmVmczogW11cblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRwcm9jZXNzZWRJZHMuYWRkKGlkKTtcblx0XHRcdFx0XHRcdGZvb3Rub3RlQ291bnQrKztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDb21tb24gZm9ybWF0IHVzaW5nIE9ML1VMIGFuZCBMSSBlbGVtZW50c1xuXHRcdFx0Y29uc3QgaXRlbXMgPSBsaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpLCBkaXZbcm9sZT1cImxpc3RpdGVtXCJdJyk7XG5cdFx0XHRpdGVtcy5mb3JFYWNoKGxpID0+IHtcblx0XHRcdFx0bGV0IGlkID0gJyc7XG5cdFx0XHRcdGxldCBjb250ZW50OiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cblx0XHRcdFx0Ly8gSGFuZGxlIGNpdGF0aW9ucyB3aXRoIC5jaXRhdGlvbnMgY2xhc3Ncblx0XHRcdFx0Y29uc3QgY2l0YXRpb25zRGl2ID0gbGkucXVlcnlTZWxlY3RvcignLmNpdGF0aW9ucycpO1xuXHRcdFx0XHRpZiAoY2l0YXRpb25zRGl2Py5pZD8udG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdyJykpIHtcblx0XHRcdFx0XHRpZCA9IGNpdGF0aW9uc0Rpdi5pZC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdC8vIExvb2sgZm9yIGNpdGF0aW9uIGNvbnRlbnQgd2l0aGluIHRoZSBjaXRhdGlvbnMgZGl2XG5cdFx0XHRcdFx0Y29uc3QgY2l0YXRpb25Db250ZW50ID0gY2l0YXRpb25zRGl2LnF1ZXJ5U2VsZWN0b3IoJy5jaXRhdGlvbi1jb250ZW50Jyk7XG5cdFx0XHRcdFx0aWYgKGNpdGF0aW9uQ29udGVudCkge1xuXHRcdFx0XHRcdFx0Y29udGVudCA9IGNpdGF0aW9uQ29udGVudDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gRXh0cmFjdCBJRCBmcm9tIHZhcmlvdXMgZm9ybWF0c1xuXHRcdFx0XHRcdGlmIChsaS5pZC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2JpYi5iaWInKSkge1xuXHRcdFx0XHRcdFx0aWQgPSBsaS5pZC5yZXBsYWNlKCdiaWIuYmliJywgJycpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChsaS5pZC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2ZuOicpKSB7XG5cdFx0XHRcdFx0XHRpZCA9IGxpLmlkLnJlcGxhY2UoJ2ZuOicsICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAobGkuaWQudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdmbicpKSB7XG5cdFx0XHRcdFx0XHRpZCA9IGxpLmlkLnJlcGxhY2UoJ2ZuJywgJycpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0Ly8gTmF0dXJlLmNvbVxuXHRcdFx0XHRcdH0gZWxzZSBpZiAobGkuaGFzQXR0cmlidXRlKCdkYXRhLWNvdW50ZXInKSkge1xuXHRcdFx0XHRcdFx0aWQgPSBsaS5nZXRBdHRyaWJ1dGUoJ2RhdGEtY291bnRlcicpPy5yZXBsYWNlKC9cXC4kLywgJycpPy50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IGxpLmlkLnNwbGl0KCcvJykucG9wKCk/Lm1hdGNoKC9jaXRlX25vdGUtKC4rKS8pO1xuXHRcdFx0XHRcdFx0aWQgPSBtYXRjaCA/IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCkgOiBsaS5pZC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb250ZW50ID0gbGk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoaWQgJiYgIXByb2Nlc3NlZElkcy5oYXMoaWQpKSB7XG5cdFx0XHRcdFx0Zm9vdG5vdGVzW2Zvb3Rub3RlQ291bnRdID0ge1xuXHRcdFx0XHRcdFx0Y29udGVudDogY29udGVudCB8fCBsaSxcblx0XHRcdFx0XHRcdG9yaWdpbmFsSWQ6IGlkLFxuXHRcdFx0XHRcdFx0cmVmczogW11cblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdHByb2Nlc3NlZElkcy5hZGQoaWQpO1xuXHRcdFx0XHRcdGZvb3Rub3RlQ291bnQrKztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gZm9vdG5vdGVzO1xuXHR9XG5cblx0cHJpdmF0ZSBmaW5kT3V0ZXJGb290bm90ZUNvbnRhaW5lcihlbDogRWxlbWVudCk6IEVsZW1lbnQge1xuXHRcdGxldCBjdXJyZW50OiBFbGVtZW50IHwgbnVsbCA9IGVsO1xuXHRcdGxldCBwYXJlbnQ6IEVsZW1lbnQgfCBudWxsID0gZWwucGFyZW50RWxlbWVudDtcblx0XHRcblx0XHQvLyBLZWVwIGdvaW5nIHVwIHVudGlsIHdlIGZpbmQgYW4gZWxlbWVudCB0aGF0J3Mgbm90IGEgc3BhbiBvciBzdXBcblx0XHR3aGlsZSAocGFyZW50ICYmIChcblx0XHRcdHBhcmVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdzcGFuJyB8fCBcblx0XHRcdHBhcmVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdzdXAnXG5cdFx0KSkge1xuXHRcdFx0Y3VycmVudCA9IHBhcmVudDtcblx0XHRcdHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50O1xuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gY3VycmVudDtcblx0fVxuXG5cdC8vIEV2ZXJ5IGZvb3Rub3RlIHJlZmVyZW5jZSBzaG91bGQgYmUgYSBzdXAgZWxlbWVudCB3aXRoIGFuIGFuY2hvciBpbnNpZGVcblx0Ly8gZS5nLiA8c3VwIGlkPVwiZm5yZWY6MVwiPjxhIGhyZWY9XCIjZm46MVwiPjE8L2E+PC9zdXA+XG5cdHByaXZhdGUgY3JlYXRlRm9vdG5vdGVSZWZlcmVuY2UoZm9vdG5vdGVOdW1iZXI6IHN0cmluZywgcmVmSWQ6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcblx0XHRjb25zdCBzdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdXAnKTtcblx0XHRzdXAuaWQgPSByZWZJZDtcblx0XHRjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXHRcdGxpbmsuaHJlZiA9IGAjZm46JHtmb290bm90ZU51bWJlcn1gO1xuXHRcdGxpbmsudGV4dENvbnRlbnQgPSBmb290bm90ZU51bWJlcjtcblx0XHRzdXAuYXBwZW5kQ2hpbGQobGluayk7XG5cdFx0cmV0dXJuIHN1cDtcblx0fVxuXG5cdHByaXZhdGUgc3RhbmRhcmRpemVGb290bm90ZXMoZWxlbWVudDogRWxlbWVudCkge1xuXHRcdGNvbnN0IGZvb3Rub3RlcyA9IHRoaXMuY29sbGVjdEZvb3Rub3RlcyhlbGVtZW50KTtcblxuXHRcdC8vIFN0YW5kYXJkaXplIGlubGluZSBmb290bm90ZXMgdXNpbmcgdGhlIGNvbGxlY3RlZCBJRHNcblx0XHRjb25zdCBmb290bm90ZUlubGluZVJlZmVyZW5jZXMgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoRk9PVE5PVEVfSU5MSU5FX1JFRkVSRU5DRVMpO1xuXHRcdFxuXHRcdC8vIEdyb3VwIHJlZmVyZW5jZXMgYnkgdGhlaXIgcGFyZW50IHN1cCBlbGVtZW50XG5cdFx0Y29uc3Qgc3VwR3JvdXBzID0gbmV3IE1hcDxFbGVtZW50LCBFbGVtZW50W10+KCk7XG5cdFx0XG5cdFx0Zm9vdG5vdGVJbmxpbmVSZWZlcmVuY2VzLmZvckVhY2goZWwgPT4ge1xuXHRcdFx0aWYgKCEoZWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHJldHVybjtcblxuXHRcdFx0bGV0IGZvb3Rub3RlSWQgPSAnJztcblx0XHRcdGxldCBmb290bm90ZUNvbnRlbnQgPSAnJztcblxuXHRcdFx0Ly8gRXh0cmFjdCBmb290bm90ZSBJRCBiYXNlZCBvbiBlbGVtZW50IHR5cGVcblx0XHRcdC8vIE5hdHVyZS5jb21cblx0XHRcdGlmIChlbC5tYXRjaGVzKCdhW2lkXj1cInJlZi1saW5rXCJdJykpIHtcblx0XHRcdFx0Zm9vdG5vdGVJZCA9IGVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG5cdFx0XHQvLyBTY2llbmNlLm9yZ1xuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdhW3JvbGU9XCJkb2MtYmlibGlvcmVmXCJdJykpIHtcblx0XHRcdFx0Y29uc3QgeG1sUmlkID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXhtbC1yaWQnKTtcblx0XHRcdFx0aWYgKHhtbFJpZCkge1xuXHRcdFx0XHRcdGZvb3Rub3RlSWQgPSB4bWxSaWQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc3QgaHJlZiA9IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuXHRcdFx0XHRcdGlmIChocmVmPy5zdGFydHNXaXRoKCcjY29yZS1SJykpIHtcblx0XHRcdFx0XHRcdGZvb3Rub3RlSWQgPSBocmVmLnJlcGxhY2UoJyNjb3JlLScsICcnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdC8vIFN1YnN0YWNrXG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ2EuZm9vdG5vdGUtYW5jaG9yLCBzcGFuLmZvb3Rub3RlLWhvdmVyY2FyZC10YXJnZXQgYScpKSB7XG5cdFx0XHRcdGNvbnN0IGlkID0gZWwuaWQ/LnJlcGxhY2UoJ2Zvb3Rub3RlLWFuY2hvci0nLCAnJykgfHwgJyc7XG5cdFx0XHRcdGlmIChpZCkge1xuXHRcdFx0XHRcdGZvb3Rub3RlSWQgPSBpZC50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHQvLyBBcnhpdlxuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdjaXRlLmx0eF9jaXRlJykpIHtcblx0XHRcdFx0Y29uc3QgbGluayA9IGVsLnF1ZXJ5U2VsZWN0b3IoJ2EnKTtcblx0XHRcdFx0aWYgKGxpbmspIHtcblx0XHRcdFx0XHRjb25zdCBocmVmID0gbGluay5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblx0XHRcdFx0XHRpZiAoaHJlZikge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBocmVmLnNwbGl0KCcvJykucG9wKCk/Lm1hdGNoKC9iaWJcXC5iaWIoXFxkKykvKTtcblx0XHRcdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRmb290bm90ZUlkID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnc3VwLnJlZmVyZW5jZScpKSB7XG5cdFx0XHRcdGNvbnN0IGxpbmtzID0gZWwucXVlcnlTZWxlY3RvckFsbCgnYScpO1xuXHRcdFx0XHRBcnJheS5mcm9tKGxpbmtzKS5mb3JFYWNoKGxpbmsgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGhyZWYgPSBsaW5rLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuXHRcdFx0XHRcdGlmIChocmVmKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IGhyZWYuc3BsaXQoJy8nKS5wb3AoKT8ubWF0Y2goLyg/OmNpdGVfbm90ZXxjaXRlX3JlZiktKC4rKS8pO1xuXHRcdFx0XHRcdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRcdFx0XHRcdGZvb3Rub3RlSWQgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ3N1cFtpZF49XCJmbnJlZjpcIl0nKSkge1xuXHRcdFx0XHRmb290bm90ZUlkID0gZWwuaWQucmVwbGFjZSgnZm5yZWY6JywgJycpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ3N1cFtpZF49XCJmbnJcIl0nKSkge1xuXHRcdFx0XHRmb290bm90ZUlkID0gZWwuaWQucmVwbGFjZSgnZm5yJywgJycpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ3NwYW4uZm9vdG5vdGUtcmVmZXJlbmNlJykpIHtcblx0XHRcdFx0Zm9vdG5vdGVJZCA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1mb290bm90ZS1pZCcpIHx8ICcnO1xuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdzcGFuLmZvb3Rub3RlLWxpbmsnKSkge1xuXHRcdFx0XHRmb290bm90ZUlkID0gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWZvb3Rub3RlLWlkJykgfHwgJyc7XG5cdFx0XHRcdGZvb3Rub3RlQ29udGVudCA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1mb290bm90ZS1jb250ZW50JykgfHwgJyc7XG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ2EuY2l0YXRpb24nKSkge1xuXHRcdFx0XHRmb290bm90ZUlkID0gZWwudGV4dENvbnRlbnQ/LnRyaW0oKSB8fCAnJztcblx0XHRcdFx0Zm9vdG5vdGVDb250ZW50ID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJykgfHwgJyc7XG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ2FbaWRePVwiZm5yZWZcIl0nKSkge1xuXHRcdFx0XHRmb290bm90ZUlkID0gZWwuaWQucmVwbGFjZSgnZm5yZWYnLCAnJykudG9Mb3dlckNhc2UoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIE90aGVyIGNpdGF0aW9uIHR5cGVzXG5cdFx0XHRcdGNvbnN0IGhyZWYgPSBlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblx0XHRcdFx0aWYgKGhyZWYpIHtcblx0XHRcdFx0XHRjb25zdCBpZCA9IGhyZWYucmVwbGFjZSgvXlsjXS8sICcnKTtcblx0XHRcdFx0XHRmb290bm90ZUlkID0gaWQudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZm9vdG5vdGVJZCkge1xuXHRcdFx0XHQvLyBGaW5kIHRoZSBmb290bm90ZSBudW1iZXIgYnkgbWF0Y2hpbmcgdGhlIG9yaWdpbmFsIElEXG5cdFx0XHRcdGNvbnN0IGZvb3Rub3RlRW50cnkgPSBPYmplY3QuZW50cmllcyhmb290bm90ZXMpLmZpbmQoXG5cdFx0XHRcdFx0KFtfLCBkYXRhXSkgPT4gZGF0YS5vcmlnaW5hbElkID09PSBmb290bm90ZUlkLnRvTG93ZXJDYXNlKClcblx0XHRcdFx0KTtcblxuXHRcdFx0XHRpZiAoZm9vdG5vdGVFbnRyeSkge1xuXHRcdFx0XHRcdGNvbnN0IFtmb290bm90ZU51bWJlciwgZm9vdG5vdGVEYXRhXSA9IGZvb3Rub3RlRW50cnk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gQ3JlYXRlIGZvb3Rub3RlIHJlZmVyZW5jZSBJRFxuXHRcdFx0XHRcdGNvbnN0IHJlZklkID0gZm9vdG5vdGVEYXRhLnJlZnMubGVuZ3RoID4gMCA/IFxuXHRcdFx0XHRcdFx0YGZucmVmOiR7Zm9vdG5vdGVOdW1iZXJ9LSR7Zm9vdG5vdGVEYXRhLnJlZnMubGVuZ3RoICsgMX1gIDogXG5cdFx0XHRcdFx0XHRgZm5yZWY6JHtmb290bm90ZU51bWJlcn1gO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGZvb3Rub3RlRGF0YS5yZWZzLnB1c2gocmVmSWQpO1xuXG5cdFx0XHRcdFx0Ly8gRmluZCB0aGUgb3V0ZXJtb3N0IGNvbnRhaW5lciAoc3BhbiBvciBzdXApXG5cdFx0XHRcdFx0Y29uc3QgY29udGFpbmVyID0gdGhpcy5maW5kT3V0ZXJGb290bm90ZUNvbnRhaW5lcihlbCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gSWYgY29udGFpbmVyIGlzIGEgc3VwLCBncm91cCByZWZlcmVuY2VzXG5cdFx0XHRcdFx0aWYgKGNvbnRhaW5lci50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdzdXAnKSB7XG5cdFx0XHRcdFx0XHRpZiAoIXN1cEdyb3Vwcy5oYXMoY29udGFpbmVyKSkge1xuXHRcdFx0XHRcdFx0XHRzdXBHcm91cHMuc2V0KGNvbnRhaW5lciwgW10pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Y29uc3QgZ3JvdXAgPSBzdXBHcm91cHMuZ2V0KGNvbnRhaW5lcikhO1xuXHRcdFx0XHRcdFx0Z3JvdXAucHVzaCh0aGlzLmNyZWF0ZUZvb3Rub3RlUmVmZXJlbmNlKGZvb3Rub3RlTnVtYmVyLCByZWZJZCkpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBSZXBsYWNlIHRoZSBjb250YWluZXIgZGlyZWN0bHlcblx0XHRcdFx0XHRcdGNvbnRhaW5lci5yZXBsYWNlV2l0aCh0aGlzLmNyZWF0ZUZvb3Rub3RlUmVmZXJlbmNlKGZvb3Rub3RlTnVtYmVyLCByZWZJZCkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gSGFuZGxlIGdyb3VwZWQgcmVmZXJlbmNlc1xuXHRcdHN1cEdyb3Vwcy5mb3JFYWNoKChyZWZlcmVuY2VzLCBjb250YWluZXIpID0+IHtcblx0XHRcdGlmIChyZWZlcmVuY2VzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Ly8gQ3JlYXRlIGEgZG9jdW1lbnQgZnJhZ21lbnQgdG8gaG9sZCBhbGwgdGhlIHJlZmVyZW5jZXNcblx0XHRcdFx0Y29uc3QgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBBZGQgZWFjaCByZWZlcmVuY2UgYXMgaXRzIG93biBzdXAgZWxlbWVudFxuXHRcdFx0XHRyZWZlcmVuY2VzLmZvckVhY2goKHJlZiwgaW5kZXgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBsaW5rID0gcmVmLnF1ZXJ5U2VsZWN0b3IoJ2EnKTtcblx0XHRcdFx0XHRpZiAobGluaykge1xuXHRcdFx0XHRcdFx0Y29uc3Qgc3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3VwJyk7XG5cdFx0XHRcdFx0XHRzdXAuaWQgPSByZWYuaWQ7XG5cdFx0XHRcdFx0XHRzdXAuYXBwZW5kQ2hpbGQobGluay5jbG9uZU5vZGUodHJ1ZSkpO1xuXHRcdFx0XHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoc3VwKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0Y29udGFpbmVyLnJlcGxhY2VXaXRoKGZyYWdtZW50KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIENyZWF0ZSB0aGUgc3RhbmRhcmRpemVkIGZvb3Rub3RlIGxpc3Rcblx0XHRjb25zdCBuZXdMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9vdG5vdGVzJyk7XG5cdFx0bmV3TGlzdC5jbGFzc05hbWUgPSAnZm9vdG5vdGVzJztcblx0XHRjb25zdCBvcmRlcmVkTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29sJyk7XG5cblx0XHQvLyBDcmVhdGUgZm9vdG5vdGUgaXRlbXMgaW4gb3JkZXJcblx0XHRPYmplY3QuZW50cmllcyhmb290bm90ZXMpLmZvckVhY2goKFtudW1iZXIsIGRhdGFdKSA9PiB7XG5cdFx0XHRjb25zdCBuZXdJdGVtID0gdGhpcy5jcmVhdGVGb290bm90ZUl0ZW0oXG5cdFx0XHRcdHBhcnNlSW50KG51bWJlciksXG5cdFx0XHRcdGRhdGEuY29udGVudCxcblx0XHRcdFx0ZGF0YS5yZWZzXG5cdFx0XHQpO1xuXHRcdFx0b3JkZXJlZExpc3QuYXBwZW5kQ2hpbGQobmV3SXRlbSk7XG5cdFx0fSk7XG5cblx0XHQvLyBSZW1vdmUgb3JpZ2luYWwgZm9vdG5vdGUgbGlzdHNcblx0XHRjb25zdCBmb290bm90ZUxpc3RzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKEZPT1ROT1RFX0xJU1RfU0VMRUNUT1JTKTtcblx0XHRmb290bm90ZUxpc3RzLmZvckVhY2gobGlzdCA9PiBsaXN0LnJlbW92ZSgpKTtcblxuXHRcdC8vIElmIHdlIGhhdmUgYW55IGZvb3Rub3RlcywgYWRkIHRoZSBuZXcgbGlzdCB0byB0aGUgZG9jdW1lbnRcblx0XHRpZiAob3JkZXJlZExpc3QuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuXHRcdFx0bmV3TGlzdC5hcHBlbmRDaGlsZChvcmRlcmVkTGlzdCk7XG5cdFx0XHRlbGVtZW50LmFwcGVuZENoaWxkKG5ld0xpc3QpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgaGFuZGxlTGF6eUltYWdlcyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0bGV0IHByb2Nlc3NlZENvdW50ID0gMDtcblx0XHRjb25zdCBsYXp5SW1hZ2VzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbWdbZGF0YS1zcmNdLCBpbWdbZGF0YS1zcmNzZXRdJyk7XG5cblx0XHRsYXp5SW1hZ2VzLmZvckVhY2goaW1nID0+IHtcblx0XHRcdGlmICghKGltZyBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpKSByZXR1cm47XG5cblx0XHRcdC8vIEhhbmRsZSBkYXRhLXNyY1xuXHRcdFx0Y29uc3QgZGF0YVNyYyA9IGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJyk7XG5cdFx0XHRpZiAoZGF0YVNyYyAmJiAhaW1nLnNyYykge1xuXHRcdFx0XHRpbWcuc3JjID0gZGF0YVNyYztcblx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdH1cblxuXHRcdFx0Ly8gSGFuZGxlIGRhdGEtc3Jjc2V0XG5cdFx0XHRjb25zdCBkYXRhU3Jjc2V0ID0gaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcblx0XHRcdGlmIChkYXRhU3Jjc2V0ICYmICFpbWcuc3Jjc2V0KSB7XG5cdFx0XHRcdGltZy5zcmNzZXQgPSBkYXRhU3Jjc2V0O1xuXHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBSZW1vdmUgbGF6eSBsb2FkaW5nIHJlbGF0ZWQgY2xhc3NlcyBhbmQgYXR0cmlidXRlc1xuXHRcdFx0aW1nLmNsYXNzTGlzdC5yZW1vdmUoJ2xhenknLCAnbGF6eWxvYWQnKTtcblx0XHRcdGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtbGwtc3RhdHVzJyk7XG5cdFx0XHRpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyYycpO1xuXHRcdFx0aW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuX2xvZygnUHJvY2Vzc2VkIGxhenkgaW1hZ2VzOicsIHByb2Nlc3NlZENvdW50KTtcblx0fVxuXG5cdHByaXZhdGUgc3RhbmRhcmRpemVFbGVtZW50cyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0bGV0IHByb2Nlc3NlZENvdW50ID0gMDtcblxuXHRcdC8vIENvbnZlcnQgZWxlbWVudHMgYmFzZWQgb24gc3RhbmRhcmRpemF0aW9uIHJ1bGVzXG5cdFx0RUxFTUVOVF9TVEFOREFSRElaQVRJT05fUlVMRVMuZm9yRWFjaChydWxlID0+IHtcblx0XHRcdGNvbnN0IGVsZW1lbnRzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHJ1bGUuc2VsZWN0b3IpO1xuXHRcdFx0ZWxlbWVudHMuZm9yRWFjaChlbCA9PiB7XG5cdFx0XHRcdGlmIChydWxlLnRyYW5zZm9ybSkge1xuXHRcdFx0XHRcdC8vIElmIHRoZXJlJ3MgYSB0cmFuc2Zvcm0gZnVuY3Rpb24sIHVzZSBpdCB0byBjcmVhdGUgdGhlIG5ldyBlbGVtZW50XG5cdFx0XHRcdFx0Y29uc3QgdHJhbnNmb3JtZWQgPSBydWxlLnRyYW5zZm9ybShlbCk7XG5cdFx0XHRcdFx0ZWwucmVwbGFjZVdpdGgodHJhbnNmb3JtZWQpO1xuXHRcdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gQ29udmVydCBsaXRlLXlvdXR1YmUgZWxlbWVudHNcblx0XHRjb25zdCBsaXRlWW91dHViZUVsZW1lbnRzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdsaXRlLXlvdXR1YmUnKTtcblx0XHRsaXRlWW91dHViZUVsZW1lbnRzLmZvckVhY2goZWwgPT4ge1xuXHRcdFx0Y29uc3QgdmlkZW9JZCA9IGVsLmdldEF0dHJpYnV0ZSgndmlkZW9pZCcpO1xuXHRcdFx0aWYgKCF2aWRlb0lkKSByZXR1cm47XG5cblx0XHRcdGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuXHRcdFx0aWZyYW1lLndpZHRoID0gJzU2MCc7XG5cdFx0XHRpZnJhbWUuaGVpZ2h0ID0gJzMxNSc7XG5cdFx0XHRpZnJhbWUuc3JjID0gYGh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLyR7dmlkZW9JZH1gO1xuXHRcdFx0aWZyYW1lLnRpdGxlID0gZWwuZ2V0QXR0cmlidXRlKCd2aWRlb3RpdGxlJykgfHwgJ1lvdVR1YmUgdmlkZW8gcGxheWVyJztcblx0XHRcdGlmcmFtZS5mcmFtZUJvcmRlciA9ICcwJztcblx0XHRcdGlmcmFtZS5hbGxvdyA9ICdhY2NlbGVyb21ldGVyOyBhdXRvcGxheTsgY2xpcGJvYXJkLXdyaXRlOyBlbmNyeXB0ZWQtbWVkaWE7IGd5cm9zY29wZTsgcGljdHVyZS1pbi1waWN0dXJlOyB3ZWItc2hhcmUnO1xuXHRcdFx0aWZyYW1lLnNldEF0dHJpYnV0ZSgnYWxsb3dmdWxsc2NyZWVuJywgJycpO1xuXG5cdFx0XHRlbC5yZXBsYWNlV2l0aChpZnJhbWUpO1xuXHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHR9KTtcblxuXHRcdC8vIEFkZCBmdXR1cmUgZW1iZWQgY29udmVyc2lvbnMgKFR3aXR0ZXIsIEluc3RhZ3JhbSwgZXRjLilcblxuXHRcdHRoaXMuX2xvZygnQ29udmVydGVkIGVtYmVkZGVkIGVsZW1lbnRzOicsIHByb2Nlc3NlZENvdW50KTtcblx0fVxuXG5cdC8vIEZpbmQgc21hbGwgSU1HIGFuZCBTVkcgZWxlbWVudHNcblx0cHJpdmF0ZSBmaW5kU21hbGxJbWFnZXMoZG9jOiBEb2N1bWVudCk6IFNldDxzdHJpbmc+IHtcblx0XHRjb25zdCBNSU5fRElNRU5TSU9OID0gMzM7XG5cdFx0Y29uc3Qgc21hbGxJbWFnZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblx0XHRjb25zdCB0cmFuc2Zvcm1SZWdleCA9IC9zY2FsZVxcKChbXFxkLl0rKVxcKS87XG5cdFx0Y29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0bGV0IHByb2Nlc3NlZENvdW50ID0gMDtcblxuXHRcdC8vIDEuIFJlYWQgcGhhc2UgLSBHYXRoZXIgYWxsIGVsZW1lbnRzIGluIGEgc2luZ2xlIHBhc3Ncblx0XHRjb25zdCBlbGVtZW50cyA9IFtcblx0XHRcdC4uLkFycmF5LmZyb20oZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKSksXG5cdFx0XHQuLi5BcnJheS5mcm9tKGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc3ZnJykpXG5cdFx0XS5maWx0ZXIoZWxlbWVudCA9PiB7XG5cdFx0XHQvLyBTa2lwIGxhenktbG9hZGVkIGltYWdlcyB0aGF0IGhhdmVuJ3QgYmVlbiBwcm9jZXNzZWQgeWV0XG5cdFx0XHRpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpIHtcblx0XHRcdFx0Y29uc3QgaXNMYXp5ID0gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2xhenknKSB8fCBcblx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnbGF6eWxvYWQnKSB8fFxuXHRcdFx0XHRcdGVsZW1lbnQuaGFzQXR0cmlidXRlKCdkYXRhLXNyYycpIHx8XG5cdFx0XHRcdFx0ZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2RhdGEtc3Jjc2V0Jyk7XG5cdFx0XHRcdHJldHVybiAhaXNMYXp5O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSk7XG5cblx0XHRpZiAoZWxlbWVudHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gc21hbGxJbWFnZXM7XG5cdFx0fVxuXG5cdFx0Ly8gMi4gQmF0Y2ggcHJvY2VzcyAtIENvbGxlY3QgYWxsIG1lYXN1cmVtZW50cyBpbiBvbmUgZ29cblx0XHRjb25zdCBtZWFzdXJlbWVudHMgPSBlbGVtZW50cy5tYXAoZWxlbWVudCA9PiAoe1xuXHRcdFx0ZWxlbWVudCxcblx0XHRcdC8vIFN0YXRpYyBhdHRyaWJ1dGVzIChubyByZWZsb3cpXG5cdFx0XHRuYXR1cmFsV2lkdGg6IGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50ID8gZWxlbWVudC5uYXR1cmFsV2lkdGggOiAwLFxuXHRcdFx0bmF0dXJhbEhlaWdodDogZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQgPyBlbGVtZW50Lm5hdHVyYWxIZWlnaHQgOiAwLFxuXHRcdFx0YXR0cldpZHRoOiBwYXJzZUludChlbGVtZW50LmdldEF0dHJpYnV0ZSgnd2lkdGgnKSB8fCAnMCcpLFxuXHRcdFx0YXR0ckhlaWdodDogcGFyc2VJbnQoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2hlaWdodCcpIHx8ICcwJylcblx0XHR9KSk7XG5cblx0XHQvLyAzLiBCYXRjaCBjb21wdXRlIHN0eWxlcyAtIFByb2Nlc3MgaW4gY2h1bmtzIHRvIGF2b2lkIGxvbmcgdGFza3Ncblx0XHRjb25zdCBCQVRDSF9TSVpFID0gNTA7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBtZWFzdXJlbWVudHMubGVuZ3RoOyBpICs9IEJBVENIX1NJWkUpIHtcblx0XHRcdGNvbnN0IGJhdGNoID0gbWVhc3VyZW1lbnRzLnNsaWNlKGksIGkgKyBCQVRDSF9TSVpFKTtcblx0XHRcdFxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Ly8gUmVhZCBwaGFzZSAtIGNvbXB1dGUgYWxsIHN0eWxlcyBhdCBvbmNlXG5cdFx0XHRcdGNvbnN0IHN0eWxlcyA9IGJhdGNoLm1hcCgoeyBlbGVtZW50IH0pID0+IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpKTtcblx0XHRcdFx0Y29uc3QgcmVjdHMgPSBiYXRjaC5tYXAoKHsgZWxlbWVudCB9KSA9PiBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIFByb2Nlc3MgcGhhc2UgLSBubyBET00gb3BlcmF0aW9uc1xuXHRcdFx0XHRiYXRjaC5mb3JFYWNoKChtZWFzdXJlbWVudCwgaW5kZXgpID0+IHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Y29uc3Qgc3R5bGUgPSBzdHlsZXNbaW5kZXhdO1xuXHRcdFx0XHRcdFx0Y29uc3QgcmVjdCA9IHJlY3RzW2luZGV4XTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Ly8gR2V0IHRyYW5zZm9ybSBzY2FsZSBpbiB0aGUgc2FtZSBiYXRjaFxuXHRcdFx0XHRcdFx0Y29uc3QgdHJhbnNmb3JtID0gc3R5bGUudHJhbnNmb3JtO1xuXHRcdFx0XHRcdFx0Y29uc3Qgc2NhbGUgPSB0cmFuc2Zvcm0gPyBcblx0XHRcdFx0XHRcdFx0cGFyc2VGbG9hdCh0cmFuc2Zvcm0ubWF0Y2godHJhbnNmb3JtUmVnZXgpPy5bMV0gfHwgJzEnKSA6IDE7XG5cblx0XHRcdFx0XHRcdC8vIENhbGN1bGF0ZSBlZmZlY3RpdmUgZGltZW5zaW9uc1xuXHRcdFx0XHRcdFx0Y29uc3Qgd2lkdGhzID0gW1xuXHRcdFx0XHRcdFx0XHRtZWFzdXJlbWVudC5uYXR1cmFsV2lkdGgsXG5cdFx0XHRcdFx0XHRcdG1lYXN1cmVtZW50LmF0dHJXaWR0aCxcblx0XHRcdFx0XHRcdFx0cGFyc2VJbnQoc3R5bGUud2lkdGgpIHx8IDAsXG5cdFx0XHRcdFx0XHRcdHJlY3Qud2lkdGggKiBzY2FsZVxuXHRcdFx0XHRcdFx0XS5maWx0ZXIoZGltID0+IHR5cGVvZiBkaW0gPT09ICdudW1iZXInICYmIGRpbSA+IDApO1xuXG5cdFx0XHRcdFx0XHRjb25zdCBoZWlnaHRzID0gW1xuXHRcdFx0XHRcdFx0XHRtZWFzdXJlbWVudC5uYXR1cmFsSGVpZ2h0LFxuXHRcdFx0XHRcdFx0XHRtZWFzdXJlbWVudC5hdHRySGVpZ2h0LFxuXHRcdFx0XHRcdFx0XHRwYXJzZUludChzdHlsZS5oZWlnaHQpIHx8IDAsXG5cdFx0XHRcdFx0XHRcdHJlY3QuaGVpZ2h0ICogc2NhbGVcblx0XHRcdFx0XHRcdF0uZmlsdGVyKGRpbSA9PiB0eXBlb2YgZGltID09PSAnbnVtYmVyJyAmJiBkaW0gPiAwKTtcblxuXHRcdFx0XHRcdFx0Ly8gRGVjaXNpb24gcGhhc2UgLSBubyBET00gb3BlcmF0aW9uc1xuXHRcdFx0XHRcdFx0aWYgKHdpZHRocy5sZW5ndGggPiAwICYmIGhlaWdodHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBlZmZlY3RpdmVXaWR0aCA9IE1hdGgubWluKC4uLndpZHRocyk7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGVmZmVjdGl2ZUhlaWdodCA9IE1hdGgubWluKC4uLmhlaWdodHMpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChlZmZlY3RpdmVXaWR0aCA8IE1JTl9ESU1FTlNJT04gfHwgZWZmZWN0aXZlSGVpZ2h0IDwgTUlOX0RJTUVOU0lPTikge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGlkZW50aWZpZXIgPSB0aGlzLmdldEVsZW1lbnRJZGVudGlmaWVyKG1lYXN1cmVtZW50LmVsZW1lbnQpO1xuXHRcdFx0XHRcdFx0XHRcdGlmIChpZGVudGlmaWVyKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzbWFsbEltYWdlcy5hZGQoaWRlbnRpZmllcik7XG5cdFx0XHRcdFx0XHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdGlmICh0aGlzLmRlYnVnKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignRGVmdWRkbGU6IEZhaWxlZCB0byBwcm9jZXNzIGVsZW1lbnQgZGltZW5zaW9uczonLCBlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAodGhpcy5kZWJ1Zykge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybignRGVmdWRkbGU6IEZhaWxlZCB0byBwcm9jZXNzIGJhdGNoOicsIGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdHRoaXMuX2xvZygnRm91bmQgc21hbGwgZWxlbWVudHM6Jywge1xuXHRcdFx0Y291bnQ6IHByb2Nlc3NlZENvdW50LFxuXHRcdFx0dG90YWxFbGVtZW50czogZWxlbWVudHMubGVuZ3RoLFxuXHRcdFx0cHJvY2Vzc2luZ1RpbWU6IGAkeyhlbmRUaW1lIC0gc3RhcnRUaW1lKS50b0ZpeGVkKDIpfW1zYFxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHNtYWxsSW1hZ2VzO1xuXHR9XG5cblx0cHJpdmF0ZSByZW1vdmVTbWFsbEltYWdlcyhkb2M6IERvY3VtZW50LCBzbWFsbEltYWdlczogU2V0PHN0cmluZz4pIHtcblx0XHRsZXQgcmVtb3ZlZENvdW50ID0gMDtcblxuXHRcdFsnaW1nJywgJ3N2ZyddLmZvckVhY2godGFnID0+IHtcblx0XHRcdGNvbnN0IGVsZW1lbnRzID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZyk7XG5cdFx0XHRBcnJheS5mcm9tKGVsZW1lbnRzKS5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuXHRcdFx0XHRjb25zdCBpZGVudGlmaWVyID0gdGhpcy5nZXRFbGVtZW50SWRlbnRpZmllcihlbGVtZW50KTtcblx0XHRcdFx0aWYgKGlkZW50aWZpZXIgJiYgc21hbGxJbWFnZXMuaGFzKGlkZW50aWZpZXIpKSB7XG5cdFx0XHRcdFx0ZWxlbWVudC5yZW1vdmUoKTtcblx0XHRcdFx0XHRyZW1vdmVkQ291bnQrKztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLl9sb2coJ1JlbW92ZWQgc21hbGwgZWxlbWVudHM6JywgcmVtb3ZlZENvdW50KTtcblx0fVxuXG5cdHByaXZhdGUgZ2V0RWxlbWVudElkZW50aWZpZXIoZWxlbWVudDogRWxlbWVudCk6IHN0cmluZyB8IG51bGwge1xuXHRcdC8vIFRyeSB0byBjcmVhdGUgYSB1bmlxdWUgaWRlbnRpZmllciB1c2luZyB2YXJpb3VzIGF0dHJpYnV0ZXNcblx0XHRpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQpIHtcblx0XHRcdC8vIEZvciBsYXp5LWxvYWRlZCBpbWFnZXMsIHVzZSBkYXRhLXNyYyBhcyBpZGVudGlmaWVyIGlmIGF2YWlsYWJsZVxuXHRcdFx0Y29uc3QgZGF0YVNyYyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpO1xuXHRcdFx0aWYgKGRhdGFTcmMpIHJldHVybiBgc3JjOiR7ZGF0YVNyY31gO1xuXHRcdFx0XG5cdFx0XHRjb25zdCBzcmMgPSBlbGVtZW50LnNyYyB8fCAnJztcblx0XHRcdGNvbnN0IHNyY3NldCA9IGVsZW1lbnQuc3Jjc2V0IHx8ICcnO1xuXHRcdFx0Y29uc3QgZGF0YVNyY3NldCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXNyY3NldCcpO1xuXHRcdFx0XG5cdFx0XHRpZiAoc3JjKSByZXR1cm4gYHNyYzoke3NyY31gO1xuXHRcdFx0aWYgKHNyY3NldCkgcmV0dXJuIGBzcmNzZXQ6JHtzcmNzZXR9YDtcblx0XHRcdGlmIChkYXRhU3Jjc2V0KSByZXR1cm4gYHNyY3NldDoke2RhdGFTcmNzZXR9YDtcblx0XHR9XG5cblx0XHRjb25zdCBpZCA9IGVsZW1lbnQuaWQgfHwgJyc7XG5cdFx0Y29uc3QgY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUgfHwgJyc7XG5cdFx0Y29uc3Qgdmlld0JveCA9IGVsZW1lbnQgaW5zdGFuY2VvZiBTVkdFbGVtZW50ID8gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3ZpZXdCb3gnKSB8fCAnJyA6ICcnO1xuXHRcdFxuXHRcdGlmIChpZCkgcmV0dXJuIGBpZDoke2lkfWA7XG5cdFx0aWYgKHZpZXdCb3gpIHJldHVybiBgdmlld0JveDoke3ZpZXdCb3h9YDtcblx0XHRpZiAoY2xhc3NOYW1lKSByZXR1cm4gYGNsYXNzOiR7Y2xhc3NOYW1lfWA7XG5cdFx0XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRwcml2YXRlIGZpbmRNYWluQ29udGVudChkb2M6IERvY3VtZW50KTogRWxlbWVudCB8IG51bGwge1xuXG5cdFx0Ly8gRmluZCBhbGwgcG90ZW50aWFsIGNvbnRlbnQgY29udGFpbmVyc1xuXHRcdGNvbnN0IGNhbmRpZGF0ZXM6IHsgZWxlbWVudDogRWxlbWVudDsgc2NvcmU6IG51bWJlciB9W10gPSBbXTtcblxuXHRcdEVOVFJZX1BPSU5UX0VMRU1FTlRTLmZvckVhY2goKHNlbGVjdG9yLCBpbmRleCkgPT4ge1xuXHRcdFx0Y29uc3QgZWxlbWVudHMgPSBkb2MucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG5cdFx0XHRlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuXHRcdFx0XHQvLyBCYXNlIHNjb3JlIGZyb20gc2VsZWN0b3IgcHJpb3JpdHkgKGVhcmxpZXIgPSBoaWdoZXIpXG5cdFx0XHRcdGxldCBzY29yZSA9IChFTlRSWV9QT0lOVF9FTEVNRU5UUy5sZW5ndGggLSBpbmRleCkgKiAxMDtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIEFkZCBzY29yZSBiYXNlZCBvbiBjb250ZW50IGFuYWx5c2lzXG5cdFx0XHRcdHNjb3JlICs9IHRoaXMuc2NvcmVFbGVtZW50KGVsZW1lbnQpO1xuXHRcdFx0XHRcblx0XHRcdFx0Y2FuZGlkYXRlcy5wdXNoKHsgZWxlbWVudCwgc2NvcmUgfSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmIChjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0Ly8gRmFsbCBiYWNrIHRvIHNjb3JpbmcgYmxvY2sgZWxlbWVudHNcblx0XHRcdC8vIEN1cnJlbnRseSA8Ym9keT4gZWxlbWVudCBpcyB1c2VkIGFzIHRoZSBmYWxsYmFjaywgc28gdGhpcyBpcyBub3QgdXNlZFxuXHRcdFx0cmV0dXJuIHRoaXMuZmluZENvbnRlbnRCeVNjb3JpbmcoZG9jKTtcblx0XHR9XG5cblx0XHQvLyBTb3J0IGJ5IHNjb3JlIGRlc2NlbmRpbmdcblx0XHRjYW5kaWRhdGVzLnNvcnQoKGEsIGIpID0+IGIuc2NvcmUgLSBhLnNjb3JlKTtcblx0XHRcblx0XHRpZiAodGhpcy5kZWJ1Zykge1xuXHRcdFx0dGhpcy5fbG9nKCdDb250ZW50IGNhbmRpZGF0ZXM6JywgY2FuZGlkYXRlcy5tYXAoYyA9PiAoe1xuXHRcdFx0XHRlbGVtZW50OiBjLmVsZW1lbnQudGFnTmFtZSxcblx0XHRcdFx0c2VsZWN0b3I6IHRoaXMuZ2V0RWxlbWVudFNlbGVjdG9yKGMuZWxlbWVudCksXG5cdFx0XHRcdHNjb3JlOiBjLnNjb3JlXG5cdFx0XHR9KSkpO1xuXHRcdH1cblxuXHRcdHJldHVybiBjYW5kaWRhdGVzWzBdLmVsZW1lbnQ7XG5cdH1cblxuXHRwcml2YXRlIGZpbmRDb250ZW50QnlTY29yaW5nKGRvYzogRG9jdW1lbnQpOiBFbGVtZW50IHwgbnVsbCB7XG5cdFx0Y29uc3QgY2FuZGlkYXRlcyA9IHRoaXMuc2NvcmVFbGVtZW50cyhkb2MpO1xuXHRcdHJldHVybiBjYW5kaWRhdGVzLmxlbmd0aCA+IDAgPyBjYW5kaWRhdGVzWzBdLmVsZW1lbnQgOiBudWxsO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRFbGVtZW50U2VsZWN0b3IoZWxlbWVudDogRWxlbWVudCk6IHN0cmluZyB7XG5cdFx0Y29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG5cdFx0bGV0IGN1cnJlbnQ6IEVsZW1lbnQgfCBudWxsID0gZWxlbWVudDtcblx0XHRcblx0XHR3aGlsZSAoY3VycmVudCAmJiBjdXJyZW50ICE9PSB0aGlzLmRvYy5kb2N1bWVudEVsZW1lbnQpIHtcblx0XHRcdGxldCBzZWxlY3RvciA9IGN1cnJlbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0aWYgKGN1cnJlbnQuaWQpIHtcblx0XHRcdFx0c2VsZWN0b3IgKz0gJyMnICsgY3VycmVudC5pZDtcblx0XHRcdH0gZWxzZSBpZiAoY3VycmVudC5jbGFzc05hbWUgJiYgdHlwZW9mIGN1cnJlbnQuY2xhc3NOYW1lID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRzZWxlY3RvciArPSAnLicgKyBjdXJyZW50LmNsYXNzTmFtZS50cmltKCkuc3BsaXQoL1xccysvKS5qb2luKCcuJyk7XG5cdFx0XHR9XG5cdFx0XHRwYXJ0cy51bnNoaWZ0KHNlbGVjdG9yKTtcblx0XHRcdGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiBwYXJ0cy5qb2luKCcgPiAnKTtcblx0fVxuXG5cdHByaXZhdGUgc2NvcmVFbGVtZW50cyhkb2M6IERvY3VtZW50KTogQ29udGVudFNjb3JlW10ge1xuXHRcdGNvbnN0IGNhbmRpZGF0ZXM6IENvbnRlbnRTY29yZVtdID0gW107XG5cblx0XHRCTE9DS19FTEVNRU5UUy5mb3JFYWNoKCh0YWc6IHN0cmluZykgPT4ge1xuXHRcdFx0QXJyYXkuZnJvbShkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnKSkuZm9yRWFjaCgoZWxlbWVudDogRWxlbWVudCkgPT4ge1xuXHRcdFx0XHRjb25zdCBzY29yZSA9IHRoaXMuc2NvcmVFbGVtZW50KGVsZW1lbnQpO1xuXHRcdFx0XHRpZiAoc2NvcmUgPiAwKSB7XG5cdFx0XHRcdFx0Y2FuZGlkYXRlcy5wdXNoKHsgc2NvcmUsIGVsZW1lbnQgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGNhbmRpZGF0ZXMuc29ydCgoYSwgYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpO1xuXHR9XG5cblx0cHJpdmF0ZSBzY29yZUVsZW1lbnQoZWxlbWVudDogRWxlbWVudCk6IG51bWJlciB7XG5cdFx0bGV0IHNjb3JlID0gMDtcblxuXHRcdC8vIFNjb3JlIGJhc2VkIG9uIGVsZW1lbnQgcHJvcGVydGllc1xuXHRcdGNvbnN0IGNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NOYW1lICYmIHR5cGVvZiBlbGVtZW50LmNsYXNzTmFtZSA9PT0gJ3N0cmluZycgPyBcblx0XHRcdGVsZW1lbnQuY2xhc3NOYW1lLnRvTG93ZXJDYXNlKCkgOiAnJztcblx0XHRjb25zdCBpZCA9IGVsZW1lbnQuaWQgPyBlbGVtZW50LmlkLnRvTG93ZXJDYXNlKCkgOiAnJztcblxuXHRcdC8vIFNjb3JlIGJhc2VkIG9uIGNvbnRlbnRcblx0XHRjb25zdCB0ZXh0ID0gZWxlbWVudC50ZXh0Q29udGVudCB8fCAnJztcblx0XHRjb25zdCB3b3JkcyA9IHRleHQuc3BsaXQoL1xccysvKS5sZW5ndGg7XG5cdFx0c2NvcmUgKz0gTWF0aC5taW4oTWF0aC5mbG9vcih3b3JkcyAvIDEwMCksIDMpO1xuXG5cdFx0Ly8gU2NvcmUgYmFzZWQgb24gbGluayBkZW5zaXR5XG5cdFx0Y29uc3QgbGlua3MgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdhJyk7XG5cdFx0Y29uc3QgbGlua1RleHQgPSBBcnJheS5mcm9tKGxpbmtzKS5yZWR1Y2UoKGFjYywgbGluaykgPT4gYWNjICsgKGxpbmsudGV4dENvbnRlbnQ/Lmxlbmd0aCB8fCAwKSwgMCk7XG5cdFx0Y29uc3QgbGlua0RlbnNpdHkgPSB0ZXh0Lmxlbmd0aCA/IGxpbmtUZXh0IC8gdGV4dC5sZW5ndGggOiAwO1xuXHRcdGlmIChsaW5rRGVuc2l0eSA+IDAuNSkge1xuXHRcdFx0c2NvcmUgLT0gMTA7XG5cdFx0fVxuXG5cdFx0Ly8gU2NvcmUgYmFzZWQgb24gcHJlc2VuY2Ugb2YgbWVhbmluZ2Z1bCBlbGVtZW50c1xuXHRcdGNvbnN0IHBhcmFncmFwaHMgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwJykubGVuZ3RoO1xuXHRcdHNjb3JlICs9IHBhcmFncmFwaHM7XG5cblx0XHRjb25zdCBpbWFnZXMgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKS5sZW5ndGg7XG5cdFx0c2NvcmUgKz0gTWF0aC5taW4oaW1hZ2VzICogMywgOSk7XG5cblx0XHRyZXR1cm4gc2NvcmU7XG5cdH1cbn0gIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsImV4cG9ydCB7IERlZnVkZGxlIH0gZnJvbSAnLi9kZWZ1ZGRsZSc7XG5leHBvcnQgdHlwZSB7IERlZnVkZGxlT3B0aW9ucywgRGVmdWRkbGVSZXNwb25zZSwgRGVmdWRkbGVNZXRhZGF0YSB9IGZyb20gJy4vdHlwZXMnOyAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=