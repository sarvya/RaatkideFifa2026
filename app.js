const PRIORITY_POINTS = { 1: 4, 2: 3, 3: 2, 4: 1 };
const ROUND_ORDER = ["Round of 16", "Quarterfinal", "Semifinal", "Final"];
const STORAGE_KEY = "wc2026-winners";

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

const matchesById = Object.fromEntries(MATCHES.map((m) => [m.id, m]));

// Pristine snapshot of the winners as authored in data.js, so a "Clear"
// action has something to fall back to besides null.
const baseById = Object.fromEntries(
  MATCHES.map((m) => [m.id, { winner: m.winner }])
);

function isMatchId(slot) {
  return Object.prototype.hasOwnProperty.call(matchesById, slot);
}

// Resolves a bracket slot ("Team 3" or a match id like "QF-1") to the
// actual team name once known, or null if not decided yet.
function resolveSlot(slot) {
  if (!isMatchId(slot)) return slot;
  return matchesById[slot].winner || null;
}

function resolvedTeams(match) {
  return match.teams.map(resolveSlot);
}

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

// Rebuilds every match's winner from (override || data.js base), then
// walks the rounds in order and clears any downstream winner that no
// longer matches the teams actually feeding into it (e.g. you changed
// an earlier pick after later rounds were already selected).
function syncMatches() {
  const overrides = loadOverrides();
  for (const m of MATCHES) {
    m.winner = Object.prototype.hasOwnProperty.call(overrides, m.id)
      ? overrides[m.id]
      : baseById[m.id].winner;
  }

  let changed = false;
  for (const round of ROUND_ORDER) {
    for (const m of MATCHES.filter((x) => x.round === round)) {
      const [a, b] = resolvedTeams(m);
      const stillValid = m.winner && a && b && (m.winner === a || m.winner === b);
      if (m.winner && !stillValid) {
        m.winner = null;
        if (Object.prototype.hasOwnProperty.call(overrides, m.id)) {
          delete overrides[m.id];
          changed = true;
        }
      }
    }
  }
  if (changed) saveOverrides(overrides);
}

function setWinner(matchId, team) {
  const overrides = loadOverrides();
  overrides[matchId] = team;
  saveOverrides(overrides);
  syncMatches();
  render();
}

function clearWinner(matchId) {
  const overrides = loadOverrides();
  delete overrides[matchId];
  saveOverrides(overrides);
  syncMatches();
  render();
}

function resetBracket() {
  localStorage.removeItem(STORAGE_KEY);
  syncMatches();
  render();
}

function eliminatedTeams() {
  const eliminated = new Set();
  for (const match of MATCHES) {
    if (!match.winner) continue;
    const [a, b] = resolvedTeams(match);
    if (a && b) {
      const loser = a === match.winner ? b : a;
      eliminated.add(loser);
    }
  }
  return eliminated;
}

function computeScores() {
  const eliminated = eliminatedTeams();
  const results = PLAYERS.map((player) => {
    let total = 0;
    const picks = player.picks.map((pick) => {
      let points = 0;
      let wins = 0;
      for (const match of MATCHES) {
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

function matchLabel(slot) {
  if (!isMatchId(slot)) return slot;
  const m = matchesById[slot];
  return m.winner || `TBD (${m.round})`;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function renderLeaderboard(scores) {
  const el = document.getElementById("leaderboard");
  el.innerHTML = scores
    .map((p, i) => {
      const alive = p.picks.filter((pk) => !pk.eliminated).length;
      return `
        <tr>
          <td class="rank">${RANK_MEDALS[i] || i + 1}</td>
          <td class="name">${p.name}</td>
          <td class="points">${p.total}</td>
          <td class="alive">${alive}/${p.picks.length} alive</td>
        </tr>`;
    })
    .join("");
}

function renderPlayers(scores) {
  const el = document.getElementById("players");
  el.innerHTML = scores
    .map(
      (p) => `
      <div class="player-card">
        <div class="player-card-header">
          <h3>${p.name}</h3>
          <span class="total-points">${p.total} pts</span>
        </div>
        <div class="picks">
          ${p.picks
            .map(
              (pk) => `
            <div class="pick ${pk.eliminated ? "eliminated" : "alive"}">
              <span class="priority-badge priority-${pk.priority}">P${pk.priority}</span>
              <span class="pick-team">${flagFor(pk.team)}${pk.team}</span>
              <span class="pick-points">${pk.points} pts</span>
              <span class="pick-status">${pk.eliminated ? "Eliminated" : "Alive"}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

function renderBracket() {
  const el = document.getElementById("bracket");
  el.innerHTML = ROUND_ORDER.map((round) => {
    const matches = MATCHES.filter((m) => m.round === round);
    return `
      <div class="round-column">
        <h3>${round}</h3>
        ${matches
          .map((m) => {
            const [a, b] = resolvedTeams(m);
            const decided = !!m.winner;
            const renderTeam = (name) => {
              if (!name) {
                return `<div class="team tbd">TBD</div>`;
              }
              const isWinner = decided && m.winner === name;
              return `<button type="button" class="team team-btn ${isWinner ? "winner" : ""}" data-match="${m.id}" data-team="${name}">${flagFor(name)}${name}</button>`;
            };
            return `
            <div class="match ${decided ? "decided" : ""}">
              ${renderTeam(a)}
              <div class="vs">vs</div>
              ${renderTeam(b)}
              ${decided ? `<button type="button" class="clear-btn" data-clear="${m.id}">Clear pick</button>` : ""}
            </div>`;
          })
          .join("")}
      </div>`;
  }).join("");

  el.querySelectorAll(".team-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const matchId = btn.dataset.match;
      const team = btn.dataset.team;
      if (btn.classList.contains("winner")) {
        clearWinner(matchId);
      } else {
        setWinner(matchId, team);
      }
    });
  });

  el.querySelectorAll(".clear-btn").forEach((btn) => {
    btn.addEventListener("click", () => clearWinner(btn.dataset.clear));
  });
}

function render() {
  const scores = computeScores();
  renderLeaderboard(scores);
  renderPlayers(scores);
  renderBracket();
}

document.getElementById("reset-bracket").addEventListener("click", () => {
  if (confirm("Clear all selected winners and start the bracket over?")) {
    resetBracket();
  }
});

syncMatches();
render();
