import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class TwitterExtractor extends BaseExtractor {
	private mainTweet: Element | null = null;
	private threadTweets: Element[] = [];

	constructor(document: Document, url: string) {
		super(document, url);
		
		// Get all tweets from the timeline
		const timeline = document.querySelector('[aria-label="Timeline: Conversation"]');
		if (!timeline) {
			// Try to find a single tweet if not in timeline view
			const singleTweet = document.querySelector('article[data-testid="tweet"]');
			if (singleTweet) {
				this.mainTweet = singleTweet;
			}
			return;
		}

		// Get all tweets before any section with "Discover more" or similar headings
		let allTweets = Array.from(timeline.querySelectorAll('article[data-testid="tweet"]'));
		const firstSection = timeline.querySelector('section, h2')?.parentElement;

		if (firstSection) {
			// Filter out tweets that appear after the first section
			const cutoffIndex = allTweets.findIndex(tweet =>
				firstSection.compareDocumentPosition(tweet) & Node.DOCUMENT_POSITION_FOLLOWING
			);
			if (cutoffIndex !== -1) {
				allTweets = allTweets.slice(0, cutoffIndex);
			}
		}

		// Set main tweet and thread tweets
		this.mainTweet = allTweets[0] || null;
		this.threadTweets = allTweets.slice(1);
	}

	canExtract(): boolean {
		return !!this.mainTweet;
	}

	extract(): ExtractorResult {
		const mainContent = this.extractTweet(this.mainTweet);
		const threadContent = this.threadTweets.map(tweet => this.extractTweet(tweet)).join('\n<hr>\n');
		
		const contentHtml = `
			<div class="tweet-thread">
				<div class="main-tweet">
					${mainContent}
				</div>
				${threadContent ? `
					<hr>
					<div class="thread-tweets">
						${threadContent}
					</div>
				` : ''}
			</div>
		`.trim();

		const tweetId = this.getTweetId();
		const tweetAuthor = this.getTweetAuthor();
		const description = this.createDescription(this.mainTweet);

		return {
			content: contentHtml,
			contentHtml: contentHtml,
			extractedContent: {
				tweetId,
				tweetAuthor,
			},
			variables: {
				title: `Thread by ${tweetAuthor}`,
				author: tweetAuthor,
				site: 'X (Twitter)',
				description,
			}
		};
	}

	private formatTweetText(text: string): string {
		if (!text) return '';

		// Create a temporary div to parse and clean the HTML
		const tempDiv = this.document.createElement('div');
		tempDiv.innerHTML = text;

		// Convert links to plain text with @ handles
		tempDiv.querySelectorAll('a').forEach(link => {
			const handle = link.textContent?.trim() || '';
			link.replaceWith(handle);
		});

		// Remove unnecessary spans and divs but keep their content
		tempDiv.querySelectorAll('span, div').forEach(element => {
			element.replaceWith(...Array.from(element.childNodes));
		});

		// Get cleaned text and split into paragraphs
		const cleanText = tempDiv.innerHTML;
		const paragraphs = cleanText.split('\n')
			.map(line => line.trim())
			.filter(line => line);

		// Wrap each paragraph in <p> tags
		return paragraphs.map(p => `<p>${p}</p>`).join('\n');
	}

	private extractTweet(tweet: Element | null): string {
		if (!tweet) return '';

		// Clone the tweet element to modify it
		const tweetClone = tweet.cloneNode(true) as Element;
		
		// Convert emoji images to text
		tweetClone.querySelectorAll('img[src*="/emoji/"]').forEach(img => {
			if (img.tagName.toLowerCase() === 'img' && img.getAttribute('alt')) {
				const altText = img.getAttribute('alt');
				if (altText) {
					img.replaceWith(altText);
				}
			}
		});

		const tweetText = tweetClone.querySelector('[data-testid="tweetText"]')?.innerHTML || '';
		const formattedText = this.formatTweetText(tweetText);
		const images = this.extractImages(tweet);
		
		// Get author info and date
		const userInfo = this.extractUserInfo(tweet);
		
		// Extract quoted tweet if present
		const quotedTweet = tweet.querySelector('[aria-labelledby*="id__"]')?.querySelector('[data-testid="User-Name"]')?.closest('[aria-labelledby*="id__"]');
		const quotedContent = quotedTweet ? this.extractTweet(quotedTweet) : '';

		return `
			<div class="tweet">
				<div class="tweet-header">
					<span class="tweet-author"><strong>${userInfo.fullName}</strong> <span class="tweet-handle">${userInfo.handle}</span></span>
					${userInfo.date ? `<a href="${userInfo.permalink}" class="tweet-date">${userInfo.date}</a>` : ''}
				</div>
				${formattedText ? `<div class="tweet-text">${formattedText}</div>` : ''}
				${images.length ? `
					<div class="tweet-media">
						${images.join('\n')}
					</div>
				` : ''}
				${quotedContent ? `
					<blockquote class="quoted-tweet">
						${quotedContent}
					</blockquote>
				` : ''}
			</div>
		`.trim();
	}

	private extractUserInfo(tweet: Element) {
		const nameElement = tweet.querySelector('[data-testid="User-Name"]');
		if (!nameElement) return { fullName: '', handle: '', date: '', permalink: '' };

		// Try to get name and handle from links first (main tweet structure)
		const links = nameElement.querySelectorAll('a');
		let fullName = links?.[0]?.textContent?.trim() || '';
		let handle = links?.[1]?.textContent?.trim() || '';

		// If links don't have the info, try to get from spans (quoted tweet structure)
		if (!fullName || !handle) {
			fullName = nameElement.querySelector('span[style*="color: rgb(15, 20, 25)"] span')?.textContent?.trim() || '';
			handle = nameElement.querySelector('span[style*="color: rgb(83, 100, 113)"]')?.textContent?.trim() || '';
		}

		const timestamp = tweet.querySelector('time');
		const datetime = timestamp?.getAttribute('datetime') || '';
		const date = datetime ? new Date(datetime).toISOString().split('T')[0] : '';
		const permalink = timestamp?.closest('a')?.href || '';

		return { fullName, handle, date, permalink };
	}

	private extractImages(tweet: Element): string[] {
		// Look for images in different containers
		const imageContainers = [
			'[data-testid="tweetPhoto"]',
			'[data-testid="tweet-image"]',
			'img[src*="media"]'
		];

		const images: string[] = [];
		
		// Skip images that are inside quoted tweets
		const quotedTweet = tweet.querySelector('[aria-labelledby*="id__"]')?.querySelector('[data-testid="User-Name"]')?.closest('[aria-labelledby*="id__"]');
		
		for (const selector of imageContainers) {
			const elements = tweet.querySelectorAll(selector);
			
			elements.forEach(img => {
				// Skip if the image is inside a quoted tweet
				if (quotedTweet?.contains(img)) {
					return;
				}

				// Check if element is an image by checking tag name and required properties
				if (img.tagName.toLowerCase() === 'img' && img.getAttribute('alt')) {
					const highQualitySrc = img.getAttribute('src')?.replace(/&name=\w+$/, '&name=large') || '';
					const cleanAlt = img.getAttribute('alt')?.replace(/\s+/g, ' ').trim() || '';
					images.push(`<img src="${highQualitySrc}" alt="${cleanAlt}" />`);
				}
			});
		}

		return images;
	}

	private getTweetId(): string {
		const match = this.url.match(/status\/(\d+)/);
		return match?.[1] || '';
	}

	private getTweetAuthor(): string {
		const nameElement = this.mainTweet?.querySelector('[data-testid="User-Name"]');
		const links = nameElement?.querySelectorAll('a');
		const handle = links?.[1]?.textContent?.trim() || '';
		return handle.startsWith('@') ? handle : `@${handle}`;
	}

	private createDescription(tweet: Element | null): string {
		if (!tweet) return '';

		const tweetText = tweet.querySelector('[data-testid="tweetText"]')?.textContent || '';
		return tweetText.trim().slice(0, 140).replace(/\s+/g, ' ');
	}
} 