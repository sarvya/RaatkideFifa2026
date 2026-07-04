// Change this to whatever password you like — this is a casual gate to
// keep this page out of casual visitors' hands, not real security.
const ADMIN_PASSWORD = "raatkide2026";
const AUTH_KEY = "wc2026-admin-auth";
const DRAFT_KEY = "wc2026-admin-draft";

const matchesById = buildMatchIndex(MATCHES);

let draft = loadDraft();
let editingIndex = null;

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to defaults */
  }
  return {
    players: JSON.parse(JSON.stringify(PLAYERS)),
    winners: Object.fromEntries(
      MATCHES.filter((m) => m.winner).map((m) => [m.id, m.winner])
    ),
  };
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

// Builds a MATCHES-shaped array using the draft's winners, then clears any
// downstream winner that no longer matches the teams actually feeding into
// it (e.g. an earlier-round pick changed after later rounds were set).
function reconciledMatches() {
  const matches = MATCHES.map((m) => ({
    id: m.id,
    round: m.round,
    teams: m.teams,
    winner: draft.winners[m.id] || null,
  }));
  const byId = buildMatchIndex(matches);

  let changed = false;
  for (const round of ROUND_ORDER) {
    for (const m of matches.filter((x) => x.round === round)) {
      const [a, b] = resolvedTeams(byId, m);
      const stillValid = m.winner && a && b && (m.winner === a || m.winner === b);
      if (m.winner && !stillValid) {
        delete draft.winners[m.id];
        m.winner = null;
        changed = true;
      }
    }
  }
  if (changed) saveDraft();
  return matches;
}

function setWinner(matchId, team) {
  draft.winners[matchId] = team;
  saveDraft();
  render();
}

function clearWinner(matchId) {
  delete draft.winners[matchId];
  saveDraft();
  render();
}

function resetResults() {
  draft.winners = {};
  saveDraft();
  render();
}

// --- Players form ---

function pickFieldsHtml(existingPicks) {
  return [1, 2, 3, 4]
    .map((priority) => {
      const current = existingPicks && existingPicks[priority - 1] ? existingPicks[priority - 1].team : "";
      const options = TEAMS.map(
        (t) => `<option value="${t}" ${t === current ? "selected" : ""}>${flagFor(t)}${t}</option>`
      ).join("");
      return `
        <label>Priority ${priority} (${PRIORITY_POINTS[priority]} pts/win)
          <select data-priority="${priority}" required>
            <option value="">-- choose team --</option>
            ${options}
          </select>
        </label>`;
    })
    .join("");
}

function resetPlayerForm() {
  editingIndex = null;
  document.getElementById("player-form-title").textContent = "Add Player";
  document.getElementById("player-form-submit").textContent = "Add Player";
  document.getElementById("player-form-cancel").style.display = "none";
  document.getElementById("player-form-error").textContent = "";
  document.getElementById("player-name").value = "";
  document.getElementById("pick-fields").innerHTML = pickFieldsHtml();
}

function startEditPlayer(index) {
  editingIndex = index;
  const player = draft.players[index];
  document.getElementById("player-form-title").textContent = `Edit ${player.name}`;
  document.getElementById("player-form-submit").textContent = "Update Player";
  document.getElementById("player-form-cancel").style.display = "inline-block";
  document.getElementById("player-form-error").textContent = "";
  document.getElementById("player-name").value = player.name;
  document.getElementById("pick-fields").innerHTML = pickFieldsHtml(player.picks);
  window.scrollTo({ top: document.getElementById("player-form").offsetTop - 20, behavior: "smooth" });
}

function removePlayer(index) {
  if (!confirm(`Remove ${draft.players[index].name}?`)) return;
  draft.players.splice(index, 1);
  saveDraft();
  render();
}

document.getElementById("player-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("player-name").value.trim();
  const selects = [...document.querySelectorAll("#pick-fields select")];
  const teams = selects.map((s) => s.value);
  const errorEl = document.getElementById("player-form-error");

  if (!name) {
    errorEl.textContent = "Name is required.";
    return;
  }
  if (teams.some((t) => !t)) {
    errorEl.textContent = "Pick a team for all 4 priorities.";
    return;
  }
  if (new Set(teams).size !== teams.length) {
    errorEl.textContent = "A player's 4 picks must be different teams.";
    return;
  }

  const picks = teams.map((team, i) => ({ team, priority: i + 1 }));
  if (editingIndex === null) {
    draft.players.push({ name, picks });
  } else {
    draft.players[editingIndex] = { name, picks };
  }
  saveDraft();
  resetPlayerForm();
  render();
});

