import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { DailyPuzzle } from '../game/daily';
import {
  evaluateRound1Graph,
  type GraphNodeStatus,
  type Round1GraphResult,
} from '../game/round1';
import { STATUS_EMOJI } from '../game/feedback';
import type { Stage, StageEdge } from '../data/types';
import type { RoundOutcome } from '../state/progress';

const MAX_ATTEMPTS = 6;

const EDGE_COLOR: Record<'correct' | 'absent', string> = {
  correct: '#538d4e',
  absent: '#a85454',
};

interface StageNodeData extends Record<string, unknown> {
  label: string;
  status?: GraphNodeStatus;
}
type StageNode = Node<StageNodeData, 'stage'>;

function StageNodeView({ data }: NodeProps<StageNode>) {
  return (
    <div className={`gnode ${data.status ? `gnode--${data.status}` : ''}`}>
      <Handle type="target" position={Position.Top} />
      <span className="gnode__label">{data.label}</span>
      {data.status && <span className="gnode__mark">{STATUS_EMOJI[data.status]}</span>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { stage: StageNodeView };

export default function Round1Graph({
  puzzle,
  allStages,
  onComplete,
  onNext,
  nextLabel = 'Next question →',
}: {
  puzzle: DailyPuzzle;
  allStages: Stage[];
  onComplete: (o: RoundOutcome) => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<StageNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<Round1GraphResult | null>(null);
  const nameById = useMemo(() => new Map(allStages.map((s) => [s.id, s.name])), [allStages]);

  const solved = Boolean(result?.solved);
  const finished = solved || attempts >= MAX_ATTEMPTS;

  // The day's candidate components: correct stages + decoys, deterministically
  // shuffled. The player decides which belong and how they connect.
  const palette = puzzle.round1Stages;
  const placedIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  function addStage(s: Stage) {
    if (finished || placedIds.has(s.id)) return;
    const i = nodes.length;
    setNodes((nds) =>
      nds.concat({
        id: s.id,
        type: 'stage',
        position: { x: 30 + (i % 3) * 190, y: 24 + Math.floor(i / 3) * 100 },
        data: { label: s.name },
      }),
    );
  }

  const onConnect = useCallback(
    (c: Connection) => {
      if (finished || c.source === c.target) return;
      setEdges((eds) => addEdge({ ...c, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    },
    [finished, setEdges],
  );

  function check() {
    if (finished) return;
    const res = evaluateRound1Graph(
      {
        nodeIds: nodes.map((n) => n.id),
        edges: edges.map((e) => [e.source, e.target] as StageEdge),
      },
      { nodeIds: puzzle.round1Answer, edges: puzzle.round1Edges },
    );
    const nextAttempts = attempts + 1;
    const done = res.solved || nextAttempts >= MAX_ATTEMPTS;

    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, status: res.nodeStatus[n.id] } })),
    );
    setEdges((eds) =>
      eds.map((e) => {
        const status = res.edgeStatus[`${e.source}->${e.target}`] ?? 'absent';
        const color = EDGE_COLOR[status];
        return {
          ...e,
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
      }),
    );

    setAttempts(nextAttempts);
    setResult(res);

    if (done) {
      const row = buildEmojiRow(res, puzzle.round1Answer, puzzle.round1Edges.length);
      onComplete({ solved: res.solved, attempts: nextAttempts, rows: [row] });
    }
  }

  return (
    <section className="round">
      <header className="round__head">
        <span className="round__tag">Round 1 · System diagram</span>
        <h2>{puzzle.scenario.title}</h2>
        <p className="round__domain">{puzzle.scenario.domain}</p>
        <p className="round__desc">{puzzle.scenario.description}</p>
        <p className="round__hint">
          Add the components you need from the list, then drag from a node’s bottom
          dot to another node’s top dot to connect them. Build the full lifecycle as
          a diagram — loops are allowed where the pipeline cycles (e.g. continuous
          retraining). 🟩 right node &amp; wiring · 🟨 right node, wrong wiring · ⬛ doesn’t belong.
        </p>
      </header>

      <div className="graph-layout">
        <aside className="graph-palette" aria-label="components">
          <p className="graph-palette__title">Components</p>
          <ul className="graph-palette__list">
            {palette.map((s) => {
              const used = placedIds.has(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className="graph-palette__item"
                    disabled={used || finished}
                    onClick={() => addStage(s)}
                  >
                    <span>{s.name}</span>
                    {used && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="graph-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodesConnectable={!finished}
            nodesDraggable={!finished}
            deleteKeyCode={finished ? null : ['Backspace', 'Delete']}
            defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} />
            <Controls showInteractive={false} />
          </ReactFlow>
          {nodes.length === 0 && (
            <p className="graph-empty">Add a component from the list to start the diagram.</p>
          )}
        </div>
      </div>

      {finished && result && (
        <div className="reveal">
          <p className={`round__verdict ${solved ? 'is-win' : 'is-loss'}`}>
            {solved ? 'Diagram solved! 🟩' : 'Out of attempts.'}
          </p>
          <p className="reveal__label">Correct connections</p>
          <ul className="reveal__order">
            {puzzle.round1Edges.map(([from, to]) => (
              <li key={`${from}->${to}`}>
                {nameById.get(from) ?? from} → {nameById.get(to) ?? to}
              </li>
            ))}
          </ul>
          {puzzle.round1DecoyIds.length > 0 && (
            <p className="reveal__note">
              Not part of this pipeline:{' '}
              {puzzle.round1DecoyIds.map((id) => nameById.get(id) ?? id).join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="round__foot">
        <span className="round__counter">
          Attempt {Math.min(attempts + (finished ? 0 : 1), MAX_ATTEMPTS)} / {MAX_ATTEMPTS}
        </span>
        {!finished ? (
          <button className="btn" onClick={check} disabled={nodes.length === 0}>
            Check diagram
          </button>
        ) : (
          <button className="btn" onClick={onNext}>
            {nextLabel}
          </button>
        )}
      </div>
    </section>
  );
}

/** Compact emoji summary: one cell per answer node, plus a connections tally. */
function buildEmojiRow(res: Round1GraphResult, answerNodeIds: string[], totalEdges: number): string {
  const cells = answerNodeIds.map((id) => {
    const status = res.nodeStatus[id];
    if (status === 'correct') return STATUS_EMOJI.correct;
    if (status === 'present') return STATUS_EMOJI.present;
    return '⬜'; // belongs but wasn't placed
  });
  const correctEdges = totalEdges - res.missingEdges.length;
  return `${cells.join('')} 🔗${correctEdges}/${totalEdges}`;
}
