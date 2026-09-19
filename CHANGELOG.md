# HabitPals Changelog

## 2026-09-20 — v1.2

### Product experience
- Reworked the dashboard around a Duolingo-inspired companion loop: tap a companion, complete a habit, earn XP, and see the companion react.
- Replaced the old animal-plus-emoji concept with expressive animal characters whose eyes, mouth, blush, tears, and celebration effects communicate state.
- Added eight companion species: Fox, Owl, Cat, Panda, Dog, Capybara, Rabbit, and Bear.
- Added neutral, happy, excited, and missed/sad companion states.
- Added completion feedback with XP toast, bounce animation, and celebratory confetti.
- Added stronger streak language and visual treatment for 3+ day streaks.
- Improved weekly challenge presentation and defeated-state feedback.

### Mobile UX
- Added compact mobile bottom navigation.
- Added safe-area-aware navigation spacing for modern phones.
- Switched mobile habit cards to thumb-friendly one-column layouts.
- Increased mascot tap targets and added pressed-state feedback.
- Improved mobile statistics, settings, tables, and chart sizing.
- Reduced visual density and improved touch spacing.

### Functionality
- Wired weekly reflection persistence to the local habit state.
- Wired feedback submission to local persistence.
- Preserved dynamic habit creation, removal, mascot selection, completion, XP, levels, streaks, achievements, weekly progress, and chart rendering.
- Added keyboard activation support for mascot completion buttons.
- Kept local-first persistence; cloud sync remains a later milestone.

### Validation
- Repository updated in small commits so v1.2 changes are independently traceable.
- Live-page fetch was unavailable during final verification due to a temporary cache miss, so deployment was not represented as visually verified.
- Next validation step: open the published GitHub Pages URL on a phone and perform the beta smoke checklist.

## 2026-09-14

### Core engine
- Added `habit-engine.js`, a framework-free deterministic habit data layer.
- Added local-calendar date handling instead of UTC-only date keys.
- Added dynamic habit create/update/archive/delete operations.
- Added completion history and deterministic current/best streak calculations.
- Added completion-rate and daily-progress calculations.
- Made XP a derived value from habit completion history.
- Added level and XP-within-level calculations.
- Added a migration foundation for the existing local HabitPals data shape.
- Added `habit-engine.test.html` browser regression tests.

### Project tracking
- Added `PROJECT_STATUS.md` as the high-level development dashboard.
- Added `BETA_CHECKLIST.md` for beta acceptance criteria.
