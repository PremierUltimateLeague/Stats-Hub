/**
 * fetch-youtube-links.js
 *
 * Fetches video URLs from the PUL YouTube channel and writes youtubeUrl
 * into the season's game data.
 *
 * - Seasons WITH schedule.json (e.g. 2026): updates youtubeUrl in schedule.json
 *   (used by schedule page + home sidebar Watch buttons)
 * - Seasons WITHOUT schedule.json (e.g. 2024, 2025): writes youtube_links.json
 *   (used by individual game pages)
 *
 * Usage:
 *   node --env-file=.env processing/fetch-youtube-links.js
 *   node --env-file=.env processing/fetch-youtube-links.js --dry-run
 *   node --env-file=.env processing/fetch-youtube-links.js --season=2025
 *   node --env-file=.env processing/fetch-youtube-links.js --season=2025 --dry-run
 *
 * Required env var:
 *   YOUTUBE_API_KEY — YouTube Data API v3 key
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

// Abbreviation → full team name (covers all historical seasons)
const ABBREV_TO_NAME = {
  'ATL':  'Atlanta Soul',
  'ATX':  'Austin Torch',
  'DC':   'DC Shadow',
  'INDY': 'Indy Red',
  'IND':  'Indy Red',
  'LA':   'LA Astra',
  'MED':  'Medellin Revolution',
  'MKE':  'Milwaukee Monarchs',
  'MIN':  'Minnesota Strike',
  'MINN': 'Minnesota Strike',
  'NSH':  'Nashville NightShade',
  'NASH': 'Nashville NightShade',
  'NY':   'New York Gridlock',
  'NYC':  'New York Gridlock',
  'PHL':  'Philadelphia Surge',
  'PHI':  'Philadelphia Surge',
  'PORT': 'Portland Rising',
  'RAL':  'Raleigh Radiance',
};

// Keywords used to identify each team in a video title
const TEAM_KEYWORDS = {
  'Atlanta Soul':         ['atlanta', 'soul'],
  'Austin Torch':         ['austin', 'torch'],
  'DC Shadow':            ['dc shadow', 'shadow'],
  'Indy Red':             ['indy', 'indy red'],
  'LA Astra':             ['la astra', 'astra'],
  'Medellin Revolution':  ['medellin', 'revolution'],
  'Milwaukee Monarchs':   ['milwaukee', 'monarchs'],
  'Minnesota Strike':     ['minnesota', 'strike'],
  'Nashville NightShade': ['nashville', 'nightshade', 'night shade'],
  'New York Gridlock':    ['new york', 'gridlock', 'nyc'],
  'Philadelphia Surge':   ['philadelphia', 'surge', 'philly'],
  'Portland Rising':      ['portland', 'rising'],
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
    titleContainsTeam(video.title, game.awayName) &&
    titleContainsTeam(video.title, game.homeName)
  );

  if (candidates.length === 1) return candidates[0];

  if (candidates.length > 1) {
    for (const game of candidates) {
      const weekNum = game.weekNum;
      if (weekNum && (lower.includes(`week ${weekNum}`) || lower.includes(`wk ${weekNum}`))) {
        return game;
      }
    }
    console.warn(`  ⚠ Ambiguous match for: "${video.title}" (${candidates.length} candidates)`);
    return null;
  }

  return null;
}

// ── Season helpers ────────────────────────────────────────────────────────────

function loadGamesFromSchedule(schedulePath) {
  const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
  const games = [];
  for (const week of schedule) {
    for (const game of week.games) {
      if (!game.youtubeUrl) {
        games.push({
          match: `${game.awayAbbrev} @ ${game.homeAbbrev}`,
          awayAbbrev: game.awayAbbrev,
          homeAbbrev: game.homeAbbrev,
          awayName: ABBREV_TO_NAME[game.awayAbbrev] ?? game.away,
          homeName: ABBREV_TO_NAME[game.homeAbbrev] ?? game.home,
          weekNum: week.week,
          _scheduleWeek: week,
          _scheduleGame: game,
        });
      }
    }
  }
  return { type: 'schedule', schedule, games };
}

function loadGamesFromTeamGames(teamGamesPath, existingLinks) {
  const teamGames = JSON.parse(fs.readFileSync(teamGamesPath, 'utf-8'));
  const seen = new Set();
  const games = [];
  for (const g of teamGames) {
    if (seen.has(g.match) || existingLinks[g.match]) continue;
    seen.add(g.match);
    const [awayAbbrev, homeAbbrev] = g.match.split(' @ ');
    const weekNum = parseInt(String(g.week).replace(/\D/g, '') || '0') || null;
    games.push({
      match: g.match,
      awayAbbrev,
      homeAbbrev,
      awayName: ABBREV_TO_NAME[awayAbbrev] ?? awayAbbrev,
      homeName: ABBREV_TO_NAME[homeAbbrev] ?? homeAbbrev,
      weekNum,
    });
  }
  return { type: 'links', games };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error('❌ YOUTUBE_API_KEY environment variable is not set.');
    console.error('   Run with: node --env-file=.env processing/fetch-youtube-links.js');
    process.exit(1);
  }

  const dataDir = path.join(REPO_ROOT, 'data', SEASON);
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ No data directory found for season ${SEASON} at ${dataDir}`);
    process.exit(1);
  }

  const schedulePath = path.join(dataDir, 'schedule.json');
  const teamGamesPath = path.join(dataDir, 'teams_games.json');
  const linksPath = path.join(dataDir, 'youtube_links.json');

  console.log(`\n🎬 Fetching YouTube links for ${SEASON} season${DRY_RUN ? ' (dry run)' : ''}...\n`);

  // Load season game list
  let seasonData;
  if (fs.existsSync(schedulePath)) {
    console.log(`  Using schedule.json (${SEASON} has a full schedule)\n`);
    seasonData = loadGamesFromSchedule(schedulePath);
  } else if (fs.existsSync(teamGamesPath)) {
    const existingLinks = fs.existsSync(linksPath)
      ? JSON.parse(fs.readFileSync(linksPath, 'utf-8'))
      : {};
    console.log(`  Using teams_games.json (no schedule.json for ${SEASON})\n`);
    seasonData = loadGamesFromTeamGames(teamGamesPath, existingLinks);
    seasonData.existingLinks = existingLinks;
  } else {
    console.error(`❌ No schedule.json or teams_games.json found for season ${SEASON}`);
    process.exit(1);
  }

  const { games } = seasonData;
  console.log(`  ${games.length} game(s) without a YouTube link\n`);
  if (games.length === 0) {
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
  const seasonPlaylist = playlists.find(p => p.snippet.title.includes(SEASON));

  if (!seasonPlaylist) {
    console.error(`❌ No playlist found containing "${SEASON}" in its title.`);
    console.log('\n  Available playlists:');
    playlists.forEach(p => console.log(`    • ${p.snippet.title}`));
    process.exit(1);
  }
  console.log(`  Found playlist: "${seasonPlaylist.snippet.title}"\n`);

  // Fetch all videos
  console.log(`  Fetching videos...`);
  const videos = await getPlaylistVideos(seasonPlaylist.id);
  console.log(`  Found ${videos.length} video(s)\n`);

  // Match and write
  let matched = 0;
  const remaining = [...games];
  const newLinks = { ...(seasonData.existingLinks ?? {}) };

  for (const video of videos) {
    const game = matchVideoToGame(video, remaining);
    if (!game) continue;

    console.log(`  ✓ "${video.title}"`);
    console.log(`    → ${game.match}`);
    console.log(`    → ${video.url}\n`);

    if (seasonData.type === 'schedule') {
      game._scheduleGame.youtubeUrl = video.url;
    } else {
      newLinks[game.match] = video.url;
    }

    remaining.splice(remaining.indexOf(game), 1);
    matched++;
  }

  if (remaining.length > 0) {
    console.log(`  ⚠ ${remaining.length} game(s) had no matching video:`);
    remaining.forEach(g => console.log(`    • ${g.match}`));
    console.log();
  }

  console.log(`  Summary: ${matched} link(s) found, ${remaining.length} unmatched\n`);

  if (matched === 0) {
    console.log('  No changes to write.');
    return;
  }

  if (DRY_RUN) {
    console.log('  Dry run — no files written.');
    return;
  }

  if (seasonData.type === 'schedule') {
    fs.writeFileSync(schedulePath, JSON.stringify(seasonData.schedule, null, 2));
    console.log(`  ✅ Updated ${schedulePath}`);
  } else {
    fs.writeFileSync(linksPath, JSON.stringify(newLinks, null, 2));
    console.log(`  ✅ Updated ${linksPath}`);
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
