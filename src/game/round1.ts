import type { StageEdge } from '../data/types';

// Node colors for the system-diagram round:
//   correct (🟩) = the node belongs AND every connection touching it is exactly right
//   present (🟨) = the node belongs, but its connections are wrong or incomplete
//   absent  (⬛) = the node doesn't belong in this diagram at all (a decoy/invented node)
export type GraphNodeStatus = 'correct' | 'present' | 'absent';
// Edge colors for the connections the player drew:
//   correct (🟩) = this exact directed connection is in the answer
//   absent  (⬛) = this connection is wrong (not in the answer)
export type GraphEdgeStatus = 'correct' | 'absent';

export interface GraphGuess {
  nodeIds: string[]; // resolved stage ids the player placed (decoys/unknowns included)
  edges: StageEdge[]; // directed connections [from, to] the player drew
}

export interface GraphAnswer {
  nodeIds: string[]; // stage ids that belong
  edges: StageEdge[]; // correct directed connections (may contain cycles)
}

export interface Round1GraphResult {
  nodeStatus: Record<string, GraphNodeStatus>; // keyed by the player's node id
  edgeStatus: Record<string, GraphEdgeStatus>; // keyed by "from->to" for drawn edges
  missingNodeIds: string[]; // answer nodes the player never placed
  missingEdges: StageEdge[]; // answer connections the player never drew
  solved: boolean;
}

const edgeKey = (e: StageEdge): string => `${e[0]}->${e[1]}`;

/** Edges (by key) that touch `nodeId` as either endpoint. */
function incident(edgeKeys: Iterable<string>, nodeId: string): Set<string> {
  const out = new Set<string>();
  for (const k of edgeKeys) {
    const [from, to] = k.split('->');
    if (from === nodeId || to === nodeId) out.add(k);
  }
  return out;
}

/**
 * Grade a system-diagram attempt by comparing the player's directed graph to the
 * answer graph. Because nodes carry identity (stage ids), this is labeled-graph
 * equality — node-set equality + directed-edge-set equality — which naturally
 * supports cycles (e.g. a monitoring → retraining loop). No isomorphism search
 * is needed.
 *
 * A node is green only when its full set of incident connections matches the
 * answer's; otherwise (right node, wrong wiring) it is yellow. Nodes that don't
 * belong are black. Solved iff both the node set and the directed edge set match.
 */
export function evaluateRound1Graph(guess: GraphGuess, answer: GraphAnswer): Round1GraphResult {
  const answerNodes = new Set(answer.nodeIds);
  const answerEdgeKeys = new Set(answer.edges.map(edgeKey));
  const guessEdgeKeys = new Set(guess.edges.map(edgeKey));

  const edgeStatus: Record<string, GraphEdgeStatus> = {};
  for (const e of guess.edges) {
    const k = edgeKey(e);
    edgeStatus[k] = answerEdgeKeys.has(k) ? 'correct' : 'absent';
  }

  const nodeStatus: Record<string, GraphNodeStatus> = {};
  for (const id of guess.nodeIds) {
    if (!answerNodes.has(id)) {
      nodeStatus[id] = 'absent';
      continue;
    }
    const drawn = incident(guessEdgeKeys, id);
    const expected = incident(answerEdgeKeys, id);
    const exact = drawn.size === expected.size && [...expected].every((k) => drawn.has(k));
    nodeStatus[id] = exact ? 'correct' : 'present';
  }

  const guessNodeSet = new Set(guess.nodeIds);
  const missingNodeIds = answer.nodeIds.filter((id) => !guessNodeSet.has(id));
  const missingEdges = answer.edges.filter((e) => !guessEdgeKeys.has(edgeKey(e)));

  const sameNodes =
    guessNodeSet.size === answerNodes.size && [...guessNodeSet].every((id) => answerNodes.has(id));
  const sameEdges =
    guessEdgeKeys.size === answerEdgeKeys.size &&
    [...guessEdgeKeys].every((k) => answerEdgeKeys.has(k));

  return {
    nodeStatus,
    edgeStatus,
    missingNodeIds,
    missingEdges,
    solved: sameNodes && sameEdges,
  };
}
