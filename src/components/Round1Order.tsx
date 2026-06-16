import { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DailyPuzzle } from '../game/daily';
import { evaluateRound1 } from '../game/round1';
import { STATUS_EMOJI, type SlotStatus } from '../game/feedback';
import type { RoundOutcome } from '../state/progress';

const MAX_ATTEMPTS = 6;

function SortableTile({
  id,
  label,
  status,
  locked,
}: {
  id: string;
  label: string;
  status?: SlotStatus;
  locked: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: locked,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`tile ${status ? `tile--${status}` : ''} ${locked ? 'tile--locked' : ''}`}
      {...attributes}
      {...listeners}
    >
      <span className="tile__grip" aria-hidden>⠿</span>
      <span className="tile__label">{label}</span>
      {status && <span className="tile__mark">{STATUS_EMOJI[status]}</span>}
    </li>
  );
}

export default function Round1Order({
  puzzle,
  onComplete,
  onNext,
  nextLabel = 'Next question →',
}: {
  puzzle: DailyPuzzle;
  onComplete: (o: RoundOutcome) => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const nameById = useMemo(
    () => new Map([...puzzle.round1Stages].map((s) => [s.id, s.name])),
    [puzzle],
  );
  const [order, setOrder] = useState<string[]>(() => puzzle.round1Stages.map((s) => s.id));
  const [statuses, setStatuses] = useState<Record<string, SlotStatus> | null>(null);
  const [rows, setRows] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const attempts = rows.length;
  const finished = solved || attempts >= MAX_ATTEMPTS;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const from = prev.indexOf(active.id as string);
      const to = prev.indexOf(over.id as string);
      return arrayMove(prev, from, to);
    });
    setStatuses(null); // clear stale feedback after a move
  }

  function submit() {
    const result = evaluateRound1(order, puzzle.round1Answer, puzzle.round1DecoyIds);
    const statusMap: Record<string, SlotStatus> = {};
    order.forEach((id, i) => (statusMap[id] = result.statuses[i]));
    const row = result.statuses.map((s) => STATUS_EMOJI[s]).join('');
    const nextRows = [...rows, row];
    setStatuses(statusMap);
    setRows(nextRows);
    setSolved(result.solved);
    if (result.solved || nextRows.length >= MAX_ATTEMPTS) {
      onComplete({ solved: result.solved, attempts: nextRows.length, rows: nextRows });
    }
  }

  return (
    <section className="round">
      <header className="round__head">
        <span className="round__tag">Round 1 · Pipeline</span>
        <h2>{puzzle.scenario.title}</h2>
        <p className="round__domain">{puzzle.scenario.domain}</p>
        <p className="round__desc">{puzzle.scenario.description}</p>
        <p className="round__hint">
          Drag the stages into the correct lifecycle order. Not every stage belongs —
          decoys will show ⬛.
        </p>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className="tiles">
            {order.map((id) => (
              <SortableTile
                key={id}
                id={id}
                label={nameById.get(id) ?? id}
                status={statuses?.[id]}
                locked={finished}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="round__foot">
        <span className="round__counter">Attempt {Math.min(attempts + (finished ? 0 : 1), MAX_ATTEMPTS)} / {MAX_ATTEMPTS}</span>
        {!finished && (
          <button className="btn" onClick={submit}>
            Check order
          </button>
        )}
        {finished && (
          <p className={`round__verdict ${solved ? 'is-win' : 'is-loss'}`}>
            {solved ? 'Pipeline solved! 🟩' : 'Out of attempts — see the colors above.'}
          </p>
        )}
      </div>
    </section>
  );
}
