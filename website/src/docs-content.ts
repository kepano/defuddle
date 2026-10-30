export const docsContent = `
		<h2 id="installation">Installation</h2>

		<pre><code class="language-bash">npm install defuddle</code></pre>

		<p>For Node.js use, install a DOM implementation:</p>

		<pre><code class="language-bash">npm install defuddle linkedom</code></pre>

		<p>Or <a href="https://github.com/jsdom/jsdom">JSDOM</a>:</p>

		<pre><code class="language-bash">npm install defuddle jsdom</code></pre>

		<p>To use the CLI globally, install with <code>-g</code>, or use <code>npx</code> to run without installing globally:</p>

<pre><code class="language-bash"># Install globally
npm install -g defuddle

# Or use npx
npx defuddle parse https://example.com/article</code></pre>

		<h2 id="browser">Browser use</h2>

		<p>In the browser, create a Defuddle instance with a <code>Document</code> object and call <code>parse()</code>.</p>

<pre><code class="language-javascript">import Defuddle from 'defuddle';

const result = new Defuddle(document).parse();

console.log(result.content);  // cleaned HTML string
console.log(result.title);    // page title
console.log(result.author);   // author name</code></pre>

		<p>You can also parse HTML strings using <code>DOMParser</code>:</p>

<pre><code class="language-javascript">const parser = new DOMParser();
const doc = parser.parseFromString(htmlString, 'text/html');
const result = new Defuddle(doc).parse();</code></pre>

		<p>Pass options as the second argument:</p>

<pre><code class="language-javascript">const result = new Defuddle(document, {
  url: 'https://example.com/article',
  debug: true
}).parse();</code></pre>

		<h2 id="node">Node.js use</h2>

		<p>The Node.js API accepts a DOM <code>Document</code> from any implementation (linkedom, JSDOM, happy-dom, etc.) and returns a promise.</p>

<pre><code class="language-javascript">import { parseHTML } from 'linkedom';
import { Defuddle } from 'defuddle/node';

const { document } = parseHTML(htmlString);
const result = await Defuddle(document, 'https://example.com/article', {
  markdown: true
});</code></pre>

		<p>Or with JSDOM:</p>

<pre><code class="language-javascript">import { JSDOM } from 'jsdom';
import { Defuddle } from 'defuddle/node';

const dom = new JSDOM(htmlString, { url: 'https://example.com/article' });
const result = await Defuddle(dom.window.document, 'https://example.com/article');</code></pre>

		<p><strong>Note:</strong> For <code>defuddle/node</code> to import properly, your <code>package.json</code> must have <code>"type": "module"</code>.</p>

		<h2 id="cli">CLI use</h2>

		<p>Defuddle includes a CLI for parsing web pages from the terminal. You can run it with <code>npx</code> or install it globally with <code>npm install -g defuddle</code>.</p>

<pre><code class="language-bash"># Parse a local HTML file
npx defuddle parse page.html

# Parse a URL
npx defuddle parse https://example.com/article

# Output as markdown
npx defuddle parse page.html --markdown

# Output as JSON with metadata
npx defuddle parse page.html --json

# Extract a specific property
npx defuddle parse page.html --property title

# Save output to a file
npx defuddle parse page.html --output result.html</code></pre>

		<h3>CLI options</h3>

		<table>
			<thead>
				<tr><th>Option</th><th>Alias</th><th>Description</th></tr>
			</thead>
			<tbody>
				<tr><td><code>--output &lt;file&gt;</code></td><td><code>-o</code></td><td>Write output to a file instead of stdout</td></tr>
				<tr><td><code>--markdown</code></td><td><code>-m</code></td><td>Convert content to markdown</td></tr>
				<tr><td><code>--md</code></td><td></td><td>Alias for <code>--markdown</code></td></tr>
				<tr><td><code>--json</code></td><td><code>-j</code></td><td>Output as JSON with metadata and content</td></tr>
				<tr><td><code>--property &lt;name&gt;</code></td><td><code>-p</code></td><td>Extract a specific property</td></tr>
				<tr><td><code>--debug</code></td><td></td><td>Enable debug mode</td></tr>
			</tbody>
		</table>

		<h3>Using templates</h3>

		<p>Use <a href="https://knap.md/cli#from-defuddle">Knap</a> to format extracted content and metadata with a Markdown template. Pipe Defuddle's JSON output into Knap:</p>

<pre><code class="language-bash">npx defuddle parse https://example.com/article --markdown --json \\
  | npx knap render template.md --data - --output note.md</code></pre>

		<p>Your <code>template.md</code> can reference Defuddle properties such as <code>{{ title }}</code> and <code>{{ content }}</code>. See the <a href="https://knap.md/cli#from-defuddle">Knap CLI docs</a> for a complete example.</p>

		<h2 id="api">API use</h2>

		<p>Use the hosted API to extract a web page without installing Defuddle. Append the page URL to <code>https://defuddle.md/</code>:</p>

<pre><code class="language-bash">curl https://defuddle.md/stephango.com</code></pre>

		<p>The response is Markdown with YAML frontmatter containing page metadata. You can include the target URL's <code>https://</code> prefix and path, for example <code>https://defuddle.md/https://stephango.com/saw</code>.</p>

		<p>To return clean HTML instead, add <code>/html/</code> before the target URL:</p>

<pre><code class="language-bash">curl https://defuddle.md/html/stephango.com</code></pre>

		<p>For additional requests, buy a request block and pass your API key in the <code>Authorization</code> header. See <a href="/pricing">pricing</a> for request blocks, usage checks, and top-ups.</p>

<pre><code class="language-bash">curl -H "Authorization: Bearer YOUR_KEY" https://defuddle.md/stephango.com</code></pre>

		<h2 id="options">Options</h2>

		<p>Options can be passed when creating a Defuddle instance (browser) or as the third argument (Node.js).</p>

		<table>
			<thead>
				<tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr>
			</thead>
			<tbody>
				<tr><td><code>url</code></td><td>string</td><td></td><td>URL of the page being parsed</td></tr>
				<tr><td><code>markdown</code></td><td>boolean</td><td>false</td><td>Convert <code>content</code> to Markdown</td></tr>
				<tr><td><code>separateMarkdown</code></td><td>boolean</td><td>false</td><td>Keep <code>content</code> as HTML and return Markdown in <code>contentMarkdown</code></td></tr>
				<tr><td><code>removeExactSelectors</code></td><td>boolean</td><td>true</td><td>Remove elements matching exact selectors (ads, social buttons, etc.)</td></tr>
				<tr><td><code>removePartialSelectors</code></td><td>boolean</td><td>true</td><td>Remove elements matching partial selectors</td></tr>
				<tr><td><code>removeHiddenElements</code></td><td>boolean</td><td>true</td><td>Remove elements hidden via CSS (display:none, visibility:hidden, etc.)</td></tr>
					<tr><td><code>removeLowScoring</code></td><td>boolean</td><td>true</td><td>Remove non-content blocks by scoring (navigation, link lists, etc.)</td></tr>
					<tr><td><code>removeSmallImages</code></td><td>boolean</td><td>true</td><td>Remove small images (icons, tracking pixels, etc.)</td></tr>
					<tr><td><code>removeImages</code></td><td>boolean</td><td>false</td><td>Remove images from the output</td></tr>
					<tr><td><code>useAsync</code></td><td>boolean</td><td>true</td><td>Allow async extractors to fetch from third-party APIs when no local content is available.</td></tr>
					<tr><td><code>standardize</code></td><td>boolean</td><td>true</td><td>Standardize HTML (footnotes, headings, code blocks, etc.)</td></tr>
					<tr><td><code>contentSelector</code></td><td>string</td><td></td><td>CSS selector to use as the main content element, bypassing auto-detection</td></tr>
					<tr><td><code>language</code></td><td>string</td><td></td><td>Preferred language (BCP 47 tag, e.g. <code>en</code>, <code>fr</code>). Sets <code>Accept-Language</code> header and selects transcript language.</td></tr>
					<tr><td><code>includeReplies</code></td><td>boolean | 'extractors'</td><td>'extractors'</td><td>Include replies: <code>'extractors'</code> for site-specific extractors only, <code>true</code> for all, <code>false</code> for none</td></tr>
					<tr><td><code>debug</code></td><td>boolean</td><td>false</td><td>Enable debug logging and return debug info in the response</td></tr>
			</tbody>
		</table>

		<h2 id="response">Response</h2>

		<p>The <code>parse()</code> method returns an object with the following properties:</p>

		<table>
			<thead>
				<tr><th>Property</th><th>Type</th><th>Description</th></tr>
			</thead>
			<tbody>
				<tr><td><code>content</code></td><td>string</td><td>Cleaned HTML string of the extracted content</td></tr>
				<tr><td><code>contentMarkdown</code></td><td>string</td><td>Markdown version (when <code>separateMarkdown</code> is true)</td></tr>
				<tr><td><code>title</code></td><td>string</td><td>Title of the article</td></tr>
				<tr><td><code>description</code></td><td>string</td><td>Description or summary</td></tr>
				<tr><td><code>author</code></td><td>string</td><td>Author of the article</td></tr>
				<tr><td><code>site</code></td><td>string</td><td>Name of the website</td></tr>
				<tr><td><code>domain</code></td><td>string</td><td>Domain name of the website</td></tr>
				<tr><td><code>favicon</code></td><td>string</td><td>URL of the website's favicon</td></tr>
				<tr><td><code>image</code></td><td>string</td><td>URL of the article's main image</td></tr>
				<tr><td><code>language</code></td><td>string</td><td>Language of the page in BCP 47 format (e.g. <code>en</code>, <code>en-US</code>)</td></tr>
				<tr><td><code>published</code></td><td>string</td><td>Publication date</td></tr>
				<tr><td><code>wordCount</code></td><td>number</td><td>Number of words in the extracted content</td></tr>
				<tr><td><code>parseTime</code></td><td>number</td><td>Time taken to parse in milliseconds</td></tr>
				<tr><td><code>metaTags</code></td><td>object[]</td><td>Meta tags from the page</td></tr>
				<tr><td><code>schemaOrgData</code></td><td>object</td><td>Schema.org data extracted from the page</td></tr>
				<tr><td><code>extractorType</code></td><td>string</td><td>Type of site-specific extractor used, if any</td></tr>
				<tr><td><code>debug</code></td><td>object</td><td>Debug info including content selector and removals (when <code>debug: true</code>)</td></tr>
			</tbody>
		</table>

		<h2 id="bundles">Bundles</h2>

		<p>Defuddle is available in three bundles:</p>

		<table>
			<thead>
				<tr><th>Bundle</th><th>Import</th><th>Description</th></tr>
			</thead>
			<tbody>
				<tr><td>Core</td><td><code>defuddle</code></td><td>Browser usage. No dependencies. Handles math content but without MathML/LaTeX conversion fallbacks.</td></tr>
				<tr><td>Full</td><td><code>defuddle/full</code></td><td>Includes math equation parsing (MathML ↔ LaTeX) and Markdown conversion via Turndown.</td></tr>
				<tr><td>Node.js</td><td><code>defuddle/node</code></td><td>For Node.js. Accepts any DOM Document (linkedom, JSDOM, happy-dom, etc.). Includes full capabilities for math and Markdown conversion.</td></tr>
			</tbody>
		</table>

		<p>The core bundle is recommended for most use cases.</p>

		<h2 id="standardization">HTML standardization</h2>

		<p>Defuddle standardizes HTML elements to provide a consistent input for downstream tools like Markdown converters.</p>

		<h3>Headings</h3>
		<ul>
			<li>The first H1 or H2 is removed if it matches the title.</li>
			<li>H1s are converted to H2s.</li>
			<li>Anchor links in headings are removed.</li>
		</ul>

		<h3>Code blocks</h3>
		<p>Code blocks are standardized. Line numbers and syntax highlighting are removed, but the language is retained.</p>
<pre><code class="language-html">&lt;pre&gt;
  &lt;code data-lang="js" class="language-js"&gt;
    // code
  &lt;/code&gt;
&lt;/pre&gt;</code></pre>

		<h3>Footnotes</h3>
		<p>Inline references and footnotes are converted to a standard format using <code>sup</code>, <code>a</code>, and an ordered list with <code>class="footnote"</code>.</p>

		<h3>Math</h3>
		<p>Math elements, including MathJax and KaTeX, are converted to standard MathML with a <code>data-latex</code> attribute containing the original LaTeX source.</p>

		<h3>Callouts</h3>
		<p>Callout and alert elements from various sources are standardized to the <a href="https://help.obsidian.md/Editing+and+formatting/Callouts">Obsidian callout format</a>. When converting to Markdown, these become Obsidian-style callouts.</p>
		<p>Supported sources:</p>
		<ul>
			<li>GitHub markdown alerts (<code>div.markdown-alert</code>)</li>
			<li>Obsidian callouts (<code>div.callout[data-callout]</code>)</li>
			<li>Callout asides (<code>aside.callout-*</code>)</li>
			<li>Bootstrap alerts (<code>div.alert.alert-*</code>)</li>
		</ul>
<pre><code class="language-html">&lt;div data-callout="info" class="callout"&gt;
  &lt;div class="callout-title"&gt;
    &lt;div class="callout-title-inner"&gt;Info&lt;/div&gt;
  &lt;/div&gt;
  &lt;div class="callout-content"&gt;
    &lt;p&gt;This is an informational callout.&lt;/p&gt;
  &lt;/div&gt;
&lt;/div&gt;</code></pre>

		<h2 id="debugging">Debugging</h2>

		<h3>Debug mode</h3>

		<p>When debug mode is enabled:</p>
		<ul>
			<li>Returns a <code>debug</code> field in the response with detailed information about content extraction</li>
			<li>More verbose console logging about the parsing process</li>
			<li>Preserves HTML class and id attributes that are normally stripped</li>
			<li>Retains all <code>data-*</code> attributes</li>
			<li>Skips div flattening to preserve document structure</li>
		</ul>

<pre><code class="language-javascript">const result = new Defuddle(document, { debug: true }).parse();

// CSS selector path of chosen main content element
console.log(result.debug.contentSelector);

// Array of removed elements with step, reason, selector, and text preview
console.log(result.debug.removals);</code></pre>

		<p>The <code>debug</code> field contains:</p>

		<table>
			<thead>
				<tr><th>Property</th><th>Type</th><th>Description</th></tr>
			</thead>
			<tbody>
				<tr><td><code>contentSelector</code></td><td>string</td><td>CSS selector path of the chosen main content element</td></tr>
				<tr><td><code>removals</code></td><td>array</td><td>List of elements removed during processing</td></tr>
			</tbody>
		</table>

		<p>Each removal entry contains:</p>

		<table>
			<thead>
				<tr><th>Property</th><th>Type</th><th>Description</th></tr>
			</thead>
			<tbody>
				<tr><td><code>step</code></td><td>string</td><td>Pipeline step (e.g. <code>removeLowScoring</code>, <code>removeBySelector</code>, <code>removeHiddenElements</code>)</td></tr>
				<tr><td><code>selector</code></td><td>string</td><td>CSS selector or pattern that matched</td></tr>
				<tr><td><code>reason</code></td><td>string</td><td>Why the element was removed (e.g. <code>score: -20</code>, <code>display:none</code>)</td></tr>
				<tr><td><code>text</code></td><td>string</td><td>First 200 characters of removed element's text content</td></tr>
			</tbody>
		</table>

		<h3>Pipeline toggles</h3>

		<p>Disable individual pipeline steps to diagnose content extraction issues:</p>

<pre><code class="language-javascript">// Skip content scoring
const result = new Defuddle(document, { removeLowScoring: false }).parse();

// Skip hidden element removal
const result = new Defuddle(document, { removeHiddenElements: false }).parse();

// Skip small image removal
const result = new Defuddle(document, { removeSmallImages: false }).parse();

// Skip HTML standardization
const result = new Defuddle(document, { standardize: false }).parse();</code></pre>

		<h3>Content selector</h3>

		<p>Use <code>contentSelector</code> to bypass auto-detection and specify the main content element directly. Falls back to auto-detection if the selector doesn't match.</p>

<pre><code class="language-javascript">const result = new Defuddle(document, {
  contentSelector: 'article.post-content'
}).parse();</code></pre>

`;
