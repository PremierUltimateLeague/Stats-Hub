/**
 * Normalize a string for accent-insensitive comparison.
 * e.g. "Ángel" -> "angel"
 */
export function normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Get top N players by a stat with proper tied rankings.
 * Players with the same stat value receive the same rank.
 * If the last included player is tied with the next, those are included too.
 */
export function getLeadersWithRanks(
    players: any[],
    stat: string,
    n: number = 5
): any[] {
    const sorted = [...players].sort((a, b) => (b[stat] || 0) - (a[stat] || 0));
    const result: any[] = [];

    for (let i = 0; i < sorted.length && result.length < n; i++) {
        const value = sorted[i][stat] || 0;
        if (i > 0 && value === (sorted[i - 1][stat] || 0)) {
            result.push({ ...sorted[i], rank: result[result.length - 1].rank });
        } else {
            result.push({ ...sorted[i], rank: i + 1 });
        }
    }

    // Include ties at cutoff
    const lastValue = result.length > 0 ? result[result.length - 1][stat] : -1;
    for (let i = result.length; i < sorted.length; i++) {
        if ((sorted[i][stat] || 0) === lastValue) {
            result.push({ ...sorted[i], rank: result[result.length - 1].rank });
        } else {
            break;
        }
    }

    return result;
}

/**
 * Pad leader lists to match the longest list's length.
 * Used on homepage and leaders page to keep boxes equal height.
 */
export function padLeadersToMatch(
    leadersByCategory: Record<string, any[]>,
    playersByCategory: Record<string, any[]>,
    categories: string[]
): Record<string, any[]> {
    const maxCount = Math.max(
        ...categories.map(cat => (leadersByCategory[cat] || []).length)
    );

    const padded: Record<string, any[]> = {};

    for (const cat of categories) {
        const leaders = leadersByCategory[cat] || [];
        const sorted = playersByCategory[cat] || [];
        const result = [...leaders];
        let nextIndex = result.length;

        while (result.length < maxCount && nextIndex < sorted.length) {
            const value = sorted[nextIndex][cat] || 0;
            const prevValue = sorted[nextIndex - 1]?.[cat] || 0;
            if (value === prevValue) {
                result.push({ ...sorted[nextIndex], rank: result[result.length - 1].rank });
            } else {
                result.push({ ...sorted[nextIndex], rank: nextIndex + 1 });
            }
            nextIndex++;
        }
        padded[cat] = result;
    }

    return padded;
}

/**
 * Parse player display name into number and name parts.
 * e.g. "99 Veronica Kolegue-Spalaris" -> { number: "99", name: "Veronica Kolegue-Spalaris" }
 */
export function parsePlayerName(displayName: string): {
    number: string | null;
    name: string;
    full: string;
} {
    const match = displayName.match(/^(\d+)\s+(.+)$/);
    return {
        number: match ? match[1] : null,
        name: match ? match[2] : displayName,
        full: displayName,
    };
}

/**
 * Check if a season has actual game stats (not all zeros).
 */
export function seasonHasStats(players: any[], statKeys: string[] = ['goals', 'assists', 'blocks']): boolean {
    return players.some(p =>
        statKeys.reduce((sum, key) => sum + (p[key] || 0), 0) > 0
    );
}