document.getElementById("player-form-cancel").addEventListener("click", resetPlayerForm);

// --- Rendering ---

function renderPlayersAdmin(scores) {
  const el = document.getElementById("admin-players");
  el.innerHTML = scores
    .map(
      (p, i) => `
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
        <div class="player-card-actions">
          <button type="button" data-edit="${i}">Edit</button>
          <button type="button" class="danger" data-remove="${i}">Remove</button>
        </div>
      </div>`
    )
    .join("");

  el.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => startEditPlayer(Number(btn.dataset.edit)))
  );
  el.querySelectorAll("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => removePlayer(Number(btn.dataset.remove)))
  );
}

function renderBracket(matches) {
  const byId = buildMatchIndex(matches);
  const el = document.getElementById("bracket");
  el.innerHTML = ROUND_ORDER.map((round) => {
    const roundMatches = matches.filter((m) => m.round === round);
    return `
      <div class="round-column">
        <h3>${round}</h3>
        ${roundMatches
          .map((m) => {
            const [a, b] = resolvedTeams(byId, m);
            const decided = !!m.winner;
            const renderTeam = (name) => {
              if (!name) return `<div class="team tbd">TBD</div>`;
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

function dataJsHeader() {
  return `/*
  EDIT THIS FILE MANUALLY as the tournament progresses, or regenerate it
  from the admin page (admin.html).

  1) TEAMS        - the 16 teams that reached the Round of 16.
  2) PLAYERS       - each person + their 4 picks, each with a priority 1-4.
                     priority 1 = 4 pts/win, priority 2 = 3 pts/win,
                     priority 3 = 2 pts/win, priority 4 = 1 pt/win.
  3) MATCHES       - the bracket. Each match has an id, a round label,
                     and "teams": either two team names (Round of 16)
                     or two other match-ids (later rounds), meaning
                     "winner of that match".
                     Set "winner" to the exact team name once decided.
                     Leave winner: null until the match is played.
*/

`;
}

function renderExport(matches) {
  const matchesOut = matches.map((m) => ({
    id: m.id,
    round: m.round,
    teams: m.teams,
    winner: m.winner || null,
  }));
  const text =
    dataJsHeader() +
    `const TEAMS = ${JSON.stringify(TEAMS, null, 2)};\n\n` +
    `const PLAYERS = ${JSON.stringify(draft.players, null, 2)};\n\n` +
    `const MATCHES = ${JSON.stringify(matchesOut, null, 2)};\n`;
  document.getElementById("export-output").value = text;
}

function render() {
  const matches = reconciledMatches();
  const scores = computeScores(draft.players, matches);
  renderPlayersAdmin(scores);
  renderBracket(matches);
  renderExport(matches);
}

document.getElementById("reset-bracket").addEventListener("click", () => {
  if (confirm("Clear all set match results? Player picks are kept.")) {
    resetResults();
  }
});

document.getElementById("copy-btn").addEventListener("click", async () => {
  const text = document.getElementById("export-output").value;
  await navigator.clipboard.writeText(text);
  const status = document.getElementById("copy-status");
  status.textContent = "Copied!";
  setTimeout(() => (status.textContent = ""), 2000);
});

document.getElementById("download-btn").addEventListener("click", () => {
  const text = document.getElementById("export-output").value;
  const blob = new Blob([text], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.js";
  a.click();
  URL.revokeObjectURL(url);
});

// --- Password gate ---

document.getElementById("gate-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = document.getElementById("gate-password").value;
  if (val === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "1");
    unlock();
  } else {
    document.getElementById("gate-error").textContent = "Incorrect password.";
  }
});

function unlock() {
  document.getElementById("gate").style.display = "none";
  document.getElementById("admin-content").style.display = "block";
  resetPlayerForm();
  render();
}

if (localStorage.getItem(AUTH_KEY) === "1") {
  unlock();
}
