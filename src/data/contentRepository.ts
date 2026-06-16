import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fallbackContent } from './fallbackContent';
import type { Content } from './types';

export interface ContentRepository {
  getContent(): Promise<Content>;
}

/** Reads all content tables from Supabase via the publishable key (read-only RLS). */
export class SupabaseContentRepository implements ContentRepository {
  async getContent(): Promise<Content> {
    const [stages, scenarios, techniques, causes, symptoms] = await Promise.all([
      supabase.from('stages').select('*'),
      supabase.from('scenarios').select('*'),
      supabase.from('techniques').select('*'),
      supabase.from('causes').select('*'),
      supabase.from('symptoms').select('*'),
    ]);

    const first = [stages, scenarios, techniques, causes, symptoms].find((r) => r.error);
    if (first?.error) {
      throw new Error(`Supabase content load failed: ${first.error.message}`);
    }

    // Round 4 tooling tables are optional: if they aren't created yet (or are
    // empty), fall back to the bundled tool content so the round still works.
    let tools = fallbackContent.tools;
    let toolPrompts = fallbackContent.toolPrompts;
    try {
      const [t, tp] = await Promise.all([
        supabase.from('tools').select('*'),
        supabase.from('tool_prompts').select('*'),
      ]);
      if (!t.error && !tp.error && t.data?.length && tp.data?.length) {
        tools = t.data as Content['tools'];
        toolPrompts = tp.data as Content['toolPrompts'];
      }
    } catch {
      /* keep bundled tool content */
    }

    return {
      stages: stages.data ?? [],
      scenarios: scenarios.data ?? [],
      techniques: techniques.data ?? [],
      causes: causes.data ?? [],
      symptoms: symptoms.data ?? [],
      tools,
      toolPrompts,
    } as Content;
  }
}

/** Serves the bundled seed content; used when Supabase isn't configured. */
export class LocalContentRepository implements ContentRepository {
  async getContent(): Promise<Content> {
    return fallbackContent;
  }
}

export function getContentRepository(): ContentRepository {
  return isSupabaseConfigured
    ? new SupabaseContentRepository()
    : new LocalContentRepository();
}
