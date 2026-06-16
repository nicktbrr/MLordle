// Domain types mirroring the Supabase content tables.

export interface Stage {
  id: string;
  name: string;
  canonical_order: number;
  description: string;
}

/** A directed connection in the correct system diagram: [from stage id, to stage id]. */
export type StageEdge = [string, string];

export interface Scenario {
  id: string;
  title: string;
  domain: string;
  description: string;
  ordered_stage_ids: string[];
  decoy_stage_ids: string[];
  /**
   * The correct directed connections between stages. May contain cycles (e.g. a
   * monitoring → retraining loop for continuous deployment). When absent, the
   * pipeline is treated as a simple linear chain through `ordered_stage_ids`.
   */
  edges?: StageEdge[];
}

export type Modality = 'image' | 'text' | 'tabular' | 'audio' | 'any';
export type WhenApplied = 'preprocessing' | 'train-time' | 'post-training' | 'inference';
export type TechniqueType =
  | 'transform'
  | 'synthetic'
  | 'sampling'
  | 'architectural'
  | 'regularization';

export interface TechniqueAttributes {
  modality: Modality;
  when_applied: WhenApplied;
  type: TechniqueType;
  needs_labels: boolean;
}

export interface Technique {
  id: string;
  name: string;
  stage_id: string;
  aliases: string[];
  attributes: TechniqueAttributes;
}

export type CauseCategory = 'data' | 'model' | 'process' | 'infra';

export interface CauseAttributes {
  lifecycle_stage: string;
  category: CauseCategory;
}

export interface Cause {
  id: string;
  name: string;
  aliases: string[];
  attributes: CauseAttributes;
}

export interface Symptom {
  id: string;
  description: string;
  cause_id: string;
  stage_id: string;
}

// ---- Round 4: tooling ----
export type ToolCategory =
  | 'experiment-tracking'
  | 'vector-db'
  | 'database'
  | 'data-versioning'
  | 'orchestration'
  | 'serving'
  | 'feature-store'
  | 'monitoring'
  | 'labeling'
  | 'model-hub'
  | 'compute';
export type ToolHosting = 'open-source' | 'managed' | 'both';
export type ToolInterface = 'library' | 'platform' | 'database' | 'cli';

export interface ToolAttributes {
  category: ToolCategory;
  lifecycle_stage: string; // a Stage id
  hosting: ToolHosting;
  interface: ToolInterface;
}

export interface Tool {
  id: string;
  name: string;
  aliases: string[];
  attributes: ToolAttributes;
}

/** A "what tool fits this need?" prompt that resolves to one tool. */
export interface ToolPrompt {
  id: string;
  description: string;
  tool_id: string;
}

/** Everything the game needs, loaded once. */
export interface Content {
  stages: Stage[];
  scenarios: Scenario[];
  techniques: Technique[];
  causes: Cause[];
  symptoms: Symptom[];
  tools: Tool[];
  toolPrompts: ToolPrompt[];
}
