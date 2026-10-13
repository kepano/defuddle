// Test fixture loaded by tests/cli.test.ts via --extractor.
// Duck-types the BaseExtractor interface so the test doesn't depend on `dist/`.

class CliTestExtractor {
	constructor(document, url) {
		this.document = document;
		this.url = url;
	}
	canExtract() { return false; }
	canExtractAsync() { return false; }
	prefersAsync() { return false; }
	extract() {
		return { content: '', contentHtml: '', extractedContent: {} };
	}
	async extractAsync() { return this.extract(); }
}

export default {
	patterns: ['cli-test-only.invalid'],
	extractor: CliTestExtractor,
};
