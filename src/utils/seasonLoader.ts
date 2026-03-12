import fs from 'node:fs';
import path from 'node:path';

export function loadSeasonData<T = Record<string, unknown>>(
  seasons: string[],
  filename: string
): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const season of seasons) {
    try {
      const data = fs.readFileSync(
        path.join(process.cwd(), 'data', season, filename),
        'utf-8'
      );
      result[season] = JSON.parse(data) as T[];
    } catch (e) {
      console.error(`Failed to load ${filename} for season ${season}:`, e);
      result[season] = [];
    }
  }

  return result;
}

export function findDefaultSeason(
  seasons: string[],
  dataBySeason: Record<string, Record<string, unknown>[]>,
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
