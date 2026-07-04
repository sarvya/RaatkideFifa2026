/*
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

const TEAMS = [
  "Canada",
  "Morocco",
  "Paraguay",
  "France",
  "Brazil",
  "Norway",
  "Mexico",
  "England",
  "Portugal",
  "Spain",
  "United States",
  "Belgium",
  "Argentina",
  "Egypt",
  "Switzerland",
  "Colombia"
];

const PLAYERS = [
  {
    "name": "Shardul",
    "picks": [
      {
        "team": "Brazil",
        "priority": 1
      },
      {
        "team": "France",
        "priority": 2
      },
      {
        "team": "Argentina",
        "priority": 3
      },
      {
        "team": "Spain",
        "priority": 4
      }
    ]
  },
  {
    "name": "Vishal",
    "picks": [
      {
        "team": "England",
        "priority": 1
      },
      {
        "team": "Portugal",
        "priority": 2
      },
      {
        "team": "United States",
        "priority": 3
      },
      {
        "team": "Belgium",
        "priority": 4
      }
    ]
  }
];

const MATCHES = [
  {
    "id": "R16-1",
    "round": "Round of 16",
    "teams": [
      "Canada",
      "Morocco"
    ],
    "winner": "Morocco"
  },
  {
    "id": "R16-2",
    "round": "Round of 16",
    "teams": [
      "Paraguay",
      "France"
    ],
    "winner": "France"
  },
  {
    "id": "R16-3",
    "round": "Round of 16",
    "teams": [
      "Brazil",
      "Norway"
    ],
    "winner": "Brazil"
  },
  {
    "id": "R16-4",
    "round": "Round of 16",
    "teams": [
      "Mexico",
      "England"
    ],
    "winner": "England"
  },
  {
    "id": "R16-5",
    "round": "Round of 16",
    "teams": [
      "Portugal",
      "Spain"
    ],
    "winner": "Spain"
  },
  {
    "id": "R16-6",
    "round": "Round of 16",
    "teams": [
      "United States",
      "Belgium"
    ],
    "winner": "Belgium"
  },
  {
    "id": "R16-7",
    "round": "Round of 16",
    "teams": [
      "Argentina",
      "Egypt"
    ],
    "winner": "Argentina"
  },
  {
    "id": "R16-8",
    "round": "Round of 16",
    "teams": [
      "Switzerland",
      "Colombia"
    ],
    "winner": "Colombia"
  },
  {
    "id": "QF-1",
    "round": "Quarterfinal",
    "teams": [
      "R16-1",
      "R16-2"
    ],
    "winner": null
  },
  {
    "id": "QF-2",
    "round": "Quarterfinal",
    "teams": [
      "R16-3",
      "R16-4"
    ],
    "winner": null
  },
  {
    "id": "QF-3",
    "round": "Quarterfinal",
    "teams": [
      "R16-5",
      "R16-6"
    ],
    "winner": null
  },
  {
    "id": "QF-4",
    "round": "Quarterfinal",
    "teams": [
      "R16-7",
      "R16-8"
    ],
    "winner": null
  },
  {
    "id": "SF-1",
    "round": "Semifinal",
    "teams": [
      "QF-1",
      "QF-2"
    ],
    "winner": null
  },
  {
    "id": "SF-2",
    "round": "Semifinal",
    "teams": [
      "QF-3",
      "QF-4"
    ],
    "winner": null
  },
  {
    "id": "F",
    "round": "Final",
    "teams": [
      "SF-1",
      "SF-2"
    ],
    "winner": null
  }
];
