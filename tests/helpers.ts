import { readdirSync } from 'fs';
import { join, basename, extname } from 'path';

export function getFixtures(): Array<{ name: string; path: string }> {
	const fixturesDir = join(__dirname, 'fixtures');
	const files = readdirSync(fixturesDir).filter(file => file.endsWith('.html'));

	return files.map(file => {
		const name = basename(file, extname(file));
		const path = join(fixturesDir, file);
		return { name, path };
	});
}
