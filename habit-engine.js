/*
 * HabitPals Core Habit Engine
 *
 * Framework-free, deterministic data layer for habits, completions, XP and streaks.
 * The UI can use this module without depending on local calendar/UTC quirks.
 */
(function (global) {
    'use strict';

    const SCHEMA_VERSION = 2;
    const XP_PER_LEVEL = 100;

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function localDateKey(date) {
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function parseDateKey(key) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error(`Invalid date key: ${key}`);
        const [year, month, day] = key.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
    }

    function shiftDate(key, amount) {
        const date = parseDateKey(key);
        date.setDate(date.getDate() + amount);
        return localDateKey(date);
    }

    function createId(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function defaultState(seedHabits) {
        const habits = {};
        (seedHabits || []).forEach((habit, index) => {
            const id = habit.id || createId('habit');
            habits[id] = {
                id,
                name: habit.name || `Habit ${index + 1}`,
                description: habit.description || '',
                category: habit.category || 'general',
                xp: Number.isFinite(Number(habit.xp)) ? Number(habit.xp) : 20,
                mascotId: habit.mascotId || habit.defaultMascot || 'owl',
                active: habit.active !== false,
                createdAt: habit.createdAt || new Date().toISOString()
            };
        });
        return {
            schemaVersion: SCHEMA_VERSION,
            profile: {},
            settings: { theme: 'system' },
            habits,
            completions: {},
            reflections: {},
            xp: 0
        };
    }

    class HabitEngine {
        constructor(state) {
            this.state = HabitEngine.normalize(state);
        }

        static normalize(raw) {
            const state = raw && typeof raw === 'object' ? raw : defaultState();
            if (!state.habits || Array.isArray(state.habits)) {
                state.habits = {};
            }
            if (!state.completions || typeof state.completions !== 'object') state.completions = {};
            if (!state.reflections || typeof state.reflections !== 'object') state.reflections = {};
            if (!state.settings || typeof state.settings !== 'object') state.settings = {};
            if (!Number.isFinite(Number(state.xp))) state.xp = 0;
            state.xp = Math.max(0, Number(state.xp));
            state.schemaVersion = SCHEMA_VERSION;
            Object.values(state.habits).forEach(habit => {
                habit.id = habit.id || createId('habit');
                habit.name = String(habit.name || 'Untitled habit').trim();
                habit.category = habit.category || 'general';
                habit.xp = Math.max(0, Number(habit.xp) || 0);
                habit.mascotId = habit.mascotId || 'owl';
                habit.active = habit.active !== false;
            });
            return state;
        }

        static fromLegacy(legacy, seedHabits) {
            if (!legacy || typeof legacy !== 'object') return new HabitEngine(defaultState(seedHabits));
            if (legacy.schemaVersion >= SCHEMA_VERSION && legacy.habits && !Array.isArray(legacy.habits)) {
                return new HabitEngine(legacy);
            }

            const next = defaultState(seedHabits);
            const oldHabits = legacy.habits || {};
            const sourceHabits = Array.isArray(oldHabits) ? oldHabits : Object.values(oldHabits);
            sourceHabits.forEach((old, index) => {
                const source = old && typeof old === 'object' ? old : {};
                const seed = (seedHabits || [])[index] || {};
                const id = source.id || seed.id || createId('habit');
                next.habits[id] = {
                    id,
                    name: source.name || seed.name || `Habit ${index + 1}`,
                    description: source.description || seed.description || '',
                    category: source.category || seed.category || 'general',
                    xp: Number(source.xp || seed.xp || 20),
                    mascotId: source.mascotId || source.defaultMascot || seed.defaultMascot || 'owl',
                    active: source.active !== false,
                    createdAt: source.createdAt || new Date().toISOString()
                };
            });

            // Preserve common legacy completion shapes.
            const legacyCompletions = legacy.completions || {};
            Object.keys(legacyCompletions).forEach(key => {
                const value = legacyCompletions[key];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    if (!next.completions[key]) next.completions[key] = {};
                    Object.keys(value).forEach(date => {
                        if (value[date]) next.completions[key][date] = true;
                    });
                }
            });

            next.profile = legacy.googleUser || legacy.profile || {};
            next.settings = legacy.settings || {};
            next.xp = Number(legacy.xp || 0);
            return new HabitEngine(next);
        }

        get habits() {
            return Object.values(this.state.habits).filter(habit => habit.active !== false);
        }

        getAllHabits(includeArchived = false) {
            const values = Object.values(this.state.habits);
            return includeArchived ? values : values.filter(habit => habit.active !== false);
        }

        createHabit(input) {
            const name = String(input && input.name || '').trim();
            if (!name) throw new Error('Habit name is required');
            const habit = {
                id: input.id || createId('habit'),
                name,
                description: String(input.description || '').trim(),
                category: input.category || 'general',
                xp: Math.max(0, Number(input.xp) || 20),
                mascotId: input.mascotId || 'owl',
                active: true,
                createdAt: new Date().toISOString()
            };
            this.state.habits[habit.id] = habit;
            return habit;
        }

        updateHabit(id, patch) {
            const habit = this.state.habits[id];
            if (!habit) throw new Error(`Habit not found: ${id}`);
            const next = { ...habit, ...patch };
            next.name = String(next.name || '').trim();
            if (!next.name) throw new Error('Habit name is required');
            next.xp = Math.max(0, Number(next.xp) || 0);
            next.active = next.active !== false;
            this.state.habits[id] = next;
            return next;
        }

        archiveHabit(id) {
            return this.updateHabit(id, { active: false });
        }

        deleteHabit(id) {
            if (!this.state.habits[id]) return false;
            delete this.state.habits[id];
            delete this.state.completions[id];
            return true;
        }

        isComplete(habitId, dateKey = localDateKey(new Date())) {
            return Boolean(this.state.completions[habitId] && this.state.completions[habitId][dateKey]);
        }

        setCompletion(habitId, dateKey, completed = true) {
            if (!this.state.habits[habitId]) throw new Error(`Habit not found: ${habitId}`);
            parseDateKey(dateKey);
            if (!this.state.completions[habitId]) this.state.completions[habitId] = {};
            const previous = Boolean(this.state.completions[habitId][dateKey]);
            if (completed) this.state.completions[habitId][dateKey] = true;
            else delete this.state.completions[habitId][dateKey];
            this.recalculateXP();
            return { changed: previous !== completed, completed };
        }

        toggleCompletion(habitId, dateKey = localDateKey(new Date())) {
            return this.setCompletion(habitId, dateKey, !this.isComplete(habitId, dateKey));
        }

        getCompletedDates(habitId) {
            return Object.keys(this.state.completions[habitId] || {})
                .filter(key => this.state.completions[habitId][key])
                .sort();
        }

        currentStreak(habitId, asOf = localDateKey(new Date())) {
            let cursor = asOf;
            let streak = 0;
            while (this.isComplete(habitId, cursor)) {
                streak += 1;
                cursor = shiftDate(cursor, -1);
            }
            return streak;
        }

        bestStreak(habitId) {
            const dates = this.getCompletedDates(habitId);
            if (!dates.length) return 0;
            let best = 1;
            let run = 1;
            for (let i = 1; i < dates.length; i += 1) {
                if (shiftDate(dates[i - 1], 1) === dates[i]) run += 1;
                else run = 1;
                best = Math.max(best, run);
            }
            return best;
        }

        completionRate(habitId, days = 30, asOf = localDateKey(new Date())) {
            if (days <= 0) return 0;
            let completed = 0;
            for (let i = 0; i < days; i += 1) {
                if (this.isComplete(habitId, shiftDate(asOf, -i))) completed += 1;
            }
            return completed / days;
        }

        dailyProgress(dateKey = localDateKey(new Date())) {
            const habits = this.habits;
            if (!habits.length) return 0;
            return habits.filter(habit => this.isComplete(habit.id, dateKey)).length / habits.length;
        }

        recalculateXP() {
            let xp = 0;
            Object.entries(this.state.completions).forEach(([habitId, dates]) => {
                const habit = this.state.habits[habitId];
                if (!habit) return;
                xp += Object.values(dates).filter(Boolean).length * habit.xp;
            });
            this.state.xp = xp;
            return xp;
        }

        level() {
            return Math.floor(this.state.xp / XP_PER_LEVEL) + 1;
        }

        xpIntoLevel() {
            return this.state.xp % XP_PER_LEVEL;
        }

        weeklySummary(asOf = localDateKey(new Date())) {
            const result = [];
            for (let i = 6; i >= 0; i -= 1) {
                const date = shiftDate(asOf, -i);
                result.push({ date, completed: this.habits.filter(h => this.isComplete(h.id, date)).length });
            }
            return result;
        }

        serialize() {
            return JSON.parse(JSON.stringify(this.state));
        }
    }

    global.HabitPalsCore = {
        SCHEMA_VERSION,
        XP_PER_LEVEL,
        localDateKey,
        parseDateKey,
        shiftDate,
        defaultState,
        HabitEngine
    };
})(window);
