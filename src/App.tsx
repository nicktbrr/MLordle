import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Round1Order from './components/Round1Order';
import Round2Technique from './components/Round2Technique';
import Round3Diagnose from './components/Round3Diagnose';
import Results from './components/Results';
import Toast, { praiseFor, type ToastMessage } from './components/Toast';
import { getContentRepository } from './data/contentRepository';
import { getDailyStats, submitResult, type DailyStats } from './data/statsRepository';
import { isSupabaseConfigured } from './lib/supabase';
import type { Content } from './data/types';
import { buildDailyPuzzle, todayKey, type DailyPuzzle } from './game/daily';
import { computeStreak, useProgress, type RoundOutcome } from './state/progress';

type Phase = 'round1' | 'round2' | 'round3' | 'results';
const ROUNDS = ['round1', 'round2', 'round3'] as const;

interface Outcomes {
  round1?: RoundOutcome;
  round2?: RoundOutcome;
  round3?: RoundOutcome;
}

export default function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dateKey = useMemo(() => todayKey(), []);
  const { results, saveDay } = useProgress();

  const [view, setView] = useState<Phase>('round1');
  const [outcomes, setOutcomes] = useState<Outcomes>({});
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getContentRepository()
      .getContent()
      .then((c) => active && setContent(c))
      .catch((e) => active && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      active = false;
    };
  }, []);

  const puzzle: DailyPuzzle | null = useMemo(
    () => (content ? buildDailyPuzzle(content, dateKey) : null),
    [content, dateKey],
  );
  const stageName = useMemo(() => {
    const map = new Map((content?.stages ?? []).map((s) => [s.id, s.name]));
    return (id: string) => map.get(id) ?? id;
  }, [content]);

  const savedToday = results[dateKey];
  const streak = computeStreak(results, dateKey);

  // Reloaded after finishing earlier today: go straight to the results recap.
  useEffect(() => {
    if (savedToday) setView('results');
  }, [savedToday]);

  // On the results screen, submit this browser's result (idempotent) and load
  // the community stats for the day.
  useEffect(() => {
    if (view !== 'results' || !savedToday || !isSupabaseConfigured) return;
    let active = true;
    setStatsLoading(true);
    (async () => {
      try {
        await submitResult(savedToday);
        const s = await getDailyStats(dateKey);
        if (active) setStats(s);
      } catch {
        /* stats are best-effort; ignore failures */
      } finally {
        if (active) setStatsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [view, savedToday, dateKey]);

  // True when today was finished in an earlier session (reloaded recap): lock the
  // rounds so a replay can't overwrite the saved result; only the recap is viewable.
  const reloadedRecap = Boolean(savedToday) && !outcomes.round1 && !outcomes.round2 && !outcomes.round3;

  // A round can be viewed once the previous one is done; results once all 3 are.
  function isUnlocked(target: Phase): boolean {
    if (reloadedRecap) return target === 'results';
    if (target === 'round1') return true;
    if (target === 'round2') return Boolean(outcomes.round1);
    if (target === 'round3') return Boolean(outcomes.round2);
    return Boolean(outcomes.round3);
  }

  function recordOutcome(round: (typeof ROUNDS)[number], o: RoundOutcome) {
    setToast(praiseFor(o.attempts, o.solved));
    setOutcomes((prev) => {
      const next = { ...prev, [round]: o };
      if (next.round1 && next.round2 && next.round3) {
        saveDay({
          dateKey,
          round1: next.round1,
          round2: next.round2,
          round3: next.round3,
          completedAt: new Date().toISOString(),
        });
      }
      return next;
    });
  }

  function goNext(from: Phase) {
    const order: Phase[] = ['round1', 'round2', 'round3', 'results'];
    const next = order[order.indexOf(from) + 1];
    if (next) setView(next);
  }

  if (error) {
    return (
      <div className="app">
        <Header streak={streak} dateKey={dateKey} />
        <main className="stage">
          <section className="round">
            <h2>Couldn’t load today’s puzzle</h2>
            <p className="round__hint">{error}</p>
          </section>
        </main>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="app">
        <Header streak={streak} dateKey={dateKey} />
        <main className="stage">
          <p className="loading">Loading today’s puzzle…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header streak={streak} dateKey={dateKey} />

      <nav className="steps" aria-label="rounds">
        {ROUNDS.map((p, i) => {
          const unlocked = isUnlocked(p);
          return (
            <button
              key={p}
              type="button"
              className={`steps__dot ${view === p ? 'is-active' : ''} ${outcomes[p] ? 'is-done' : ''}`}
              disabled={!unlocked}
              aria-current={view === p}
              onClick={() => unlocked && setView(p)}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <main className="stage">
        <div hidden={view !== 'round1'}>
          <Round1Order
            puzzle={puzzle}
            onComplete={(o) => recordOutcome('round1', o)}
            onNext={() => goNext('round1')}
          />
        </div>
        <div hidden={view !== 'round2'}>
          <Round2Technique
            puzzle={puzzle}
            onComplete={(o) => recordOutcome('round2', o)}
            onNext={() => goNext('round2')}
          />
        </div>
        <div hidden={view !== 'round3'}>
          <Round3Diagnose
            puzzle={puzzle}
            stageName={stageName}
            onComplete={(o) => recordOutcome('round3', o)}
            onNext={() => goNext('round3')}
            nextLabel="See results →"
          />
        </div>
        {view === 'results' && savedToday && (
          <Results
            result={savedToday}
            streak={streak}
            alreadyPlayed={!outcomes.round3}
            stats={stats}
            statsLoading={statsLoading}
          />
        )}
      </main>

      <Toast message={toast} />

      {!isSupabaseConfigured && (
        <footer className="banner">
          Running on bundled demo content — set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to load from Supabase.
        </footer>
      )}
    </div>
  );
}
