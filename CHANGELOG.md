# HabitPals Changelog

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
