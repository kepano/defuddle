import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';

export class WeiboExtractor extends BaseExtractor {
	canExtract(): boolean {
		const domain = new URL(this.url).hostname;
		if (!domain.includes('weibo.com')) {
			return false;
		}

		// Check if it's a detail page
		const detailPagePattern = /weibo\.com\/\d+\/[A-Za-z0-9]+$/;
		if (!detailPagePattern.test(this.url)) {
			return false;
		}

		// Check for weibo-specific elements
		const weiboIndicators = [
			'[class*="head_name"]',
			'[class*="detail_wbtext"]',
			'[class*="head-info"]',
			'[class*="picture"]'
		];

		return weiboIndicators.some(selector => this.document.querySelector(selector) !== null);
	}

	extract(): ExtractorResult {
		const weiboData = this.extractWeiboContent();
		const formatted = this.convertToDefuddleFormat(weiboData);

		return {
			content: formatted.content,
			contentHtml: formatted.content,
			extractedContent: {
				type: 'weibo',
				author: formatted.author,
				publishTime: formatted.published,
				isRepost: weiboData.isRepost ? 'true' : 'false',
				wordCount: formatted.wordCount.toString(),
				imageCount: weiboData.images.length.toString(),
			},
			variables: {
				title: formatted.title,
				author: formatted.author,
				site: formatted.site,
				description: formatted.description,
				published: formatted.published,
			}
		};
	}

