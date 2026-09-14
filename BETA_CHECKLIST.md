# HabitPals Beta Checklist

Legend: **Done** = implemented and verified · **In progress** = partially implemented · **Not started** = planned · **Blocked** = requires external configuration

## Core habit engine

- [x] Local calendar date handling
- [x] Dynamic habit create/update/archive/delete API
- [x] Completion history by habit and date
- [x] Deterministic current streak calculation
- [x] Best streak calculation
- [x] Completion-rate calculation
- [x] Daily progress calculation
- [x] XP derived from completion history
- [x] Level calculation
- [x] Legacy-state migration foundation
- [x] Browser-level regression tests

## Existing product features

- [ ] Dashboard wired to the new engine
- [ ] Dynamic habit cards
- [ ] Habit CRUD UI
- [ ] Mascot reactions driven by engine state
- [ ] Achievements driven by engine state
- [ ] Progress analytics driven by engine state
- [ ] Weekly reflection persistence
- [ ] JSON export/import

## Authentication & cloud

- [ ] Google Sign-In creates a Firebase Auth session
- [ ] Firestore user document
- [ ] Firestore habit persistence
- [ ] Firestore completion persistence
- [ ] Firestore reflection persistence
- [ ] Offline/local cache reconciliation
- [ ] Firestore security rules verified

## Production

- [ ] Mobile QA
- [ ] Error/loading/empty states
- [ ] GitHub Pages publishing
- [ ] Firebase authorized domain configured
- [ ] Google OAuth production origin configured
- [ ] `habitpals.site.je` DNS configured
- [ ] HTTPS verified

## Deferred from beta

- Google Drive backup
- Custom mascot uploads
- Custom audio uploads
- AI coach
- Social features
- Payments/donations
- Calendar integrations
- Complex notification scheduler
