// Read-only public page: renders leaderboard, players, and bracket straight
// from data.js. Results are edited on the admin page, not here.

const matchesById = buildMatchIndex(MATCHES);

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
            const [a, b] = resolvedTeams(matchesById, m);
            const decided = !!m.winner;
            const renderTeam = (name) => {
              if (!name) return `<div class="team tbd">TBD</div>`;
              const isWinner = decided && m.winner === name;
              return `<div class="team ${isWinner ? "winner" : ""}">${flagFor(name)}${name}</div>`;
            };
            return `
            <div class="match ${decided ? "decided" : ""}">
              ${renderTeam(a)}
              <div class="vs">vs</div>
              ${renderTeam(b)}
            </div>`;
          })
          .join("")}
      </div>`;
  }).join("");
}

function render() {
  const scores = computeScores(PLAYERS, MATCHES);
  renderLeaderboard(scores);
  renderPlayers(scores);
  renderBracket();
}

render();
