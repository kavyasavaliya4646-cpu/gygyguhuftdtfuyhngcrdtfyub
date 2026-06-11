import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured, normalizeEntry, sanitizeEntryForDb } from './supabase.js';

const today = new Date().toISOString().slice(0, 10);
const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const minuteOptions = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const initialRows = [
  { id: 'local-1', date: today, time: '12:00 PM', lobby: '16-1', slotPrice: 16, seller: 'Rishi', slots: 12, amount: 192 },
  { id: 'local-2', date: today, time: '12:00 PM', lobby: '16-2', slotPrice: 16, seller: 'Rishi', slots: 10, amount: 160 },
  { id: 'local-3', date: today, time: '12:00 PM', lobby: '16-2', slotPrice: 16, seller: 'Shubh', slots: 2, amount: 32 },
].map(normalizeEntry);

function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}

function parseStoredRows() {
  try {
    const saved = localStorage.getItem('slot-accounting-rows');
    return saved ? JSON.parse(saved).map(normalizeEntry) : initialRows;
  } catch {
    return initialRows;
  }
}

function parseTime12h(value) {
  if (!value) {
    return { hour: '12', minute: '00', period: 'AM' };
  }

  const [timePart = '12:00', periodPart = 'AM'] = value.split(' ');
  const [rawHour = '12', rawMinute = '00'] = timePart.split(':');
  const hour = String(Math.min(Math.max(Number(rawHour) || 12, 1), 12)).padStart(2, '0');
  const minute = minuteOptions.includes(rawMinute) ? rawMinute : '00';
  const period = periodPart.toUpperCase() === 'PM' ? 'PM' : 'AM';

  return { hour, minute, period };
}

function buildTime12h(hour, minute, period) {
  return `${hour}:${minute} ${period}`;
}

function mapFieldToDb(field) {
  return field === 'slotPrice' ? 'slotprice' : field;
}

function isPersistedId(id) {
  return /^\d+$/.test(String(id));
}

function mergeEntries(primaryRows, fallbackRows) {
  const merged = new Map();

  [...primaryRows, ...fallbackRows].forEach((row) => {
    const normalized = normalizeEntry(row);
    if (normalized?.id) {
      merged.set(String(normalized.id), normalized);
    }
  });

  return Array.from(merged.values()).sort((left, right) => {
    const leftTime = new Date(`${left.date || today}T${convertTo24h(left.time) || '00:00'}`).getTime();
    const rightTime = new Date(`${right.date || today}T${convertTo24h(right.time) || '00:00'}`).getTime();
    return rightTime - leftTime;
  });
}