	private extractWeiboContent() {
		const weiboData = {
			author: '',
			authorUrl: '',
			publishTime: '',
			content: '',
			images: [] as string[],
			videos: [] as string[],
			url: this.document.URL,
			isRepost: false,
			originalContent: '',
			originalAuthor: '',
			wordCount: 0
		};

		// Extract author using optimized selectors
		const authorSelectors = [
			'[class*="head_name"] span',
			'[class*="head_name"]',
			'a[usercard] span[title]',
			'a[href*="/u/"] span[title]',
			'[class*="ALink_default"] span[title]'
		];

		for (const selector of authorSelectors) {
			const authorElement = this.document.querySelector(selector) as HTMLElement;
			if (authorElement && authorElement.textContent?.trim()) {
				weiboData.author = this.cleanText(authorElement.textContent);
				const linkElement = authorElement.closest('a') as HTMLAnchorElement;
				weiboData.authorUrl = linkElement?.href || '';
				break;
			}
		}

		// Extract publish time using optimized selectors
		const timeSelectors = [
			'[class*="head-info_time"]',
			'[class*="head-info"] a[href*="/PiLYu"]',
			'a[title*="25-"]',
			'[class*="head-info_info"] a'
		];

		for (const selector of timeSelectors) {
			const timeElement = this.document.querySelector(selector) as HTMLElement;
			if (timeElement && (timeElement.textContent?.trim() || timeElement.title)) {
				const rawTime = this.cleanText(timeElement.textContent || timeElement.title || '');
				weiboData.publishTime = this.formatWeiboTime(rawTime);
				break;
			}
		}

		// Extract content using optimized selectors
		const contentSelectors = [
			'[class*="detail_wbtext"]',
			'[class*="detail_text"]',
			'[class*="wbpro-feed-content"] [class*="detail_wbtext"]',
			'[class*="detail_ogText"]'
		];

		for (const selector of contentSelectors) {
			const contentElement = this.document.querySelector(selector) as HTMLElement;
			if (contentElement && contentElement.textContent?.trim()) {
				// Process HTML content to preserve links and structure
				let htmlContent = contentElement.innerHTML;
				htmlContent = htmlContent.replace(/<br\s*\/?>/gi, '\n');

				const tempDiv = this.document.createElement('div');
				tempDiv.innerHTML = htmlContent;

				const processNode = (node: Node): string => {
					let result = '';
					if (node.nodeType === Node.TEXT_NODE) {
						result += node.textContent || '';
					} else if (node.nodeType === Node.ELEMENT_NODE) {
						const element = node as HTMLElement;
						if (element.tagName === 'A') {
							const linkText = element.textContent;
							const href = (element as HTMLAnchorElement).href;
							if (linkText && href && href !== this.document.URL) {
								result += `[${linkText}](${href})`;
							} else {
								result += linkText;
							}
						} else {
							for (let child of Array.from(element.childNodes)) {
								result += processNode(child);
							}
						}
					}
					return result;
				};

				weiboData.content = this.cleanText(processNode(tempDiv));
				break;
			}
		}

		// Fallback content extraction
		if (!weiboData.content) {
			const allTextElements = this.document.querySelectorAll('div, p, span');
			const foundElement = Array.from(allTextElements).find(element => {
				const text = element.textContent?.trim() || '';
				return (
					text.length > 10 &&
					text.length < 2000 &&
					!text.includes('转发') &&
					!text.includes('评论') &&
					!text.includes('赞') &&
					!text.includes('关注') &&
					!text.includes('粉丝')
				);
			});

			if (foundElement) {
				weiboData.content = this.cleanText(foundElement.textContent || '');
			}
		}

		// Check for repost content
		const repostSelectors = [
			'[class*="WB_expand_media"]',
			'[class*="Feed_retweet"]',
			'[class*="WB_feed_expand"]',
			'[node-type="feed_list_forwardContent"]',
			'[class*="quote"]',
			'[class*="retweet"]'
		];

		let repostElement: Element | null = null;
		for (const selector of repostSelectors) {
			repostElement = this.document.querySelector(selector);
			if (repostElement) {
				break;
			}
		}

		if (repostElement) {
			weiboData.isRepost = true;

			// Extract original content
			const originalContentElement =
				repostElement.querySelector('[class*="WB_text"]') ||
				repostElement.querySelector('[class*="weibo-text"]') ||
				repostElement.querySelector('[class*="text"]');
			if (originalContentElement) {
				weiboData.originalContent = this.cleanText(originalContentElement.textContent || '');
			}

			// Extract original author
			const originalAuthorElement =
				repostElement.querySelector('[usercard] [class*="W_fb"]') ||
				repostElement.querySelector('[class*="WB_info"] [class*="W_fb"]') ||
				repostElement.querySelector('[class*="username"]') ||
				repostElement.querySelector('[class*="screen-name"]');
			if (originalAuthorElement) {
				weiboData.originalAuthor = this.cleanText(originalAuthorElement.textContent || '');
			}
		}

		// Extract images using optimized selectors
		const imageElements = this.document.querySelectorAll(
			'[class*="picture"] [class*="woo-picture-img"], [class*="picture_pic"] img'
		) as NodeListOf<HTMLImageElement>;

		imageElements.forEach(img => {
			let imgSrc = img.src;
			// Convert to high resolution
			if (imgSrc.includes('orj360')) {
				imgSrc = imgSrc.replace('orj360', 'large');
			} else if (imgSrc.includes('thumbnail') || imgSrc.includes('bmiddle')) {
				imgSrc = imgSrc.replace('thumbnail', 'large').replace('bmiddle', 'large');
			}
			if (imgSrc && !weiboData.images.includes(imgSrc) && imgSrc.includes('sinaimg')) {
				weiboData.images.push(imgSrc);
			}
		});

		// Extract videos
		const videoElements = this.document.querySelectorAll('video, [data-video], [class*="video"]') as NodeListOf<HTMLElement>;
		videoElements.forEach(video => {
			const videoSrc = (video as HTMLVideoElement).src || video.dataset.video || video.dataset.src;
			if (videoSrc && !weiboData.videos.includes(videoSrc)) {
				weiboData.videos.push(videoSrc);
			}
		});

		weiboData.wordCount = weiboData.content.length;
		return weiboData;
	}

