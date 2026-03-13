/**
 * fetch-youtube-links.js
 *
 * Fetches video URLs from the PUL YouTube channel and updates schedule.json
 * with youtubeUrl for each matched game.
 *
 * Usage:
 *   node processing/fetch-youtube-links.js               # updates schedule.json
 *   node processing/fetch-youtube-links.js --dry-run     # prints matches, no writes
 *   node processing/fetch-youtube-links.js --season 2025 # specific season
 *
 * Required env var:
 *   YOUTUBE_API_KEY — YouTube Data API v3 key (store in .env or GitHub secret)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ── Config ────────────────────────────────────────────────────────────────────

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_HANDLE = 'PremierUltimateLeague';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SEASON = args.find(a => a.startsWith('--season='))?.split('=')[1]
  ?? String(new Date().getFullYear());

// Keywords used to identify each team in a video title
const TEAM_KEYWORDS = {
  'Atlanta Soul':         ['atlanta', 'soul'],
  'Austin Torch':         ['austin', 'torch'],
  'DC Shadow':            ['dc shadow', 'shadow'],
  'Indy Red':             ['indy', 'indy red'],
  'Milwaukee Monarchs':   ['milwaukee', 'monarchs'],
  'Minnesota Strike':     ['minnesota', 'strike'],
  'Nashville NightShade': ['nashville', 'nightshade', 'night shade'],
  'New York Gridlock':    ['new york', 'gridlock', 'nyc'],
  'Philadelphia Surge':   ['philadelphia', 'surge', 'philly'],
  'Raleigh Radiance':     ['raleigh', 'radiance'],
};

// ── YouTube API helpers ───────────────────────────────────────────────────────

async function apiGet(endpoint, params) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('key', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`YouTube API error ${res.status}: ${err?.error?.message ?? res.statusText}`);
  }
  return res.json();
}

async function getChannelId() {
  const data = await apiGet('channels', { part: 'id', forHandle: CHANNEL_HANDLE });
  const id = data.items?.[0]?.id;
  if (!id) throw new Error(`Channel not found for handle: ${CHANNEL_HANDLE}`);
  return id;
}

async function getPlaylists(channelId) {
  const playlists = [];
  let pageToken = undefined;
  do {
    const params = { part: 'snippet', channelId, maxResults: 50 };
    if (pageToken) params.pageToken = pageToken;
    const data = await apiGet('playlists', params);
    playlists.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return playlists;
}

async function getPlaylistVideos(playlistId) {
  const videos = [];
  let pageToken = undefined;
  do {
    const params = { part: 'snippet', playlistId, maxResults: 50 };
    if (pageToken) params.pageToken = pageToken;
    const data = await apiGet('playlistItems', params);
    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      if (videoId && title) {
        videos.push({ title, url: `https://www.youtube.com/watch?v=${videoId}` });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return videos;
}

// ── Matching logic ────────────────────────────────────────────────────────────

function titleContainsTeam(title, teamName) {
  const lower = title.toLowerCase();
  return TEAM_KEYWORDS[teamName]?.some(kw => lower.includes(kw)) ?? false;
}

function matchVideoToGame(video, games) {
  const lower = video.title.toLowerCase();
  const candidates = games.filter(game =>
    titleContainsTeam(video.title, game.away) &&
    titleContainsTeam(video.title, game.home)
  );

  if (candidates.length === 1) return candidates[0];

  // If multiple candidates (e.g. same matchup different weeks), try week number
  if (candidates.length > 1) {
    for (const game of candidates) {
      if (lower.includes(`week ${game.week}`) || lower.includes(`wk ${game.week}`)) {
        return game;
      }
    }
    // Still ambiguous — return null rather than guess wrong
    console.warn(`  ⚠ Ambiguous match for: "${video.title}" (${candidates.length} candidates)`);
    return null;
  }

  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error('❌ YOUTUBE_API_KEY environment variable is not set.');
    console.error('   Add it to your .env file or pass it inline:');
    console.error('   YOUTUBE_API_KEY=your_key node processing/fetch-youtube-links.js');
    process.exit(1);
  }

  const schedulePath = path.join(REPO_ROOT, 'data', SEASON, 'schedule.json');
  if (!fs.existsSync(schedulePath)) {
    console.error(`❌ No schedule.json found for season ${SEASON} at ${schedulePath}`);
    process.exit(1);
  }

  console.log(`\n🎬 Fetching YouTube links for ${SEASON} season${DRY_RUN ? ' (dry run)' : ''}...\n`);

  // Load schedule
  const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

  // Flatten all games that don't yet have a youtubeUrl
  const gamesNeedingLinks = [];
  for (const week of schedule) {
    for (const game of week.games) {
      if (!game.youtubeUrl) {
        gamesNeedingLinks.push({ ...game, week: week.week });
      }
    }
  }
  console.log(`  ${gamesNeedingLinks.length} game(s) without a YouTube link\n`);
  if (gamesNeedingLinks.length === 0) {
    console.log('  Nothing to do — all games already have links.');
    return;
  }

  // Resolve channel
  console.log(`  Resolving channel @${CHANNEL_HANDLE}...`);
  const channelId = await getChannelId();
  console.log(`  Channel ID: ${channelId}\n`);

  // Find the season playlist
  console.log(`  Fetching playlists...`);
  const playlists = await getPlaylists(channelId);
  const seasonPlaylist = playlists.find(p =>
    p.snippet.title.includes(SEASON)
  );

  if (!seasonPlaylist) {
    console.error(`❌ No playlist found containing "${SEASON}" in its title.`);
    console.log('\n  Available playlists:');
    playlists.forEach(p => console.log(`    • ${p.snippet.title}`));
    console.log('\n  Use --season=YEAR to target a different year, or check the playlist name above.');
    process.exit(1);
  }

  console.log(`  Found playlist: "${seasonPlaylist.snippet.title}"\n`);

  // Fetch all videos in playlist
  console.log(`  Fetching videos...`);
  const videos = await getPlaylistVideos(seasonPlaylist.id);
  console.log(`  Found ${videos.length} video(s)\n`);

  // Match videos to games
  let matched = 0;
  let unmatched = 0;

  for (const video of videos) {
    const game = matchVideoToGame(video, gamesNeedingLinks);
    if (!game) {
      unmatched++;
      continue;
    }

    console.log(`  ✓ Matched: "${video.title}"`);
    console.log(`         → Week ${game.week}: ${game.away} @ ${game.home}`);
    console.log(`         → ${video.url}\n`);

    // Write back into schedule
    for (const week of schedule) {
      if (week.week !== game.week) continue;
      for (const g of week.games) {
        if (g.awayAbbrev === game.awayAbbrev && g.homeAbbrev === game.homeAbbrev) {
          g.youtubeUrl = video.url;
          matched++;
        }
      }
    }

    // Remove from candidates so it can't match twice
    const idx = gamesNeedingLinks.indexOf(game);
    if (idx !== -1) gamesNeedingLinks.splice(idx, 1);
  }

  // Report unmatched games
  if (gamesNeedingLinks.length > 0) {
    console.log(`  ⚠ ${gamesNeedingLinks.length} game(s) had no matching video:`);
    gamesNeedingLinks.forEach(g => console.log(`    • Week ${g.week}: ${g.away} @ ${g.home}`));
    console.log();
  }

  console.log(`  Summary: ${matched} link(s) found, ${gamesNeedingLinks.length} game(s) unmatched\n`);

  if (matched === 0) {
    console.log('  No changes to write.');
    return;
  }

  if (DRY_RUN) {
    console.log('  Dry run — no files written.');
    return;
  }

  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
  console.log(`  ✅ Updated ${schedulePath}`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
