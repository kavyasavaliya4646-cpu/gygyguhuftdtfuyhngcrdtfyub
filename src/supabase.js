import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabase);

export function normalizeEntry(entry) {
  if (!entry) {
    return entry;
  }

  return {
    ...entry,
    id: String(entry.id),
    slotPrice: Number(entry.slotPrice ?? entry.slotprice ?? 0),
    slots: Number(entry.slots ?? 0),
    amount: Number(entry.amount ?? 0),
  };
}

export function sanitizeEntryForDb(entry, options = {}) {
  const payload = {
    date: entry.date,
    time: entry.time,
    lobby: entry.lobby,
    slotprice: Number(entry.slotPrice ?? entry.slotprice ?? 0),
    seller: entry.seller,
    slots: Number(entry.slots ?? 0),
    amount: Number(entry.amount ?? 0),
  };

  if (options.includeId) {
    payload.id = Number(entry.id);
  }

  return payload;
}
