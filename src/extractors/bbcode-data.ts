import { BaseExtractor } from './_base';
import { ExtractorResult } from '../types/extractors';
import { bbcodeToHtml } from '../utils/bbcode';

export class BbcodeDataExtractor extends BaseExtractor {
	private eventData: any = undefined;

	canExtract(): boolean {
		return !!this.getEventData()?.announcement_body?.body;
	}

	extract(): ExtractorResult {
		const event = this.getEventData();
		const body = event.announcement_body;
		const contentHtml = bbcodeToHtml(body.body || '');
		const title = body.headline || event.event_name || '';
		const published = body.posttime
			? new Date(body.posttime * 1000).toISOString()
			: '';
		const author = this.getGroupName();

		return {
			content: contentHtml,
			contentHtml,
			extractedContent: {},
			variables: {
				title,
				author,
				published,
			},
		};
	}

	private getEventData(): any {
		if (this.eventData === undefined) {
			this.eventData = this.parseConfigAttr('data-partnereventstore') ?? null;
		}
		return this.eventData;
	}

	private getGroupName(): string {
		const data = this.parseConfigAttr('data-groupvanityinfo');
		return data?.group_name || '';
	}

	private parseConfigAttr(attr: string): any {
		const config = this.document.querySelector('#application_config');
		const raw = config?.getAttribute(attr);
		if (!raw) return null;

		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed[0] : parsed;
		} catch {
			return null;
		}
	}
}