export default function App() {
  const [rows, setRows] = useState(() => parseStoredRows());
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    date: today,
    time: '12:00 PM',
    lobby: '',
    slotPrice: '',
    seller: '',
    slots: '',
    amount: '',
  });
  const [searchDraft, setSearchDraft] = useState({ text: '', from: '', to: '', time: '' });
  const [appliedFilters, setAppliedFilters] = useState({ text: '', from: '', to: '', time: '' });
  const [copied, setCopied] = useState(false);

  const connectionStatus = !isSupabaseConfigured
    ? {
        tone: 'offline',
        label: 'Offline mode',
        message: 'Supabase is not configured. Data is saving only in this browser.',
      }
    : error
      ? {
          tone: 'error',
          label: 'Connection issue',
          message: `Supabase issue: ${error}`,
        }
      : loading && !hasLoadedOnce && rows.length === 0
        ? {
            tone: 'loading',
            label: 'Syncing',
            message: 'Connecting to Supabase and syncing your latest entries...',
          }
        : {
            tone: 'success',
            label: 'Connected',
            message: 'Supabase is connected and real-time sync is active.',
          };

  useEffect(() => {
    localStorage.setItem('slot-accounting-rows', JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setHasLoadedOnce(true);
      return undefined;
    }

    const syncToSupabase = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: loadError } = await supabase
          .from('slot_entries')
          .select('*')
          .order('created_at', { ascending: false });

        if (loadError) {
          setError(loadError.message);
          return;
        }

        if (data) {
          const remoteRows = data.map(normalizeEntry);
          setRows((currentRows) => mergeEntries(remoteRows, currentRows));
        }
      } catch (syncError) {
        setError(syncError?.message || 'Could not connect to Supabase.');
      } finally {
        setHasLoadedOnce(true);
        setLoading(false);
      }
    };

    syncToSupabase();

    const channel = supabase
      .channel('slot_entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_entries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRows((prev) => mergeEntries([payload.new], prev));
        } else if (payload.eventType === 'UPDATE') {
          setRows((prev) => prev.map((row) => (row.id === String(payload.new.id) ? normalizeEntry(payload.new) : row)));
        } else if (payload.eventType === 'DELETE') {
          setRows((prev) => prev.filter((row) => row.id !== String(payload.old.id)));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculatedAmount = Number(form.amount || 0) || Number(form.slotPrice || 0) * Number(form.slots || 0);
  const showLoadingStats = loading && !hasLoadedOnce && rows.length === 0;
  const totalRevenue = useMemo(() => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0), [rows]);
  const totalSlots = useMemo(() => rows.reduce((sum, row) => sum + Number(row.slots || 0), 0), [rows]);
  const sellerCount = useMemo(() => new Set(rows.map((row) => row.seller)).size, [rows]);
  const todayEntries = useMemo(() => rows.filter((row) => row.date === today).length, [rows]);

  const sellerSummary = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      const key = row.seller || 'Unknown';
      const current = map.get(key) || { slots: 0, amount: 0, entries: 0 };
      map.set(key, {
        slots: current.slots + Number(row.slots || 0),
        amount: current.amount + Number(row.amount || 0),
        entries: current.entries + 1,
      });
    });

    return Array.from(map.entries())
      .map(([seller, totals]) => ({ seller, ...totals }))
      .sort((left, right) => right.amount - left.amount);
  }, [rows]);

  const topSeller = sellerSummary[0];

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesText =
        !appliedFilters.text ||
        [row.lobby, row.seller, row.time].join(' ').toLowerCase().includes(appliedFilters.text.toLowerCase());
      const matchesTime = !appliedFilters.time || row.time.toLowerCase().includes(appliedFilters.time.toLowerCase());
      const rowDate = row.date || '';
      const matchesFrom = !appliedFilters.from || rowDate >= appliedFilters.from;
      const matchesTo = !appliedFilters.to || rowDate <= appliedFilters.to;
      return matchesText && matchesTime && matchesFrom && matchesTo;
    });
  }, [rows, appliedFilters]);

  const applySearch = () => {
    setAppliedFilters(searchDraft);
  };

  const clearSearch = () => {
    const emptyFilters = { text: '', from: '', to: '', time: '' };
    setSearchDraft(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const addEntry = async () => {
    if (!form.lobby || !form.seller || !form.slots || !form.slotPrice || !form.date || !form.time) {
      return;
    }

    const newRow = normalizeEntry({
      id: `temp-${crypto.randomUUID()}`,
      date: form.date,
      time: form.time,
      lobby: form.lobby.trim(),
      slotPrice: Number(form.slotPrice),
      seller: form.seller.trim(),
      slots: Number(form.slots),
      amount: Number(form.amount || calculatedAmount),
    });

    setRows((prev) => [newRow, ...prev]);

    if (isSupabaseConfigured) {
      try {
        const { data: insertedRow, error: insertError } = await supabase
          .from('slot_entries')
          .insert([sanitizeEntryForDb(newRow)])
          .select()
          .single();
        if (insertError) {
          throw insertError;
        }
        if (insertedRow) {
          const normalizedInsertedRow = normalizeEntry(insertedRow);
          setRows((prev) => prev.map((row) => (row.id === newRow.id ? normalizedInsertedRow : row)));
        }
      } catch (dbError) {
        setError(dbError.message);
        setRows((prev) => prev.filter((row) => row.id !== newRow.id));
      }
    }

    setForm((current) => ({ ...current, lobby: '', seller: '', slots: '', amount: '' }));
  };

  const updateEntry = async (id, field, value) => {
    const newValue = field === 'slotPrice' || field === 'slots' || field === 'amount' ? Number(value) : value;

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) {
          return row;
        }

        const updated = { ...row, [field]: newValue };
        if (field === 'slotPrice' || field === 'slots') {
          updated.amount = Number(updated.slotPrice || 0) * Number(updated.slots || 0);
        }
        return updated;
      })
    );

    if (isSupabaseConfigured && isPersistedId(id)) {
      try {
        const updatedRow = { [mapFieldToDb(field)]: newValue };
        if (field === 'slotPrice' || field === 'slots') {
          const currentRow = rows.find((row) => row.id === id);
          updatedRow.amount =
            Number(field === 'slotPrice' ? newValue : currentRow?.slotPrice || 0) *
            Number(field === 'slots' ? newValue : currentRow?.slots || 0);
        }
        const { error: updateError } = await supabase.from('slot_entries').update(updatedRow).eq('id', id);
        if (updateError) {
          throw updateError;
        }
      } catch (dbError) {
        setError(dbError.message);
      }
    }
  };

  const deleteEntry = async (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));

    if (isSupabaseConfigured && isPersistedId(id)) {
      try {
        const { error: deleteError } = await supabase.from('slot_entries').delete().eq('id', id);
        if (deleteError) {
          throw deleteError;
        }
      } catch (dbError) {
        setError(dbError.message);
      }
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete all entries?')) {
      return;
    }

    setRows([]);

    if (isSupabaseConfigured) {
      try {
        const { error: clearError } = await supabase.from('slot_entries').delete().gte('id', 0);
        if (clearError) {
          throw clearError;
        }
      } catch (dbError) {
        setError(dbError.message);
      }
    }
  };

  const exportSummary = async () => {
    const lines = [
      `GxF Seller Summary (${formatDate(today)})`,
      `Total Revenue: ${formatMoney(totalRevenue)}`,
      `Total Slots: ${totalSlots}`,
      '',
      ...sellerSummary.map((item) => `${item.seller}: ${item.slots} slots | ${formatMoney(item.amount)}`),
      '',
      'Entries:',
      ...filteredRows.map(
        (row) =>
          `${formatDate(row.date)} | ${row.time} | Lobby ${row.lobby} | ${row.seller} | ${row.slots} slots x ${formatMoney(row.slotPrice)} = ${formatMoney(row.amount)}`
      ),
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy summary.');
    }
  };

  return (
    <div className="page-shell">
      <header className="hero-card">
        <div className="hero-copy-block">
          <div className="hero-badge-row">
            <p className="eyebrow">Revenue tracker</p>
            <span className={`sync-pill sync-pill-${connectionStatus.tone}`}>{connectionStatus.label}</span>
          </div>
          <h1>GxF Slot Seller Hisab</h1>
          <p className="hero-copy">A cleaner dashboard for logging slots faster, checking totals instantly, and keeping sellers organized.</p>
          <div className="hero-highlights">
            <span>{todayEntries} entries today</span>
            <span>{sellerCount} active sellers</span>
            <span>{formatMoney(totalRevenue)} tracked</span>
          </div>
          <p className={`status-banner status-${connectionStatus.tone}`}>{connectionStatus.message}</p>
        </div>

        <div className="hero-actions">
          <button className="button button-light" onClick={exportSummary}>
            {copied ? 'Copied!' : 'Copy Admin Summary'}
          </button>
          <button className="button button-danger" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Total Revenue" value={showLoadingStats ? 'Loading...' : formatMoney(totalRevenue)} sub={`${rows.length} total entries`} />
        <StatCard label="Total Slots" value={showLoadingStats ? 'Loading...' : totalSlots} sub={`${sellerCount} sellers active`} />
        <StatCard label="Top Seller" value={topSeller?.seller || '-'} sub={topSeller ? formatMoney(topSeller.amount) : 'No data yet'} />
        <StatCard label="Today" value={todayEntries} sub={topSeller ? `${topSeller.entries} entries by ${topSeller.seller}` : 'Start logging entries'} />
      </section>

      <section className="insight-grid">
        <div className="panel feature-panel">
          <div className="panel-heading compact">
            <div>
              <h2>Quick Insights</h2>
              <p>Useful context before you share the report.</p>
            </div>
          </div>
          <div className="insight-list">
            <InsightRow label="Best performer" value={topSeller ? `${topSeller.seller} - ${formatMoney(topSeller.amount)}` : 'No seller data'} />
            <InsightRow label="Average value" value={rows.length ? formatMoney(totalRevenue / rows.length) : 'Rs 0'} />
            <InsightRow label="Average slots" value={rows.length ? `${Math.round(totalSlots / rows.length)} per entry` : '0 per entry'} />
          </div>
        </div>

        <div className="panel feature-panel">
          <div className="panel-heading compact">
            <div>
              <h2>Seller Leaderboard</h2>
              <p>Top totals at a glance.</p>
            </div>
          </div>
          <div className="seller-stack">
            {sellerSummary.length === 0 ? (
              <div className="empty-state">No seller activity yet.</div>
            ) : (
              sellerSummary.slice(0, 3).map((seller, index) => (
                <div className="seller-card" key={seller.seller}>
                  <div>
                    <p className="seller-rank">#{index + 1}</p>
                    <h3>{seller.seller}</h3>
                    <p>{seller.entries} entries - {seller.slots} slots</p>
                  </div>
                  <strong>{formatMoney(seller.amount)}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Add Slot Entry</h2>
            <p>Now with explicit AM/PM controls for faster, clearer logging.</p>
          </div>
        </div>

        <div className="form-grid">
          <DateInput label="Date" value={form.date} onChange={(value) => setForm((current) => ({ ...current, date: value }))} />
          <TimeField label="Time" value={form.time} onChange={(value) => setForm((current) => ({ ...current, time: value }))} />
          <InputField label="Lobby" value={form.lobby} onChange={(value) => setForm((current) => ({ ...current, lobby: value }))} placeholder="16-1" />
          <InputField label="Seller" value={form.seller} onChange={(value) => setForm((current) => ({ ...current, seller: value }))} placeholder="Rishi" />
          <InputField label="Slot Price" type="number" value={form.slotPrice} onChange={(value) => setForm((current) => ({ ...current, slotPrice: value }))} placeholder="16" />
          <InputField label="Slots" type="number" value={form.slots} onChange={(value) => setForm((current) => ({ ...current, slots: value }))} placeholder="12" />
          <InputField label="Amount" type="number" value={form.amount || calculatedAmount || ''} onChange={(value) => setForm((current) => ({ ...current, amount: value }))} placeholder="Auto" />
        </div>

        <div className="panel-footer">
          <button className="button button-solid" onClick={addEntry}>
            Add Entry
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading spaced">
          <div>
            <h2>Admin Search</h2>
            <p>Enter filters, then click Search.</p>
          </div>
          <div className="search-grid">
            <TextInput value={searchDraft.text} onChange={(value) => setSearchDraft((current) => ({ ...current, text: value }))} placeholder="Search lobby, seller or time" />
            <DateInput label="From" value={searchDraft.from} onChange={(value) => setSearchDraft((current) => ({ ...current, from: value }))} />
            <DateInput label="To" value={searchDraft.to} onChange={(value) => setSearchDraft((current) => ({ ...current, to: value }))} />
            <InputField label="Time" type="text" value={searchDraft.time} onChange={(value) => setSearchDraft((current) => ({ ...current, time: value }))} placeholder="12:00 PM" />
          </div>
          <div className="search-actions">
            <button className="button button-light search-button" onClick={applySearch}>Search</button>
            <button className="button search-clear-button" onClick={clearSearch}>Clear Search</button>
          </div>
        </div>

        <div className="table-wrap">
          {filteredRows.length === 0 ? (
            <div className="empty-state">No entries found for the selected filters.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Lobby</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Slots</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td><input className="table-input" type="date" value={row.date} onChange={(e) => updateEntry(row.id, 'date', e.target.value)} /></td>
                    <td><TimeField compact value={row.time} onChange={(value) => updateEntry(row.id, 'time', value)} /></td>
                    <td><input className="table-input" value={row.lobby} onChange={(e) => updateEntry(row.id, 'lobby', e.target.value)} /></td>
                    <td><input className="table-input" value={row.seller} onChange={(e) => updateEntry(row.id, 'seller', e.target.value)} /></td>
                    <td><input className="table-input" type="number" value={row.slotPrice} onChange={(e) => updateEntry(row.id, 'slotPrice', e.target.value)} /></td>
                    <td><input className="table-input" type="number" value={row.slots} onChange={(e) => updateEntry(row.id, 'slots', e.target.value)} /></td>
                    <td><input className="table-input" type="number" value={row.amount} onChange={(e) => updateEntry(row.id, 'amount', e.target.value)} /></td>
                    <td><button className="button button-danger small" onClick={() => deleteEntry(row.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function InsightRow({ label, value }) {
  return (
    <div className="insight-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return <input className="search-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

function InputField({ label, value, onChange, placeholder = '', type = 'text' }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TimeField({ label, value, onChange, compact = false }) {
  const time = parseTime12h(value);

  const handlePartChange = (nextPart) => {
    onChange(buildTime12h(nextPart.hour ?? time.hour, nextPart.minute ?? time.minute, nextPart.period ?? time.period));
  };

  return (
    <label className={`field-block ${compact ? 'field-block-compact' : ''}`}>
      {label ? <span>{label}</span> : null}
      <div className={`time-picker ${compact ? 'time-picker-compact' : ''}`}>
        <select value={time.hour} onChange={(e) => handlePartChange({ hour: e.target.value })}>
          {hourOptions.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <select value={time.minute} onChange={(e) => handlePartChange({ minute: e.target.value })}>
          {minuteOptions.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
        <select value={time.period} onChange={(e) => handlePartChange({ period: e.target.value })}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </label>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub ? <p className="stat-sub">{sub}</p> : null}
    </div>
  );
}

function convertTo24h(value) {
  if (!value) return '';
  const [time, modifier] = value.split(' ');
  if (!modifier) return value;
  let [hours, minutes] = time.split(':');
  if (modifier.toLowerCase() === 'pm' && hours !== '12') hours = String(Number(hours) + 12);
  if (modifier.toLowerCase() === 'am' && hours === '12') hours = '00';
  return `${hours.padStart(2, '0')}:${minutes}`;
}
