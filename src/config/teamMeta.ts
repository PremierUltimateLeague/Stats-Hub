/**
 * Team metadata: founding info, status, and editorial context.
 *
 * Sources:
 *   - https://www.premierultimateleague.com/expansion
 *   - https://en.wikipedia.org/wiki/Premier_Ultimate_League
 *   - Individual team Wikipedia pages
 *
 * 2019 original 8:  Atlanta Soul, Austin Torch, Columbus Pride, Indy Red,
 *                    Medellin Revolution, Nashville NightShade, New York Gridlock,
 *                    Raleigh Radiance
 * 2020 expansion 4: DC Shadow, Milwaukee Monarchs, Minnesota Strike, Portland Rising
 *                    (season cancelled — COVID-19)
 * 2021:             Limited Championship Series — 9 of 12 teams competed
 *                    (Atlanta, Minnesota, Nashville opted out)
 * 2023:             Philadelphia Surge replaced Medellin Revolution
 * 2024:             Columbus Pride on hiatus → dissolved June 2024
 * 2025:             LA Astra joined; Portland Rising suspended operations
 */

export type TeamStatus = 'active' | 'suspended' | 'dissolved' | 'departed';

export interface TeamMeta {
    /** Year the team joined the PUL */
    founded: number;
    /** Current operational status */
    status: TeamStatus;
    /** Brief note shown on the team page (optional) */
    statusNote?: string;
    /** City/region */
    location: string;
    /** Seasons the team actively competed in (not just existed) */
    seasonsActive: string[];
}

export const teamMeta: Record<string, TeamMeta> = {
    'Atlanta Soul': {
        founded: 2019,
        status: 'active',
        location: 'Atlanta, GA',
        seasonsActive: ['2019', '2022', '2023', '2024', '2025'],
        // Opted out of 2021 Championship Series
    },
    'Austin Torch': {
        founded: 2019,
        status: 'active',
        location: 'Austin, TX',
        seasonsActive: ['2019', '2021', '2022', '2023', '2024', '2025'],
    },
    'Columbus Pride': {
        founded: 2019,
        status: 'dissolved',
        statusNote: 'Dissolved June 2024',
        location: 'Columbus, OH',
        seasonsActive: ['2019', '2021', '2022', '2023'],
        // On hiatus for 2024, officially dissolved June 2024
    },
    'DC Shadow': {
        founded: 2020,
        status: 'active',
        location: 'Washington, DC',
        seasonsActive: ['2021', '2022', '2023', '2024', '2025'],
        // 2020 expansion team, season cancelled
    },
    'Indy Red': {
        founded: 2019,
        status: 'active',
        location: 'Indianapolis, IN',
        seasonsActive: ['2019', '2021', '2022', '2023', '2024', '2025'],
    },
    'LA Astra': {
        founded: 2025,
        status: 'active',
        location: 'Los Angeles, CA',
        seasonsActive: ['2025'],
    },
    'Medellin Revolution': {
        founded: 2019,
        status: 'departed',
        statusNote: 'Left PUL after 2022 to join Latam Pro',
        location: 'Medellín, Colombia',
        seasonsActive: ['2019', '2021', '2022'],
        // Opted out of 2020 (cancelled), competed in 2021 Championship Series
    },
    'Milwaukee Monarchs': {
        founded: 2020,
        status: 'active',
        location: 'Milwaukee, WI',
        seasonsActive: ['2021', '2022', '2023', '2024', '2025'],
    },
    'Minnesota Strike': {
        founded: 2020,
        status: 'active',
        location: 'Minneapolis, MN',
        seasonsActive: ['2022', '2023', '2024', '2025'],
        // Opted out of 2021 Championship Series
    },
    'Nashville NightShade': {
        founded: 2019,
        status: 'active',
        location: 'Nashville, TN',
        seasonsActive: ['2019', '2022', '2023', '2024', '2025'],
        // Opted out of 2021 Championship Series
    },
    'New York Gridlock': {
        founded: 2019,
        status: 'active',
        location: 'New York, NY',
        seasonsActive: ['2019', '2021', '2022', '2023', '2024', '2025'],
    },
    'Philadelphia Surge': {
        founded: 2023,
        status: 'active',
        location: 'Philadelphia, PA',
        seasonsActive: ['2023', '2024', '2025'],
        // Replaced Medellin Revolution
    },
    'Portland Rising': {
        founded: 2020,
        status: 'suspended',
        statusNote: 'Suspended operations for 2025',
        location: 'Portland, ME',
        seasonsActive: ['2021', '2022', '2023', '2024'],
    },
    'Raleigh Radiance': {
        founded: 2019,
        status: 'active',
        location: 'Raleigh, NC',
        seasonsActive: ['2019', '2021', '2022', '2023', '2024', '2025'],
    },
};

/**
 * Get display string for team status badge.
 */
export function getStatusLabel(status: TeamStatus): string {
    switch (status) {
        case 'active': return 'Active';
        case 'suspended': return 'Suspended';
        case 'dissolved': return 'Dissolved';
        case 'departed': return 'Departed';
    }
}

/**
 * Get CSS classes for a status badge.
 */
export function getStatusClasses(status: TeamStatus): string {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'suspended': return 'bg-yellow-100 text-yellow-800';
        case 'dissolved': return 'bg-red-100 text-red-800';
        case 'departed': return 'bg-gray-100 text-gray-600';
    }
}