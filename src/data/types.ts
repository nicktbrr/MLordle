// Domain types mirroring the Supabase content tables.

export interface Stage {
  id: string;
  name: string;
  canonical_order: number;
  description: string;
}

export interface Scenario {
  id: string;
  title: string;
  domain: string;
  description: string;
  ordered_stage_ids: string[];
  decoy_stage_ids: string[];
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

/** Everything the game needs, loaded once. */
export interface Content {
  stages: Stage[];
  scenarios: Scenario[];
  techniques: Technique[];
  causes: Cause[];
  symptoms: Symptom[];
}
