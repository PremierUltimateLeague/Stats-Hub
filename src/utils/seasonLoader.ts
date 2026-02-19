import fs from 'node:fs';
import path from 'node:path';

export function loadSeasonData(
  seasons: string[],
  filename: string
): Record<string, any[]> {
  const result: Record<string, any[]> = {};

  for (const season of seasons) {
    try {
      const data = fs.readFileSync(
        path.join(process.cwd(), 'data', season, filename),
        'utf-8'
      );
      result[season] = JSON.parse(data);
    } catch (e) {
      result[season] = [];
    }
  }

  return result;
}

export function findDefaultSeason(
  seasons: string[],
  dataBySeason: Record<string, any[]>,
  statKeys: string[]
): string {
  let defaultSeason = seasons[0];

  for (const season of seasons) {
    const items = dataBySeason[season] || [];

    const hasStats = items.some((item: any) =>
      statKeys.reduce((sum, key) => sum + (item[key] || 0), 0) > 0
    );

    if (hasStats) {
      defaultSeason = season;
      break;
    }
  }

  return defaultSeason;
}
