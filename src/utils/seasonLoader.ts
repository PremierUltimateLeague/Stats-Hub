import fs from 'node:fs';
import path from 'node:path';

// JSON data from files has no enforced schema — any[] is correct here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadSeasonData(seasons: string[], filename: string): Record<string, any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any[]> = {};

  for (const season of seasons) {
    try {
      const data = fs.readFileSync(
        path.join(process.cwd(), 'data', season, filename),
        'utf-8'
      );
      result[season] = JSON.parse(data);
    } catch (e) {
      console.error(`Failed to load ${filename} for season ${season}:`, e);
      result[season] = [];
    }
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findDefaultSeason(
  seasons: string[],
  dataBySeason: Record<string, any[]>,
  statKeys: string[]
): string {
  let defaultSeason = seasons[0];

  for (const season of seasons) {
    const items = dataBySeason[season] || [];

    const hasStats = items.some((item) =>
      statKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0) > 0
    );

    if (hasStats) {
      defaultSeason = season;
      break;
    }
  }

  return defaultSeason;
}