	private formatWeiboTime(timeStr: string): string {
		if (!timeStr) return '';

		try {
			// Handle relative times
			if (timeStr.includes('刚刚')) {
				const now = new Date();
				return this.formatDate(now);
			}

			if (timeStr.includes('分钟前')) {
				const minutes = parseInt(timeStr.match(/(\d+)分钟前/)?.[1] || '0');
				const date = new Date(Date.now() - minutes * 60 * 1000);
				return this.formatDate(date);
			}

			if (timeStr.includes('小时前')) {
				const hours = parseInt(timeStr.match(/(\d+)小时前/)?.[1] || '0');
				const date = new Date(Date.now() - hours * 60 * 60 * 1000);
				return this.formatDate(date);
			}

			if (timeStr.includes('今天')) {
				const timeMatch = timeStr.match(/今天\s*(\d{1,2}):(\d{2})/);
				if (timeMatch) {
					const now = new Date();
					const hours = timeMatch[1].padStart(2, '0');
					const minutes = timeMatch[2];
					return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${hours}:${minutes}`;
				}
			}

			if (timeStr.includes('昨天')) {
				const timeMatch = timeStr.match(/昨天\s*(\d{1,2}):(\d{2})/);
				if (timeMatch) {
					const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
					const hours = timeMatch[1].padStart(2, '0');
					const minutes = timeMatch[2];
					return this.formatDate(yesterday, `${hours}:${minutes}`);
				}
			}

			// Handle full date formats
			const fullDateMatch = timeStr.match(/(\d{4})[-年](\d{1,2})[-月](\d{1,2})[日]?\s*(\d{1,2}):(\d{2})/);
			if (fullDateMatch) {
				const year = fullDateMatch[1];
				const month = fullDateMatch[2].padStart(2, '0');
				const day = fullDateMatch[3].padStart(2, '0');
				const hours = fullDateMatch[4].padStart(2, '0');
				const minutes = fullDateMatch[5];
				return `${year}-${month}-${day} ${hours}:${minutes}`;
			}

			// Handle short date formats
			const shortDateMatch = timeStr.match(/(\d{2})[-年](\d{1,2})[-月](\d{1,2})[日]?\s*(\d{1,2}):(\d{2})/);
			if (shortDateMatch) {
				let year = parseInt(shortDateMatch[1]);
				const currentYear = new Date().getFullYear();
				const currentYearShort = currentYear % 100;

				if (year <= currentYearShort + 10) {
					year = 2000 + year;
				} else {
					year = 1900 + year;
				}

				const month = shortDateMatch[2].padStart(2, '0');
				const day = shortDateMatch[3].padStart(2, '0');
				const hours = shortDateMatch[4].padStart(2, '0');
				const minutes = shortDateMatch[5];
				return `${year}-${month}-${day} ${hours}:${minutes}`;
			}

			// Try to parse as Date
			const date = new Date(timeStr);
			if (!isNaN(date.getTime())) {
				return this.formatDate(date);
			}

			return timeStr;
		} catch (error) {
			console.warn('Time formatting failed:', timeStr, error);
			return timeStr;
		}
	}

	private formatDate(date: Date, time?: string): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = time ? time.split(':')[0] : String(date.getHours()).padStart(2, '0');
		const minutes = time ? time.split(':')[1] : String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day} ${hours}:${minutes}`;
	}

	private cleanText(text: string): string {
		if (!text) return '';
		return text
			.replace(/[ \t]+/g, ' ')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}

	private convertToDefuddleFormat(weiboData: any) {
		let content = '';

		const contentWithBr = weiboData.content.replace(/\n/g, '<br>');
		const originalContentWithBr = weiboData.originalContent ? weiboData.originalContent.replace(/\n/g, '<br>') : '';

		if (weiboData.isRepost && weiboData.originalContent) {
			content += `<strong>转发内容：</strong><br><br>${contentWithBr}<br><br>`;
			content += `<strong>原博内容：</strong><br><br>`;
			if (weiboData.originalAuthor) {
				content += `原博作者：${weiboData.originalAuthor}<br><br>`;
			}
			content += `${originalContentWithBr}<br><br>`;
		} else {
			content += `${contentWithBr}<br><br>`;
		}

		// Add images
		if (weiboData.images.length > 0) {
			weiboData.images.forEach((img: string) => {
				content += `<img src="${img}"><br><br>`;
			});
		}

		// Add videos
		if (weiboData.videos.length > 0) {
			content += `<strong>视频 (${weiboData.videos.length}个)：</strong><br><br>`;
			weiboData.videos.forEach((video: string, index: number) => {
				content += `<a href="${video}">视频${index + 1}</a><br><br>`;
			});
		}

		const title = weiboData.content.substring(0, 50).replace(/[#\n\r]/g, '') || '微博内容';
		const description = weiboData.content.substring(0, 200);

		return {
			author: weiboData.author,
			content: content.trim(),
			description: description,
			title: title,
			published: weiboData.publishTime,
			site: '微博',
			wordCount: weiboData.wordCount,
			image: weiboData.images[0] || ''
		};
	}
}