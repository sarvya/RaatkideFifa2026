// Shared logic used by both the public page (app.js) and the admin page
// (admin.js), so scoring/bracket rules only live in one place.

const ROUND_ORDER = ["Round of 16", "Quarterfinal", "Semifinal", "Final"];
const PRIORITY_POINTS = { 1: 4, 2: 3, 3: 2, 4: 1 };

const FLAGS = {
  Canada: "🇨🇦",
  Morocco: "🇲🇦",
  Paraguay: "🇵🇾",
  France: "🇫🇷",
  Brazil: "🇧🇷",
  Norway: "🇳🇴",
  Mexico: "🇲🇽",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Portugal: "🇵🇹",
  Spain: "🇪🇸",
  "United States": "🇺🇸",
  Belgium: "🇧🇪",
  Argentina: "🇦🇷",
  Egypt: "🇪🇬",
  Switzerland: "🇨🇭",
  Colombia: "🇨🇴",
};

function flagFor(team) {
  return FLAGS[team] ? `${FLAGS[team]} ` : "";
}

function buildMatchIndex(matches) {
  return Object.fromEntries(matches.map((m) => [m.id, m]));
}

// Resolves a bracket slot ("Brazil" or a match id like "QF-1") to the
// actual team name once known, or null if not decided yet.
function resolveSlot(matchesById, slot) {
  if (!Object.prototype.hasOwnProperty.call(matchesById, slot)) return slot;
  return matchesById[slot].winner || null;
}

function resolvedTeams(matchesById, match) {
  return match.teams.map((slot) => resolveSlot(matchesById, slot));
}

function matchLabel(matchesById, slot) {
  if (!Object.prototype.hasOwnProperty.call(matchesById, slot)) return slot;
  const m = matchesById[slot];
  return m.winner || `TBD (${m.round})`;
}

function eliminatedTeams(matches) {
  const matchesById = buildMatchIndex(matches);
  const eliminated = new Set();
  for (const match of matches) {
    if (!match.winner) continue;
    const [a, b] = resolvedTeams(matchesById, match);
    if (a && b) {
      const loser = a === match.winner ? b : a;
      eliminated.add(loser);
    }
  }
  return eliminated;
}

function computeScores(players, matches) {
  const eliminated = eliminatedTeams(matches);
  const results = players.map((player) => {
    let total = 0;
    const picks = player.picks.map((pick) => {
      let points = 0;
      let wins = 0;
      for (const match of matches) {
        if (match.winner === pick.team) {
          points += PRIORITY_POINTS[pick.priority];
          wins += 1;
        }
      }
      total += points;
      return {
        ...pick,
        points,
        wins,
        eliminated: eliminated.has(pick.team),
      };
    });
    return { name: player.name, picks, total };
  });
  return results.sort((a, b) => b.total - a.total);
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];
