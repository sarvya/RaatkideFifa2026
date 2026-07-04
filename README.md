# Raatkide — FIFA World Cup 2026 Pick'em

A single-page pick'em app for the Round of 16 onward. Each player picks 4 teams,
ranked by priority 1-4. Every time a picked team wins a match, the player earns
points based on that team's priority (P1 = 4 pts, P2 = 3 pts, P3 = 2 pts, P4 = 1 pt).

## Files

- `index.html` / `style.css` — page structure and styling
- `app.js` — scoring and bracket logic
- `data.js` — **edit this** to update teams, players/picks, and match winners

## Updating results

Click a team directly in the bracket to mark it as the winner (saved in your
browser). To make results visible to everyone viewing the hosted site, edit the
`winner` field for that match in `data.js`, then commit and push.
