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
            // Check if div contains mixed content types that should be preserved
            if (tagName === 'div') {
                const children = Array.from(el.children);
                const hasPreservedElements = children.some(child => PRESERVE_ELEMENTS.has(child.tagName.toLowerCase()) ||
                    child.getAttribute('role') === 'article' ||
                    child.className.toLowerCase().includes('article'));
                if (hasPreservedElements)
                    return true;
            }
            return false;
        };
        // Function to check if a div is a wrapper div
        const isWrapperDiv = (div) => {
            var _a;
            // Check if it's just empty space
            if (!((_a = div.textContent) === null || _a === void 0 ? void 0 : _a.trim()))
                return true;
            // Check if it only contains other divs
            const children = Array.from(div.children);
            if (children.length === 0)
                return true;
            // Check if all children are divs
            const allDivs = children.every(child => child.tagName.toLowerCase() === 'div');
            if (allDivs)
                return true;
            // Check for common wrapper patterns
            const className = div.className.toLowerCase();
            const isWrapper = /(?:wrapper|container|layout|row|col|grid|flex|outer|inner|content-area)/i.test(className);
            if (isWrapper)
                return true;
            // Check if it has excessive whitespace or empty text nodes
            const textNodes = Array.from(div.childNodes).filter(node => { var _a; return node.nodeType === Node.TEXT_NODE && ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()); });
            if (textNodes.length === 0)
                return true;
            return false;
        };
        // Function to process a single div
        const processDiv = (div) => {
            var _a, _b;
            // Skip processing if div has been removed or should be preserved
            if (!div.isConnected || shouldPreserveElement(div))
                return false;
            // Case 1: Empty div or div with only whitespace
            if (!div.hasChildNodes() || !((_a = div.textContent) === null || _a === void 0 ? void 0 : _a.trim())) {
                div.remove();
                processedCount++;
                return true;
            }
            // Case 2: Wrapper div - merge up aggressively
            if (isWrapperDiv(div)) {
                const fragment = document.createDocumentFragment();
                while (div.firstChild) {
                    fragment.appendChild(div.firstChild);
                }
                div.replaceWith(fragment);
                processedCount++;
                return true;
            }
            // Case 3: Div only contains text content - convert to paragraph
            if (!div.children.length && ((_b = div.textContent) === null || _b === void 0 ? void 0 : _b.trim())) {
                const p = document.createElement('p');
                p.textContent = div.textContent;
                div.replaceWith(p);
                processedCount++;
                return true;
            }
            // Case 4: Div has single child
            if (div.children.length === 1) {
                const child = div.firstElementChild;
                const childTag = child.tagName.toLowerCase();
                // Don't unwrap if child is inline or should be preserved
                if (!INLINE_ELEMENTS.has(childTag) && !shouldPreserveElement(child)) {
                    div.replaceWith(child);
                    processedCount++;
                    return true;
                }
            }
            // Case 5: Deeply nested div - merge up
            let nestingDepth = 0;
            let parent = div.parentElement;
            while (parent) {
                if (parent.tagName.toLowerCase() === 'div') {
                    nestingDepth++;
                }
                parent = parent.parentElement;
            }
            if (nestingDepth > 1) {
                const fragment = document.createDocumentFragment();
                while (div.firstChild) {
                    fragment.appendChild(div.firstChild);
                }
                div.replaceWith(fragment);
                processedCount++;
                return true;
            }
            return false;
        };
        // First pass: Process top-level divs
        const processTopLevelDivs = () => {
            const topDivs = Array.from(element.children).filter(el => el.tagName.toLowerCase() === 'div');
            let modified = false;
            topDivs.forEach(div => {
                if (processDiv(div)) {
                    modified = true;
                }
            });
            return modified;
        };
        // Second pass: Process remaining divs from deepest to shallowest
        const processRemainingDivs = () => {
            const allDivs = Array.from(element.getElementsByTagName('div'))
                .sort((a, b) => {
                // Count nesting depth
                const getDepth = (el) => {
                    let depth = 0;
                    let parent = el.parentElement;
                    while (parent) {
                        if (parent.tagName.toLowerCase() === 'div')
                            depth++;
                        parent = parent.parentElement;
                    }
                    return depth;
                };
                return getDepth(b) - getDepth(a); // Process deepest first
            });
            let modified = false;
            allDivs.forEach(div => {
                if (processDiv(div)) {
                    modified = true;
                }
            });
            return modified;
        };
        // Final cleanup pass
        const finalCleanup = () => {
            const remainingDivs = Array.from(element.getElementsByTagName('div'));
            let modified = false;
            remainingDivs.forEach(div => {
                if (!shouldPreserveElement(div) && isWrapperDiv(div)) {
                    const fragment = document.createDocumentFragment();
                    while (div.firstChild) {
                        fragment.appendChild(div.firstChild);
                    }
                    div.replaceWith(fragment);
                    processedCount++;
                    modified = true;
                }
            });
            return modified;
        };
        // Execute all passes until no more changes
        do {
            keepProcessing = false;
            if (processTopLevelDivs())
                keepProcessing = true;
            if (processRemainingDivs())
                keepProcessing = true;
            if (finalCleanup())
                keepProcessing = true;
        } while (keepProcessing);
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
        // Flatten unnecessary div elements - moved earlier in the process
        this.flattenDivs(element);
        // Strip unwanted attributes
        this.stripUnwantedAttributes(element);
        // Remove empty elements
        this.removeEmptyElements(element);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QW9CLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzVELEtBQUssSUFBSSxVQUFVLENBQUM7UUFFcEIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUMxRCxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWpDLE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztDQUNEO0FBLzJDRCw0QkErMkNDOzs7Ozs7O1VDNThFRDtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7Ozs7Ozs7Ozs7O0FDdEJBLDREQUFzQztBQUE3Qiw2R0FBUSIsInNvdXJjZXMiOlsid2VicGFjazovL0RlZnVkZGxlL3dlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbiIsIndlYnBhY2s6Ly9EZWZ1ZGRsZS8uL3NyYy9tZXRhZGF0YS50cyIsIndlYnBhY2s6Ly9EZWZ1ZGRsZS8uL3NyYy9kZWZ1ZGRsZS50cyIsIndlYnBhY2s6Ly9EZWZ1ZGRsZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9EZWZ1ZGRsZS8uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJEZWZ1ZGRsZVwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJEZWZ1ZGRsZVwiXSA9IGZhY3RvcnkoKTtcbn0pKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHRoaXMsICgpID0+IHtcbnJldHVybiAiLCJpbXBvcnQgeyBEZWZ1ZGRsZU1ldGFkYXRhIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBjbGFzcyBNZXRhZGF0YUV4dHJhY3RvciB7XG5cdHN0YXRpYyBleHRyYWN0KGRvYzogRG9jdW1lbnQsIHNjaGVtYU9yZ0RhdGE6IGFueSk6IERlZnVkZGxlTWV0YWRhdGEge1xuXHRcdGxldCBkb21haW4gPSAnJztcblx0XHRsZXQgdXJsID0gJyc7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gVHJ5IHRvIGdldCBVUkwgZnJvbSBkb2N1bWVudCBsb2NhdGlvblxuXHRcdFx0dXJsID0gZG9jLmxvY2F0aW9uPy5ocmVmIHx8ICcnO1xuXHRcdFx0XG5cdFx0XHQvLyBJZiBubyBVUkwgZnJvbSBsb2NhdGlvbiwgdHJ5IG90aGVyIHNvdXJjZXNcblx0XHRcdGlmICghdXJsKSB7XG5cdFx0XHRcdHVybCA9IHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwib2c6dXJsXCIpIHx8XG5cdFx0XHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJ0d2l0dGVyOnVybFwiKSB8fFxuXHRcdFx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAndXJsJykgfHxcblx0XHRcdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ21haW5FbnRpdHlPZlBhZ2UudXJsJykgfHxcblx0XHRcdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ21haW5FbnRpdHkudXJsJykgfHxcblx0XHRcdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ1dlYlNpdGUudXJsJykgfHxcblx0XHRcdFx0XHRkb2MucXVlcnlTZWxlY3RvcignbGlua1tyZWw9XCJjYW5vbmljYWxcIl0nKT8uZ2V0QXR0cmlidXRlKCdocmVmJykgfHwgJyc7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh1cmwpIHtcblx0XHRcdFx0ZG9tYWluID0gbmV3IFVSTCh1cmwpLmhvc3RuYW1lLnJlcGxhY2UoL153d3dcXC4vLCAnJyk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Ly8gSWYgVVJMIHBhcnNpbmcgZmFpbHMsIHRyeSB0byBnZXQgZnJvbSBiYXNlIHRhZ1xuXHRcdFx0Y29uc3QgYmFzZVRhZyA9IGRvYy5xdWVyeVNlbGVjdG9yKCdiYXNlW2hyZWZdJyk7XG5cdFx0XHRpZiAoYmFzZVRhZykge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHVybCA9IGJhc2VUYWcuZ2V0QXR0cmlidXRlKCdocmVmJykgfHwgJyc7XG5cdFx0XHRcdFx0ZG9tYWluID0gbmV3IFVSTCh1cmwpLmhvc3RuYW1lLnJlcGxhY2UoL153d3dcXC4vLCAnJyk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBwYXJzZSBiYXNlIFVSTDonLCBlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHR0aXRsZTogdGhpcy5nZXRUaXRsZShkb2MsIHNjaGVtYU9yZ0RhdGEpLFxuXHRcdFx0ZGVzY3JpcHRpb246IHRoaXMuZ2V0RGVzY3JpcHRpb24oZG9jLCBzY2hlbWFPcmdEYXRhKSxcblx0XHRcdGRvbWFpbixcblx0XHRcdGZhdmljb246IHRoaXMuZ2V0RmF2aWNvbihkb2MsIHVybCksXG5cdFx0XHRpbWFnZTogdGhpcy5nZXRJbWFnZShkb2MsIHNjaGVtYU9yZ0RhdGEpLFxuXHRcdFx0cHVibGlzaGVkOiB0aGlzLmdldFB1Ymxpc2hlZChkb2MsIHNjaGVtYU9yZ0RhdGEpLFxuXHRcdFx0YXV0aG9yOiB0aGlzLmdldEF1dGhvcihkb2MsIHNjaGVtYU9yZ0RhdGEpLFxuXHRcdFx0c2l0ZTogdGhpcy5nZXRTaXRlKGRvYywgc2NoZW1hT3JnRGF0YSksXG5cdFx0XHRzY2hlbWFPcmdEYXRhLFxuXHRcdFx0d29yZENvdW50OiAwLFxuXHRcdFx0cGFyc2VUaW1lOiAwXG5cdFx0fTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldEF1dGhvcihkb2M6IERvY3VtZW50LCBzY2hlbWFPcmdEYXRhOiBhbnkpOiBzdHJpbmcge1xuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwic2FpbHRocnUuYXV0aG9yXCIpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2F1dGhvci5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwiYXV0aG9yXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwiYnlsXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwiYXV0aG9yXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwiYXV0aG9yTGlzdFwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcImNvcHlyaWdodFwiKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdjb3B5cmlnaHRIb2xkZXIubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcIm9nOnNpdGVfbmFtZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdwdWJsaXNoZXIubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ3NvdXJjZU9yZ2FuaXphdGlvbi5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnaXNQYXJ0T2YubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwidHdpdHRlcjpjcmVhdG9yXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwiYXBwbGljYXRpb24tbmFtZVwiKSB8fFxuXHRcdFx0Jydcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0U2l0ZShkb2M6IERvY3VtZW50LCBzY2hlbWFPcmdEYXRhOiBhbnkpOiBzdHJpbmcge1xuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ3B1Ymxpc2hlci5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwib2c6c2l0ZV9uYW1lXCIpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ1dlYlNpdGUubmFtZScpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ3NvdXJjZU9yZ2FuaXphdGlvbi5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJjb3B5cmlnaHRcIikgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnY29weXJpZ2h0SG9sZGVyLm5hbWUnKSB8fFxuXHRcdFx0dGhpcy5nZXRTY2hlbWFQcm9wZXJ0eShkb2MsIHNjaGVtYU9yZ0RhdGEsICdpc1BhcnRPZi5uYW1lJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJhcHBsaWNhdGlvbi1uYW1lXCIpIHx8XG5cdFx0XHR0aGlzLmdldEF1dGhvcihkb2MsIHNjaGVtYU9yZ0RhdGEpIHx8XG5cdFx0XHQnJ1xuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRUaXRsZShkb2M6IERvY3VtZW50LCBzY2hlbWFPcmdEYXRhOiBhbnkpOiBzdHJpbmcge1xuXHRcdGNvbnN0IHJhd1RpdGxlID0gKFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwicHJvcGVydHlcIiwgXCJvZzp0aXRsZVwiKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInR3aXR0ZXI6dGl0bGVcIikgfHxcblx0XHRcdHRoaXMuZ2V0U2NoZW1hUHJvcGVydHkoZG9jLCBzY2hlbWFPcmdEYXRhLCAnaGVhZGxpbmUnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInRpdGxlXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwic2FpbHRocnUudGl0bGVcIikgfHxcblx0XHRcdGRvYy5xdWVyeVNlbGVjdG9yKCd0aXRsZScpPy50ZXh0Q29udGVudD8udHJpbSgpIHx8XG5cdFx0XHQnJ1xuXHRcdCk7XG5cblx0XHRyZXR1cm4gdGhpcy5jbGVhblRpdGxlKHJhd1RpdGxlLCB0aGlzLmdldFNpdGUoZG9jLCBzY2hlbWFPcmdEYXRhKSk7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBjbGVhblRpdGxlKHRpdGxlOiBzdHJpbmcsIHNpdGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdGlmICghdGl0bGUgfHwgIXNpdGVOYW1lKSByZXR1cm4gdGl0bGU7XG5cblx0XHQvLyBSZW1vdmUgc2l0ZSBuYW1lIGlmIGl0IGV4aXN0c1xuXHRcdGNvbnN0IHNpdGVOYW1lRXNjYXBlZCA9IHNpdGVOYW1lLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJyk7XG5cdFx0Y29uc3QgcGF0dGVybnMgPSBbXG5cdFx0XHRgXFxcXHMqW1xcXFx8XFxcXC3igJPigJRdXFxcXHMqJHtzaXRlTmFtZUVzY2FwZWR9XFxcXHMqJGAsIC8vIFRpdGxlIHwgU2l0ZSBOYW1lXG5cdFx0XHRgXlxcXFxzKiR7c2l0ZU5hbWVFc2NhcGVkfVxcXFxzKltcXFxcfFxcXFwt4oCT4oCUXVxcXFxzKmAsIC8vIFNpdGUgTmFtZSB8IFRpdGxlXG5cdFx0XTtcblx0XHRcblx0XHRmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcblx0XHRcdGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChwYXR0ZXJuLCAnaScpO1xuXHRcdFx0aWYgKHJlZ2V4LnRlc3QodGl0bGUpKSB7XG5cdFx0XHRcdHRpdGxlID0gdGl0bGUucmVwbGFjZShyZWdleCwgJycpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGl0bGUudHJpbSgpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0RGVzY3JpcHRpb24oZG9jOiBEb2N1bWVudCwgc2NoZW1hT3JnRGF0YTogYW55KTogc3RyaW5nIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcImRlc2NyaXB0aW9uXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcImRlc2NyaXB0aW9uXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcIm9nOmRlc2NyaXB0aW9uXCIpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2Rlc2NyaXB0aW9uJykgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwic2FpbHRocnUuZGVzY3JpcHRpb25cIikgfHxcblx0XHRcdCcnXG5cdFx0KTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldEltYWdlKGRvYzogRG9jdW1lbnQsIHNjaGVtYU9yZ0RhdGE6IGFueSk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIChcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwib2c6aW1hZ2VcIikgfHxcblx0XHRcdHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcIm5hbWVcIiwgXCJ0d2l0dGVyOmltYWdlXCIpIHx8XG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2ltYWdlLnVybCcpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJuYW1lXCIsIFwic2FpbHRocnUuaW1hZ2UuZnVsbFwiKSB8fFxuXHRcdFx0Jydcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0RmF2aWNvbihkb2M6IERvY3VtZW50LCBiYXNlVXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdGNvbnN0IGljb25Gcm9tTWV0YSA9IHRoaXMuZ2V0TWV0YUNvbnRlbnQoZG9jLCBcInByb3BlcnR5XCIsIFwib2c6aW1hZ2U6ZmF2aWNvblwiKTtcblx0XHRpZiAoaWNvbkZyb21NZXRhKSByZXR1cm4gaWNvbkZyb21NZXRhO1xuXG5cdFx0Y29uc3QgaWNvbkxpbmsgPSBkb2MucXVlcnlTZWxlY3RvcihcImxpbmtbcmVsPSdpY29uJ11cIik/LmdldEF0dHJpYnV0ZShcImhyZWZcIik7XG5cdFx0aWYgKGljb25MaW5rKSByZXR1cm4gaWNvbkxpbms7XG5cblx0XHRjb25zdCBzaG9ydGN1dExpbmsgPSBkb2MucXVlcnlTZWxlY3RvcihcImxpbmtbcmVsPSdzaG9ydGN1dCBpY29uJ11cIik/LmdldEF0dHJpYnV0ZShcImhyZWZcIik7XG5cdFx0aWYgKHNob3J0Y3V0TGluaykgcmV0dXJuIHNob3J0Y3V0TGluaztcblxuXHRcdC8vIE9ubHkgdHJ5IHRvIGNvbnN0cnVjdCBmYXZpY29uIFVSTCBpZiB3ZSBoYXZlIGEgdmFsaWQgYmFzZSBVUkxcblx0XHRpZiAoYmFzZVVybCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIG5ldyBVUkwoXCIvZmF2aWNvbi5pY29cIiwgYmFzZVVybCkuaHJlZjtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdGYWlsZWQgdG8gY29uc3RydWN0IGZhdmljb24gVVJMOicsIGUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiAnJztcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldFB1Ymxpc2hlZChkb2M6IERvY3VtZW50LCBzY2hlbWFPcmdEYXRhOiBhbnkpOiBzdHJpbmcge1xuXHRcdHJldHVybiAoXG5cdFx0XHR0aGlzLmdldFNjaGVtYVByb3BlcnR5KGRvYywgc2NoZW1hT3JnRGF0YSwgJ2RhdGVQdWJsaXNoZWQnKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInB1Ymxpc2hEYXRlXCIpIHx8XG5cdFx0XHR0aGlzLmdldE1ldGFDb250ZW50KGRvYywgXCJwcm9wZXJ0eVwiLCBcImFydGljbGU6cHVibGlzaGVkX3RpbWVcIikgfHxcblx0XHRcdHRoaXMuZ2V0VGltZUVsZW1lbnQoZG9jKSB8fFxuXHRcdFx0dGhpcy5nZXRNZXRhQ29udGVudChkb2MsIFwibmFtZVwiLCBcInNhaWx0aHJ1LmRhdGVcIikgfHxcblx0XHRcdCcnXG5cdFx0KTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGdldE1ldGFDb250ZW50KGRvYzogRG9jdW1lbnQsIGF0dHI6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0Y29uc3Qgc2VsZWN0b3IgPSBgbWV0YVske2F0dHJ9XWA7XG5cdFx0Y29uc3QgZWxlbWVudCA9IEFycmF5LmZyb20oZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuXHRcdFx0LmZpbmQoZWwgPT4gZWwuZ2V0QXR0cmlidXRlKGF0dHIpPy50b0xvd2VyQ2FzZSgpID09PSB2YWx1ZS50b0xvd2VyQ2FzZSgpKTtcblx0XHRjb25zdCBjb250ZW50ID0gZWxlbWVudCA/IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiY29udGVudFwiKT8udHJpbSgpID8/IFwiXCIgOiBcIlwiO1xuXHRcdHJldHVybiB0aGlzLmRlY29kZUhUTUxFbnRpdGllcyhjb250ZW50LCBkb2MpO1xuXHR9XG5cblx0cHJpdmF0ZSBzdGF0aWMgZ2V0VGltZUVsZW1lbnQoZG9jOiBEb2N1bWVudCk6IHN0cmluZyB7XG5cdFx0Y29uc3Qgc2VsZWN0b3IgPSBgdGltZWA7XG5cdFx0Y29uc3QgZWxlbWVudCA9IEFycmF5LmZyb20oZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVswXTtcblx0XHRjb25zdCBjb250ZW50ID0gZWxlbWVudCA/IChlbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGV0aW1lXCIpPy50cmltKCkgPz8gZWxlbWVudC50ZXh0Q29udGVudD8udHJpbSgpID8/IFwiXCIpIDogXCJcIjtcblx0XHRyZXR1cm4gdGhpcy5kZWNvZGVIVE1MRW50aXRpZXMoY29udGVudCwgZG9jKTtcblx0fVxuXG5cdHByaXZhdGUgc3RhdGljIGRlY29kZUhUTUxFbnRpdGllcyh0ZXh0OiBzdHJpbmcsIGRvYzogRG9jdW1lbnQpOiBzdHJpbmcge1xuXHRcdGNvbnN0IHRleHRhcmVhID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG5cdFx0dGV4dGFyZWEuaW5uZXJIVE1MID0gdGV4dDtcblx0XHRyZXR1cm4gdGV4dGFyZWEudmFsdWU7XG5cdH1cblxuXHRwcml2YXRlIHN0YXRpYyBnZXRTY2hlbWFQcm9wZXJ0eShkb2M6IERvY3VtZW50LCBzY2hlbWFPcmdEYXRhOiBhbnksIHByb3BlcnR5OiBzdHJpbmcsIGRlZmF1bHRWYWx1ZTogc3RyaW5nID0gJycpOiBzdHJpbmcge1xuXHRcdGlmICghc2NoZW1hT3JnRGF0YSkgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcblxuXHRcdGNvbnN0IHNlYXJjaFNjaGVtYSA9IChkYXRhOiBhbnksIHByb3BzOiBzdHJpbmdbXSwgZnVsbFBhdGg6IHN0cmluZywgaXNFeGFjdE1hdGNoOiBib29sZWFuID0gdHJ1ZSk6IHN0cmluZ1tdID0+IHtcblx0XHRcdGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0cmV0dXJuIHByb3BzLmxlbmd0aCA9PT0gMCA/IFtkYXRhXSA6IFtdO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZiAoIWRhdGEgfHwgdHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcblx0XHRcdFx0Y29uc3QgY3VycmVudFByb3AgPSBwcm9wc1swXTtcblx0XHRcdFx0aWYgKC9eXFxbXFxkK1xcXSQvLnRlc3QoY3VycmVudFByb3ApKSB7XG5cdFx0XHRcdFx0Y29uc3QgaW5kZXggPSBwYXJzZUludChjdXJyZW50UHJvcC5zbGljZSgxLCAtMSkpO1xuXHRcdFx0XHRcdGlmIChkYXRhW2luZGV4XSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHNlYXJjaFNjaGVtYShkYXRhW2luZGV4XSwgcHJvcHMuc2xpY2UoMSksIGZ1bGxQYXRoLCBpc0V4YWN0TWF0Y2gpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdGlmIChwcm9wcy5sZW5ndGggPT09IDAgJiYgZGF0YS5ldmVyeShpdGVtID0+IHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEubWFwKFN0cmluZyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiBkYXRhLmZsYXRNYXAoaXRlbSA9PiBzZWFyY2hTY2hlbWEoaXRlbSwgcHJvcHMsIGZ1bGxQYXRoLCBpc0V4YWN0TWF0Y2gpKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgW2N1cnJlbnRQcm9wLCAuLi5yZW1haW5pbmdQcm9wc10gPSBwcm9wcztcblx0XHRcdFxuXHRcdFx0aWYgKCFjdXJyZW50UHJvcCkge1xuXHRcdFx0XHRpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSByZXR1cm4gW2RhdGFdO1xuXHRcdFx0XHRpZiAodHlwZW9mIGRhdGEgPT09ICdvYmplY3QnICYmIGRhdGEubmFtZSkge1xuXHRcdFx0XHRcdHJldHVybiBbZGF0YS5uYW1lXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLmhhc093blByb3BlcnR5KGN1cnJlbnRQcm9wKSkge1xuXHRcdFx0XHRyZXR1cm4gc2VhcmNoU2NoZW1hKGRhdGFbY3VycmVudFByb3BdLCByZW1haW5pbmdQcm9wcywgXG5cdFx0XHRcdFx0ZnVsbFBhdGggPyBgJHtmdWxsUGF0aH0uJHtjdXJyZW50UHJvcH1gIDogY3VycmVudFByb3AsIHRydWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWlzRXhhY3RNYXRjaCkge1xuXHRcdFx0XHRjb25zdCBuZXN0ZWRSZXN1bHRzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdFx0XHRmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhW2tleV0gPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdFx0XHRjb25zdCByZXN1bHRzID0gc2VhcmNoU2NoZW1hKGRhdGFba2V5XSwgcHJvcHMsIFxuXHRcdFx0XHRcdFx0XHRmdWxsUGF0aCA/IGAke2Z1bGxQYXRofS4ke2tleX1gIDoga2V5LCBmYWxzZSk7XG5cdFx0XHRcdFx0XHRuZXN0ZWRSZXN1bHRzLnB1c2goLi4ucmVzdWx0cyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChuZXN0ZWRSZXN1bHRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gbmVzdGVkUmVzdWx0cztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cdFx0XHRsZXQgcmVzdWx0cyA9IHNlYXJjaFNjaGVtYShzY2hlbWFPcmdEYXRhLCBwcm9wZXJ0eS5zcGxpdCgnLicpLCAnJywgdHJ1ZSk7XG5cdFx0XHRpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cmVzdWx0cyA9IHNlYXJjaFNjaGVtYShzY2hlbWFPcmdEYXRhLCBwcm9wZXJ0eS5zcGxpdCgnLicpLCAnJywgZmFsc2UpO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3QgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggPiAwID8gcmVzdWx0cy5maWx0ZXIoQm9vbGVhbikuam9pbignLCAnKSA6IGRlZmF1bHRWYWx1ZTtcblx0XHRcdHJldHVybiB0aGlzLmRlY29kZUhUTUxFbnRpdGllcyhyZXN1bHQsIGRvYyk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYEVycm9yIGluIGdldFNjaGVtYVByb3BlcnR5IGZvciAke3Byb3BlcnR5fTpgLCBlcnJvcik7XG5cdFx0XHRyZXR1cm4gZGVmYXVsdFZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdHN0YXRpYyBleHRyYWN0U2NoZW1hT3JnRGF0YShkb2M6IERvY3VtZW50KTogYW55IHtcblx0XHRjb25zdCBzY2hlbWFTY3JpcHRzID0gZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NjcmlwdFt0eXBlPVwiYXBwbGljYXRpb24vbGQranNvblwiXScpO1xuXHRcdGNvbnN0IHNjaGVtYURhdGE6IGFueVtdID0gW107XG5cblx0XHRzY2hlbWFTY3JpcHRzLmZvckVhY2goc2NyaXB0ID0+IHtcblx0XHRcdGxldCBqc29uQ29udGVudCA9IHNjcmlwdC50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0anNvbkNvbnRlbnQgPSBqc29uQ29udGVudFxuXHRcdFx0XHRcdC5yZXBsYWNlKC9cXC9cXCpbXFxzXFxTXSo/XFwqXFwvfF5cXHMqXFwvXFwvLiokL2dtLCAnJylcblx0XHRcdFx0XHQucmVwbGFjZSgvXlxccyo8IVxcW0NEQVRBXFxbKFtcXHNcXFNdKj8pXFxdXFxdPlxccyokLywgJyQxJylcblx0XHRcdFx0XHQucmVwbGFjZSgvXlxccyooXFwqXFwvfFxcL1xcKilcXHMqfFxccyooXFwqXFwvfFxcL1xcKilcXHMqJC9nLCAnJylcblx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRjb25zdCBqc29uRGF0YSA9IEpTT04ucGFyc2UoanNvbkNvbnRlbnQpO1xuXG5cdFx0XHRcdGlmIChqc29uRGF0YVsnQGdyYXBoJ10gJiYgQXJyYXkuaXNBcnJheShqc29uRGF0YVsnQGdyYXBoJ10pKSB7XG5cdFx0XHRcdFx0c2NoZW1hRGF0YS5wdXNoKC4uLmpzb25EYXRhWydAZ3JhcGgnXSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2NoZW1hRGF0YS5wdXNoKGpzb25EYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignRXJyb3IgcGFyc2luZyBzY2hlbWEub3JnIGRhdGE6JywgZXJyb3IpO1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdQcm9ibGVtYXRpYyBKU09OIGNvbnRlbnQ6JywganNvbkNvbnRlbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHNjaGVtYURhdGE7XG5cdH1cbn0iLCJpbXBvcnQgeyBNZXRhZGF0YUV4dHJhY3RvciB9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHsgRGVmdWRkbGVPcHRpb25zLCBEZWZ1ZGRsZVJlc3BvbnNlLCBEZWZ1ZGRsZU1ldGFkYXRhIH0gZnJvbSAnLi90eXBlcyc7XG5cbi8vIEVudHJ5IHBvaW50IGVsZW1lbnRzXG4vLyBUaGVzZSBhcmUgdGhlIGVsZW1lbnRzIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGZpbmQgdGhlIG1haW4gY29udGVudFxuY29uc3QgRU5UUllfUE9JTlRfRUxFTUVOVFMgPSBbXG5cdCdhcnRpY2xlJyxcblx0J1tyb2xlPVwiYXJ0aWNsZVwiXScsXG5cdCdbaXRlbXByb3A9XCJhcnRpY2xlQm9keVwiXScsXG5cdCcucG9zdC1jb250ZW50Jyxcblx0Jy5hcnRpY2xlLWNvbnRlbnQnLFxuXHQnI2FydGljbGUtY29udGVudCcsXG5cdCcuY29udGVudC1hcnRpY2xlJyxcblx0J21haW4nLFxuXHQnW3JvbGU9XCJtYWluXCJdJyxcblx0J2JvZHknIC8vIGVuc3VyZXMgdGhlcmUgaXMgYWx3YXlzIGEgbWF0Y2hcbl07XG5cbmNvbnN0IE1PQklMRV9XSURUSCA9IDYwMDtcbmNvbnN0IEJMT0NLX0VMRU1FTlRTID0gWydkaXYnLCAnc2VjdGlvbicsICdhcnRpY2xlJywgJ21haW4nXTtcblxuLy8gSGlkZGVuIGVsZW1lbnRzIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWRcbmNvbnN0IEhJRERFTl9FTEVNRU5UX1NFTEVDVE9SUyA9IFtcblx0J1toaWRkZW5dJyxcblx0J1thcmlhLWhpZGRlbj1cInRydWVcIl0nLFxuLy9cdCdbc3R5bGUqPVwiZGlzcGxheTogbm9uZVwiXScsIGNhdXNlcyBwcm9ibGVtcyBmb3IgbWF0aCBmb3JtdWxhc1xuLy9cdCdbc3R5bGUqPVwiZGlzcGxheTpub25lXCJdJyxcblx0J1tzdHlsZSo9XCJ2aXNpYmlsaXR5OiBoaWRkZW5cIl0nLFxuXHQnW3N0eWxlKj1cInZpc2liaWxpdHk6aGlkZGVuXCJdJyxcblx0Jy5oaWRkZW4nLFxuXHQnLmludmlzaWJsZSdcbl0uam9pbignLCcpO1xuXG4vLyBTZWxlY3RvcnMgdG8gYmUgcmVtb3ZlZFxuY29uc3QgRVhBQ1RfU0VMRUNUT1JTID0gW1xuXHQvLyBzY3JpcHRzLCBzdHlsZXNcblx0J25vc2NyaXB0Jyxcblx0J3NjcmlwdCcsXG5cdCdzdHlsZScsXG5cblx0Ly8gYWRzXG5cdCcuYWQ6bm90KFtjbGFzcyo9XCJncmFkaWVudFwiXSknLFxuXHQnW2NsYXNzXj1cImFkLVwiIGldJyxcblx0J1tjbGFzcyQ9XCItYWRcIiBpXScsXG5cdCdbaWRePVwiYWQtXCIgaV0nLFxuXHQnW2lkJD1cIi1hZFwiIGldJyxcblx0J1tyb2xlPVwiYmFubmVyXCIgaV0nLFxuXHQnLnByb21vJyxcblx0Jy5Qcm9tbycsXG5cblx0Ly8gY29tbWVudHNcblx0J1tpZD1cImNvbW1lbnRzXCIgaV0nLFxuXG5cdC8vIGhlYWRlciwgbmF2XG5cdCdoZWFkZXInLFxuXHQnLmhlYWRlcicsXG5cdCcjaGVhZGVyJyxcblx0J25hdicsXG5cdCcubmF2aWdhdGlvbicsXG5cdCcjbmF2aWdhdGlvbicsXG5cdCdbcm9sZT1cIm5hdmlnYXRpb25cIiBpXScsXG5cdCdbcm9sZT1cImRpYWxvZ1wiIGldJyxcblx0J1tyb2xlKj1cImNvbXBsZW1lbnRhcnlcIiBpXScsXG5cdCdbY2xhc3MqPVwicGFnaW5hdGlvblwiIGldJyxcblx0Jy5tZW51Jyxcblx0JyNtZW51JyxcblxuXHQvLyBtZXRhZGF0YVxuXHQnLmF1dGhvcicsXG5cdCcuQXV0aG9yJyxcblx0Jy5jb250cmlidXRvcicsXG5cdCcuZGF0ZScsXG5cdCcubWV0YScsXG5cdCcudGFncycsXG5cdCcudG9jJyxcblx0Jy5Ub2MnLFxuXHQnI3RvYycsXG5cdCcjdGl0bGUnLFxuXHQnI1RpdGxlJyxcblx0J1tocmVmKj1cIi9jYXRlZ29yeVwiXScsXG5cdCdbaHJlZio9XCIvY2F0ZWdvcmllc1wiXScsXG5cdCdbaHJlZio9XCIvdGFnL1wiXScsXG5cdCdbaHJlZio9XCIvdGFncy9cIl0nLFxuXHQnW2hyZWYqPVwiL3RvcGljc1wiXScsXG5cdCdbaHJlZio9XCJhdXRob3JcIl0nLFxuXHQnW2hyZWY9XCIjc2l0ZS1jb250ZW50XCJdJyxcblx0J1tzcmMqPVwiYXV0aG9yXCJdJyxcblxuXHQvLyBmb290ZXJcblx0J2Zvb3RlcicsXG5cblx0Ly8gaW5wdXRzLCBmb3JtcywgZWxlbWVudHNcblx0J2FzaWRlJyxcblx0J2J1dHRvbicsXG5cdFx0Ly8gJ1tyb2xlPVwiYnV0dG9uXCJdJywgTWVkaXVtIGltYWdlc1xuXHQnY2FudmFzJyxcblx0J2RpYWxvZycsXG5cdCdmaWVsZHNldCcsXG5cdCdmb3JtJyxcblx0J2lucHV0Om5vdChbdHlwZT1cImNoZWNrYm94XCJdKScsXG5cdCdsYWJlbCcsXG5cdCdsaW5rJyxcblx0J29wdGlvbicsXG5cdCdzZWxlY3QnLFxuXHQndGV4dGFyZWEnLFxuXHQndGltZScsXG5cblx0Ly8gaWZyYW1lc1xuXHQnaW5zdGFyZWFkLXBsYXllcicsXG5cdCdpZnJhbWU6bm90KFtzcmMqPVwieW91dHViZVwiXSk6bm90KFtzcmMqPVwieW91dHUuYmVcIl0pOm5vdChbc3JjKj1cInZpbWVvXCJdKTpub3QoW3NyYyo9XCJ0d2l0dGVyXCJdKScsXG5cblx0Ly8gbG9nb3Ncblx0J1tjbGFzcz1cImxvZ29cIiBpXScsXG5cdCcjbG9nbycsXG5cdCcjTG9nbycsXG5cblx0Ly8gbmV3c2xldHRlclxuXHQnI25ld3NsZXR0ZXInLFxuXHQnI05ld3NsZXR0ZXInLFxuXG5cdC8vIGhpZGRlbiBmb3IgcHJpbnRcblx0Jy5ub3ByaW50Jyxcblx0J1tkYXRhLWxpbmstbmFtZSo9XCJza2lwXCIgaV0nLFxuXHQnW2RhdGEtcHJpbnQtbGF5b3V0PVwiaGlkZVwiIGldJyxcblx0J1tkYXRhLWJsb2NrPVwiZG9ub3RwcmludFwiIGldJyxcblxuXHQvLyBmb290bm90ZXMsIGNpdGF0aW9uc1xuXHQnW2NsYXNzKj1cImNsaWNrYWJsZS1pY29uXCIgaV0nLFxuXHQnbGkgc3BhbltjbGFzcyo9XCJsdHhfdGFnXCIgaV1bY2xhc3MqPVwibHR4X3RhZ19pdGVtXCIgaV0nLFxuXHQnYVtocmVmXj1cIiNcIl1bY2xhc3MqPVwiYW5jaG9yXCIgaV0nLFxuXHQnYVtocmVmXj1cIiNcIl1bY2xhc3MqPVwicmVmXCIgaV0nLFxuXG5cdC8vIGxpbmsgbGlzdHNcblx0J1tkYXRhLWNvbnRhaW5lcio9XCJtb3N0LXZpZXdlZFwiIGldJyxcblxuXHQvLyBzaWRlYmFyXG5cdCcuc2lkZWJhcicsXG5cdCcuU2lkZWJhcicsXG5cdCcjc2lkZWJhcicsXG5cdCcjU2lkZWJhcicsXG5cdCcjc2l0ZXN1YicsXG5cdFxuXHQvLyBvdGhlclxuXHQnI05ZVF9BQk9WRV9NQUlOX0NPTlRFTlRfUkVHSU9OJyxcblx0J1tkYXRhLXRlc3RpZD1cInBob3Rvdmlld2VyLWNoaWxkcmVuLWZpZ3VyZVwiXSA+IHNwYW4nLCAvLyBOZXcgWW9yayBUaW1lc1xuXHQndGFibGUuaW5mb2JveCcsXG5cdCcucGVuY3JhZnQ6bm90KC5wYy1kaXNwbGF5LWNvbnRlbnRzKScsIC8vIFN1YnN0YWNrXG5cdCdbZGF0YS1vcHRpbWl6ZWx5PVwicmVsYXRlZC1hcnRpY2xlcy1zZWN0aW9uXCIgaV0nIC8vIFRoZSBFY29ub21pc3Rcbl07XG5cbi8vIFJlbW92YWwgcGF0dGVybnMgdGVzdGVkIGFnYWluc3QgYXR0cmlidXRlczogY2xhc3MsIGlkLCBkYXRhLXRlc3RpZCwgYW5kIGRhdGEtcWFcbi8vIENhc2UgaW5zZW5zaXRpdmUsIHBhcnRpYWwgbWF0Y2hlcyBhbGxvd2VkXG5jb25zdCBQQVJUSUFMX1NFTEVDVE9SUyA9IFtcblx0J2FjY2Vzcy13YWxsJyxcblx0J2FjdGl2aXR5cHViJyxcblx0J2FjdGlvbmNhbGwnLFxuXHQnYXBwZW5kaXgnLFxuXHQnYXZhdGFyJyxcblx0J2FkdmVydCcsXG5cdCctYWQtJyxcblx0J19hZF8nLFxuXHQnYWxsdGVybXMnLFxuXHQnYXJvdW5kLXRoZS13ZWInLFxuXHQnYXJ0aWNsZS1ib3R0b20tc2VjdGlvbicsXG5cdCdhcnRpY2xlX19jb3B5Jyxcblx0J2FydGljbGVfZGF0ZScsXG5cdCdhcnRpY2xlLWVuZCAnLFxuXHQnYXJ0aWNsZV9oZWFkZXInLFxuXHQnYXJ0aWNsZV9faGVhZGVyJyxcblx0J2FydGljbGVfX2luZm8nLFxuXHQnYXJ0aWNsZS1pbmZvJyxcblx0J2FydGljbGVfX21ldGEnLFxuXHQnYXJ0aWNsZS1zdWJqZWN0Jyxcblx0J2FydGljbGVfc3ViamVjdCcsXG5cdCdhcnRpY2xlLXNuaXBwZXQnLFxuXHQnYXJ0aWNsZS1zZXBhcmF0b3InLFxuXHQnYXJ0aWNsZS10YWdzJyxcblx0J2FydGljbGVfdGFncycsXG5cdCdhcnRpY2xlLXRpdGxlJyxcblx0J2FydGljbGVfdGl0bGUnLFxuXHQnYXJ0aWNsZXRvcGljcycsXG5cdCdhcnRpY2xlLXRvcGljcycsXG5cdCdhcnRpY2xlLXR5cGUnLFxuXHQnYXJ0aWNsZS0tbGVkZScsIC8vIFRoZSBWZXJnZVxuXHQnYXNzb2NpYXRlZC1wZW9wbGUnLFxuLy9cdCdhdXRob3InLCBHd2VyblxuXHQnYXV0aG9yLW5hbWUnLFxuXHQnYmFjay10by10b3AnLFxuXHQnYmFja2xpbmtzLXNlY3Rpb24nLFxuXHQnYmFubmVyJyxcblx0J2Jpby1ibG9jaycsXG5cdCdibG9nLXBhZ2VyJyxcblx0J2JvdHRvbS1vZi1hcnRpY2xlJyxcblx0J2JyYW5kLWJhcicsXG5cdCdicmVhZGNydW1iJyxcblx0J2J1dHRvbi13cmFwcGVyJyxcblx0J2J0bi0nLFxuXHQnLWJ0bicsXG5cdCdieWxpbmUnLFxuXHQnY2FwdGNoYScsXG5cdCdjYXRfaGVhZGVyJyxcblx0J2NhdGxpbmtzJyxcblx0J2NoYXB0ZXItbGlzdCcsIC8vIFRoZSBFY29ub21pc3Rcblx0J2NvbGxlY3Rpb25zJyxcblx0J2NvbW1lbnRzJyxcbi8vXHQnLWNvbW1lbnQnLCBTeW50YXggaGlnaGxpZ2h0aW5nXG5cdCdjb21tZW50LWNvdW50Jyxcblx0J2NvbW1lbnQtY29udGVudCcsXG5cdCdjb21tZW50LWZvcm0nLFxuXHQnY29tbWVudC1udW1iZXInLFxuXHQnY29tbWVudC1yZXNwb25kJyxcblx0J2NvbW1lbnQtdGhyZWFkJyxcblx0J2NvbXBsZW1lbnRhcnknLFxuXHQnY29uc2VudCcsXG5cdCdjb250ZW50LWNhcmQnLCAvLyBUaGUgVmVyZ2Vcblx0J2NvbnRlbnQtdG9waWNzJyxcblx0J2NvbnRlbnRwcm9tbycsXG5cdCdjb250ZXh0LXdpZGdldCcsIC8vIFJldXRlcnNcblx0J2NvcmUtY29sbGF0ZXJhbCcsXG5cdCdfY3RhJyxcblx0Jy1jdGEnLFxuXHQnY3RhLScsXG5cdCdjdGFfJyxcblx0J2N1cnJlbnQtaXNzdWUnLCAvLyBUaGUgTmF0aW9uXG5cdCdjdXN0b20tbGlzdC1udW1iZXInLFxuXHQnZGF0ZWxpbmUnLFxuXHQnZGF0ZWhlYWRlcicsXG5cdCdkYXRlLWhlYWRlcicsXG5cdCdkYXRlX2hlYWRlci0nLFxuLy9cdCdkaWFsb2cnLFxuXHQnZGlzY2xhaW1lcicsXG5cdCdkaXNjbG9zdXJlJyxcblx0J2Rpc2N1c3Npb24nLFxuXHQnZGlzY3Vzc18nLFxuXHQnZGlzcXVzJyxcblx0J2RvbmF0ZScsXG5cdCdkcm9wZG93bicsIC8vIEFycyBUZWNobmljYVxuXHQnZWxldHRlcnMnLFxuXHQnZW1haWxzaWdudXAnLFxuXHQnZW5nYWdlbWVudC13aWRnZXQnLFxuXHQnZW50cnktYXV0aG9yLWluZm8nLFxuXHQnZW50cnktY2F0ZWdvcmllcycsXG5cdCdlbnRyeS1kYXRlJyxcblx0J2VudHJ5LW1ldGEnLFxuXHQnZW50cnktdGl0bGUnLFxuXHQnZW50cnktdXRpbGl0eScsXG5cdCdleWVicm93Jyxcblx0J2V4cGFuZC1yZWR1Y2UnLFxuXHQnZXh0ZXJuYWxsaW5rZW1iZWR3cmFwcGVyJywgLy8gVGhlIE5ldyBZb3JrZXJcblx0J2V4dHJhLXNlcnZpY2VzJyxcblx0J2V4dHJhLXRpdGxlJyxcblx0J2ZhY2Vib29rJyxcblx0J2Zhdm9yaXRlJyxcblx0J2ZlZWRiYWNrJyxcblx0J2ZlZWQtbGlua3MnLFxuXHQnZmllbGQtc2l0ZS1zZWN0aW9ucycsXG5cdCdmaXhlZCcsXG5cdCdmbG9hdGluZy12aWQnLFxuXHQnZm9sbG93Jyxcblx0J2Zvb3RlcicsXG5cdCdmb290bm90ZS1iYWNrJyxcblx0J2Zvb3Rub3RlYmFjaycsXG5cdCdmb3IteW91Jyxcblx0J2Zyb250bWF0dGVyJyxcblx0J2Z1cnRoZXItcmVhZGluZycsXG5cdCdnaXN0LW1ldGEnLFxuLy9cdCdnbG9iYWwnLFxuXHQnZ29vZ2xlJyxcblx0J2dvb2ctJyxcblx0J2dyYXBoLXZpZXcnLFxuXHQnaGVhZGVyLWxvZ28nLFxuXHQnaGVhZGVyLXBhdHRlcm4nLCAvLyBUaGUgVmVyZ2Vcblx0J2hlcm8tbGlzdCcsXG5cdCdoaWRlLWZvci1wcmludCcsXG5cdCdoaWRlLXByaW50Jyxcblx0J2hpZGRlbi1zaWRlbm90ZScsXG5cdCdpbnRlcmx1ZGUnLFxuXHQnaW50ZXJhY3Rpb24nLFxuXHQnanVtcGxpbmsnLFxuLy9cdCdrZXl3b3JkJywgLy8gdXNlZCBpbiBzeW50YXggaGlnaGxpZ2h0aW5nXG5cdCdraWNrZXInLFxuXHQnbGFic3RhYicsIC8vIEFyeGl2XG5cdCctbGFiZWxzJyxcblx0J2xhbmd1YWdlLW5hbWUnLFxuXHQnbGF0ZXN0LWNvbnRlbnQnLFxuXHQnLWxlZGVzLScsIC8vIFRoZSBWZXJnZVxuXHQnLWxpY2Vuc2UnLFxuXHQnbGluay1ib3gnLFxuXHQnbGlua3MtZ3JpZCcsIC8vIEJCQ1xuXHQnbGlua3MtdGl0bGUnLCAvLyBCQkNcblx0J2xpc3RpbmctZHluYW1pYy10ZXJtcycsIC8vIEJvc3RvbiBSZXZpZXdcblx0J2xpc3QtdGFncycsXG5cdCdsb2FkaW5nJyxcblx0J2xvYS1pbmZvJyxcblx0J2xvZ29fY29udGFpbmVyJyxcblx0J2x0eF9yb2xlX3JlZm51bScsIC8vIEFyeGl2XG5cdCdsdHhfdGFnX2JpYml0ZW0nLFxuXHQnbHR4X2Vycm9yJyxcblx0J21hcmtldGluZycsXG5cdCdtZWRpYS1pbnF1aXJ5Jyxcblx0J21lbnUtJyxcblx0J21ldGEtJyxcblx0J21ldGFkYXRhJyxcblx0J21pZ2h0LWxpa2UnLFxuXHQnX21vZGFsJyxcblx0Jy1tb2RhbCcsXG5cdCdtb3JlLScsXG5cdCdtb3JlbmV3cycsXG5cdCdtb3Jlc3RvcmllcycsXG5cdCdtb3ZlLWhlbHBlcicsXG5cdCdtdy1lZGl0c2VjdGlvbicsXG5cdCdtdy1jaXRlLWJhY2tsaW5rJyxcblx0J213LWluZGljYXRvcnMnLFxuXHQnbXctanVtcC1saW5rJyxcblx0J25hdi0nLFxuXHQnbmF2XycsXG5cdCduYXZiYXInLFxuLy9cdCduYXZpZ2F0aW9uJyxcblx0J25leHQtJyxcblx0J25ld3Mtc3RvcnktdGl0bGUnLFxuLy9cdCduZXdzbGV0dGVyJywgdXNlZCBvbiBTdWJzdGFja1xuXHQnbmV3c2xldHRlcl8nLFxuXHQnbmV3c2xldHRlci1zaWdudXAnLFxuXHQnbmV3c2xldHRlcnNpZ251cCcsXG5cdCduZXdzbGV0dGVyd2lkZ2V0Jyxcblx0J25ld3NsZXR0ZXJ3cmFwcGVyJyxcblx0J25vdC1mb3VuZCcsXG5cdCdub21vYmlsZScsXG5cdCdub3ByaW50Jyxcblx0J29yaWdpbmFsbHktcHVibGlzaGVkJywgLy8gTWVyY3VyeSBOZXdzXG5cdCdvdXRsaW5lLXZpZXcnLFxuXHQnb3ZlcmxheScsXG5cdCdwYWdlLXRpdGxlJyxcblx0Jy1wYXJ0bmVycycsXG5cdCdwbGVhJyxcblx0J3BvcHVsYXInLFxuLy9cdCdwb3B1cCcsIEd3ZXJuXG5cdCdwb3AtdXAnLFxuXHQncG9wb3ZlcicsXG5cdCdwb3N0LWJvdHRvbScsXG5cdCdwb3N0X19jYXRlZ29yeScsXG5cdCdwb3N0Y29tbWVudCcsXG5cdCdwb3N0ZGF0ZScsXG5cdCdwb3N0LWF1dGhvcicsXG5cdCdwb3N0LWRhdGUnLFxuXHQncG9zdF9kYXRlJyxcblx0J3Bvc3QtZmVlZHMnLFxuXHQncG9zdGluZm8nLFxuXHQncG9zdC1pbmZvJyxcblx0J3Bvc3RfaW5mbycsXG5cdCdwb3N0LWlubGluZS1kYXRlJyxcblx0J3Bvc3QtbGlua3MnLFxuXHQncG9zdC1tZXRhJyxcblx0J3Bvc3RtZXRhJyxcblx0J3Bvc3RzbmlwcGV0Jyxcblx0J3Bvc3Rfc25pcHBldCcsXG5cdCdwb3N0LXNuaXBwZXQnLFxuXHQncG9zdHRpdGxlJyxcblx0J3Bvc3QtdGl0bGUnLFxuXHQncG9zdF90aXRsZScsXG5cdCdwb3N0dGF4Jyxcblx0J3Bvc3QtdGF4Jyxcblx0J3Bvc3RfdGF4Jyxcblx0J3Bvc3R0YWcnLFxuXHQncG9zdF90YWcnLFxuXHQncG9zdC10YWcnLFxuLy9cdCdwcmV2aWV3JywgdXNlZCBvbiBPYnNpZGlhbiBQdWJsaXNoXG5cdCdwcmV2bmV4dCcsXG5cdCdwcmV2aW91c25leHQnLFxuXHQncHJpbnQtbm9uZScsXG5cdCdwcmludC1oZWFkZXInLFxuXHQncHJvZmlsZScsXG4vL1x0J3Byb21vJyxcblx0J3Byb21vLWJveCcsXG5cdCdwdWJkYXRlJyxcblx0J3B1Yl9kYXRlJyxcblx0J3B1Yi1kYXRlJyxcblx0J3B1YmxpY2F0aW9uLWRhdGUnLFxuXHQncHVibGljYXRpb25OYW1lJywgLy8gTWVkaXVtXG5cdCdxci1jb2RlJyxcblx0J3FyX2NvZGUnLFxuXHQnX3JhaWwnLFxuXHQncmVhZG1vcmUnLFxuXHQncmVhZC1uZXh0Jyxcblx0J3JlYWRfbmV4dCcsXG5cdCdyZWFkX3RpbWUnLFxuXHQncmVhZC10aW1lJyxcblx0J3JlYWRpbmdfdGltZScsXG5cdCdyZWFkaW5nLXRpbWUnLFxuXHQncmVhZGluZy1saXN0Jyxcblx0J3JlY2VudHBvc3QnLFxuXHQncmVjZW50X3Bvc3QnLFxuXHQncmVjZW50LXBvc3QnLFxuXHQncmVjb21tZW5kJyxcblx0J3JlZGlyZWN0ZWRmcm9tJyxcblx0J3JlY2lyYycsXG5cdCdyZWdpc3RlcicsXG5cdCdyZWxhdGVkJyxcblx0J3JlbGV2YW50Jyxcblx0J3JldmVyc2Vmb290bm90ZScsXG5cdCdzY3JlZW4tcmVhZGVyLXRleHQnLFxuLy9cdCdzaGFyZScsXG4vL1x0Jy1zaGFyZScsIHNjaXRlY2hkYWlseS5jb21cblx0J3NoYXJlLWJveCcsXG5cdCdzaGFyZS1pY29ucycsXG5cdCdzaGFyZWxpbmtzJyxcblx0J3NoYXJlLXNlY3Rpb24nLFxuXHQnc2lkZWJhcnRpdGxlJyxcblx0J3NpZGViYXJfJyxcblx0J3NpbWlsYXItJyxcblx0J3NpbWlsYXJfJyxcblx0J3NpbWlsYXJzLScsXG5cdCdzaWRlaXRlbXMnLFxuXHQnc2lkZS1ib3gnLFxuXHQnc2l0ZS1pbmRleCcsXG5cdCdzaXRlLWhlYWRlcicsXG5cdCdzaXRlLWxvZ28nLFxuXHQnc2l0ZS1uYW1lJyxcbi8vXHQnc2tpcC0nLFxuLy9cdCdza2lwLWxpbmsnLCBUZWNoQ3J1bmNoXG5cdCdzb2NpYWwnLFxuXHQnc3BlZWNoaWZ5LWlnbm9yZScsXG5cdCdzcG9uc29yJyxcbi8vXHQnLXN0YXRzJyxcblx0J19zdGF0cycsXG5cdCdzdGlja3knLFxuXHQnc3RvcnlyZWFkdGltZScsIC8vIE1lZGl1bVxuXHQnc3RvcnlwdWJsaXNoZGF0ZScsIC8vIE1lZGl1bVxuXHQnc3ViamVjdC1sYWJlbCcsXG5cdCdzdWJzY3JpYmUnLFxuXHQnX3RhZ3MnLFxuXHQndGFnc19faXRlbScsXG5cdCd0YWdfbGlzdCcsXG5cdCd0YXhvbm9teScsXG5cdCd0YWJsZS1vZi1jb250ZW50cycsXG5cdCd0YWJzLScsXG4vL1x0J3RlYXNlcicsIE5hdHVyZVxuXHQndGVybWluYWx0b3V0Jyxcblx0J3RpbWUtcnVicmljJyxcblx0J3RpbWVzdGFtcCcsXG5cdCd0aXBfb2ZmJyxcblx0J3RpcHRvdXQnLFxuXHQnLXRvdXQtJyxcblx0Jy10b2MnLFxuXHQndG9waWMtbGlzdCcsXG5cdCd0b29sYmFyJyxcblx0J3Rvb2x0aXAnLFxuXHQndG9wLXdyYXBwZXInLFxuXHQndHJlZS1pdGVtJyxcblx0J3RyZW5kaW5nJyxcblx0J3RydXN0LWZlYXQnLFxuXHQndHJ1c3QtYmFkZ2UnLFxuXHQndHdpdHRlcicsXG5cdCd2aXN1YWxseS1oaWRkZW4nLFxuXHQnd2VsY29tZWJveCdcbl07XG5cbi8vIFNlbGVjdG9ycyBmb3IgZm9vdG5vdGVzIGFuZCBjaXRhdGlvbnNcbmNvbnN0IEZPT1ROT1RFX0lOTElORV9SRUZFUkVOQ0VTID0gW1xuXHQnc3VwLnJlZmVyZW5jZScsXG5cdCdjaXRlLmx0eF9jaXRlJyxcblx0J3N1cFtpZF49XCJmbnJcIl0nLFxuXHQnc3VwW2lkXj1cImZucmVmOlwiXScsXG5cdCdzcGFuLmZvb3Rub3RlLWxpbmsnLFxuXHQnYS5jaXRhdGlvbicsXG5cdCdhW2lkXj1cInJlZi1saW5rXCJdJyxcblx0J2FbaHJlZl49XCIjZm5cIl0nLFxuXHQnYVtocmVmXj1cIiNjaXRlXCJdJyxcblx0J2FbaHJlZl49XCIjcmVmZXJlbmNlXCJdJyxcblx0J2FbaHJlZl49XCIjZm9vdG5vdGVcIl0nLFxuXHQnYVtocmVmXj1cIiNyXCJdJywgLy8gQ29tbW9uIGluIGFjYWRlbWljIHBhcGVyc1xuXHQnYVtocmVmXj1cIiNiXCJdJywgLy8gQ29tbW9uIGZvciBiaWJsaW9ncmFwaHkgcmVmZXJlbmNlc1xuXHQnYVtocmVmKj1cImNpdGVfbm90ZVwiXScsXG5cdCdhW2hyZWYqPVwiY2l0ZV9yZWZcIl0nLFxuXHQnYS5mb290bm90ZS1hbmNob3InLCAvLyBTdWJzdGFja1xuXHQnc3Bhbi5mb290bm90ZS1ob3ZlcmNhcmQtdGFyZ2V0IGEnLCAvLyBTdWJzdGFja1xuXHQnYVtyb2xlPVwiZG9jLWJpYmxpb3JlZlwiXScsIC8vIFNjaWVuY2Uub3JnXG5cdCdhW2lkXj1cImZucmVmXCJdJyxcblx0J2FbaWRePVwicmVmLWxpbmtcIl0nLCAvLyBOYXR1cmUuY29tXG5dLmpvaW4oJywnKTtcblxuY29uc3QgRk9PVE5PVEVfTElTVF9TRUxFQ1RPUlMgPSBbXG5cdCdkaXYuZm9vdG5vdGUgb2wnLFxuXHQnZGl2LmZvb3Rub3RlcyBvbCcsXG5cdCdkaXZbcm9sZT1cImRvYy1lbmRub3Rlc1wiXScsXG5cdCdkaXZbcm9sZT1cImRvYy1mb290bm90ZXNcIl0nLFxuXHQnb2wuZm9vdG5vdGVzLWxpc3QnLFxuXHQnb2wuZm9vdG5vdGVzJyxcblx0J29sLnJlZmVyZW5jZXMnLFxuXHQnb2xbY2xhc3MqPVwiYXJ0aWNsZS1yZWZlcmVuY2VzXCJdJyxcblx0J3NlY3Rpb24uZm9vdG5vdGVzIG9sJyxcblx0J3NlY3Rpb25bcm9sZT1cImRvYy1lbmRub3Rlc1wiXScsXG5cdCdzZWN0aW9uW3JvbGU9XCJkb2MtZm9vdG5vdGVzXCJdJyxcblx0J3NlY3Rpb25bcm9sZT1cImRvYy1iaWJsaW9ncmFwaHlcIl0nLFxuXHQndWwuZm9vdG5vdGVzLWxpc3QnLFxuXHQndWwubHR4X2JpYmxpc3QnLFxuXHQnZGl2LmZvb3Rub3RlW2RhdGEtY29tcG9uZW50LW5hbWU9XCJGb290bm90ZVRvRE9NXCJdJyAvLyBTdWJzdGFja1xuXS5qb2luKCcsJyk7XG5cbi8vIEVsZW1lbnRzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYmUgZW1wdHlcbi8vIFRoZXNlIGFyZSBub3QgcmVtb3ZlZCBldmVuIGlmIHRoZXkgaGF2ZSBubyBjb250ZW50XG5jb25zdCBBTExPV0VEX0VNUFRZX0VMRU1FTlRTID0gbmV3IFNldChbXG5cdCdhcmVhJyxcblx0J2F1ZGlvJyxcblx0J2Jhc2UnLFxuXHQnYnInLFxuXHQnY2lyY2xlJyxcblx0J2NvbCcsXG5cdCdkZWZzJyxcblx0J2VsbGlwc2UnLFxuXHQnZW1iZWQnLFxuXHQnZmlndXJlJyxcblx0J2cnLFxuXHQnaHInLFxuXHQnaWZyYW1lJyxcblx0J2ltZycsXG5cdCdpbnB1dCcsXG5cdCdsaW5lJyxcblx0J2xpbmsnLFxuXHQnbWFzaycsXG5cdCdtZXRhJyxcblx0J29iamVjdCcsXG5cdCdwYXJhbScsXG5cdCdwYXRoJyxcblx0J3BhdHRlcm4nLFxuXHQncGljdHVyZScsXG5cdCdwb2x5Z29uJyxcblx0J3BvbHlsaW5lJyxcblx0J3JlY3QnLFxuXHQnc291cmNlJyxcblx0J3N0b3AnLFxuXHQnc3ZnJyxcblx0J3RkJyxcblx0J3RoJyxcblx0J3RyYWNrJyxcblx0J3VzZScsXG5cdCd2aWRlbycsXG5cdCd3YnInXG5dKTtcblxuLy8gQXR0cmlidXRlcyB0byBrZWVwXG5jb25zdCBBTExPV0VEX0FUVFJJQlVURVMgPSBuZXcgU2V0KFtcblx0J2FsdCcsXG5cdCdhbGxvdycsXG5cdCdhbGxvd2Z1bGxzY3JlZW4nLFxuXHQnYXJpYS1sYWJlbCcsXG5cdCdjaGVja2VkJyxcblx0J2NvbHNwYW4nLFxuXHQnY29udHJvbHMnLFxuXHQnZGF0YS1zcmMnLFxuXHQnZGF0YS1zcmNzZXQnLFxuXHQnZGF0YS1sYW5nJyxcblx0J2RpcicsXG5cdCdmcmFtZWJvcmRlcicsXG5cdCdoZWFkZXJzJyxcblx0J2hlaWdodCcsXG5cdCdocmVmJyxcblx0J2xhbmcnLFxuXHQncm9sZScsXG5cdCdyb3dzcGFuJyxcblx0J3NyYycsXG5cdCdzcmNzZXQnLFxuXHQndGl0bGUnLFxuXHQndHlwZScsXG5cdCd3aWR0aCdcbl0pO1xuXG4vLyBTdXBwb3J0ZWQgbGFuZ3VhZ2VzIGZvciBjb2RlIGJsb2Nrc1xuY29uc3QgU1VQUE9SVEVEX0xBTkdVQUdFUyA9IG5ldyBTZXQoW1xuXHQvLyBNYXJrdXAgJiBXZWJcblx0J21hcmt1cCcsICdodG1sJywgJ3htbCcsICdzdmcnLCAnbWF0aG1sJywgJ3NzbWwnLCAnYXRvbScsICdyc3MnLFxuXHQnamF2YXNjcmlwdCcsICdqcycsICdqc3gnLCAndHlwZXNjcmlwdCcsICd0cycsICd0c3gnLFxuXHQnd2ViYXNzZW1ibHknLCAnd2FzbScsXG5cdFxuXHQvLyBDb21tb24gUHJvZ3JhbW1pbmcgTGFuZ3VhZ2VzXG5cdCdweXRob24nLFxuXHQnamF2YScsXG5cdCdjc2hhcnAnLCAnY3MnLCAnZG90bmV0JywgJ2FzcG5ldCcsXG5cdCdjcHAnLCAnYysrJywgJ2MnLCAnb2JqYycsXG5cdCdydWJ5JywgJ3JiJyxcblx0J3BocCcsXG5cdCdnb2xhbmcnLFxuXHQncnVzdCcsXG5cdCdzd2lmdCcsXG5cdCdrb3RsaW4nLFxuXHQnc2NhbGEnLFxuXHQnZGFydCcsXG5cdFxuXHQvLyBTaGVsbCAmIFNjcmlwdGluZ1xuXHQnYmFzaCcsICdzaGVsbCcsICdzaCcsXG5cdCdwb3dlcnNoZWxsJyxcblx0J2JhdGNoJyxcblx0XG5cdC8vIERhdGEgJiBDb25maWdcblx0J2pzb24nLCAnanNvbnAnLFxuXHQneWFtbCcsICd5bWwnLFxuXHQndG9tbCcsXG5cdCdkb2NrZXJmaWxlJyxcblx0J2dpdGlnbm9yZScsXG5cdFxuXHQvLyBRdWVyeSBMYW5ndWFnZXNcblx0J3NxbCcsICdteXNxbCcsICdwb3N0Z3Jlc3FsJyxcblx0J2dyYXBocWwnLFxuXHQnbW9uZ29kYicsXG5cdCdzcGFycWwnLFxuXHRcblx0Ly8gTWFya3VwICYgRG9jdW1lbnRhdGlvblxuXHQnbWFya2Rvd24nLCAnbWQnLFxuXHQnbGF0ZXgnLCAndGV4Jyxcblx0J2FzY2lpZG9jJywgJ2Fkb2MnLFxuXHQnanNkb2MnLFxuXHRcblx0Ly8gRnVuY3Rpb25hbCBMYW5ndWFnZXNcblx0J2hhc2tlbGwnLCAnaHMnLFxuXHQnZWxtJyxcblx0J2VsaXhpcicsXG5cdCdlcmxhbmcnLFxuXHQnb2NhbWwnLFxuXHQnZnNoYXJwJyxcblx0J3NjaGVtZScsXG5cdCdsaXNwJywgJ2VsaXNwJyxcblx0J2Nsb2p1cmUnLFxuXHRcblx0Ly8gT3RoZXIgTGFuZ3VhZ2VzXG5cdCdtYXRsYWInLFxuXHQnZm9ydHJhbicsXG5cdCdjb2JvbCcsXG5cdCdwYXNjYWwnLFxuXHQncGVybCcsXG5cdCdsdWEnLFxuXHQnanVsaWEnLFxuXHQnZ3Jvb3Z5Jyxcblx0J2NyeXN0YWwnLFxuXHQnbmltJyxcblx0J3ppZycsXG5cdFxuXHQvLyBEb21haW4gU3BlY2lmaWNcblx0J3JlZ2V4Jyxcblx0J2dyYWRsZScsXG5cdCdjbWFrZScsXG5cdCdtYWtlZmlsZScsXG5cdCduaXgnLFxuXHQndGVycmFmb3JtJyxcblx0J3NvbGlkaXR5Jyxcblx0J2dsc2wnLFxuXHQnaGxzbCcsXG5cdFxuXHQvLyBBc3NlbWJseVxuXHQnbmFzbScsXG5cdCdtYXNtJyxcblx0J2FybWFzbScsXG5cdFxuXHQvLyBHYW1lIERldmVsb3BtZW50XG5cdCdnZHNjcmlwdCcsXG5cdCd1bnJlYWxzY3JpcHQnLFxuXHRcblx0Ly8gT3RoZXJzXG5cdCdhYmFwJyxcblx0J2FjdGlvbnNjcmlwdCcsXG5cdCdhZGEnLFxuXHQnYWdkYScsXG5cdCdhbnRscjQnLFxuXHQnYXBwbGVzY3JpcHQnLFxuXHQnYXJkdWlubycsXG5cdCdjb2ZmZWVzY3JpcHQnLFxuXHQnZGphbmdvJyxcblx0J2VybGFuZycsXG5cdCdmb3J0cmFuJyxcblx0J2hheGUnLFxuXHQnaWRyaXMnLFxuXHQna290bGluJyxcblx0J2xpdmVzY3JpcHQnLFxuXHQnbWF0bGFiJyxcblx0J25naW54Jyxcblx0J3Bhc2NhbCcsXG5cdCdwcm9sb2cnLFxuXHQncHVwcGV0Jyxcblx0J3NjYWxhJyxcblx0J3NjaGVtZScsXG5cdCd0Y2wnLFxuXHQndmVyaWxvZycsXG5cdCd2aGRsJ1xuXSk7XG5cblxuLy8gRWxlbWVudCBzdGFuZGFyZGl6YXRpb24gcnVsZXNcbi8vIE1hcHMgc2VsZWN0b3JzIHRvIHRoZWlyIHRhcmdldCBIVE1MIGVsZW1lbnQgbmFtZVxuaW50ZXJmYWNlIFN0YW5kYXJkaXphdGlvblJ1bGUge1xuXHRzZWxlY3Rvcjogc3RyaW5nO1xuXHRlbGVtZW50OiBzdHJpbmc7XG5cdHRyYW5zZm9ybT86IChlbDogRWxlbWVudCkgPT4gRWxlbWVudDtcbn1cblxuY29uc3QgRUxFTUVOVF9TVEFOREFSRElaQVRJT05fUlVMRVM6IFN0YW5kYXJkaXphdGlvblJ1bGVbXSA9IFtcblx0Ly8gQ29kZSBibG9ja3Ncblx0e1xuXHRcdHNlbGVjdG9yOiAncHJlJyxcblx0XHRlbGVtZW50OiAncHJlJyxcblx0XHR0cmFuc2Zvcm06IChlbDogRWxlbWVudCk6IEVsZW1lbnQgPT4ge1xuXHRcdFx0aWYgKCEoZWwgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHJldHVybiBlbDtcblxuXHRcdFx0Ly8gRnVuY3Rpb24gdG8gZ2V0IGxhbmd1YWdlIGZyb20gY2xhc3Ncblx0XHRcdGNvbnN0IGdldExhbmd1YWdlRnJvbUNsYXNzID0gKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogc3RyaW5nID0+IHtcblx0XHRcdFx0Ly8gQ2hlY2sgZGF0YS1sYW5nIGF0dHJpYnV0ZSBmaXJzdFxuXHRcdFx0XHRjb25zdCBkYXRhTGFuZyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWxhbmcnKTtcblx0XHRcdFx0aWYgKGRhdGFMYW5nKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGFMYW5nLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBEZWZpbmUgbGFuZ3VhZ2UgcGF0dGVybnNcblx0XHRcdFx0Y29uc3QgbGFuZ3VhZ2VQYXR0ZXJucyA9IFtcblx0XHRcdFx0XHQvXmxhbmd1YWdlLShcXHcrKSQvLCAgICAgICAgICAvLyBsYW5ndWFnZS1qYXZhc2NyaXB0XG5cdFx0XHRcdFx0L15sYW5nLShcXHcrKSQvLCAgICAgICAgICAgICAgLy8gbGFuZy1qYXZhc2NyaXB0XG5cdFx0XHRcdFx0L14oXFx3KyktY29kZSQvLCAgICAgICAgICAgICAgLy8gamF2YXNjcmlwdC1jb2RlXG5cdFx0XHRcdFx0L15jb2RlLShcXHcrKSQvLCAgICAgICAgICAgICAgLy8gY29kZS1qYXZhc2NyaXB0XG5cdFx0XHRcdFx0L15zeW50YXgtKFxcdyspJC8sICAgICAgICAgICAgLy8gc3ludGF4LWphdmFzY3JpcHRcblx0XHRcdFx0XHQvXmNvZGUtc25pcHBldF9fKFxcdyspJC8sICAgICAvLyBjb2RlLXNuaXBwZXRfX2phdmFzY3JpcHRcblx0XHRcdFx0XHQvXmhpZ2hsaWdodC0oXFx3KykkLywgICAgICAgICAvLyBoaWdobGlnaHQtamF2YXNjcmlwdFxuXHRcdFx0XHRcdC9eKFxcdyspLXNuaXBwZXQkLyAgICAgICAgICAgIC8vIGphdmFzY3JpcHQtc25pcHBldFxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdC8vIFRoZW4gY2hlY2sgdGhlIGNsYXNzIGF0dHJpYnV0ZSBmb3IgcGF0dGVybnNcblx0XHRcdFx0aWYgKGVsZW1lbnQuY2xhc3NOYW1lICYmIHR5cGVvZiBlbGVtZW50LmNsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHBhdHRlcm4gb2YgbGFuZ3VhZ2VQYXR0ZXJucykge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBlbGVtZW50LmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpLm1hdGNoKHBhdHRlcm4pO1xuXHRcdFx0XHRcdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBUaGVuIGNoZWNrIGZvciBzdXBwb3J0ZWQgbGFuZ3VhZ2Vcblx0XHRcdFx0XHRpZiAoU1VQUE9SVEVEX0xBTkdVQUdFUy5oYXMoZWxlbWVudC5jbGFzc05hbWUudG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtZW50LmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGNsYXNzTmFtZXMgPSBBcnJheS5mcm9tKGVsZW1lbnQuY2xhc3NMaXN0KTtcblx0XHRcdFx0XG5cdFx0XHRcdGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGNsYXNzTmFtZXMpIHtcblx0XHRcdFx0XHQvLyBDaGVjayBwYXR0ZXJucyBmaXJzdFxuXHRcdFx0XHRcdGZvciAoY29uc3QgcGF0dGVybiBvZiBsYW5ndWFnZVBhdHRlcm5zKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtYXRjaCA9IGNsYXNzTmFtZS5tYXRjaChwYXR0ZXJuKTtcblx0XHRcdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBPbmx5IGNoZWNrIGJhcmUgbGFuZ3VhZ2UgbmFtZXMgaWYgbm8gcGF0dGVybnMgd2VyZSBmb3VuZFxuXHRcdFx0XHRmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBjbGFzc05hbWVzKSB7XG5cdFx0XHRcdFx0aWYgKFNVUFBPUlRFRF9MQU5HVUFHRVMuaGFzKGNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdH07XG5cblx0XHRcdC8vIFRyeSB0byBnZXQgdGhlIGxhbmd1YWdlIGZyb20gdGhlIGVsZW1lbnQgYW5kIGl0cyBhbmNlc3RvcnNcblx0XHRcdGxldCBsYW5ndWFnZSA9ICcnO1xuXHRcdFx0bGV0IGN1cnJlbnRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBlbDtcblx0XHRcdFxuXHRcdFx0d2hpbGUgKGN1cnJlbnRFbGVtZW50ICYmICFsYW5ndWFnZSkge1xuXHRcdFx0XHRsYW5ndWFnZSA9IGdldExhbmd1YWdlRnJvbUNsYXNzKGN1cnJlbnRFbGVtZW50KTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIEFsc28gY2hlY2sgZm9yIGNvZGUgZWxlbWVudHMgd2l0aGluIHRoZSBjdXJyZW50IGVsZW1lbnRcblx0XHRcdFx0aWYgKCFsYW5ndWFnZSAmJiBjdXJyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKCdjb2RlJykpIHtcblx0XHRcdFx0XHRsYW5ndWFnZSA9IGdldExhbmd1YWdlRnJvbUNsYXNzKGN1cnJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2NvZGUnKSEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEZ1bmN0aW9uIHRvIHJlY3Vyc2l2ZWx5IGV4dHJhY3QgdGV4dCBjb250ZW50IHdoaWxlIHByZXNlcnZpbmcgc3RydWN0dXJlXG5cdFx0XHRjb25zdCBleHRyYWN0U3RydWN0dXJlZFRleHQgPSAoZWxlbWVudDogTm9kZSk6IHN0cmluZyA9PiB7XG5cdFx0XHRcdGlmIChlbGVtZW50Lm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuXHRcdFx0XHRcdHJldHVybiBlbGVtZW50LnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRsZXQgdGV4dCA9ICcnO1xuXHRcdFx0XHRpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG5cdFx0XHRcdFx0Ly8gSGFuZGxlIGxpbmUgYnJlYWtzXG5cdFx0XHRcdFx0aWYgKGVsZW1lbnQudGFnTmFtZSA9PT0gJ0JSJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuICdcXG4nO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvLyBIYW5kbGUgY29kZSBlbGVtZW50cyBhbmQgdGhlaXIgY2hpbGRyZW5cblx0XHRcdFx0XHRlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaChjaGlsZCA9PiB7XG5cdFx0XHRcdFx0XHR0ZXh0ICs9IGV4dHJhY3RTdHJ1Y3R1cmVkVGV4dChjaGlsZCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly8gQWRkIG5ld2xpbmUgYWZ0ZXIgZWFjaCBjb2RlIGVsZW1lbnRcblx0XHRcdFx0XHRpZiAoZWxlbWVudC50YWdOYW1lID09PSAnQ09ERScpIHtcblx0XHRcdFx0XHRcdHRleHQgKz0gJ1xcbic7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB0ZXh0O1xuXHRcdFx0fTtcblxuXHRcdFx0Ly8gRXh0cmFjdCBhbGwgdGV4dCBjb250ZW50XG5cdFx0XHRsZXQgY29kZUNvbnRlbnQgPSBleHRyYWN0U3RydWN0dXJlZFRleHQoZWwpO1xuXG5cdFx0XHQvLyBDbGVhbiB1cCB0aGUgY29udGVudFxuXHRcdFx0Y29kZUNvbnRlbnQgPSBjb2RlQ29udGVudFxuXHRcdFx0XHQvLyBSZW1vdmUgYW55IGV4dHJhIG5ld2xpbmVzIGF0IHRoZSBzdGFydFxuXHRcdFx0XHQucmVwbGFjZSgvXlxcbisvLCAnJylcblx0XHRcdFx0Ly8gUmVtb3ZlIGFueSBleHRyYSBuZXdsaW5lcyBhdCB0aGUgZW5kXG5cdFx0XHRcdC5yZXBsYWNlKC9cXG4rJC8sICcnKVxuXHRcdFx0XHQvLyBSZXBsYWNlIG11bHRpcGxlIGNvbnNlY3V0aXZlIG5ld2xpbmVzIHdpdGggYSBzaW5nbGUgbmV3bGluZVxuXHRcdFx0XHQucmVwbGFjZSgvXFxuezMsfS9nLCAnXFxuXFxuJyk7XG5cblx0XHRcdC8vIENyZWF0ZSBuZXcgcHJlIGVsZW1lbnRcblx0XHRcdGNvbnN0IG5ld1ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuXHRcdFx0XG5cdFx0XHQvLyBDb3B5IGFsbG93ZWQgYXR0cmlidXRlc1xuXHRcdFx0QXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKS5mb3JFYWNoKGF0dHIgPT4ge1xuXHRcdFx0XHRpZiAoQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyLm5hbWUpKSB7XG5cdFx0XHRcdFx0bmV3UHJlLnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gQ3JlYXRlIGNvZGUgZWxlbWVudFxuXHRcdFx0Y29uc3QgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcblx0XHRcdGlmIChsYW5ndWFnZSkge1xuXHRcdFx0XHRjb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1sYW5nJywgbGFuZ3VhZ2UpO1xuXHRcdFx0XHRjb2RlLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBgbGFuZ3VhZ2UtJHtsYW5ndWFnZX1gKTtcblx0XHRcdH1cblx0XHRcdGNvZGUudGV4dENvbnRlbnQgPSBjb2RlQ29udGVudDtcblx0XHRcdFxuXHRcdFx0bmV3UHJlLmFwcGVuZENoaWxkKGNvZGUpO1xuXHRcdFx0cmV0dXJuIG5ld1ByZTtcblx0XHR9XG5cdH0sXG5cdC8vIFNpbXBsaWZ5IGhlYWRpbmdzIGJ5IHJlbW92aW5nIGludGVybmFsIG5hdmlnYXRpb24gZWxlbWVudHNcblx0e1xuXHRcdHNlbGVjdG9yOiAnaDEsIGgyLCBoMywgaDQsIGg1LCBoNicsXG5cdFx0ZWxlbWVudDogJ2tlZXAnLFxuXHRcdHRyYW5zZm9ybTogKGVsOiBFbGVtZW50KTogRWxlbWVudCA9PiB7XG5cdFx0XHQvLyBJZiBoZWFkaW5nIG9ubHkgY29udGFpbnMgYSBzaW5nbGUgYW5jaG9yIHdpdGggaW50ZXJuYWwgbGlua1xuXHRcdFx0aWYgKGVsLmNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiBcblx0XHRcdFx0ZWwuZmlyc3RFbGVtZW50Q2hpbGQ/LnRhZ05hbWUgPT09ICdBJyAmJlxuXHRcdFx0XHQoZWwuZmlyc3RFbGVtZW50Q2hpbGQuZ2V0QXR0cmlidXRlKCdocmVmJyk/LmluY2x1ZGVzKCcjJykgfHwgXG5cdFx0XHRcdCBlbC5maXJzdEVsZW1lbnRDaGlsZC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKT8uc3RhcnRzV2l0aCgnIycpKSkge1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gQ3JlYXRlIG5ldyBoZWFkaW5nIG9mIHNhbWUgbGV2ZWxcblx0XHRcdFx0Y29uc3QgbmV3SGVhZGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWwudGFnTmFtZSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBDb3B5IGFsbG93ZWQgYXR0cmlidXRlcyBmcm9tIG9yaWdpbmFsIGhlYWRpbmdcblx0XHRcdFx0QXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKS5mb3JFYWNoKGF0dHIgPT4ge1xuXHRcdFx0XHRcdGlmIChBTExPV0VEX0FUVFJJQlVURVMuaGFzKGF0dHIubmFtZSkpIHtcblx0XHRcdFx0XHRcdG5ld0hlYWRpbmcuc2V0QXR0cmlidXRlKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIEp1c3QgdXNlIHRoZSB0ZXh0IGNvbnRlbnRcblx0XHRcdFx0bmV3SGVhZGluZy50ZXh0Q29udGVudCA9IGVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gbmV3SGVhZGluZztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gSWYgaGVhZGluZyBjb250YWlucyBuYXZpZ2F0aW9uIGJ1dHRvbnMgb3Igb3RoZXIgdXRpbGl0eSBlbGVtZW50c1xuXHRcdFx0Y29uc3QgYnV0dG9ucyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbicpO1xuXHRcdFx0aWYgKGJ1dHRvbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRjb25zdCBuZXdIZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbC50YWdOYW1lKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vIENvcHkgYWxsb3dlZCBhdHRyaWJ1dGVzXG5cdFx0XHRcdEFycmF5LmZyb20oZWwuYXR0cmlidXRlcykuZm9yRWFjaChhdHRyID0+IHtcblx0XHRcdFx0XHRpZiAoQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyLm5hbWUpKSB7XG5cdFx0XHRcdFx0XHRuZXdIZWFkaW5nLnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBKdXN0IHVzZSB0aGUgdGV4dCBjb250ZW50XG5cdFx0XHRcdG5ld0hlYWRpbmcudGV4dENvbnRlbnQgPSBlbC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuXHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIG5ld0hlYWRpbmc7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBlbDtcblx0XHR9XG5cdH0sXG5cdC8vIENvbnZlcnQgZGl2cyB3aXRoIHBhcmFncmFwaCByb2xlIHRvIGFjdHVhbCBwYXJhZ3JhcGhzXG5cdHsgXG5cdFx0c2VsZWN0b3I6ICdkaXZbZGF0YS10ZXN0aWRePVwicGFyYWdyYXBoXCJdLCBkaXZbcm9sZT1cInBhcmFncmFwaFwiXScsIFxuXHRcdGVsZW1lbnQ6ICdwJyxcblx0XHR0cmFuc2Zvcm06IChlbDogRWxlbWVudCk6IEVsZW1lbnQgPT4ge1xuXHRcdFx0Y29uc3QgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdFxuXHRcdFx0Ly8gQ29weSBpbm5lckhUTUxcblx0XHRcdHAuaW5uZXJIVE1MID0gZWwuaW5uZXJIVE1MO1xuXHRcdFx0XG5cdFx0XHQvLyBDb3B5IGFsbG93ZWQgYXR0cmlidXRlc1xuXHRcdFx0QXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKS5mb3JFYWNoKGF0dHIgPT4ge1xuXHRcdFx0XHRpZiAoQUxMT1dFRF9BVFRSSUJVVEVTLmhhcyhhdHRyLm5hbWUpKSB7XG5cdFx0XHRcdFx0cC5zZXRBdHRyaWJ1dGUoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdHJldHVybiBwO1xuXHRcdH1cblx0fSxcblx0Ly8gQ29udmVydCBkaXZzIHdpdGggbGlzdCByb2xlcyB0byBhY3R1YWwgbGlzdHNcblx0eyBcblx0XHRzZWxlY3RvcjogJ2Rpdltyb2xlPVwibGlzdFwiXScsIFxuXHRcdGVsZW1lbnQ6ICd1bCcsXG5cdFx0Ly8gQ3VzdG9tIGhhbmRsZXIgZm9yIGxpc3QgdHlwZSBkZXRlY3Rpb24gYW5kIHRyYW5zZm9ybWF0aW9uXG5cdFx0dHJhbnNmb3JtOiAoZWw6IEVsZW1lbnQpOiBFbGVtZW50ID0+IHtcblx0XHRcdC8vIEZpcnN0IGRldGVybWluZSBpZiB0aGlzIGlzIGFuIG9yZGVyZWQgbGlzdFxuXHRcdFx0Y29uc3QgZmlyc3RJdGVtID0gZWwucXVlcnlTZWxlY3RvcignZGl2W3JvbGU9XCJsaXN0aXRlbVwiXSAubGFiZWwnKTtcblx0XHRcdGNvbnN0IGxhYmVsID0gZmlyc3RJdGVtPy50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuXHRcdFx0Y29uc3QgaXNPcmRlcmVkID0gbGFiZWwubWF0Y2goL15cXGQrXFwpLyk7XG5cdFx0XHRcblx0XHRcdC8vIENyZWF0ZSB0aGUgYXBwcm9wcmlhdGUgbGlzdCB0eXBlXG5cdFx0XHRjb25zdCBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChpc09yZGVyZWQgPyAnb2wnIDogJ3VsJyk7XG5cdFx0XHRcblx0XHRcdC8vIFByb2Nlc3MgZWFjaCBsaXN0IGl0ZW1cblx0XHRcdGNvbnN0IGl0ZW1zID0gZWwucXVlcnlTZWxlY3RvckFsbCgnZGl2W3JvbGU9XCJsaXN0aXRlbVwiXScpO1xuXHRcdFx0aXRlbXMuZm9yRWFjaChpdGVtID0+IHtcblx0XHRcdFx0Y29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXHRcdFx0XHRjb25zdCBjb250ZW50ID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuY29udGVudCcpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGNvbnRlbnQpIHtcblx0XHRcdFx0XHQvLyBDb252ZXJ0IGFueSBwYXJhZ3JhcGggZGl2cyBpbnNpZGUgY29udGVudFxuXHRcdFx0XHRcdGNvbnN0IHBhcmFncmFwaERpdnMgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdltyb2xlPVwicGFyYWdyYXBoXCJdJyk7XG5cdFx0XHRcdFx0cGFyYWdyYXBoRGl2cy5mb3JFYWNoKGRpdiA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdFx0XHRcdFx0cC5pbm5lckhUTUwgPSBkaXYuaW5uZXJIVE1MO1xuXHRcdFx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKHApO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIENvbnZlcnQgYW55IG5lc3RlZCBsaXN0cyByZWN1cnNpdmVseVxuXHRcdFx0XHRcdGNvbnN0IG5lc3RlZExpc3RzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCdkaXZbcm9sZT1cImxpc3RcIl0nKTtcblx0XHRcdFx0XHRuZXN0ZWRMaXN0cy5mb3JFYWNoKG5lc3RlZExpc3QgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgZmlyc3ROZXN0ZWRJdGVtID0gbmVzdGVkTGlzdC5xdWVyeVNlbGVjdG9yKCdkaXZbcm9sZT1cImxpc3RpdGVtXCJdIC5sYWJlbCcpO1xuXHRcdFx0XHRcdFx0Y29uc3QgbmVzdGVkTGFiZWwgPSBmaXJzdE5lc3RlZEl0ZW0/LnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG5cdFx0XHRcdFx0XHRjb25zdCBpc05lc3RlZE9yZGVyZWQgPSBuZXN0ZWRMYWJlbC5tYXRjaCgvXlxcZCtcXCkvKTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0Y29uc3QgbmV3TmVzdGVkTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaXNOZXN0ZWRPcmRlcmVkID8gJ29sJyA6ICd1bCcpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHQvLyBQcm9jZXNzIG5lc3RlZCBpdGVtc1xuXHRcdFx0XHRcdFx0Y29uc3QgbmVzdGVkSXRlbXMgPSBuZXN0ZWRMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJ2Rpdltyb2xlPVwibGlzdGl0ZW1cIl0nKTtcblx0XHRcdFx0XHRcdG5lc3RlZEl0ZW1zLmZvckVhY2gobmVzdGVkSXRlbSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG5lc3RlZExpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbmVzdGVkQ29udGVudCA9IG5lc3RlZEl0ZW0ucXVlcnlTZWxlY3RvcignLmNvbnRlbnQnKTtcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGlmIChuZXN0ZWRDb250ZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gQ29udmVydCBwYXJhZ3JhcGggZGl2cyBpbiBuZXN0ZWQgaXRlbXNcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBuZXN0ZWRQYXJhZ3JhcGhzID0gbmVzdGVkQ29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCdkaXZbcm9sZT1cInBhcmFncmFwaFwiXScpO1xuXHRcdFx0XHRcdFx0XHRcdG5lc3RlZFBhcmFncmFwaHMuZm9yRWFjaChkaXYgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdFx0XHRcdFx0XHRcdHAuaW5uZXJIVE1MID0gZGl2LmlubmVySFRNTDtcblx0XHRcdFx0XHRcdFx0XHRcdGRpdi5yZXBsYWNlV2l0aChwKTtcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRuZXN0ZWRMaS5pbm5lckhUTUwgPSBuZXN0ZWRDb250ZW50LmlubmVySFRNTDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0bmV3TmVzdGVkTGlzdC5hcHBlbmRDaGlsZChuZXN0ZWRMaSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0bmVzdGVkTGlzdC5yZXBsYWNlV2l0aChuZXdOZXN0ZWRMaXN0KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRsaS5pbm5lckhUTUwgPSBjb250ZW50LmlubmVySFRNTDtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0bGlzdC5hcHBlbmRDaGlsZChsaSk7XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0cmV0dXJuIGxpc3Q7XG5cdFx0fVxuXHR9LFxuXHR7IFxuXHRcdHNlbGVjdG9yOiAnZGl2W3JvbGU9XCJsaXN0aXRlbVwiXScsIFxuXHRcdGVsZW1lbnQ6ICdsaScsXG5cdFx0Ly8gQ3VzdG9tIGhhbmRsZXIgZm9yIGxpc3QgaXRlbSBjb250ZW50XG5cdFx0dHJhbnNmb3JtOiAoZWw6IEVsZW1lbnQpOiBFbGVtZW50ID0+IHtcblx0XHRcdGNvbnN0IGNvbnRlbnQgPSBlbC5xdWVyeVNlbGVjdG9yKCcuY29udGVudCcpO1xuXHRcdFx0aWYgKCFjb250ZW50KSByZXR1cm4gZWw7XG5cdFx0XHRcblx0XHRcdC8vIENvbnZlcnQgYW55IHBhcmFncmFwaCBkaXZzIGluc2lkZSBjb250ZW50XG5cdFx0XHRjb25zdCBwYXJhZ3JhcGhEaXZzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKCdkaXZbcm9sZT1cInBhcmFncmFwaFwiXScpO1xuXHRcdFx0cGFyYWdyYXBoRGl2cy5mb3JFYWNoKGRpdiA9PiB7XG5cdFx0XHRcdGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cdFx0XHRcdHAuaW5uZXJIVE1MID0gZGl2LmlubmVySFRNTDtcblx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKHApO1xuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdHJldHVybiBjb250ZW50O1xuXHRcdH1cblx0fSxcblx0Ly8gQ29kZSBibG9ja3Mgd2l0aCBzeW50YXggaGlnaGxpZ2h0aW5nXG5cdHtcblx0XHRzZWxlY3RvcjogJy53cC1ibG9jay1zeW50YXhoaWdobGlnaHRlci1jb2RlLCAuc3ludGF4aGlnaGxpZ2h0ZXIsIC5oaWdobGlnaHQsIC5oaWdobGlnaHQtc291cmNlLCAud3AtYmxvY2stY29kZSwgcHJlW2NsYXNzKj1cImxhbmd1YWdlLVwiXSwgcHJlW2NsYXNzKj1cImJydXNoOlwiXScsXG5cdFx0ZWxlbWVudDogJ3ByZScsXG5cdFx0dHJhbnNmb3JtOiAoZWw6IEVsZW1lbnQpOiBFbGVtZW50ID0+IHtcblx0XHRcdGlmICghKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm4gZWw7XG5cblx0XHRcdC8vIENyZWF0ZSBuZXcgcHJlIGVsZW1lbnRcblx0XHRcdGNvbnN0IG5ld1ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ByZScpO1xuXHRcdFx0XG5cdFx0XHQvLyBUcnkgdG8gZGV0ZWN0IGxhbmd1YWdlXG5cdFx0XHRsZXQgbGFuZ3VhZ2UgPSAnJztcblx0XHRcdFxuXHRcdFx0Ly8gQ2hlY2sgZm9yIFdvcmRQcmVzcyBzeW50YXggaGlnaGxpZ2h0ZXIgc3BlY2lmaWMgZm9ybWF0XG5cdFx0XHRjb25zdCBzeW50YXhFbCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJy5zeW50YXhoaWdobGlnaHRlcicpO1xuXHRcdFx0aWYgKHN5bnRheEVsKSB7XG5cdFx0XHRcdC8vIEdldCBsYW5ndWFnZSBmcm9tIHN5bnRheGhpZ2hsaWdodGVyIGNsYXNzXG5cdFx0XHRcdGNvbnN0IGNsYXNzZXMgPSBBcnJheS5mcm9tKHN5bnRheEVsLmNsYXNzTGlzdCk7XG5cdFx0XHRcdGNvbnN0IGxhbmdDbGFzcyA9IGNsYXNzZXMuZmluZChjID0+ICFbJ3N5bnRheGhpZ2hsaWdodGVyJywgJ25vZ3V0dGVyJ10uaW5jbHVkZXMoYykpO1xuXHRcdFx0XHRpZiAobGFuZ0NsYXNzICYmIFNVUFBPUlRFRF9MQU5HVUFHRVMuaGFzKGxhbmdDbGFzcy50b0xvd2VyQ2FzZSgpKSkge1xuXHRcdFx0XHRcdGxhbmd1YWdlID0gbGFuZ0NsYXNzLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgbm8gbGFuZ3VhZ2UgZm91bmQgeWV0LCBjaGVjayBvdGhlciBjb21tb24gcGF0dGVybnNcblx0XHRcdGlmICghbGFuZ3VhZ2UpIHtcblx0XHRcdFx0Y29uc3QgY2xhc3NOYW1lcyA9IEFycmF5LmZyb20oZWwuY2xhc3NMaXN0KTtcblx0XHRcdFx0Y29uc3QgbGFuZ3VhZ2VQYXR0ZXJucyA9IFtcblx0XHRcdFx0XHQvKD86XnxcXHMpKD86bGFuZ3VhZ2V8bGFuZ3xicnVzaHxzeW50YXgpLShcXHcrKSg/Olxcc3wkKS9pLFxuXHRcdFx0XHRcdC8oPzpefFxccykoXFx3KykoPzpcXHN8JCkvaVxuXHRcdFx0XHRdO1xuXG5cdFx0XHRcdGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGNsYXNzTmFtZXMpIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHBhdHRlcm4gb2YgbGFuZ3VhZ2VQYXR0ZXJucykge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBjbGFzc05hbWUubWF0Y2gocGF0dGVybik7XG5cdFx0XHRcdFx0XHRpZiAobWF0Y2ggJiYgbWF0Y2hbMV0gJiYgU1VQUE9SVEVEX0xBTkdVQUdFUy5oYXMobWF0Y2hbMV0udG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHRcdFx0bGFuZ3VhZ2UgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGxhbmd1YWdlKSBicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBFeHRyYWN0IGNvZGUgY29udGVudCwgaGFuZGxpbmcgdmFyaW91cyBmb3JtYXRzXG5cdFx0XHRsZXQgY29kZUNvbnRlbnQgPSAnJztcblxuXHRcdFx0Ly8gSGFuZGxlIFdvcmRQcmVzcyBzeW50YXggaGlnaGxpZ2h0ZXIgdGFibGUgZm9ybWF0XG5cdFx0XHRjb25zdCBjb2RlQ29udGFpbmVyID0gZWwucXVlcnlTZWxlY3RvcignLnN5bnRheGhpZ2hsaWdodGVyIHRhYmxlIC5jb2RlIC5jb250YWluZXInKTtcblx0XHRcdGlmIChjb2RlQ29udGFpbmVyKSB7XG5cdFx0XHRcdC8vIFByb2Nlc3MgZWFjaCBsaW5lXG5cdFx0XHRcdGNvbnN0IGxpbmVzID0gQXJyYXkuZnJvbShjb2RlQ29udGFpbmVyLmNoaWxkcmVuKTtcblx0XHRcdFx0Y29kZUNvbnRlbnQgPSBsaW5lc1xuXHRcdFx0XHRcdC5tYXAobGluZSA9PiB7XG5cdFx0XHRcdFx0XHQvLyBHZXQgYWxsIGNvZGUgZWxlbWVudHMgaW4gdGhpcyBsaW5lXG5cdFx0XHRcdFx0XHRjb25zdCBjb2RlUGFydHMgPSBBcnJheS5mcm9tKGxpbmUucXVlcnlTZWxlY3RvckFsbCgnY29kZScpKVxuXHRcdFx0XHRcdFx0XHQubWFwKGNvZGUgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdC8vIEdldCB0aGUgdGV4dCBjb250ZW50LCBwcmVzZXJ2aW5nIHNwYWNlc1xuXHRcdFx0XHRcdFx0XHRcdGxldCB0ZXh0ID0gY29kZS50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0XHRcdFx0XHQvLyBJZiB0aGlzIGlzIGEgJ3NwYWNlcycgY2xhc3MgZWxlbWVudCwgY29udmVydCB0byBhY3R1YWwgc3BhY2VzXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGNvZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdzcGFjZXMnKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGV4dCA9ICcgJy5yZXBlYXQodGV4dC5sZW5ndGgpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gdGV4dDtcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0LmpvaW4oJycpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGNvZGVQYXJ0cyB8fCBsaW5lLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmpvaW4oJ1xcbicpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gSGFuZGxlIFdvcmRQcmVzcyBzeW50YXggaGlnaGxpZ2h0ZXIgbm9uLXRhYmxlIGZvcm1hdFxuXHRcdFx0XHRjb25zdCBjb2RlTGluZXMgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKCcuY29kZSAubGluZScpO1xuXHRcdFx0XHRpZiAoY29kZUxpbmVzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRjb2RlQ29udGVudCA9IEFycmF5LmZyb20oY29kZUxpbmVzKVxuXHRcdFx0XHRcdFx0Lm1hcChsaW5lID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgY29kZVBhcnRzID0gQXJyYXkuZnJvbShsaW5lLnF1ZXJ5U2VsZWN0b3JBbGwoJ2NvZGUnKSlcblx0XHRcdFx0XHRcdFx0XHQubWFwKGNvZGUgPT4gY29kZS50ZXh0Q29udGVudCB8fCAnJylcblx0XHRcdFx0XHRcdFx0XHQuam9pbignJyk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBjb2RlUGFydHMgfHwgbGluZS50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuam9pbignXFxuJyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gRmFsbGJhY2sgdG8gcmVndWxhciB0ZXh0IGNvbnRlbnRcblx0XHRcdFx0XHRjb2RlQ29udGVudCA9IGVsLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIENsZWFuIHVwIHRoZSBjb250ZW50XG5cdFx0XHRjb2RlQ29udGVudCA9IGNvZGVDb250ZW50XG5cdFx0XHRcdC5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJykgLy8gVHJpbSBzdGFydC9lbmQgd2hpdGVzcGFjZVxuXHRcdFx0XHQucmVwbGFjZSgvXFx0L2csICcgICAgJykgLy8gQ29udmVydCB0YWJzIHRvIHNwYWNlc1xuXHRcdFx0XHQucmVwbGFjZSgvXFxuezMsfS9nLCAnXFxuXFxuJykgLy8gTm9ybWFsaXplIG11bHRpcGxlIG5ld2xpbmVzXG5cdFx0XHRcdC5yZXBsYWNlKC9cXHUwMGEwL2csICcgJyk7IC8vIFJlcGxhY2Ugbm9uLWJyZWFraW5nIHNwYWNlcyB3aXRoIHJlZ3VsYXIgc3BhY2VzXG5cblx0XHRcdC8vIENyZWF0ZSBjb2RlIGVsZW1lbnQgd2l0aCBsYW5ndWFnZSBjbGFzcyBpZiBkZXRlY3RlZFxuXHRcdFx0Y29uc3QgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NvZGUnKTtcblx0XHRcdGlmIChsYW5ndWFnZSkge1xuXHRcdFx0XHRjb2RlLnNldEF0dHJpYnV0ZSgnZGF0YS1sYW5nJywgbGFuZ3VhZ2UpO1xuXHRcdFx0XHRjb2RlLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBgbGFuZ3VhZ2UtJHtsYW5ndWFnZX1gKTtcblx0XHRcdH1cblx0XHRcdGNvZGUudGV4dENvbnRlbnQgPSBjb2RlQ29udGVudDtcblx0XHRcdFxuXHRcdFx0bmV3UHJlLmFwcGVuZENoaWxkKGNvZGUpO1xuXHRcdFx0cmV0dXJuIG5ld1ByZTtcblx0XHR9XG5cdH1cbl07XG5cbmludGVyZmFjZSBGb290bm90ZURhdGEge1xuXHRjb250ZW50OiBFbGVtZW50IHwgc3RyaW5nO1xuXHRvcmlnaW5hbElkOiBzdHJpbmc7XG5cdHJlZnM6IHN0cmluZ1tdO1xufVxuXG5pbnRlcmZhY2UgRm9vdG5vdGVDb2xsZWN0aW9uIHtcblx0W2Zvb3Rub3RlTnVtYmVyOiBudW1iZXJdOiBGb290bm90ZURhdGE7XG59XG5cbmludGVyZmFjZSBDb250ZW50U2NvcmUge1xuXHRzY29yZTogbnVtYmVyO1xuXHRlbGVtZW50OiBFbGVtZW50O1xufVxuXG5pbnRlcmZhY2UgU3R5bGVDaGFuZ2Uge1xuXHRzZWxlY3Rvcjogc3RyaW5nO1xuXHRzdHlsZXM6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIERlZnVkZGxlIHtcblx0cHJpdmF0ZSBkb2M6IERvY3VtZW50O1xuXHRwcml2YXRlIG9wdGlvbnM6IERlZnVkZGxlT3B0aW9ucztcblx0cHJpdmF0ZSBkZWJ1ZzogYm9vbGVhbjtcblxuXHQvKipcblx0ICogQ3JlYXRlIGEgbmV3IERlZnVkZGxlIGluc3RhbmNlXG5cdCAqIEBwYXJhbSBkb2MgLSBUaGUgZG9jdW1lbnQgdG8gcGFyc2Vcblx0ICogQHBhcmFtIG9wdGlvbnMgLSBPcHRpb25zIGZvciBwYXJzaW5nXG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcihkb2M6IERvY3VtZW50LCBvcHRpb25zOiBEZWZ1ZGRsZU9wdGlvbnMgPSB7fSkge1xuXHRcdHRoaXMuZG9jID0gZG9jO1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0dGhpcy5kZWJ1ZyA9IG9wdGlvbnMuZGVidWcgfHwgZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogUGFyc2UgdGhlIGRvY3VtZW50IGFuZCBleHRyYWN0IGl0cyBtYWluIGNvbnRlbnRcblx0ICovXG5cdHBhcnNlKCk6IERlZnVkZGxlUmVzcG9uc2Uge1xuXHRcdGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG5cdFx0Ly8gRXh0cmFjdCBtZXRhZGF0YSBmaXJzdCBzaW5jZSB3ZSdsbCBuZWVkIGl0IGluIG11bHRpcGxlIHBsYWNlc1xuXHRcdGNvbnN0IHNjaGVtYU9yZ0RhdGEgPSBNZXRhZGF0YUV4dHJhY3Rvci5leHRyYWN0U2NoZW1hT3JnRGF0YSh0aGlzLmRvYyk7XG5cdFx0Y29uc3QgbWV0YWRhdGEgPSBNZXRhZGF0YUV4dHJhY3Rvci5leHRyYWN0KHRoaXMuZG9jLCBzY2hlbWFPcmdEYXRhKTtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBFdmFsdWF0ZSBzdHlsZXMgYW5kIHNpemVzIG9uIG9yaWdpbmFsIGRvY3VtZW50XG5cdFx0XHRjb25zdCBtb2JpbGVTdHlsZXMgPSB0aGlzLl9ldmFsdWF0ZU1lZGlhUXVlcmllcyh0aGlzLmRvYyk7XG5cdFx0XHRcblx0XHRcdC8vIENoZWNrIGZvciBzbWFsbCBpbWFnZXMgaW4gb3JpZ2luYWwgZG9jdW1lbnQsIGV4Y2x1ZGluZyBsYXp5LWxvYWRlZCBvbmVzXG5cdFx0XHRjb25zdCBzbWFsbEltYWdlcyA9IHRoaXMuZmluZFNtYWxsSW1hZ2VzKHRoaXMuZG9jKTtcblx0XHRcdFxuXHRcdFx0Ly8gQ2xvbmUgZG9jdW1lbnRcblx0XHRcdGNvbnN0IGNsb25lID0gdGhpcy5kb2MuY2xvbmVOb2RlKHRydWUpIGFzIERvY3VtZW50O1xuXHRcdFx0XG5cdFx0XHQvLyBBcHBseSBtb2JpbGUgc3R5bGUgdG8gY2xvbmVcblx0XHRcdHRoaXMuYXBwbHlNb2JpbGVTdHlsZXMoY2xvbmUsIG1vYmlsZVN0eWxlcyk7XG5cblx0XHRcdC8vIEZpbmQgbWFpbiBjb250ZW50XG5cdFx0XHRjb25zdCBtYWluQ29udGVudCA9IHRoaXMuZmluZE1haW5Db250ZW50KGNsb25lKTtcblx0XHRcdGlmICghbWFpbkNvbnRlbnQpIHtcblx0XHRcdFx0Y29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGNvbnRlbnQ6IHRoaXMuZG9jLmJvZHkuaW5uZXJIVE1MLFxuXHRcdFx0XHRcdC4uLm1ldGFkYXRhLFxuXHRcdFx0XHRcdHdvcmRDb3VudDogdGhpcy5jb3VudFdvcmRzKHRoaXMuZG9jLmJvZHkuaW5uZXJIVE1MKSxcblx0XHRcdFx0XHRwYXJzZVRpbWU6IE1hdGgucm91bmQoZW5kVGltZSAtIHN0YXJ0VGltZSlcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmVtb3ZlIHNtYWxsIGltYWdlcyBpZGVudGlmaWVkIGZyb20gb3JpZ2luYWwgZG9jdW1lbnRcblx0XHRcdHRoaXMucmVtb3ZlU21hbGxJbWFnZXMoY2xvbmUsIHNtYWxsSW1hZ2VzKTtcblx0XHRcdFxuXHRcdFx0Ly8gUGVyZm9ybSBvdGhlciBkZXN0cnVjdGl2ZSBvcGVyYXRpb25zIG9uIHRoZSBjbG9uZVxuXHRcdFx0dGhpcy5yZW1vdmVIaWRkZW5FbGVtZW50cyhjbG9uZSk7XG5cdFx0XHR0aGlzLnJlbW92ZUNsdXR0ZXIoY2xvbmUpO1xuXG5cdFx0XHQvLyBDbGVhbiB1cCB0aGUgbWFpbiBjb250ZW50XG5cdFx0XHR0aGlzLmNsZWFuQ29udGVudChtYWluQ29udGVudCwgbWV0YWRhdGEpO1xuXG5cdFx0XHRjb25zdCBjb250ZW50ID0gbWFpbkNvbnRlbnQgPyBtYWluQ29udGVudC5vdXRlckhUTUwgOiB0aGlzLmRvYy5ib2R5LmlubmVySFRNTDtcblx0XHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y29udGVudCxcblx0XHRcdFx0Li4ubWV0YWRhdGEsXG5cdFx0XHRcdHdvcmRDb3VudDogdGhpcy5jb3VudFdvcmRzKGNvbnRlbnQpLFxuXHRcdFx0XHRwYXJzZVRpbWU6IE1hdGgucm91bmQoZW5kVGltZSAtIHN0YXJ0VGltZSlcblx0XHRcdH07XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0RlZnVkZGxlJywgJ0Vycm9yIHByb2Nlc3NpbmcgZG9jdW1lbnQ6JywgZXJyb3IpO1xuXHRcdFx0Y29uc3QgZW5kVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y29udGVudDogdGhpcy5kb2MuYm9keS5pbm5lckhUTUwsXG5cdFx0XHRcdC4uLm1ldGFkYXRhLFxuXHRcdFx0XHR3b3JkQ291bnQ6IHRoaXMuY291bnRXb3Jkcyh0aGlzLmRvYy5ib2R5LmlubmVySFRNTCksXG5cdFx0XHRcdHBhcnNlVGltZTogTWF0aC5yb3VuZChlbmRUaW1lIC0gc3RhcnRUaW1lKVxuXHRcdFx0fTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGNvdW50V29yZHMoY29udGVudDogc3RyaW5nKTogbnVtYmVyIHtcblx0XHQvLyBDcmVhdGUgYSB0ZW1wb3JhcnkgZGl2IHRvIHBhcnNlIEhUTUwgY29udGVudFxuXHRcdGNvbnN0IHRlbXBEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHR0ZW1wRGl2LmlubmVySFRNTCA9IGNvbnRlbnQ7XG5cblx0XHQvLyBHZXQgdGV4dCBjb250ZW50LCByZW1vdmluZyBleHRyYSB3aGl0ZXNwYWNlXG5cdFx0Y29uc3QgdGV4dCA9IHRlbXBEaXYudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0Y29uc3Qgd29yZHMgPSB0ZXh0XG5cdFx0XHQudHJpbSgpXG5cdFx0XHQucmVwbGFjZSgvXFxzKy9nLCAnICcpIC8vIFJlcGxhY2UgbXVsdGlwbGUgc3BhY2VzIHdpdGggc2luZ2xlIHNwYWNlXG5cdFx0XHQuc3BsaXQoJyAnKVxuXHRcdFx0LmZpbHRlcih3b3JkID0+IHdvcmQubGVuZ3RoID4gMCk7IC8vIEZpbHRlciBvdXQgZW1wdHkgc3RyaW5nc1xuXG5cdFx0cmV0dXJuIHdvcmRzLmxlbmd0aDtcblx0fVxuXG5cdC8vIE1ha2UgYWxsIG90aGVyIG1ldGhvZHMgcHJpdmF0ZSBieSByZW1vdmluZyB0aGUgc3RhdGljIGtleXdvcmQgYW5kIHVzaW5nIHByaXZhdGVcblx0cHJpdmF0ZSBfbG9nKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG5cdFx0aWYgKHRoaXMuZGVidWcpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdEZWZ1ZGRsZTonLCAuLi5hcmdzKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIF9ldmFsdWF0ZU1lZGlhUXVlcmllcyhkb2M6IERvY3VtZW50KTogU3R5bGVDaGFuZ2VbXSB7XG5cdFx0Y29uc3QgbW9iaWxlU3R5bGVzOiBTdHlsZUNoYW5nZVtdID0gW107XG5cdFx0Y29uc3QgbWF4V2lkdGhSZWdleCA9IC9tYXgtd2lkdGhbXjpdKjpcXHMqKFxcZCspLztcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBHZXQgYWxsIHN0eWxlcywgaW5jbHVkaW5nIGlubGluZSBzdHlsZXNcblx0XHRcdGNvbnN0IHNoZWV0cyA9IEFycmF5LmZyb20oZG9jLnN0eWxlU2hlZXRzKS5maWx0ZXIoc2hlZXQgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIEFjY2VzcyBydWxlcyBvbmNlIHRvIGNoZWNrIHZhbGlkaXR5XG5cdFx0XHRcdFx0c2hlZXQuY3NzUnVsZXM7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHQvLyBFeHBlY3RlZCBlcnJvciBmb3IgY3Jvc3Mtb3JpZ2luIHN0eWxlc2hlZXRzXG5cdFx0XHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnU2VjdXJpdHlFcnJvcicpIHtcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdC8vIFByb2Nlc3MgYWxsIHNoZWV0cyBpbiBhIHNpbmdsZSBwYXNzXG5cdFx0XHRjb25zdCBtZWRpYVJ1bGVzID0gc2hlZXRzLmZsYXRNYXAoc2hlZXQgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHJldHVybiBBcnJheS5mcm9tKHNoZWV0LmNzc1J1bGVzKVxuXHRcdFx0XHRcdFx0LmZpbHRlcigocnVsZSk6IHJ1bGUgaXMgQ1NTTWVkaWFSdWxlID0+IFxuXHRcdFx0XHRcdFx0XHRydWxlIGluc3RhbmNlb2YgQ1NTTWVkaWFSdWxlICYmXG5cdFx0XHRcdFx0XHRcdHJ1bGUuY29uZGl0aW9uVGV4dC5pbmNsdWRlcygnbWF4LXdpZHRoJylcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAodGhpcy5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdEZWZ1ZGRsZTogRmFpbGVkIHRvIHByb2Nlc3Mgc3R5bGVzaGVldDonLCBlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gUHJvY2VzcyBhbGwgbWVkaWEgcnVsZXMgaW4gYSBzaW5nbGUgcGFzc1xuXHRcdFx0bWVkaWFSdWxlcy5mb3JFYWNoKHJ1bGUgPT4ge1xuXHRcdFx0XHRjb25zdCBtYXRjaCA9IHJ1bGUuY29uZGl0aW9uVGV4dC5tYXRjaChtYXhXaWR0aFJlZ2V4KTtcblx0XHRcdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRcdFx0Y29uc3QgbWF4V2lkdGggPSBwYXJzZUludChtYXRjaFsxXSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0aWYgKE1PQklMRV9XSURUSCA8PSBtYXhXaWR0aCkge1xuXHRcdFx0XHRcdFx0Ly8gQmF0Y2ggcHJvY2VzcyBhbGwgc3R5bGUgcnVsZXNcblx0XHRcdFx0XHRcdGNvbnN0IHN0eWxlUnVsZXMgPSBBcnJheS5mcm9tKHJ1bGUuY3NzUnVsZXMpXG5cdFx0XHRcdFx0XHRcdC5maWx0ZXIoKHIpOiByIGlzIENTU1N0eWxlUnVsZSA9PiByIGluc3RhbmNlb2YgQ1NTU3R5bGVSdWxlKTtcblxuXHRcdFx0XHRcdFx0c3R5bGVSdWxlcy5mb3JFYWNoKGNzc1J1bGUgPT4ge1xuXHRcdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRcdG1vYmlsZVN0eWxlcy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdHNlbGVjdG9yOiBjc3NSdWxlLnNlbGVjdG9yVGV4dCxcblx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlczogY3NzUnVsZS5zdHlsZS5jc3NUZXh0XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdEZWZ1ZGRsZTogRmFpbGVkIHRvIHByb2Nlc3MgQ1NTIHJ1bGU6JywgZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0RlZnVkZGxlOiBFcnJvciBldmFsdWF0aW5nIG1lZGlhIHF1ZXJpZXM6JywgZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1vYmlsZVN0eWxlcztcblx0fVxuXG5cdHByaXZhdGUgYXBwbHlNb2JpbGVTdHlsZXMoZG9jOiBEb2N1bWVudCwgbW9iaWxlU3R5bGVzOiBTdHlsZUNoYW5nZVtdKSB7XG5cdFx0bGV0IGFwcGxpZWRDb3VudCA9IDA7XG5cblx0XHRtb2JpbGVTdHlsZXMuZm9yRWFjaCgoe3NlbGVjdG9yLCBzdHlsZXN9KSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBlbGVtZW50cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcblx0XHRcdFx0ZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcblx0XHRcdFx0XHRlbGVtZW50LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBcblx0XHRcdFx0XHRcdChlbGVtZW50LmdldEF0dHJpYnV0ZSgnc3R5bGUnKSB8fCAnJykgKyBzdHlsZXNcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdGFwcGxpZWRDb3VudCsrO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignRGVmdWRkbGUnLCAnRXJyb3IgYXBwbHlpbmcgc3R5bGVzIGZvciBzZWxlY3RvcjonLCBzZWxlY3RvciwgZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlSGlkZGVuRWxlbWVudHMoZG9jOiBEb2N1bWVudCkge1xuXHRcdGxldCBjb3VudCA9IDA7XG5cdFx0Y29uc3QgZWxlbWVudHNUb1JlbW92ZSA9IG5ldyBTZXQ8RWxlbWVudD4oKTtcblxuXHRcdC8vIEZpcnN0IHBhc3M6IEdldCBhbGwgZWxlbWVudHMgbWF0Y2hpbmcgaGlkZGVuIHNlbGVjdG9yc1xuXHRcdGNvbnN0IGhpZGRlbkVsZW1lbnRzID0gZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoSElEREVOX0VMRU1FTlRfU0VMRUNUT1JTKTtcblx0XHRoaWRkZW5FbGVtZW50cy5mb3JFYWNoKGVsID0+IGVsZW1lbnRzVG9SZW1vdmUuYWRkKGVsKSk7XG5cdFx0Y291bnQgKz0gaGlkZGVuRWxlbWVudHMubGVuZ3RoO1xuXG5cdFx0Ly8gU2Vjb25kIHBhc3M6IFVzZSBUcmVlV2Fsa2VyIGZvciBlZmZpY2llbnQgdHJhdmVyc2FsXG5cdFx0Y29uc3QgdHJlZVdhbGtlciA9IGRvYy5jcmVhdGVUcmVlV2Fsa2VyKFxuXHRcdFx0ZG9jLmJvZHksXG5cdFx0XHROb2RlRmlsdGVyLlNIT1dfRUxFTUVOVCxcblx0XHRcdHtcblx0XHRcdFx0YWNjZXB0Tm9kZTogKG5vZGU6IEVsZW1lbnQpID0+IHtcblx0XHRcdFx0XHQvLyBTa2lwIGVsZW1lbnRzIGFscmVhZHkgbWFya2VkIGZvciByZW1vdmFsXG5cdFx0XHRcdFx0aWYgKGVsZW1lbnRzVG9SZW1vdmUuaGFzKG5vZGUpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfUkVKRUNUO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gTm9kZUZpbHRlci5GSUxURVJfQUNDRVBUO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0KTtcblxuXHRcdC8vIEJhdGNoIHN0eWxlIGNvbXB1dGF0aW9uc1xuXHRcdGNvbnN0IGVsZW1lbnRzOiBFbGVtZW50W10gPSBbXTtcblx0XHRsZXQgY3VycmVudE5vZGU6IEVsZW1lbnQgfCBudWxsO1xuXHRcdHdoaWxlIChjdXJyZW50Tm9kZSA9IHRyZWVXYWxrZXIubmV4dE5vZGUoKSBhcyBFbGVtZW50KSB7XG5cdFx0XHRlbGVtZW50cy5wdXNoKGN1cnJlbnROb2RlKTtcblx0XHR9XG5cblx0XHQvLyBQcm9jZXNzIHN0eWxlcyBpbiBiYXRjaGVzIHRvIG1pbmltaXplIGxheW91dCB0aHJhc2hpbmdcblx0XHRjb25zdCBCQVRDSF9TSVpFID0gMTAwO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpICs9IEJBVENIX1NJWkUpIHtcblx0XHRcdGNvbnN0IGJhdGNoID0gZWxlbWVudHMuc2xpY2UoaSwgaSArIEJBVENIX1NJWkUpO1xuXHRcdFx0XG5cdFx0XHQvLyBSZWFkIHBoYXNlIC0gZ2F0aGVyIGFsbCBjb21wdXRlZFN0eWxlc1xuXHRcdFx0Y29uc3Qgc3R5bGVzID0gYmF0Y2gubWFwKGVsID0+IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsKSk7XG5cdFx0XHRcblx0XHRcdC8vIFdyaXRlIHBoYXNlIC0gbWFyayBlbGVtZW50cyBmb3IgcmVtb3ZhbFxuXHRcdFx0YmF0Y2guZm9yRWFjaCgoZWxlbWVudCwgaW5kZXgpID0+IHtcblx0XHRcdFx0Y29uc3QgY29tcHV0ZWRTdHlsZSA9IHN0eWxlc1tpbmRleF07XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRjb21wdXRlZFN0eWxlLmRpc3BsYXkgPT09ICdub25lJyB8fFxuXHRcdFx0XHRcdGNvbXB1dGVkU3R5bGUudmlzaWJpbGl0eSA9PT0gJ2hpZGRlbicgfHxcblx0XHRcdFx0XHRjb21wdXRlZFN0eWxlLm9wYWNpdHkgPT09ICcwJ1xuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRlbGVtZW50c1RvUmVtb3ZlLmFkZChlbGVtZW50KTtcblx0XHRcdFx0XHRjb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBGaW5hbCBwYXNzOiBCYXRjaCByZW1vdmUgYWxsIGhpZGRlbiBlbGVtZW50c1xuXHRcdGVsZW1lbnRzVG9SZW1vdmUuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmUoKSk7XG5cblx0XHR0aGlzLl9sb2coJ1JlbW92ZWQgaGlkZGVuIGVsZW1lbnRzOicsIGNvdW50KTtcblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlQ2x1dHRlcihkb2M6IERvY3VtZW50KSB7XG5cdFx0Y29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0bGV0IGV4YWN0U2VsZWN0b3JDb3VudCA9IDA7XG5cdFx0bGV0IHBhcnRpYWxTZWxlY3RvckNvdW50ID0gMDtcblxuXHRcdC8vIFRyYWNrIGFsbCBlbGVtZW50cyB0byBiZSByZW1vdmVkXG5cdFx0Y29uc3QgZWxlbWVudHNUb1JlbW92ZSA9IG5ldyBTZXQ8RWxlbWVudD4oKTtcblxuXHRcdC8vIEZpcnN0IGNvbGxlY3QgZWxlbWVudHMgbWF0Y2hpbmcgZXhhY3Qgc2VsZWN0b3JzXG5cdFx0Y29uc3QgZXhhY3RFbGVtZW50cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKEVYQUNUX1NFTEVDVE9SUy5qb2luKCcsJykpO1xuXHRcdGV4YWN0RWxlbWVudHMuZm9yRWFjaChlbCA9PiB7XG5cdFx0XHRpZiAoZWw/LnBhcmVudE5vZGUpIHtcblx0XHRcdFx0ZWxlbWVudHNUb1JlbW92ZS5hZGQoZWwpO1xuXHRcdFx0XHRleGFjdFNlbGVjdG9yQ291bnQrKztcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFByZS1jb21waWxlIHJlZ2V4ZXMgYW5kIGNvbWJpbmUgaW50byBhIHNpbmdsZSByZWdleCBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlXG5cdFx0Y29uc3QgY29tYmluZWRQYXR0ZXJuID0gUEFSVElBTF9TRUxFQ1RPUlMuam9pbignfCcpO1xuXHRcdGNvbnN0IHBhcnRpYWxSZWdleCA9IG5ldyBSZWdFeHAoY29tYmluZWRQYXR0ZXJuLCAnaScpO1xuXG5cdFx0Ly8gQ3JlYXRlIGFuIGVmZmljaWVudCBhdHRyaWJ1dGUgc2VsZWN0b3IgZm9yIGVsZW1lbnRzIHdlIGNhcmUgYWJvdXRcblx0XHRjb25zdCBhdHRyaWJ1dGVTZWxlY3RvciA9ICdbY2xhc3NdLFtpZF0sW2RhdGEtdGVzdGlkXSxbZGF0YS1xYV0sW2RhdGEtY3ldJztcblx0XHRjb25zdCBhbGxFbGVtZW50cyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKGF0dHJpYnV0ZVNlbGVjdG9yKTtcblxuXHRcdC8vIFByb2Nlc3MgZWxlbWVudHMgZm9yIHBhcnRpYWwgbWF0Y2hlc1xuXHRcdGFsbEVsZW1lbnRzLmZvckVhY2goZWwgPT4ge1xuXHRcdFx0Ly8gU2tpcCBpZiBhbHJlYWR5IG1hcmtlZCBmb3IgcmVtb3ZhbFxuXHRcdFx0aWYgKGVsZW1lbnRzVG9SZW1vdmUuaGFzKGVsKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIEdldCBhbGwgcmVsZXZhbnQgYXR0cmlidXRlcyBhbmQgY29tYmluZSBpbnRvIGEgc2luZ2xlIHN0cmluZ1xuXHRcdFx0Y29uc3QgYXR0cnMgPSBbXG5cdFx0XHRcdGVsLmNsYXNzTmFtZSAmJiB0eXBlb2YgZWwuY2xhc3NOYW1lID09PSAnc3RyaW5nJyA/IGVsLmNsYXNzTmFtZSA6ICcnLFxuXHRcdFx0XHRlbC5pZCB8fCAnJyxcblx0XHRcdFx0ZWwuZ2V0QXR0cmlidXRlKCdkYXRhLXRlc3RpZCcpIHx8ICcnLFxuXHRcdFx0XHRlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcWEnKSB8fCAnJyxcblx0XHRcdFx0ZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWN5JykgfHwgJydcblx0XHRcdF0uam9pbignICcpLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRcdC8vIFNraXAgaWYgbm8gYXR0cmlidXRlcyB0byBjaGVja1xuXHRcdFx0aWYgKCFhdHRycy50cmltKCkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDaGVjayBmb3IgcGFydGlhbCBtYXRjaCB1c2luZyBzaW5nbGUgcmVnZXggdGVzdFxuXHRcdFx0aWYgKHBhcnRpYWxSZWdleC50ZXN0KGF0dHJzKSkge1xuXHRcdFx0XHRlbGVtZW50c1RvUmVtb3ZlLmFkZChlbCk7XG5cdFx0XHRcdHBhcnRpYWxTZWxlY3RvckNvdW50Kys7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBSZW1vdmUgYWxsIGNvbGxlY3RlZCBlbGVtZW50cyBpbiBhIHNpbmdsZSBwYXNzXG5cdFx0ZWxlbWVudHNUb1JlbW92ZS5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKTtcblxuXHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHR0aGlzLl9sb2coJ1JlbW92ZWQgY2x1dHRlciBlbGVtZW50czonLCB7XG5cdFx0XHRleGFjdFNlbGVjdG9yczogZXhhY3RTZWxlY3RvckNvdW50LFxuXHRcdFx0cGFydGlhbFNlbGVjdG9yczogcGFydGlhbFNlbGVjdG9yQ291bnQsXG5cdFx0XHR0b3RhbDogZWxlbWVudHNUb1JlbW92ZS5zaXplLFxuXHRcdFx0cHJvY2Vzc2luZ1RpbWU6IGAkeyhlbmRUaW1lIC0gc3RhcnRUaW1lKS50b0ZpeGVkKDIpfW1zYFxuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBmbGF0dGVuRGl2cyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0bGV0IHByb2Nlc3NlZENvdW50ID0gMDtcblx0XHRjb25zdCBzdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuXHRcdC8vIFByb2Nlc3MgaW4gYmF0Y2hlcyB0byBtYWludGFpbiBwZXJmb3JtYW5jZVxuXHRcdGNvbnN0IEJBVENIX1NJWkUgPSAxMDA7XG5cdFx0bGV0IGtlZXBQcm9jZXNzaW5nID0gdHJ1ZTtcblxuXHRcdC8vIEVsZW1lbnRzIHRoYXQgc2hvdWxkIG5vdCBiZSB1bndyYXBwZWRcblx0XHRjb25zdCBQUkVTRVJWRV9FTEVNRU5UUyA9IG5ldyBTZXQoW1xuXHRcdFx0J3ByZScsICdjb2RlJywgJ3RhYmxlJywgJ3RoZWFkJywgJ3Rib2R5JywgJ3RyJywgJ3RkJywgJ3RoJyxcblx0XHRcdCd1bCcsICdvbCcsICdsaScsICdkbCcsICdkdCcsICdkZCcsXG5cdFx0XHQnZmlndXJlJywgJ2ZpZ2NhcHRpb24nLFxuXHRcdFx0J2RldGFpbHMnLCAnc3VtbWFyeScsXG5cdFx0XHQnYmxvY2txdW90ZScsXG5cdFx0XHQnZm9ybScsICdmaWVsZHNldCdcblx0XHRdKTtcblxuXHRcdC8vIElubGluZSBlbGVtZW50cyB0aGF0IHNob3VsZCBub3QgYmUgdW53cmFwcGVkXG5cdFx0Y29uc3QgSU5MSU5FX0VMRU1FTlRTID0gbmV3IFNldChbXG5cdFx0XHQnYScsICdzcGFuJywgJ3N0cm9uZycsICdlbScsICdpJywgJ2InLCAndScsICdjb2RlJywgJ2JyJywgJ3NtYWxsJyxcblx0XHRcdCdzdWInLCAnc3VwJywgJ21hcmsnLCAnZGVsJywgJ2lucycsICdxJywgJ2FiYnInLCAnY2l0ZScsICd0aW1lJ1xuXHRcdF0pO1xuXG5cdFx0Y29uc3Qgc2hvdWxkUHJlc2VydmVFbGVtZW50ID0gKGVsOiBFbGVtZW50KTogYm9vbGVhbiA9PiB7XG5cdFx0XHRjb25zdCB0YWdOYW1lID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XG5cdFx0XHQvLyBDaGVjayBpZiBlbGVtZW50IHNob3VsZCBiZSBwcmVzZXJ2ZWRcblx0XHRcdGlmIChQUkVTRVJWRV9FTEVNRU5UUy5oYXModGFnTmFtZSkpIHJldHVybiB0cnVlO1xuXHRcdFx0XG5cdFx0XHQvLyBDaGVjayBmb3Igc2VtYW50aWMgcm9sZXNcblx0XHRcdGNvbnN0IHJvbGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ3JvbGUnKTtcblx0XHRcdGlmIChyb2xlICYmIFsnYXJ0aWNsZScsICdtYWluJywgJ25hdmlnYXRpb24nLCAnYmFubmVyJywgJ2NvbnRlbnRpbmZvJ10uaW5jbHVkZXMocm9sZSkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIENoZWNrIGZvciBzZW1hbnRpYyBjbGFzc2VzXG5cdFx0XHRjb25zdCBjbGFzc05hbWUgPSBlbC5jbGFzc05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdGlmIChjbGFzc05hbWUubWF0Y2goLyg/OmFydGljbGV8bWFpbnxjb250ZW50fGZvb3Rub3RlfHJlZmVyZW5jZXxiaWJsaW9ncmFwaHkpLykpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENoZWNrIGlmIGRpdiBjb250YWlucyBtaXhlZCBjb250ZW50IHR5cGVzIHRoYXQgc2hvdWxkIGJlIHByZXNlcnZlZFxuXHRcdFx0aWYgKHRhZ05hbWUgPT09ICdkaXYnKSB7XG5cdFx0XHRcdGNvbnN0IGNoaWxkcmVuID0gQXJyYXkuZnJvbShlbC5jaGlsZHJlbik7XG5cdFx0XHRcdGNvbnN0IGhhc1ByZXNlcnZlZEVsZW1lbnRzID0gY2hpbGRyZW4uc29tZShjaGlsZCA9PiBcblx0XHRcdFx0XHRQUkVTRVJWRV9FTEVNRU5UUy5oYXMoY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpKSB8fFxuXHRcdFx0XHRcdGNoaWxkLmdldEF0dHJpYnV0ZSgncm9sZScpID09PSAnYXJ0aWNsZScgfHxcblx0XHRcdFx0XHRjaGlsZC5jbGFzc05hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnYXJ0aWNsZScpXG5cdFx0XHRcdCk7XG5cdFx0XHRcdGlmIChoYXNQcmVzZXJ2ZWRFbGVtZW50cykgcmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cdFx0Ly8gRnVuY3Rpb24gdG8gY2hlY2sgaWYgYSBkaXYgaXMgYSB3cmFwcGVyIGRpdlxuXHRcdGNvbnN0IGlzV3JhcHBlckRpdiA9IChkaXY6IEVsZW1lbnQpOiBib29sZWFuID0+IHtcblx0XHRcdC8vIENoZWNrIGlmIGl0J3MganVzdCBlbXB0eSBzcGFjZVxuXHRcdFx0aWYgKCFkaXYudGV4dENvbnRlbnQ/LnRyaW0oKSkgcmV0dXJuIHRydWU7XG5cblx0XHRcdC8vIENoZWNrIGlmIGl0IG9ubHkgY29udGFpbnMgb3RoZXIgZGl2c1xuXHRcdFx0Y29uc3QgY2hpbGRyZW4gPSBBcnJheS5mcm9tKGRpdi5jaGlsZHJlbik7XG5cdFx0XHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZTtcblx0XHRcdFxuXHRcdFx0Ly8gQ2hlY2sgaWYgYWxsIGNoaWxkcmVuIGFyZSBkaXZzXG5cdFx0XHRjb25zdCBhbGxEaXZzID0gY2hpbGRyZW4uZXZlcnkoY2hpbGQgPT4gY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnZGl2Jyk7XG5cdFx0XHRpZiAoYWxsRGl2cykgcmV0dXJuIHRydWU7XG5cblx0XHRcdC8vIENoZWNrIGZvciBjb21tb24gd3JhcHBlciBwYXR0ZXJuc1xuXHRcdFx0Y29uc3QgY2xhc3NOYW1lID0gZGl2LmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0Y29uc3QgaXNXcmFwcGVyID0gLyg/OndyYXBwZXJ8Y29udGFpbmVyfGxheW91dHxyb3d8Y29sfGdyaWR8ZmxleHxvdXRlcnxpbm5lcnxjb250ZW50LWFyZWEpL2kudGVzdChjbGFzc05hbWUpO1xuXHRcdFx0aWYgKGlzV3JhcHBlcikgcmV0dXJuIHRydWU7XG5cblx0XHRcdC8vIENoZWNrIGlmIGl0IGhhcyBleGNlc3NpdmUgd2hpdGVzcGFjZSBvciBlbXB0eSB0ZXh0IG5vZGVzXG5cdFx0XHRjb25zdCB0ZXh0Tm9kZXMgPSBBcnJheS5mcm9tKGRpdi5jaGlsZE5vZGVzKS5maWx0ZXIobm9kZSA9PiBcblx0XHRcdFx0bm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUgJiYgbm9kZS50ZXh0Q29udGVudD8udHJpbSgpXG5cdFx0XHQpO1xuXHRcdFx0aWYgKHRleHROb2Rlcy5sZW5ndGggPT09IDApIHJldHVybiB0cnVlO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXHRcdC8vIEZ1bmN0aW9uIHRvIHByb2Nlc3MgYSBzaW5nbGUgZGl2XG5cdFx0Y29uc3QgcHJvY2Vzc0RpdiA9IChkaXY6IEVsZW1lbnQpOiBib29sZWFuID0+IHtcblx0XHRcdC8vIFNraXAgcHJvY2Vzc2luZyBpZiBkaXYgaGFzIGJlZW4gcmVtb3ZlZCBvciBzaG91bGQgYmUgcHJlc2VydmVkXG5cdFx0XHRpZiAoIWRpdi5pc0Nvbm5lY3RlZCB8fCBzaG91bGRQcmVzZXJ2ZUVsZW1lbnQoZGl2KSkgcmV0dXJuIGZhbHNlO1xuXG5cdFx0XHQvLyBDYXNlIDE6IEVtcHR5IGRpdiBvciBkaXYgd2l0aCBvbmx5IHdoaXRlc3BhY2Vcblx0XHRcdGlmICghZGl2Lmhhc0NoaWxkTm9kZXMoKSB8fCAhZGl2LnRleHRDb250ZW50Py50cmltKCkpIHtcblx0XHRcdFx0ZGl2LnJlbW92ZSgpO1xuXHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FzZSAyOiBXcmFwcGVyIGRpdiAtIG1lcmdlIHVwIGFnZ3Jlc3NpdmVseVxuXHRcdFx0aWYgKGlzV3JhcHBlckRpdihkaXYpKSB7XG5cdFx0XHRcdGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0XHR3aGlsZSAoZGl2LmZpcnN0Q2hpbGQpIHtcblx0XHRcdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkaXYuZmlyc3RDaGlsZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKGZyYWdtZW50KTtcblx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENhc2UgMzogRGl2IG9ubHkgY29udGFpbnMgdGV4dCBjb250ZW50IC0gY29udmVydCB0byBwYXJhZ3JhcGhcblx0XHRcdGlmICghZGl2LmNoaWxkcmVuLmxlbmd0aCAmJiBkaXYudGV4dENvbnRlbnQ/LnRyaW0oKSkge1xuXHRcdFx0XHRjb25zdCBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdFx0XHRwLnRleHRDb250ZW50ID0gZGl2LnRleHRDb250ZW50O1xuXHRcdFx0XHRkaXYucmVwbGFjZVdpdGgocCk7XG5cdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDYXNlIDQ6IERpdiBoYXMgc2luZ2xlIGNoaWxkXG5cdFx0XHRpZiAoZGl2LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0XHRjb25zdCBjaGlsZCA9IGRpdi5maXJzdEVsZW1lbnRDaGlsZCE7XG5cdFx0XHRcdGNvbnN0IGNoaWxkVGFnID0gY2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gRG9uJ3QgdW53cmFwIGlmIGNoaWxkIGlzIGlubGluZSBvciBzaG91bGQgYmUgcHJlc2VydmVkXG5cdFx0XHRcdGlmICghSU5MSU5FX0VMRU1FTlRTLmhhcyhjaGlsZFRhZykgJiYgIXNob3VsZFByZXNlcnZlRWxlbWVudChjaGlsZCkpIHtcblx0XHRcdFx0XHRkaXYucmVwbGFjZVdpdGgoY2hpbGQpO1xuXHRcdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FzZSA1OiBEZWVwbHkgbmVzdGVkIGRpdiAtIG1lcmdlIHVwXG5cdFx0XHRsZXQgbmVzdGluZ0RlcHRoID0gMDtcblx0XHRcdGxldCBwYXJlbnQgPSBkaXYucGFyZW50RWxlbWVudDtcblx0XHRcdHdoaWxlIChwYXJlbnQpIHtcblx0XHRcdFx0aWYgKHBhcmVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdkaXYnKSB7XG5cdFx0XHRcdFx0bmVzdGluZ0RlcHRoKys7XG5cdFx0XHRcdH1cblx0XHRcdFx0cGFyZW50ID0gcGFyZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChuZXN0aW5nRGVwdGggPiAxKSB7XG5cdFx0XHRcdGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0XHR3aGlsZSAoZGl2LmZpcnN0Q2hpbGQpIHtcblx0XHRcdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkaXYuZmlyc3RDaGlsZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKGZyYWdtZW50KTtcblx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cdFx0Ly8gRmlyc3QgcGFzczogUHJvY2VzcyB0b3AtbGV2ZWwgZGl2c1xuXHRcdGNvbnN0IHByb2Nlc3NUb3BMZXZlbERpdnMgPSAoKSA9PiB7XG5cdFx0XHRjb25zdCB0b3BEaXZzID0gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkcmVuKS5maWx0ZXIoXG5cdFx0XHRcdGVsID0+IGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2Rpdidcblx0XHRcdCk7XG5cdFx0XHRcblx0XHRcdGxldCBtb2RpZmllZCA9IGZhbHNlO1xuXHRcdFx0dG9wRGl2cy5mb3JFYWNoKGRpdiA9PiB7XG5cdFx0XHRcdGlmIChwcm9jZXNzRGl2KGRpdikpIHtcblx0XHRcdFx0XHRtb2RpZmllZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIG1vZGlmaWVkO1xuXHRcdH07XG5cblx0XHQvLyBTZWNvbmQgcGFzczogUHJvY2VzcyByZW1haW5pbmcgZGl2cyBmcm9tIGRlZXBlc3QgdG8gc2hhbGxvd2VzdFxuXHRcdGNvbnN0IHByb2Nlc3NSZW1haW5pbmdEaXZzID0gKCkgPT4ge1xuXHRcdFx0Y29uc3QgYWxsRGl2cyA9IEFycmF5LmZyb20oZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnZGl2JykpXG5cdFx0XHRcdC5zb3J0KChhLCBiKSA9PiB7XG5cdFx0XHRcdFx0Ly8gQ291bnQgbmVzdGluZyBkZXB0aFxuXHRcdFx0XHRcdGNvbnN0IGdldERlcHRoID0gKGVsOiBFbGVtZW50KTogbnVtYmVyID0+IHtcblx0XHRcdFx0XHRcdGxldCBkZXB0aCA9IDA7XG5cdFx0XHRcdFx0XHRsZXQgcGFyZW50ID0gZWwucGFyZW50RWxlbWVudDtcblx0XHRcdFx0XHRcdHdoaWxlIChwYXJlbnQpIHtcblx0XHRcdFx0XHRcdFx0aWYgKHBhcmVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdkaXYnKSBkZXB0aCsrO1xuXHRcdFx0XHRcdFx0XHRwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBkZXB0aDtcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdHJldHVybiBnZXREZXB0aChiKSAtIGdldERlcHRoKGEpOyAvLyBQcm9jZXNzIGRlZXBlc3QgZmlyc3Rcblx0XHRcdFx0fSk7XG5cblx0XHRcdGxldCBtb2RpZmllZCA9IGZhbHNlO1xuXHRcdFx0YWxsRGl2cy5mb3JFYWNoKGRpdiA9PiB7XG5cdFx0XHRcdGlmIChwcm9jZXNzRGl2KGRpdikpIHtcblx0XHRcdFx0XHRtb2RpZmllZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIG1vZGlmaWVkO1xuXHRcdH07XG5cblx0XHQvLyBGaW5hbCBjbGVhbnVwIHBhc3Ncblx0XHRjb25zdCBmaW5hbENsZWFudXAgPSAoKSA9PiB7XG5cdFx0XHRjb25zdCByZW1haW5pbmdEaXZzID0gQXJyYXkuZnJvbShlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKSk7XG5cdFx0XHRsZXQgbW9kaWZpZWQgPSBmYWxzZTtcblx0XHRcdFxuXHRcdFx0cmVtYWluaW5nRGl2cy5mb3JFYWNoKGRpdiA9PiB7XG5cdFx0XHRcdGlmICghc2hvdWxkUHJlc2VydmVFbGVtZW50KGRpdikgJiYgaXNXcmFwcGVyRGl2KGRpdikpIHtcblx0XHRcdFx0XHRjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHRcdFx0XHR3aGlsZSAoZGl2LmZpcnN0Q2hpbGQpIHtcblx0XHRcdFx0XHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGRpdi5maXJzdENoaWxkKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGl2LnJlcGxhY2VXaXRoKGZyYWdtZW50KTtcblx0XHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0XHRcdG1vZGlmaWVkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gbW9kaWZpZWQ7XG5cdFx0fTtcblxuXHRcdC8vIEV4ZWN1dGUgYWxsIHBhc3NlcyB1bnRpbCBubyBtb3JlIGNoYW5nZXNcblx0XHRkbyB7XG5cdFx0XHRrZWVwUHJvY2Vzc2luZyA9IGZhbHNlO1xuXHRcdFx0aWYgKHByb2Nlc3NUb3BMZXZlbERpdnMoKSkga2VlcFByb2Nlc3NpbmcgPSB0cnVlO1xuXHRcdFx0aWYgKHByb2Nlc3NSZW1haW5pbmdEaXZzKCkpIGtlZXBQcm9jZXNzaW5nID0gdHJ1ZTtcblx0XHRcdGlmIChmaW5hbENsZWFudXAoKSkga2VlcFByb2Nlc3NpbmcgPSB0cnVlO1xuXHRcdH0gd2hpbGUgKGtlZXBQcm9jZXNzaW5nKTtcblxuXHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHR0aGlzLl9sb2coJ0ZsYXR0ZW5lZCBkaXZzOicsIHtcblx0XHRcdGNvdW50OiBwcm9jZXNzZWRDb3VudCxcblx0XHRcdHByb2Nlc3NpbmdUaW1lOiBgJHsoZW5kVGltZSAtIHN0YXJ0VGltZSkudG9GaXhlZCgyKX1tc2Bcblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgY2xlYW5Db250ZW50KGVsZW1lbnQ6IEVsZW1lbnQsIG1ldGFkYXRhOiBEZWZ1ZGRsZU1ldGFkYXRhKSB7XG5cdFx0Ly8gUmVtb3ZlIEhUTUwgY29tbWVudHNcblx0XHR0aGlzLnJlbW92ZUh0bWxDb21tZW50cyhlbGVtZW50KTtcblx0XHRcblx0XHQvLyBIYW5kbGUgSDEgZWxlbWVudHMgLSByZW1vdmUgZmlyc3Qgb25lIGFuZCBjb252ZXJ0IG90aGVycyB0byBIMlxuXHRcdHRoaXMuaGFuZGxlSGVhZGluZ3MoZWxlbWVudCwgbWV0YWRhdGEudGl0bGUpO1xuXHRcdFxuXHRcdC8vIFN0YW5kYXJkaXplIGZvb3Rub3RlcyBhbmQgY2l0YXRpb25zXG5cdFx0dGhpcy5zdGFuZGFyZGl6ZUZvb3Rub3RlcyhlbGVtZW50KTtcblxuXHRcdC8vIEhhbmRsZSBsYXp5LWxvYWRlZCBpbWFnZXNcblx0XHR0aGlzLmhhbmRsZUxhenlJbWFnZXMoZWxlbWVudCk7XG5cblx0XHQvLyBDb252ZXJ0IGVtYmVkZGVkIGNvbnRlbnQgdG8gc3RhbmRhcmQgZm9ybWF0c1xuXHRcdHRoaXMuc3RhbmRhcmRpemVFbGVtZW50cyhlbGVtZW50KTtcblxuXHRcdC8vIEZsYXR0ZW4gdW5uZWNlc3NhcnkgZGl2IGVsZW1lbnRzIC0gbW92ZWQgZWFybGllciBpbiB0aGUgcHJvY2Vzc1xuXHRcdHRoaXMuZmxhdHRlbkRpdnMoZWxlbWVudCk7XG5cdFx0XG5cdFx0Ly8gU3RyaXAgdW53YW50ZWQgYXR0cmlidXRlc1xuXHRcdHRoaXMuc3RyaXBVbndhbnRlZEF0dHJpYnV0ZXMoZWxlbWVudCk7XG5cblx0XHQvLyBSZW1vdmUgZW1wdHkgZWxlbWVudHNcblx0XHR0aGlzLnJlbW92ZUVtcHR5RWxlbWVudHMoZWxlbWVudCk7XG5cblx0XHQvLyBSZW1vdmUgdHJhaWxpbmcgaGVhZGluZ3Ncblx0XHR0aGlzLnJlbW92ZVRyYWlsaW5nSGVhZGluZ3MoZWxlbWVudCk7XG5cdH1cblxuXHRwcml2YXRlIHJlbW92ZVRyYWlsaW5nSGVhZGluZ3MoZWxlbWVudDogRWxlbWVudCkge1xuXHRcdGxldCByZW1vdmVkQ291bnQgPSAwO1xuXG5cdFx0Y29uc3QgaGFzQ29udGVudEFmdGVyID0gKGVsOiBFbGVtZW50KTogYm9vbGVhbiA9PiB7XG5cdFx0XHQvLyBDaGVjayBpZiB0aGVyZSdzIGFueSBtZWFuaW5nZnVsIGNvbnRlbnQgYWZ0ZXIgdGhpcyBlbGVtZW50XG5cdFx0XHRsZXQgbmV4dENvbnRlbnQgPSAnJztcblx0XHRcdGxldCBzaWJsaW5nID0gZWwubmV4dFNpYmxpbmc7XG5cblx0XHRcdC8vIEZpcnN0IGNoZWNrIGRpcmVjdCBzaWJsaW5nc1xuXHRcdFx0d2hpbGUgKHNpYmxpbmcpIHtcblx0XHRcdFx0aWYgKHNpYmxpbmcubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG5cdFx0XHRcdFx0bmV4dENvbnRlbnQgKz0gc2libGluZy50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0fSBlbHNlIGlmIChzaWJsaW5nLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuXHRcdFx0XHRcdC8vIElmIHdlIGZpbmQgYW4gZWxlbWVudCBzaWJsaW5nLCBjaGVjayBpdHMgY29udGVudFxuXHRcdFx0XHRcdG5leHRDb250ZW50ICs9IChzaWJsaW5nIGFzIEVsZW1lbnQpLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBJZiB3ZSBmb3VuZCBtZWFuaW5nZnVsIGNvbnRlbnQgYXQgdGhpcyBsZXZlbCwgcmV0dXJuIHRydWVcblx0XHRcdGlmIChuZXh0Q29udGVudC50cmltKCkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIElmIG5vIGNvbnRlbnQgZm91bmQgYXQgdGhpcyBsZXZlbCBhbmQgd2UgaGF2ZSBhIHBhcmVudCxcblx0XHRcdC8vIGNoZWNrIGZvciBjb250ZW50IGFmdGVyIHRoZSBwYXJlbnRcblx0XHRcdGNvbnN0IHBhcmVudCA9IGVsLnBhcmVudEVsZW1lbnQ7XG5cdFx0XHRpZiAocGFyZW50ICYmIHBhcmVudCAhPT0gZWxlbWVudCkge1xuXHRcdFx0XHRyZXR1cm4gaGFzQ29udGVudEFmdGVyKHBhcmVudCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cdFx0Ly8gUHJvY2VzcyBhbGwgaGVhZGluZ3MgZnJvbSBib3R0b20gdG8gdG9wXG5cdFx0Y29uc3QgaGVhZGluZ3MgPSBBcnJheS5mcm9tKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaDEsIGgyLCBoMywgaDQsIGg1LCBoNicpKVxuXHRcdFx0LnJldmVyc2UoKTtcblxuXHRcdGhlYWRpbmdzLmZvckVhY2goaGVhZGluZyA9PiB7XG5cdFx0XHRpZiAoIWhhc0NvbnRlbnRBZnRlcihoZWFkaW5nKSkge1xuXHRcdFx0XHRoZWFkaW5nLnJlbW92ZSgpO1xuXHRcdFx0XHRyZW1vdmVkQ291bnQrKztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFN0b3AgcHJvY2Vzc2luZyBvbmNlIHdlIGZpbmQgYSBoZWFkaW5nIHdpdGggY29udGVudCBhZnRlciBpdFxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAocmVtb3ZlZENvdW50ID4gMCkge1xuXHRcdFx0dGhpcy5fbG9nKCdSZW1vdmVkIHRyYWlsaW5nIGhlYWRpbmdzOicsIHJlbW92ZWRDb3VudCk7XG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBoYW5kbGVIZWFkaW5ncyhlbGVtZW50OiBFbGVtZW50LCB0aXRsZTogc3RyaW5nKSB7XG5cdFx0Y29uc3QgaDFzID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDEnKTtcblxuXHRcdEFycmF5LmZyb20oaDFzKS5mb3JFYWNoKGgxID0+IHtcblx0XHRcdGNvbnN0IGgyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDInKTtcblx0XHRcdGgyLmlubmVySFRNTCA9IGgxLmlubmVySFRNTDtcblx0XHRcdC8vIENvcHkgYWxsb3dlZCBhdHRyaWJ1dGVzXG5cdFx0XHRBcnJheS5mcm9tKGgxLmF0dHJpYnV0ZXMpLmZvckVhY2goYXR0ciA9PiB7XG5cdFx0XHRcdGlmIChBTExPV0VEX0FUVFJJQlVURVMuaGFzKGF0dHIubmFtZSkpIHtcblx0XHRcdFx0XHRoMi5zZXRBdHRyaWJ1dGUoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRoMS5wYXJlbnROb2RlPy5yZXBsYWNlQ2hpbGQoaDIsIGgxKTtcblx0XHR9KTtcblxuXHRcdC8vIFJlbW92ZSBmaXJzdCBIMiBpZiBpdCBtYXRjaGVzIHRpdGxlXG5cdFx0Y29uc3QgaDJzID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDInKTtcblx0XHRpZiAoaDJzLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IGZpcnN0SDIgPSBoMnNbMF07XG5cdFx0XHRjb25zdCBmaXJzdEgyVGV4dCA9IGZpcnN0SDIudGV4dENvbnRlbnQ/LnRyaW0oKS50b0xvd2VyQ2FzZSgpIHx8ICcnO1xuXHRcdFx0Y29uc3Qgbm9ybWFsaXplZFRpdGxlID0gdGl0bGUudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cdFx0XHRpZiAobm9ybWFsaXplZFRpdGxlICYmIG5vcm1hbGl6ZWRUaXRsZSA9PT0gZmlyc3RIMlRleHQpIHtcblx0XHRcdFx0Zmlyc3RIMi5yZW1vdmUoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbW92ZUh0bWxDb21tZW50cyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0Y29uc3QgY29tbWVudHM6IENvbW1lbnRbXSA9IFtdO1xuXHRcdGNvbnN0IHdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIoXG5cdFx0XHRlbGVtZW50LFxuXHRcdFx0Tm9kZUZpbHRlci5TSE9XX0NPTU1FTlQsXG5cdFx0XHRudWxsXG5cdFx0KTtcblxuXHRcdGxldCBub2RlO1xuXHRcdHdoaWxlIChub2RlID0gd2Fsa2VyLm5leHROb2RlKCkpIHtcblx0XHRcdGNvbW1lbnRzLnB1c2gobm9kZSBhcyBDb21tZW50KTtcblx0XHR9XG5cblx0XHRjb21tZW50cy5mb3JFYWNoKGNvbW1lbnQgPT4ge1xuXHRcdFx0Y29tbWVudC5yZW1vdmUoKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuX2xvZygnUmVtb3ZlZCBIVE1MIGNvbW1lbnRzOicsIGNvbW1lbnRzLmxlbmd0aCk7XG5cdH1cblxuXHRwcml2YXRlIHN0cmlwVW53YW50ZWRBdHRyaWJ1dGVzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcblx0XHRsZXQgYXR0cmlidXRlQ291bnQgPSAwO1xuXG5cdFx0Y29uc3QgcHJvY2Vzc0VsZW1lbnQgPSAoZWw6IEVsZW1lbnQpID0+IHtcblx0XHRcdC8vIFNraXAgU1ZHIGVsZW1lbnRzIC0gcHJlc2VydmUgYWxsIHRoZWlyIGF0dHJpYnV0ZXNcblx0XHRcdGlmIChlbCBpbnN0YW5jZW9mIFNWR0VsZW1lbnQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBhdHRyaWJ1dGVzID0gQXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKTtcblx0XHRcdFxuXHRcdFx0YXR0cmlidXRlcy5mb3JFYWNoKGF0dHIgPT4ge1xuXHRcdFx0XHRjb25zdCBhdHRyTmFtZSA9IGF0dHIubmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRpZiAoIUFMTE9XRURfQVRUUklCVVRFUy5oYXMoYXR0ck5hbWUpKSB7XG5cdFx0XHRcdFx0ZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIubmFtZSk7XG5cdFx0XHRcdFx0YXR0cmlidXRlQ291bnQrKztcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHByb2Nlc3NFbGVtZW50KGVsZW1lbnQpO1xuXHRcdGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnKicpLmZvckVhY2gocHJvY2Vzc0VsZW1lbnQpO1xuXG5cdFx0dGhpcy5fbG9nKCdTdHJpcHBlZCBhdHRyaWJ1dGVzOicsIGF0dHJpYnV0ZUNvdW50KTtcblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlRW1wdHlFbGVtZW50cyhlbGVtZW50OiBFbGVtZW50KSB7XG5cdFx0bGV0IHJlbW92ZWRDb3VudCA9IDA7XG5cdFx0bGV0IGl0ZXJhdGlvbnMgPSAwO1xuXHRcdGxldCBrZWVwUmVtb3ZpbmcgPSB0cnVlO1xuXG5cdFx0d2hpbGUgKGtlZXBSZW1vdmluZykge1xuXHRcdFx0aXRlcmF0aW9ucysrO1xuXHRcdFx0a2VlcFJlbW92aW5nID0gZmFsc2U7XG5cdFx0XHQvLyBHZXQgYWxsIGVsZW1lbnRzIHdpdGhvdXQgY2hpbGRyZW4sIHdvcmtpbmcgZnJvbSBkZWVwZXN0IGZpcnN0XG5cdFx0XHRjb25zdCBlbXB0eUVsZW1lbnRzID0gQXJyYXkuZnJvbShlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykpLmZpbHRlcihlbCA9PiB7XG5cdFx0XHRcdGlmIChBTExPV0VEX0VNUFRZX0VMRU1FTlRTLmhhcyhlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBDaGVjayBpZiBlbGVtZW50IGhhcyBvbmx5IHdoaXRlc3BhY2Ugb3IgJm5ic3A7XG5cdFx0XHRcdGNvbnN0IHRleHRDb250ZW50ID0gZWwudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0XHRcdGNvbnN0IGhhc09ubHlXaGl0ZXNwYWNlID0gdGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA9PT0gMDtcblx0XHRcdFx0Y29uc3QgaGFzTmJzcCA9IHRleHRDb250ZW50LmluY2x1ZGVzKCdcXHUwMEEwJyk7IC8vIFVuaWNvZGUgbm9uLWJyZWFraW5nIHNwYWNlXG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBDaGVjayBpZiBlbGVtZW50IGhhcyBubyBtZWFuaW5nZnVsIGNoaWxkcmVuXG5cdFx0XHRcdGNvbnN0IGhhc05vQ2hpbGRyZW4gPSAhZWwuaGFzQ2hpbGROb2RlcygpIHx8IFxuXHRcdFx0XHRcdChBcnJheS5mcm9tKGVsLmNoaWxkTm9kZXMpLmV2ZXJ5KG5vZGUgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IG5vZGVUZXh0ID0gbm9kZS50ZXh0Q29udGVudCB8fCAnJztcblx0XHRcdFx0XHRcdFx0cmV0dXJuIG5vZGVUZXh0LnRyaW0oKS5sZW5ndGggPT09IDAgJiYgIW5vZGVUZXh0LmluY2x1ZGVzKCdcXHUwMEEwJyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdHJldHVybiBoYXNPbmx5V2hpdGVzcGFjZSAmJiAhaGFzTmJzcCAmJiBoYXNOb0NoaWxkcmVuO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChlbXB0eUVsZW1lbnRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0ZW1wdHlFbGVtZW50cy5mb3JFYWNoKGVsID0+IHtcblx0XHRcdFx0XHRlbC5yZW1vdmUoKTtcblx0XHRcdFx0XHRyZW1vdmVkQ291bnQrKztcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGtlZXBSZW1vdmluZyA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5fbG9nKCdSZW1vdmVkIGVtcHR5IGVsZW1lbnRzOicsIHtcblx0XHRcdGNvdW50OiByZW1vdmVkQ291bnQsXG5cdFx0XHRpdGVyYXRpb25zXG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIGNyZWF0ZUZvb3Rub3RlSXRlbShcblx0XHRmb290bm90ZU51bWJlcjogbnVtYmVyLFxuXHRcdGNvbnRlbnQ6IHN0cmluZyB8IEVsZW1lbnQsXG5cdFx0cmVmczogc3RyaW5nW11cblx0KTogSFRNTExJRWxlbWVudCB7XG5cdFx0Y29uc3QgbmV3SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cdFx0bmV3SXRlbS5jbGFzc05hbWUgPSAnZm9vdG5vdGUnO1xuXHRcdG5ld0l0ZW0uaWQgPSBgZm46JHtmb290bm90ZU51bWJlcn1gO1xuXG5cdFx0Ly8gSGFuZGxlIGNvbnRlbnRcblx0XHRpZiAodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRjb25zdCBwYXJhZ3JhcGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG5cdFx0XHRwYXJhZ3JhcGguaW5uZXJIVE1MID0gY29udGVudDtcblx0XHRcdG5ld0l0ZW0uYXBwZW5kQ2hpbGQocGFyYWdyYXBoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gR2V0IGFsbCBwYXJhZ3JhcGhzIGZyb20gdGhlIGNvbnRlbnRcblx0XHRcdGNvbnN0IHBhcmFncmFwaHMgPSBBcnJheS5mcm9tKGNvbnRlbnQucXVlcnlTZWxlY3RvckFsbCgncCcpKTtcblx0XHRcdGlmIChwYXJhZ3JhcGhzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHQvLyBJZiBubyBwYXJhZ3JhcGhzLCB3cmFwIGNvbnRlbnQgaW4gYSBwYXJhZ3JhcGhcblx0XHRcdFx0Y29uc3QgcGFyYWdyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuXHRcdFx0XHRwYXJhZ3JhcGguaW5uZXJIVE1MID0gY29udGVudC5pbm5lckhUTUw7XG5cdFx0XHRcdG5ld0l0ZW0uYXBwZW5kQ2hpbGQocGFyYWdyYXBoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIENvcHkgZXhpc3RpbmcgcGFyYWdyYXBoc1xuXHRcdFx0XHRwYXJhZ3JhcGhzLmZvckVhY2gocCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgbmV3UCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcblx0XHRcdFx0XHRuZXdQLmlubmVySFRNTCA9IHAuaW5uZXJIVE1MO1xuXHRcdFx0XHRcdG5ld0l0ZW0uYXBwZW5kQ2hpbGQobmV3UCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIEFkZCBiYWNrbGluayhzKSB0byB0aGUgbGFzdCBwYXJhZ3JhcGhcblx0XHRjb25zdCBsYXN0UGFyYWdyYXBoID0gbmV3SXRlbS5xdWVyeVNlbGVjdG9yKCdwOmxhc3Qtb2YtdHlwZScpIHx8IG5ld0l0ZW07XG5cdFx0cmVmcy5mb3JFYWNoKChyZWZJZCwgaW5kZXgpID0+IHtcblx0XHRcdGNvbnN0IGJhY2tsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXHRcdFx0YmFja2xpbmsuaHJlZiA9IGAjJHtyZWZJZH1gO1xuXHRcdFx0YmFja2xpbmsudGl0bGUgPSAncmV0dXJuIHRvIGFydGljbGUnO1xuXHRcdFx0YmFja2xpbmsuY2xhc3NOYW1lID0gJ2Zvb3Rub3RlLWJhY2tyZWYnO1xuXHRcdFx0YmFja2xpbmsuaW5uZXJIVE1MID0gJ+KGqSc7XG5cdFx0XHRpZiAoaW5kZXggPCByZWZzLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0YmFja2xpbmsuaW5uZXJIVE1MICs9ICcgJztcblx0XHRcdH1cblx0XHRcdGxhc3RQYXJhZ3JhcGguYXBwZW5kQ2hpbGQoYmFja2xpbmspO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIG5ld0l0ZW07XG5cdH1cblxuXHRwcml2YXRlIGNvbGxlY3RGb290bm90ZXMoZWxlbWVudDogRWxlbWVudCk6IEZvb3Rub3RlQ29sbGVjdGlvbiB7XG5cdFx0Y29uc3QgZm9vdG5vdGVzOiBGb290bm90ZUNvbGxlY3Rpb24gPSB7fTtcblx0XHRsZXQgZm9vdG5vdGVDb3VudCA9IDE7XG5cdFx0Y29uc3QgcHJvY2Vzc2VkSWRzID0gbmV3IFNldDxzdHJpbmc+KCk7IC8vIFRyYWNrIHByb2Nlc3NlZCBJRHNcblxuXHRcdC8vIENvbGxlY3QgYWxsIGZvb3Rub3RlcyBhbmQgdGhlaXIgSURzIGZyb20gZm9vdG5vdGUgbGlzdHNcblx0XHRjb25zdCBmb290bm90ZUxpc3RzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKEZPT1ROT1RFX0xJU1RfU0VMRUNUT1JTKTtcblx0XHRmb290bm90ZUxpc3RzLmZvckVhY2gobGlzdCA9PiB7XG5cdFx0XHQvLyBTdWJzdGFjayBoYXMgaW5kaXZpZHVhbCBmb290bm90ZSBkaXZzIHdpdGggbm8gcGFyZW50XG5cdFx0XHRpZiAobGlzdC5tYXRjaGVzKCdkaXYuZm9vdG5vdGVbZGF0YS1jb21wb25lbnQtbmFtZT1cIkZvb3Rub3RlVG9ET01cIl0nKSkge1xuXHRcdFx0XHRjb25zdCBhbmNob3IgPSBsaXN0LnF1ZXJ5U2VsZWN0b3IoJ2EuZm9vdG5vdGUtbnVtYmVyJyk7XG5cdFx0XHRcdGNvbnN0IGNvbnRlbnQgPSBsaXN0LnF1ZXJ5U2VsZWN0b3IoJy5mb290bm90ZS1jb250ZW50Jyk7XG5cdFx0XHRcdGlmIChhbmNob3IgJiYgY29udGVudCkge1xuXHRcdFx0XHRcdGNvbnN0IGlkID0gYW5jaG9yLmlkLnJlcGxhY2UoJ2Zvb3Rub3RlLScsICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdGlmIChpZCAmJiAhcHJvY2Vzc2VkSWRzLmhhcyhpZCkpIHtcblx0XHRcdFx0XHRcdGZvb3Rub3Rlc1tmb290bm90ZUNvdW50XSA9IHtcblx0XHRcdFx0XHRcdFx0Y29udGVudDogY29udGVudCxcblx0XHRcdFx0XHRcdFx0b3JpZ2luYWxJZDogaWQsXG5cdFx0XHRcdFx0XHRcdHJlZnM6IFtdXG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0cHJvY2Vzc2VkSWRzLmFkZChpZCk7XG5cdFx0XHRcdFx0XHRmb290bm90ZUNvdW50Kys7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ29tbW9uIGZvcm1hdCB1c2luZyBPTC9VTCBhbmQgTEkgZWxlbWVudHNcblx0XHRcdGNvbnN0IGl0ZW1zID0gbGlzdC5xdWVyeVNlbGVjdG9yQWxsKCdsaSwgZGl2W3JvbGU9XCJsaXN0aXRlbVwiXScpO1xuXHRcdFx0aXRlbXMuZm9yRWFjaChsaSA9PiB7XG5cdFx0XHRcdGxldCBpZCA9ICcnO1xuXHRcdFx0XHRsZXQgY29udGVudDogRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG5cdFx0XHRcdC8vIEhhbmRsZSBjaXRhdGlvbnMgd2l0aCAuY2l0YXRpb25zIGNsYXNzXG5cdFx0XHRcdGNvbnN0IGNpdGF0aW9uc0RpdiA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy5jaXRhdGlvbnMnKTtcblx0XHRcdFx0aWYgKGNpdGF0aW9uc0Rpdj8uaWQ/LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgncicpKSB7XG5cdFx0XHRcdFx0aWQgPSBjaXRhdGlvbnNEaXYuaWQudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHQvLyBMb29rIGZvciBjaXRhdGlvbiBjb250ZW50IHdpdGhpbiB0aGUgY2l0YXRpb25zIGRpdlxuXHRcdFx0XHRcdGNvbnN0IGNpdGF0aW9uQ29udGVudCA9IGNpdGF0aW9uc0Rpdi5xdWVyeVNlbGVjdG9yKCcuY2l0YXRpb24tY29udGVudCcpO1xuXHRcdFx0XHRcdGlmIChjaXRhdGlvbkNvbnRlbnQpIHtcblx0XHRcdFx0XHRcdGNvbnRlbnQgPSBjaXRhdGlvbkNvbnRlbnQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIEV4dHJhY3QgSUQgZnJvbSB2YXJpb3VzIGZvcm1hdHNcblx0XHRcdFx0XHRpZiAobGkuaWQudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdiaWIuYmliJykpIHtcblx0XHRcdFx0XHRcdGlkID0gbGkuaWQucmVwbGFjZSgnYmliLmJpYicsICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAobGkuaWQudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCdmbjonKSkge1xuXHRcdFx0XHRcdFx0aWQgPSBsaS5pZC5yZXBsYWNlKCdmbjonLCAnJykudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGxpLmlkLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnZm4nKSkge1xuXHRcdFx0XHRcdFx0aWQgPSBsaS5pZC5yZXBsYWNlKCdmbicsICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRcdC8vIE5hdHVyZS5jb21cblx0XHRcdFx0XHR9IGVsc2UgaWYgKGxpLmhhc0F0dHJpYnV0ZSgnZGF0YS1jb3VudGVyJykpIHtcblx0XHRcdFx0XHRcdGlkID0gbGkuZ2V0QXR0cmlidXRlKCdkYXRhLWNvdW50ZXInKT8ucmVwbGFjZSgvXFwuJC8sICcnKT8udG9Mb3dlckNhc2UoKSB8fCAnJztcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBsaS5pZC5zcGxpdCgnLycpLnBvcCgpPy5tYXRjaCgvY2l0ZV9ub3RlLSguKykvKTtcblx0XHRcdFx0XHRcdGlkID0gbWF0Y2ggPyBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpIDogbGkuaWQudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y29udGVudCA9IGxpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGlkICYmICFwcm9jZXNzZWRJZHMuaGFzKGlkKSkge1xuXHRcdFx0XHRcdGZvb3Rub3Rlc1tmb290bm90ZUNvdW50XSA9IHtcblx0XHRcdFx0XHRcdGNvbnRlbnQ6IGNvbnRlbnQgfHwgbGksXG5cdFx0XHRcdFx0XHRvcmlnaW5hbElkOiBpZCxcblx0XHRcdFx0XHRcdHJlZnM6IFtdXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRwcm9jZXNzZWRJZHMuYWRkKGlkKTtcblx0XHRcdFx0XHRmb290bm90ZUNvdW50Kys7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGZvb3Rub3Rlcztcblx0fVxuXG5cdHByaXZhdGUgZmluZE91dGVyRm9vdG5vdGVDb250YWluZXIoZWw6IEVsZW1lbnQpOiBFbGVtZW50IHtcblx0XHRsZXQgY3VycmVudDogRWxlbWVudCB8IG51bGwgPSBlbDtcblx0XHRsZXQgcGFyZW50OiBFbGVtZW50IHwgbnVsbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG5cdFx0XG5cdFx0Ly8gS2VlcCBnb2luZyB1cCB1bnRpbCB3ZSBmaW5kIGFuIGVsZW1lbnQgdGhhdCdzIG5vdCBhIHNwYW4gb3Igc3VwXG5cdFx0d2hpbGUgKHBhcmVudCAmJiAoXG5cdFx0XHRwYXJlbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc3BhbicgfHwgXG5cdFx0XHRwYXJlbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc3VwJ1xuXHRcdCkpIHtcblx0XHRcdGN1cnJlbnQgPSBwYXJlbnQ7XG5cdFx0XHRwYXJlbnQgPSBwYXJlbnQucGFyZW50RWxlbWVudDtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIGN1cnJlbnQ7XG5cdH1cblxuXHQvLyBFdmVyeSBmb290bm90ZSByZWZlcmVuY2Ugc2hvdWxkIGJlIGEgc3VwIGVsZW1lbnQgd2l0aCBhbiBhbmNob3IgaW5zaWRlXG5cdC8vIGUuZy4gPHN1cCBpZD1cImZucmVmOjFcIj48YSBocmVmPVwiI2ZuOjFcIj4xPC9hPjwvc3VwPlxuXHRwcml2YXRlIGNyZWF0ZUZvb3Rub3RlUmVmZXJlbmNlKGZvb3Rub3RlTnVtYmVyOiBzdHJpbmcsIHJlZklkOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG5cdFx0Y29uc3Qgc3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3VwJyk7XG5cdFx0c3VwLmlkID0gcmVmSWQ7XG5cdFx0Y29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblx0XHRsaW5rLmhyZWYgPSBgI2ZuOiR7Zm9vdG5vdGVOdW1iZXJ9YDtcblx0XHRsaW5rLnRleHRDb250ZW50ID0gZm9vdG5vdGVOdW1iZXI7XG5cdFx0c3VwLmFwcGVuZENoaWxkKGxpbmspO1xuXHRcdHJldHVybiBzdXA7XG5cdH1cblxuXHRwcml2YXRlIHN0YW5kYXJkaXplRm9vdG5vdGVzKGVsZW1lbnQ6IEVsZW1lbnQpIHtcblx0XHRjb25zdCBmb290bm90ZXMgPSB0aGlzLmNvbGxlY3RGb290bm90ZXMoZWxlbWVudCk7XG5cblx0XHQvLyBTdGFuZGFyZGl6ZSBpbmxpbmUgZm9vdG5vdGVzIHVzaW5nIHRoZSBjb2xsZWN0ZWQgSURzXG5cdFx0Y29uc3QgZm9vdG5vdGVJbmxpbmVSZWZlcmVuY2VzID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKEZPT1ROT1RFX0lOTElORV9SRUZFUkVOQ0VTKTtcblx0XHRcblx0XHQvLyBHcm91cCByZWZlcmVuY2VzIGJ5IHRoZWlyIHBhcmVudCBzdXAgZWxlbWVudFxuXHRcdGNvbnN0IHN1cEdyb3VwcyA9IG5ldyBNYXA8RWxlbWVudCwgRWxlbWVudFtdPigpO1xuXHRcdFxuXHRcdGZvb3Rub3RlSW5saW5lUmVmZXJlbmNlcy5mb3JFYWNoKGVsID0+IHtcblx0XHRcdGlmICghKGVsIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm47XG5cblx0XHRcdGxldCBmb290bm90ZUlkID0gJyc7XG5cdFx0XHRsZXQgZm9vdG5vdGVDb250ZW50ID0gJyc7XG5cblx0XHRcdC8vIEV4dHJhY3QgZm9vdG5vdGUgSUQgYmFzZWQgb24gZWxlbWVudCB0eXBlXG5cdFx0XHQvLyBOYXR1cmUuY29tXG5cdFx0XHRpZiAoZWwubWF0Y2hlcygnYVtpZF49XCJyZWYtbGlua1wiXScpKSB7XG5cdFx0XHRcdGZvb3Rub3RlSWQgPSBlbC50ZXh0Q29udGVudD8udHJpbSgpIHx8ICcnO1xuXHRcdFx0Ly8gU2NpZW5jZS5vcmdcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnYVtyb2xlPVwiZG9jLWJpYmxpb3JlZlwiXScpKSB7XG5cdFx0XHRcdGNvbnN0IHhtbFJpZCA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS14bWwtcmlkJyk7XG5cdFx0XHRcdGlmICh4bWxSaWQpIHtcblx0XHRcdFx0XHRmb290bm90ZUlkID0geG1sUmlkO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnN0IGhyZWYgPSBlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblx0XHRcdFx0XHRpZiAoaHJlZj8uc3RhcnRzV2l0aCgnI2NvcmUtUicpKSB7XG5cdFx0XHRcdFx0XHRmb290bm90ZUlkID0gaHJlZi5yZXBsYWNlKCcjY29yZS0nLCAnJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHQvLyBTdWJzdGFja1xuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdhLmZvb3Rub3RlLWFuY2hvciwgc3Bhbi5mb290bm90ZS1ob3ZlcmNhcmQtdGFyZ2V0IGEnKSkge1xuXHRcdFx0XHRjb25zdCBpZCA9IGVsLmlkPy5yZXBsYWNlKCdmb290bm90ZS1hbmNob3ItJywgJycpIHx8ICcnO1xuXHRcdFx0XHRpZiAoaWQpIHtcblx0XHRcdFx0XHRmb290bm90ZUlkID0gaWQudG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0fVxuXHRcdFx0Ly8gQXJ4aXZcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnY2l0ZS5sdHhfY2l0ZScpKSB7XG5cdFx0XHRcdGNvbnN0IGxpbmsgPSBlbC5xdWVyeVNlbGVjdG9yKCdhJyk7XG5cdFx0XHRcdGlmIChsaW5rKSB7XG5cdFx0XHRcdFx0Y29uc3QgaHJlZiA9IGxpbmsuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cdFx0XHRcdFx0aWYgKGhyZWYpIHtcblx0XHRcdFx0XHRcdGNvbnN0IG1hdGNoID0gaHJlZi5zcGxpdCgnLycpLnBvcCgpPy5tYXRjaCgvYmliXFwuYmliKFxcZCspLyk7XG5cdFx0XHRcdFx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdFx0XHRcdFx0Zm9vdG5vdGVJZCA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGVsLm1hdGNoZXMoJ3N1cC5yZWZlcmVuY2UnKSkge1xuXHRcdFx0XHRjb25zdCBsaW5rcyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKTtcblx0XHRcdFx0QXJyYXkuZnJvbShsaW5rcykuZm9yRWFjaChsaW5rID0+IHtcblx0XHRcdFx0XHRjb25zdCBocmVmID0gbGluay5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblx0XHRcdFx0XHRpZiAoaHJlZikge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWF0Y2ggPSBocmVmLnNwbGl0KCcvJykucG9wKCk/Lm1hdGNoKC8oPzpjaXRlX25vdGV8Y2l0ZV9yZWYpLSguKykvKTtcblx0XHRcdFx0XHRcdGlmIChtYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRmb290bm90ZUlkID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdzdXBbaWRePVwiZm5yZWY6XCJdJykpIHtcblx0XHRcdFx0Zm9vdG5vdGVJZCA9IGVsLmlkLnJlcGxhY2UoJ2ZucmVmOicsICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdzdXBbaWRePVwiZm5yXCJdJykpIHtcblx0XHRcdFx0Zm9vdG5vdGVJZCA9IGVsLmlkLnJlcGxhY2UoJ2ZucicsICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdzcGFuLmZvb3Rub3RlLXJlZmVyZW5jZScpKSB7XG5cdFx0XHRcdGZvb3Rub3RlSWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtZm9vdG5vdGUtaWQnKSB8fCAnJztcblx0XHRcdH0gZWxzZSBpZiAoZWwubWF0Y2hlcygnc3Bhbi5mb290bm90ZS1saW5rJykpIHtcblx0XHRcdFx0Zm9vdG5vdGVJZCA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1mb290bm90ZS1pZCcpIHx8ICcnO1xuXHRcdFx0XHRmb290bm90ZUNvbnRlbnQgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtZm9vdG5vdGUtY29udGVudCcpIHx8ICcnO1xuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdhLmNpdGF0aW9uJykpIHtcblx0XHRcdFx0Zm9vdG5vdGVJZCA9IGVsLnRleHRDb250ZW50Py50cmltKCkgfHwgJyc7XG5cdFx0XHRcdGZvb3Rub3RlQ29udGVudCA9IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnO1xuXHRcdFx0fSBlbHNlIGlmIChlbC5tYXRjaGVzKCdhW2lkXj1cImZucmVmXCJdJykpIHtcblx0XHRcdFx0Zm9vdG5vdGVJZCA9IGVsLmlkLnJlcGxhY2UoJ2ZucmVmJywgJycpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBPdGhlciBjaXRhdGlvbiB0eXBlc1xuXHRcdFx0XHRjb25zdCBocmVmID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cdFx0XHRcdGlmIChocmVmKSB7XG5cdFx0XHRcdFx0Y29uc3QgaWQgPSBocmVmLnJlcGxhY2UoL15bI10vLCAnJyk7XG5cdFx0XHRcdFx0Zm9vdG5vdGVJZCA9IGlkLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKGZvb3Rub3RlSWQpIHtcblx0XHRcdFx0Ly8gRmluZCB0aGUgZm9vdG5vdGUgbnVtYmVyIGJ5IG1hdGNoaW5nIHRoZSBvcmlnaW5hbCBJRFxuXHRcdFx0XHRjb25zdCBmb290bm90ZUVudHJ5ID0gT2JqZWN0LmVudHJpZXMoZm9vdG5vdGVzKS5maW5kKFxuXHRcdFx0XHRcdChbXywgZGF0YV0pID0+IGRhdGEub3JpZ2luYWxJZCA9PT0gZm9vdG5vdGVJZC50b0xvd2VyQ2FzZSgpXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0aWYgKGZvb3Rub3RlRW50cnkpIHtcblx0XHRcdFx0XHRjb25zdCBbZm9vdG5vdGVOdW1iZXIsIGZvb3Rub3RlRGF0YV0gPSBmb290bm90ZUVudHJ5O1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIENyZWF0ZSBmb290bm90ZSByZWZlcmVuY2UgSURcblx0XHRcdFx0XHRjb25zdCByZWZJZCA9IGZvb3Rub3RlRGF0YS5yZWZzLmxlbmd0aCA+IDAgPyBcblx0XHRcdFx0XHRcdGBmbnJlZjoke2Zvb3Rub3RlTnVtYmVyfS0ke2Zvb3Rub3RlRGF0YS5yZWZzLmxlbmd0aCArIDF9YCA6IFxuXHRcdFx0XHRcdFx0YGZucmVmOiR7Zm9vdG5vdGVOdW1iZXJ9YDtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRmb290bm90ZURhdGEucmVmcy5wdXNoKHJlZklkKTtcblxuXHRcdFx0XHRcdC8vIEZpbmQgdGhlIG91dGVybW9zdCBjb250YWluZXIgKHNwYW4gb3Igc3VwKVxuXHRcdFx0XHRcdGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuZmluZE91dGVyRm9vdG5vdGVDb250YWluZXIoZWwpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIElmIGNvbnRhaW5lciBpcyBhIHN1cCwgZ3JvdXAgcmVmZXJlbmNlc1xuXHRcdFx0XHRcdGlmIChjb250YWluZXIudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc3VwJykge1xuXHRcdFx0XHRcdFx0aWYgKCFzdXBHcm91cHMuaGFzKGNvbnRhaW5lcikpIHtcblx0XHRcdFx0XHRcdFx0c3VwR3JvdXBzLnNldChjb250YWluZXIsIFtdKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNvbnN0IGdyb3VwID0gc3VwR3JvdXBzLmdldChjb250YWluZXIpITtcblx0XHRcdFx0XHRcdGdyb3VwLnB1c2godGhpcy5jcmVhdGVGb290bm90ZVJlZmVyZW5jZShmb290bm90ZU51bWJlciwgcmVmSWQpKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gUmVwbGFjZSB0aGUgY29udGFpbmVyIGRpcmVjdGx5XG5cdFx0XHRcdFx0XHRjb250YWluZXIucmVwbGFjZVdpdGgodGhpcy5jcmVhdGVGb290bm90ZVJlZmVyZW5jZShmb290bm90ZU51bWJlciwgcmVmSWQpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIEhhbmRsZSBncm91cGVkIHJlZmVyZW5jZXNcblx0XHRzdXBHcm91cHMuZm9yRWFjaCgocmVmZXJlbmNlcywgY29udGFpbmVyKSA9PiB7XG5cdFx0XHRpZiAocmVmZXJlbmNlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdC8vIENyZWF0ZSBhIGRvY3VtZW50IGZyYWdtZW50IHRvIGhvbGQgYWxsIHRoZSByZWZlcmVuY2VzXG5cdFx0XHRcdGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gQWRkIGVhY2ggcmVmZXJlbmNlIGFzIGl0cyBvd24gc3VwIGVsZW1lbnRcblx0XHRcdFx0cmVmZXJlbmNlcy5mb3JFYWNoKChyZWYsIGluZGV4KSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgbGluayA9IHJlZi5xdWVyeVNlbGVjdG9yKCdhJyk7XG5cdFx0XHRcdFx0aWYgKGxpbmspIHtcblx0XHRcdFx0XHRcdGNvbnN0IHN1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N1cCcpO1xuXHRcdFx0XHRcdFx0c3VwLmlkID0gcmVmLmlkO1xuXHRcdFx0XHRcdFx0c3VwLmFwcGVuZENoaWxkKGxpbmsuY2xvbmVOb2RlKHRydWUpKTtcblx0XHRcdFx0XHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKHN1cCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdGNvbnRhaW5lci5yZXBsYWNlV2l0aChmcmFnbWVudCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBDcmVhdGUgdGhlIHN0YW5kYXJkaXplZCBmb290bm90ZSBsaXN0XG5cdFx0Y29uc3QgbmV3TGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvb3Rub3RlcycpO1xuXHRcdG5ld0xpc3QuY2xhc3NOYW1lID0gJ2Zvb3Rub3Rlcyc7XG5cdFx0Y29uc3Qgb3JkZXJlZExpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvbCcpO1xuXG5cdFx0Ly8gQ3JlYXRlIGZvb3Rub3RlIGl0ZW1zIGluIG9yZGVyXG5cdFx0T2JqZWN0LmVudHJpZXMoZm9vdG5vdGVzKS5mb3JFYWNoKChbbnVtYmVyLCBkYXRhXSkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3SXRlbSA9IHRoaXMuY3JlYXRlRm9vdG5vdGVJdGVtKFxuXHRcdFx0XHRwYXJzZUludChudW1iZXIpLFxuXHRcdFx0XHRkYXRhLmNvbnRlbnQsXG5cdFx0XHRcdGRhdGEucmVmc1xuXHRcdFx0KTtcblx0XHRcdG9yZGVyZWRMaXN0LmFwcGVuZENoaWxkKG5ld0l0ZW0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gUmVtb3ZlIG9yaWdpbmFsIGZvb3Rub3RlIGxpc3RzXG5cdFx0Y29uc3QgZm9vdG5vdGVMaXN0cyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChGT09UTk9URV9MSVNUX1NFTEVDVE9SUyk7XG5cdFx0Zm9vdG5vdGVMaXN0cy5mb3JFYWNoKGxpc3QgPT4gbGlzdC5yZW1vdmUoKSk7XG5cblx0XHQvLyBJZiB3ZSBoYXZlIGFueSBmb290bm90ZXMsIGFkZCB0aGUgbmV3IGxpc3QgdG8gdGhlIGRvY3VtZW50XG5cdFx0aWYgKG9yZGVyZWRMaXN0LmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcblx0XHRcdG5ld0xpc3QuYXBwZW5kQ2hpbGQob3JkZXJlZExpc3QpO1xuXHRcdFx0ZWxlbWVudC5hcHBlbmRDaGlsZChuZXdMaXN0KTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGhhbmRsZUxhenlJbWFnZXMoZWxlbWVudDogRWxlbWVudCkge1xuXHRcdGxldCBwcm9jZXNzZWRDb3VudCA9IDA7XG5cdFx0Y29uc3QgbGF6eUltYWdlcyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW1nW2RhdGEtc3JjXSwgaW1nW2RhdGEtc3Jjc2V0XScpO1xuXG5cdFx0bGF6eUltYWdlcy5mb3JFYWNoKGltZyA9PiB7XG5cdFx0XHRpZiAoIShpbWcgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSkgcmV0dXJuO1xuXG5cdFx0XHQvLyBIYW5kbGUgZGF0YS1zcmNcblx0XHRcdGNvbnN0IGRhdGFTcmMgPSBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpO1xuXHRcdFx0aWYgKGRhdGFTcmMgJiYgIWltZy5zcmMpIHtcblx0XHRcdFx0aW1nLnNyYyA9IGRhdGFTcmM7XG5cdFx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0XHR9XG5cblx0XHRcdC8vIEhhbmRsZSBkYXRhLXNyY3NldFxuXHRcdFx0Y29uc3QgZGF0YVNyY3NldCA9IGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3Jjc2V0Jyk7XG5cdFx0XHRpZiAoZGF0YVNyY3NldCAmJiAhaW1nLnNyY3NldCkge1xuXHRcdFx0XHRpbWcuc3Jjc2V0ID0gZGF0YVNyY3NldDtcblx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdH1cblxuXHRcdFx0Ly8gUmVtb3ZlIGxhenkgbG9hZGluZyByZWxhdGVkIGNsYXNzZXMgYW5kIGF0dHJpYnV0ZXNcblx0XHRcdGltZy5jbGFzc0xpc3QucmVtb3ZlKCdsYXp5JywgJ2xhenlsb2FkJyk7XG5cdFx0XHRpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWxsLXN0YXR1cycpO1xuXHRcdFx0aW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcblx0XHRcdGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3Jjc2V0Jyk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLl9sb2coJ1Byb2Nlc3NlZCBsYXp5IGltYWdlczonLCBwcm9jZXNzZWRDb3VudCk7XG5cdH1cblxuXHRwcml2YXRlIHN0YW5kYXJkaXplRWxlbWVudHMoZWxlbWVudDogRWxlbWVudCkge1xuXHRcdGxldCBwcm9jZXNzZWRDb3VudCA9IDA7XG5cblx0XHQvLyBDb252ZXJ0IGVsZW1lbnRzIGJhc2VkIG9uIHN0YW5kYXJkaXphdGlvbiBydWxlc1xuXHRcdEVMRU1FTlRfU1RBTkRBUkRJWkFUSU9OX1JVTEVTLmZvckVhY2gocnVsZSA9PiB7XG5cdFx0XHRjb25zdCBlbGVtZW50cyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChydWxlLnNlbGVjdG9yKTtcblx0XHRcdGVsZW1lbnRzLmZvckVhY2goZWwgPT4ge1xuXHRcdFx0XHRpZiAocnVsZS50cmFuc2Zvcm0pIHtcblx0XHRcdFx0XHQvLyBJZiB0aGVyZSdzIGEgdHJhbnNmb3JtIGZ1bmN0aW9uLCB1c2UgaXQgdG8gY3JlYXRlIHRoZSBuZXcgZWxlbWVudFxuXHRcdFx0XHRcdGNvbnN0IHRyYW5zZm9ybWVkID0gcnVsZS50cmFuc2Zvcm0oZWwpO1xuXHRcdFx0XHRcdGVsLnJlcGxhY2VXaXRoKHRyYW5zZm9ybWVkKTtcblx0XHRcdFx0XHRwcm9jZXNzZWRDb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIENvbnZlcnQgbGl0ZS15b3V0dWJlIGVsZW1lbnRzXG5cdFx0Y29uc3QgbGl0ZVlvdXR1YmVFbGVtZW50cyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnbGl0ZS15b3V0dWJlJyk7XG5cdFx0bGl0ZVlvdXR1YmVFbGVtZW50cy5mb3JFYWNoKGVsID0+IHtcblx0XHRcdGNvbnN0IHZpZGVvSWQgPSBlbC5nZXRBdHRyaWJ1dGUoJ3ZpZGVvaWQnKTtcblx0XHRcdGlmICghdmlkZW9JZCkgcmV0dXJuO1xuXG5cdFx0XHRjb25zdCBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcblx0XHRcdGlmcmFtZS53aWR0aCA9ICc1NjAnO1xuXHRcdFx0aWZyYW1lLmhlaWdodCA9ICczMTUnO1xuXHRcdFx0aWZyYW1lLnNyYyA9IGBodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8ke3ZpZGVvSWR9YDtcblx0XHRcdGlmcmFtZS50aXRsZSA9IGVsLmdldEF0dHJpYnV0ZSgndmlkZW90aXRsZScpIHx8ICdZb3VUdWJlIHZpZGVvIHBsYXllcic7XG5cdFx0XHRpZnJhbWUuZnJhbWVCb3JkZXIgPSAnMCc7XG5cdFx0XHRpZnJhbWUuYWxsb3cgPSAnYWNjZWxlcm9tZXRlcjsgYXV0b3BsYXk7IGNsaXBib2FyZC13cml0ZTsgZW5jcnlwdGVkLW1lZGlhOyBneXJvc2NvcGU7IHBpY3R1cmUtaW4tcGljdHVyZTsgd2ViLXNoYXJlJztcblx0XHRcdGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2FsbG93ZnVsbHNjcmVlbicsICcnKTtcblxuXHRcdFx0ZWwucmVwbGFjZVdpdGgoaWZyYW1lKTtcblx0XHRcdHByb2Nlc3NlZENvdW50Kys7XG5cdFx0fSk7XG5cblx0XHQvLyBBZGQgZnV0dXJlIGVtYmVkIGNvbnZlcnNpb25zIChUd2l0dGVyLCBJbnN0YWdyYW0sIGV0Yy4pXG5cblx0XHR0aGlzLl9sb2coJ0NvbnZlcnRlZCBlbWJlZGRlZCBlbGVtZW50czonLCBwcm9jZXNzZWRDb3VudCk7XG5cdH1cblxuXHQvLyBGaW5kIHNtYWxsIElNRyBhbmQgU1ZHIGVsZW1lbnRzXG5cdHByaXZhdGUgZmluZFNtYWxsSW1hZ2VzKGRvYzogRG9jdW1lbnQpOiBTZXQ8c3RyaW5nPiB7XG5cdFx0Y29uc3QgTUlOX0RJTUVOU0lPTiA9IDMzO1xuXHRcdGNvbnN0IHNtYWxsSW1hZ2VzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cdFx0Y29uc3QgdHJhbnNmb3JtUmVnZXggPSAvc2NhbGVcXCgoW1xcZC5dKylcXCkvO1xuXHRcdGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdGxldCBwcm9jZXNzZWRDb3VudCA9IDA7XG5cblx0XHQvLyAxLiBSZWFkIHBoYXNlIC0gR2F0aGVyIGFsbCBlbGVtZW50cyBpbiBhIHNpbmdsZSBwYXNzXG5cdFx0Y29uc3QgZWxlbWVudHMgPSBbXG5cdFx0XHQuLi5BcnJheS5mcm9tKGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJykpLFxuXHRcdFx0Li4uQXJyYXkuZnJvbShkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3N2ZycpKVxuXHRcdF0uZmlsdGVyKGVsZW1lbnQgPT4ge1xuXHRcdFx0Ly8gU2tpcCBsYXp5LWxvYWRlZCBpbWFnZXMgdGhhdCBoYXZlbid0IGJlZW4gcHJvY2Vzc2VkIHlldFxuXHRcdFx0aWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB7XG5cdFx0XHRcdGNvbnN0IGlzTGF6eSA9IGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdsYXp5JykgfHwgXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2xhenlsb2FkJykgfHxcblx0XHRcdFx0XHRlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnZGF0YS1zcmMnKSB8fFxuXHRcdFx0XHRcdGVsZW1lbnQuaGFzQXR0cmlidXRlKCdkYXRhLXNyY3NldCcpO1xuXHRcdFx0XHRyZXR1cm4gIWlzTGF6eTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0pO1xuXG5cdFx0aWYgKGVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIHNtYWxsSW1hZ2VzO1xuXHRcdH1cblxuXHRcdC8vIDIuIEJhdGNoIHByb2Nlc3MgLSBDb2xsZWN0IGFsbCBtZWFzdXJlbWVudHMgaW4gb25lIGdvXG5cdFx0Y29uc3QgbWVhc3VyZW1lbnRzID0gZWxlbWVudHMubWFwKGVsZW1lbnQgPT4gKHtcblx0XHRcdGVsZW1lbnQsXG5cdFx0XHQvLyBTdGF0aWMgYXR0cmlidXRlcyAobm8gcmVmbG93KVxuXHRcdFx0bmF0dXJhbFdpZHRoOiBlbGVtZW50IGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCA/IGVsZW1lbnQubmF0dXJhbFdpZHRoIDogMCxcblx0XHRcdG5hdHVyYWxIZWlnaHQ6IGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50ID8gZWxlbWVudC5uYXR1cmFsSGVpZ2h0IDogMCxcblx0XHRcdGF0dHJXaWR0aDogcGFyc2VJbnQoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3dpZHRoJykgfHwgJzAnKSxcblx0XHRcdGF0dHJIZWlnaHQ6IHBhcnNlSW50KGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdoZWlnaHQnKSB8fCAnMCcpXG5cdFx0fSkpO1xuXG5cdFx0Ly8gMy4gQmF0Y2ggY29tcHV0ZSBzdHlsZXMgLSBQcm9jZXNzIGluIGNodW5rcyB0byBhdm9pZCBsb25nIHRhc2tzXG5cdFx0Y29uc3QgQkFUQ0hfU0laRSA9IDUwO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbWVhc3VyZW1lbnRzLmxlbmd0aDsgaSArPSBCQVRDSF9TSVpFKSB7XG5cdFx0XHRjb25zdCBiYXRjaCA9IG1lYXN1cmVtZW50cy5zbGljZShpLCBpICsgQkFUQ0hfU0laRSk7XG5cdFx0XHRcblx0XHRcdHRyeSB7XG5cdFx0XHRcdC8vIFJlYWQgcGhhc2UgLSBjb21wdXRlIGFsbCBzdHlsZXMgYXQgb25jZVxuXHRcdFx0XHRjb25zdCBzdHlsZXMgPSBiYXRjaC5tYXAoKHsgZWxlbWVudCB9KSA9PiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KSk7XG5cdFx0XHRcdGNvbnN0IHJlY3RzID0gYmF0Y2gubWFwKCh7IGVsZW1lbnQgfSkgPT4gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBQcm9jZXNzIHBoYXNlIC0gbm8gRE9NIG9wZXJhdGlvbnNcblx0XHRcdFx0YmF0Y2guZm9yRWFjaCgobWVhc3VyZW1lbnQsIGluZGV4KSA9PiB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IHN0eWxlID0gc3R5bGVzW2luZGV4XTtcblx0XHRcdFx0XHRcdGNvbnN0IHJlY3QgPSByZWN0c1tpbmRleF07XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdC8vIEdldCB0cmFuc2Zvcm0gc2NhbGUgaW4gdGhlIHNhbWUgYmF0Y2hcblx0XHRcdFx0XHRcdGNvbnN0IHRyYW5zZm9ybSA9IHN0eWxlLnRyYW5zZm9ybTtcblx0XHRcdFx0XHRcdGNvbnN0IHNjYWxlID0gdHJhbnNmb3JtID8gXG5cdFx0XHRcdFx0XHRcdHBhcnNlRmxvYXQodHJhbnNmb3JtLm1hdGNoKHRyYW5zZm9ybVJlZ2V4KT8uWzFdIHx8ICcxJykgOiAxO1xuXG5cdFx0XHRcdFx0XHQvLyBDYWxjdWxhdGUgZWZmZWN0aXZlIGRpbWVuc2lvbnNcblx0XHRcdFx0XHRcdGNvbnN0IHdpZHRocyA9IFtcblx0XHRcdFx0XHRcdFx0bWVhc3VyZW1lbnQubmF0dXJhbFdpZHRoLFxuXHRcdFx0XHRcdFx0XHRtZWFzdXJlbWVudC5hdHRyV2lkdGgsXG5cdFx0XHRcdFx0XHRcdHBhcnNlSW50KHN0eWxlLndpZHRoKSB8fCAwLFxuXHRcdFx0XHRcdFx0XHRyZWN0LndpZHRoICogc2NhbGVcblx0XHRcdFx0XHRcdF0uZmlsdGVyKGRpbSA9PiB0eXBlb2YgZGltID09PSAnbnVtYmVyJyAmJiBkaW0gPiAwKTtcblxuXHRcdFx0XHRcdFx0Y29uc3QgaGVpZ2h0cyA9IFtcblx0XHRcdFx0XHRcdFx0bWVhc3VyZW1lbnQubmF0dXJhbEhlaWdodCxcblx0XHRcdFx0XHRcdFx0bWVhc3VyZW1lbnQuYXR0ckhlaWdodCxcblx0XHRcdFx0XHRcdFx0cGFyc2VJbnQoc3R5bGUuaGVpZ2h0KSB8fCAwLFxuXHRcdFx0XHRcdFx0XHRyZWN0LmhlaWdodCAqIHNjYWxlXG5cdFx0XHRcdFx0XHRdLmZpbHRlcihkaW0gPT4gdHlwZW9mIGRpbSA9PT0gJ251bWJlcicgJiYgZGltID4gMCk7XG5cblx0XHRcdFx0XHRcdC8vIERlY2lzaW9uIHBoYXNlIC0gbm8gRE9NIG9wZXJhdGlvbnNcblx0XHRcdFx0XHRcdGlmICh3aWR0aHMubGVuZ3RoID4gMCAmJiBoZWlnaHRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgZWZmZWN0aXZlV2lkdGggPSBNYXRoLm1pbiguLi53aWR0aHMpO1xuXHRcdFx0XHRcdFx0XHRjb25zdCBlZmZlY3RpdmVIZWlnaHQgPSBNYXRoLm1pbiguLi5oZWlnaHRzKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoZWZmZWN0aXZlV2lkdGggPCBNSU5fRElNRU5TSU9OIHx8IGVmZmVjdGl2ZUhlaWdodCA8IE1JTl9ESU1FTlNJT04pIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBpZGVudGlmaWVyID0gdGhpcy5nZXRFbGVtZW50SWRlbnRpZmllcihtZWFzdXJlbWVudC5lbGVtZW50KTtcblx0XHRcdFx0XHRcdFx0XHRpZiAoaWRlbnRpZmllcikge1xuXHRcdFx0XHRcdFx0XHRcdFx0c21hbGxJbWFnZXMuYWRkKGlkZW50aWZpZXIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0cHJvY2Vzc2VkQ291bnQrKztcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRpZiAodGhpcy5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ0RlZnVkZGxlOiBGYWlsZWQgdG8gcHJvY2VzcyBlbGVtZW50IGRpbWVuc2lvbnM6JywgZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKHRoaXMuZGVidWcpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ0RlZnVkZGxlOiBGYWlsZWQgdG8gcHJvY2VzcyBiYXRjaDonLCBlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGVuZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblx0XHR0aGlzLl9sb2coJ0ZvdW5kIHNtYWxsIGVsZW1lbnRzOicsIHtcblx0XHRcdGNvdW50OiBwcm9jZXNzZWRDb3VudCxcblx0XHRcdHRvdGFsRWxlbWVudHM6IGVsZW1lbnRzLmxlbmd0aCxcblx0XHRcdHByb2Nlc3NpbmdUaW1lOiBgJHsoZW5kVGltZSAtIHN0YXJ0VGltZSkudG9GaXhlZCgyKX1tc2Bcblx0XHR9KTtcblxuXHRcdHJldHVybiBzbWFsbEltYWdlcztcblx0fVxuXG5cdHByaXZhdGUgcmVtb3ZlU21hbGxJbWFnZXMoZG9jOiBEb2N1bWVudCwgc21hbGxJbWFnZXM6IFNldDxzdHJpbmc+KSB7XG5cdFx0bGV0IHJlbW92ZWRDb3VudCA9IDA7XG5cblx0XHRbJ2ltZycsICdzdmcnXS5mb3JFYWNoKHRhZyA9PiB7XG5cdFx0XHRjb25zdCBlbGVtZW50cyA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWcpO1xuXHRcdFx0QXJyYXkuZnJvbShlbGVtZW50cykuZm9yRWFjaChlbGVtZW50ID0+IHtcblx0XHRcdFx0Y29uc3QgaWRlbnRpZmllciA9IHRoaXMuZ2V0RWxlbWVudElkZW50aWZpZXIoZWxlbWVudCk7XG5cdFx0XHRcdGlmIChpZGVudGlmaWVyICYmIHNtYWxsSW1hZ2VzLmhhcyhpZGVudGlmaWVyKSkge1xuXHRcdFx0XHRcdGVsZW1lbnQucmVtb3ZlKCk7XG5cdFx0XHRcdFx0cmVtb3ZlZENvdW50Kys7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5fbG9nKCdSZW1vdmVkIHNtYWxsIGVsZW1lbnRzOicsIHJlbW92ZWRDb3VudCk7XG5cdH1cblxuXHRwcml2YXRlIGdldEVsZW1lbnRJZGVudGlmaWVyKGVsZW1lbnQ6IEVsZW1lbnQpOiBzdHJpbmcgfCBudWxsIHtcblx0XHQvLyBUcnkgdG8gY3JlYXRlIGEgdW5pcXVlIGlkZW50aWZpZXIgdXNpbmcgdmFyaW91cyBhdHRyaWJ1dGVzXG5cdFx0aWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50KSB7XG5cdFx0XHQvLyBGb3IgbGF6eS1sb2FkZWQgaW1hZ2VzLCB1c2UgZGF0YS1zcmMgYXMgaWRlbnRpZmllciBpZiBhdmFpbGFibGVcblx0XHRcdGNvbnN0IGRhdGFTcmMgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcblx0XHRcdGlmIChkYXRhU3JjKSByZXR1cm4gYHNyYzoke2RhdGFTcmN9YDtcblx0XHRcdFxuXHRcdFx0Y29uc3Qgc3JjID0gZWxlbWVudC5zcmMgfHwgJyc7XG5cdFx0XHRjb25zdCBzcmNzZXQgPSBlbGVtZW50LnNyY3NldCB8fCAnJztcblx0XHRcdGNvbnN0IGRhdGFTcmNzZXQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcblx0XHRcdFxuXHRcdFx0aWYgKHNyYykgcmV0dXJuIGBzcmM6JHtzcmN9YDtcblx0XHRcdGlmIChzcmNzZXQpIHJldHVybiBgc3Jjc2V0OiR7c3Jjc2V0fWA7XG5cdFx0XHRpZiAoZGF0YVNyY3NldCkgcmV0dXJuIGBzcmNzZXQ6JHtkYXRhU3Jjc2V0fWA7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaWQgPSBlbGVtZW50LmlkIHx8ICcnO1xuXHRcdGNvbnN0IGNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NOYW1lIHx8ICcnO1xuXHRcdGNvbnN0IHZpZXdCb3ggPSBlbGVtZW50IGluc3RhbmNlb2YgU1ZHRWxlbWVudCA/IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCd2aWV3Qm94JykgfHwgJycgOiAnJztcblx0XHRcblx0XHRpZiAoaWQpIHJldHVybiBgaWQ6JHtpZH1gO1xuXHRcdGlmICh2aWV3Qm94KSByZXR1cm4gYHZpZXdCb3g6JHt2aWV3Qm94fWA7XG5cdFx0aWYgKGNsYXNzTmFtZSkgcmV0dXJuIGBjbGFzczoke2NsYXNzTmFtZX1gO1xuXHRcdFxuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0cHJpdmF0ZSBmaW5kTWFpbkNvbnRlbnQoZG9jOiBEb2N1bWVudCk6IEVsZW1lbnQgfCBudWxsIHtcblxuXHRcdC8vIEZpbmQgYWxsIHBvdGVudGlhbCBjb250ZW50IGNvbnRhaW5lcnNcblx0XHRjb25zdCBjYW5kaWRhdGVzOiB7IGVsZW1lbnQ6IEVsZW1lbnQ7IHNjb3JlOiBudW1iZXIgfVtdID0gW107XG5cblx0XHRFTlRSWV9QT0lOVF9FTEVNRU5UUy5mb3JFYWNoKChzZWxlY3RvciwgaW5kZXgpID0+IHtcblx0XHRcdGNvbnN0IGVsZW1lbnRzID0gZG9jLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuXHRcdFx0ZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcblx0XHRcdFx0Ly8gQmFzZSBzY29yZSBmcm9tIHNlbGVjdG9yIHByaW9yaXR5IChlYXJsaWVyID0gaGlnaGVyKVxuXHRcdFx0XHRsZXQgc2NvcmUgPSAoRU5UUllfUE9JTlRfRUxFTUVOVFMubGVuZ3RoIC0gaW5kZXgpICogMTA7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBBZGQgc2NvcmUgYmFzZWQgb24gY29udGVudCBhbmFseXNpc1xuXHRcdFx0XHRzY29yZSArPSB0aGlzLnNjb3JlRWxlbWVudChlbGVtZW50KTtcblx0XHRcdFx0XG5cdFx0XHRcdGNhbmRpZGF0ZXMucHVzaCh7IGVsZW1lbnQsIHNjb3JlIH0pO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRpZiAoY2FuZGlkYXRlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdC8vIEZhbGwgYmFjayB0byBzY29yaW5nIGJsb2NrIGVsZW1lbnRzXG5cdFx0XHQvLyBDdXJyZW50bHkgPGJvZHk+IGVsZW1lbnQgaXMgdXNlZCBhcyB0aGUgZmFsbGJhY2ssIHNvIHRoaXMgaXMgbm90IHVzZWRcblx0XHRcdHJldHVybiB0aGlzLmZpbmRDb250ZW50QnlTY29yaW5nKGRvYyk7XG5cdFx0fVxuXG5cdFx0Ly8gU29ydCBieSBzY29yZSBkZXNjZW5kaW5nXG5cdFx0Y2FuZGlkYXRlcy5zb3J0KChhLCBiKSA9PiBiLnNjb3JlIC0gYS5zY29yZSk7XG5cdFx0XG5cdFx0aWYgKHRoaXMuZGVidWcpIHtcblx0XHRcdHRoaXMuX2xvZygnQ29udGVudCBjYW5kaWRhdGVzOicsIGNhbmRpZGF0ZXMubWFwKGMgPT4gKHtcblx0XHRcdFx0ZWxlbWVudDogYy5lbGVtZW50LnRhZ05hbWUsXG5cdFx0XHRcdHNlbGVjdG9yOiB0aGlzLmdldEVsZW1lbnRTZWxlY3RvcihjLmVsZW1lbnQpLFxuXHRcdFx0XHRzY29yZTogYy5zY29yZVxuXHRcdFx0fSkpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gY2FuZGlkYXRlc1swXS5lbGVtZW50O1xuXHR9XG5cblx0cHJpdmF0ZSBmaW5kQ29udGVudEJ5U2NvcmluZyhkb2M6IERvY3VtZW50KTogRWxlbWVudCB8IG51bGwge1xuXHRcdGNvbnN0IGNhbmRpZGF0ZXMgPSB0aGlzLnNjb3JlRWxlbWVudHMoZG9jKTtcblx0XHRyZXR1cm4gY2FuZGlkYXRlcy5sZW5ndGggPiAwID8gY2FuZGlkYXRlc1swXS5lbGVtZW50IDogbnVsbDtcblx0fVxuXG5cdHByaXZhdGUgZ2V0RWxlbWVudFNlbGVjdG9yKGVsZW1lbnQ6IEVsZW1lbnQpOiBzdHJpbmcge1xuXHRcdGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGxldCBjdXJyZW50OiBFbGVtZW50IHwgbnVsbCA9IGVsZW1lbnQ7XG5cdFx0XG5cdFx0d2hpbGUgKGN1cnJlbnQgJiYgY3VycmVudCAhPT0gdGhpcy5kb2MuZG9jdW1lbnRFbGVtZW50KSB7XG5cdFx0XHRsZXQgc2VsZWN0b3IgPSBjdXJyZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRcdGlmIChjdXJyZW50LmlkKSB7XG5cdFx0XHRcdHNlbGVjdG9yICs9ICcjJyArIGN1cnJlbnQuaWQ7XG5cdFx0XHR9IGVsc2UgaWYgKGN1cnJlbnQuY2xhc3NOYW1lICYmIHR5cGVvZiBjdXJyZW50LmNsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0c2VsZWN0b3IgKz0gJy4nICsgY3VycmVudC5jbGFzc05hbWUudHJpbSgpLnNwbGl0KC9cXHMrLykuam9pbignLicpO1xuXHRcdFx0fVxuXHRcdFx0cGFydHMudW5zaGlmdChzZWxlY3Rvcik7XG5cdFx0XHRjdXJyZW50ID0gY3VycmVudC5wYXJlbnRFbGVtZW50O1xuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gcGFydHMuam9pbignID4gJyk7XG5cdH1cblxuXHRwcml2YXRlIHNjb3JlRWxlbWVudHMoZG9jOiBEb2N1bWVudCk6IENvbnRlbnRTY29yZVtdIHtcblx0XHRjb25zdCBjYW5kaWRhdGVzOiBDb250ZW50U2NvcmVbXSA9IFtdO1xuXG5cdFx0QkxPQ0tfRUxFTUVOVFMuZm9yRWFjaCgodGFnOiBzdHJpbmcpID0+IHtcblx0XHRcdEFycmF5LmZyb20oZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZykpLmZvckVhY2goKGVsZW1lbnQ6IEVsZW1lbnQpID0+IHtcblx0XHRcdFx0Y29uc3Qgc2NvcmUgPSB0aGlzLnNjb3JlRWxlbWVudChlbGVtZW50KTtcblx0XHRcdFx0aWYgKHNjb3JlID4gMCkge1xuXHRcdFx0XHRcdGNhbmRpZGF0ZXMucHVzaCh7IHNjb3JlLCBlbGVtZW50IH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBjYW5kaWRhdGVzLnNvcnQoKGEsIGIpID0+IGIuc2NvcmUgLSBhLnNjb3JlKTtcblx0fVxuXG5cdHByaXZhdGUgc2NvcmVFbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBudW1iZXIge1xuXHRcdGxldCBzY29yZSA9IDA7XG5cblx0XHQvLyBTY29yZSBiYXNlZCBvbiBlbGVtZW50IHByb3BlcnRpZXNcblx0XHRjb25zdCBjbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZSAmJiB0eXBlb2YgZWxlbWVudC5jbGFzc05hbWUgPT09ICdzdHJpbmcnID8gXG5cdFx0XHRlbGVtZW50LmNsYXNzTmFtZS50b0xvd2VyQ2FzZSgpIDogJyc7XG5cdFx0Y29uc3QgaWQgPSBlbGVtZW50LmlkID8gZWxlbWVudC5pZC50b0xvd2VyQ2FzZSgpIDogJyc7XG5cblx0XHQvLyBTY29yZSBiYXNlZCBvbiBjb250ZW50XG5cdFx0Y29uc3QgdGV4dCA9IGVsZW1lbnQudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0Y29uc3Qgd29yZHMgPSB0ZXh0LnNwbGl0KC9cXHMrLykubGVuZ3RoO1xuXHRcdHNjb3JlICs9IE1hdGgubWluKE1hdGguZmxvb3Iod29yZHMgLyAxMDApLCAzKTtcblxuXHRcdC8vIFNjb3JlIGJhc2VkIG9uIGxpbmsgZGVuc2l0eVxuXHRcdGNvbnN0IGxpbmtzID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYScpO1xuXHRcdGNvbnN0IGxpbmtUZXh0ID0gQXJyYXkuZnJvbShsaW5rcykucmVkdWNlKChhY2MsIGxpbmspID0+IGFjYyArIChsaW5rLnRleHRDb250ZW50Py5sZW5ndGggfHwgMCksIDApO1xuXHRcdGNvbnN0IGxpbmtEZW5zaXR5ID0gdGV4dC5sZW5ndGggPyBsaW5rVGV4dCAvIHRleHQubGVuZ3RoIDogMDtcblx0XHRpZiAobGlua0RlbnNpdHkgPiAwLjUpIHtcblx0XHRcdHNjb3JlIC09IDEwO1xuXHRcdH1cblxuXHRcdC8vIFNjb3JlIGJhc2VkIG9uIHByZXNlbmNlIG9mIG1lYW5pbmdmdWwgZWxlbWVudHNcblx0XHRjb25zdCBwYXJhZ3JhcGhzID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgncCcpLmxlbmd0aDtcblx0XHRzY29yZSArPSBwYXJhZ3JhcGhzO1xuXG5cdFx0Y29uc3QgaW1hZ2VzID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJykubGVuZ3RoO1xuXHRcdHNjb3JlICs9IE1hdGgubWluKGltYWdlcyAqIDMsIDkpO1xuXG5cdFx0cmV0dXJuIHNjb3JlO1xuXHR9XG59ICIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJleHBvcnQgeyBEZWZ1ZGRsZSB9IGZyb20gJy4vZGVmdWRkbGUnO1xuZXhwb3J0IHR5cGUgeyBEZWZ1ZGRsZU9wdGlvbnMsIERlZnVkZGxlUmVzcG9uc2UsIERlZnVkZGxlTWV0YWRhdGEgfSBmcm9tICcuL3R5cGVzJzsgIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9