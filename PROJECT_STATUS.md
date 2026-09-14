# HabitPals — Development Status

Last updated: 2026-09-14

## Current milestone

**Beta rescue & core engine rebuild**

The existing HabitPals project is a functional UI prototype. The next goal is a reliable beta with real habit CRUD, deterministic streaks, persistent user data, and deployable production hosting.

## Progress

| Area | Status | Target |
|---|---|---|
| Existing UI / navigation | Done | Preserve and improve |
| Local habit completion | In progress | Reliable core engine |
| Dynamic habit CRUD | Not started | Create / edit / archive |
| Deterministic streaks | Not started | History-based calculation |
| XP / levels | Existing | Verify against new engine |
| Mascot reactions | Existing | Wire to real state |
| Achievements | Existing | Verify and harden |
| Firebase Authentication | Partially wired | Real Google/Firebase session |
| Firestore persistence | Not started | Per-user cloud data |
| Progress analytics | Partially wired | Real historical data |
| Reflections | Partially wired | Persist and retrieve |
| Export / import | Placeholder | JSON backup / restore |
| Mobile hardening | Existing responsive CSS | Beta QA |
| GitHub Pages | Not configured | Production deployment |
| `habitpals.site.je` | Not configured | Custom domain |

## Planned implementation order

1. Rebuild the core habit data model and migration layer.
2. Add dynamic habit CRUD and archive behavior.
3. Replace click-based streaks with deterministic history-based streak calculations.
4. Connect Google Sign-In to Firebase Authentication.
5. Persist habits, completions, settings, and reflections in Firestore.
6. Complete progress analytics and export/import.
7. Harden mobile UX and error/offline states.
8. Configure GitHub Pages and `habitpals.site.je`.

## How to check progress

This file is the high-level status dashboard. `BETA_CHECKLIST.md` will track individual acceptance criteria, while `CHANGELOG.md` records shipped changes.

The project can also be reviewed directly from the Git history: each milestone should be a small, clearly named commit.

## Definition of beta

HabitPals is beta-ready when a new user can sign in, create habits, complete them over multiple days, see accurate streak/XP/progress data, return on another device and recover their data from Firestore, complete a reflection, export their data, and use the app comfortably on mobile.
