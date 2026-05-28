import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase.js';

const today = new Date().toISOString().slice(0, 10);

const initialRows = [
  { id: 'local-1', date: today, time: '12:00 PM', lobby: '16¹', slotPrice: 16, seller: 'Rishi', slots: 12, amount: 192 },
  { id: 'local-2', date: today, time: '12:00 PM', lobby: '16²', slotPrice: 16, seller: 'Rishi', slots: 10, amount: 160 },
  { id: 'local-3', date: today, time: '12:00 PM', lobby: '16²', slotPrice: 16, seller: 'Shubh', slots: 2, amount: 32 },
];

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}

export default function App() {
  const [rows, setRows] = useState(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('slot-accounting-rows');
    return saved ? JSON.parse(saved) : initialRows;
  });
  const [loading, setLoading] = useState(false);
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
  const [searchText, setSearchText] = useState('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchTime, setSearchTime] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Save to localStorage whenever rows change
    localStorage.setItem('slot-accounting-rows', JSON.stringify(rows));

    // Try to sync with Supabase if configured
    if (!isSupabaseConfigured) {
      return;
    }

    const syncToSupabase = async () => {
      try {
        const { data, error: loadError } = await supabase
          .from('slot_entries')
          .select('*')
          .order('created_at', { ascending: false });

        if (!loadError && data) {
          setRows(data);
        }
      } catch (e) {
        // Silently fail if Supabase is not available
      }
    };

    syncToSupabase();

    // Listen for real-time updates
    const subscription = supabase
      .channel('slot_entries_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'slot_entries' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRows((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRows((prev) => prev.map((row) => (row.id === payload.new.id ? payload.new : row)));
          } else if (payload.eventType === 'DELETE') {
            setRows((prev) => prev.filter((row) => row.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const calculatedAmount = Number(form.amount || 0) || Number(form.slotPrice || 0) * Number(form.slots || 0);

  const addEntry = async () => {
    if (!form.lobby || !form.seller || !form.slots || !form.slotPrice || !form.date || !form.time) {
      return;
    }

    const newRow = {
      id: Date.now(),
      date: form.date,
      time: form.time,
      lobby: form.lobby.trim(),
      slotPrice: Number(form.slotPrice),
      seller: form.seller.trim(),
      slots: Number(form.slots),
      amount: Number(form.amount || calculatedAmount),
    };

    setRows((prev) => [newRow, ...prev]);

    // Try to sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('slot_entries').insert([newRow]);
      } catch (firestoreError) {
        setError(firestoreError.message);
      }
    }

    setForm({ ...form, lobby: '', seller: '', slots: '', amount: '' });
  };

  const updateEntry = async (id, field, value) => {
    const newValue = field === 'slotPrice' || field === 'slots' || field === 'amount' ? Number(value) : value;

    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = {
          ...row,
          [field]: newValue,
        };
        if (field === 'slotPrice' || field === 'slots') {
          updated.amount = Number(updated.slotPrice || 0) * Number(updated.slots || 0);
        }
        return updated;
      })
    );

    // Try to sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const updatedRow = { [field]: newValue };
        if (field === 'slotPrice' || field === 'slots') {
          const currentRow = rows.find((row) => row.id === id);
          updatedRow.amount = Number(field === 'slotPrice' ? newValue : currentRow.slotPrice || 0) * Number(field === 'slots' ? newValue : currentRow.slots || 0);
        }
        await supabase.from('slot_entries').update(updatedRow).eq('id', id);
      } catch (firestoreError) {
        setError(firestoreError.message);
      }
    }
  };

  const deleteEntry = async (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));

    // Try to sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('slot_entries').delete().eq('id', id);
      } catch (firestoreError) {
        setError(firestoreError.message);
      }
    }
  };

  const clearAll = async () => {
    setRows([]);

    // Try to sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await supabase.from('slot_entries').delete().neq('id', '');
      } catch (firestoreError) {
        setError(firestoreError.message);
      }
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const text = `${row.date} ${row.time} ${row.lobby} ${row.seller}`.toLowerCase();
      const searchValue = searchText.toLowerCase();
      const matchesText = text.includes(searchValue);
      const matchesTime = searchTime ? row.time.toLowerCase().includes(searchTime.toLowerCase()) : true;
      const matchesFrom = searchFrom ? row.date >= searchFrom : true;
      const matchesTo = searchTo ? row.date <= searchTo : true;
      return matchesText && matchesTime && matchesFrom && matchesTo;
    });
  }, [rows, searchText, searchFrom, searchTo, searchTime]);

  const sellerSummary = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      if (!row.seller) return;
      if (!map.has(row.seller)) {
        map.set(row.seller, { seller: row.seller, slots: 0, amount: 0, lobbies: new Set() });
      }
      const item = map.get(row.seller);
      item.slots += Number(row.slots || 0);
      item.amount += Number(row.amount || 0);
      item.lobbies.add(row.lobby);
    });
    return Array.from(map.values())
      .map((item) => ({ ...item, lobbies: item.lobbies.size }))
      .sort((a, b) => b.amount - a.amount);
  }, [rows]);

  const lobbySummary = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const key = `${row.date}-${row.time}-${row.lobby}`;
      if (!map.has(key)) {
        map.set(key, { date: row.date, time: row.time, lobby: row.lobby, slotPrice: row.slotPrice, slots: 0, amount: 0, sellers: [] });
      }
      const item = map.get(key);
      item.slots += Number(row.slots || 0);
      item.amount += Number(row.amount || 0);
      item.sellers.push(row);
    });
    return Array.from(map.values());
  }, [rows]);

  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalSlots = rows.reduce((sum, row) => sum + Number(row.slots || 0), 0);
  const totalLobbies = lobbySummary.length;
  const topSeller = sellerSummary[0];

  const reportText = useMemo(() => {
    const sellerLines = sellerSummary
      .map((seller) => `${seller.seller}: ${seller.slots} slots | ${formatMoney(seller.amount)}`)
      .join('\n');
    const lobbyLines = lobbySummary
      .map((lobby) => {
        const sellers = lobby.sellers
          .map((seller) => `${seller.slots} ${seller.seller} (${formatMoney(seller.amount)})`)
          .join(', ');
        return `${formatDate(lobby.date)} ${lobby.time} Lobby ${lobby.lobby} - ${sellers}`;
      })
      .join('\n');
    return `SCRIMS SLOT ACCOUNTING REPORT\n\nTotal Lobbies: ${totalLobbies}\nTotal Slots Sold: ${totalSlots}\nTotal Collection: ${formatMoney(totalAmount)}\n\nSeller Wise Report:\n${sellerLines}\n\nLobby Wise Report:\n${lobbyLines}`;
  }, [sellerSummary, lobbySummary, totalLobbies, totalSlots, totalAmount]);

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="app-shell">
      <header className="brand-bar">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Scrims Slot Accounting</h1>
          <p className="subtitle">Track sales, filter by date and time, and manage slot reports from a single admin view.</p>
          {!isSupabaseConfigured && (
            <p style={{ marginTop: 8, color: '#fbbf24' }}>
              💾 Working offline with local storage. Data will sync to Supabase once configured.
            </p>
          )}
          {error && (
            <p style={{ marginTop: 8, color: '#f87171' }}>Error: {error}</p>
          )}
        </div>
        <div className="header-actions">
          <button className="button button-solid" onClick={copyReport}>{copied ? 'Copied Report' : 'Copy Report'}</button>
          <button className="button button-danger" onClick={clearAll}>Clear All</button>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Lobbies" value={totalLobbies} />
        <StatCard label="Slots Sold" value={totalSlots} />
        <StatCard label="Collection" value={formatMoney(totalAmount)} />
        <StatCard label="Top Seller" value={topSeller ? topSeller.seller : '-'} sub={topSeller ? formatMoney(topSeller.amount) : ''} />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Add New Sale</h2>
            <p>Enter the sale details below. Amount auto-calculates from price × slots.</p>
          </div>
        </div>

        <div className="form-grid">
          <InputField label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
          <InputField label="Time" type="time" value={form.time} onChange={(value) => setForm({ ...form, time: value })} />
          <InputField label="Lobby" value={form.lobby} onChange={(value) => setForm({ ...form, lobby: value })} placeholder="16¹" />
          <InputField label="Seller" value={form.seller} onChange={(value) => setForm({ ...form, seller: value })} placeholder="Rishi" />
          <InputField label="Slot Price" type="number" value={form.slotPrice} onChange={(value) => setForm({ ...form, slotPrice: value })} placeholder="16" />
          <InputField label="Slots" type="number" value={form.slots} onChange={(value) => setForm({ ...form, slots: value })} placeholder="12" />
          <InputField label="Amount" type="number" value={form.amount || calculatedAmount || ''} onChange={(value) => setForm({ ...form, amount: value })} placeholder="Auto" />
        </div>

        <div className="panel-footer">
          <button className="button button-solid" onClick={addEntry}>Add Entry</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading spaced">
          <div>
            <h2>Admin Search</h2>
            <p>Search by lobby, seller, date range, or time.</p>
          </div>
          <div className="search-grid">
            <TextInput value={searchText} onChange={setSearchText} placeholder="Search lobby, seller or time" />
            <DateInput label="From" value={searchFrom} onChange={setSearchFrom} />
            <DateInput label="To" value={searchTo} onChange={setSearchTo} />
            <InputField label="Time" type="text" value={searchTime} onChange={setSearchTime} placeholder="12:00" />
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
                    <td><input className="table-input" type="time" value={convertTo24h(row.time)} onChange={(e) => updateEntry(row.id, 'time', convertFrom24h(e.target.value))} /></td>
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

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      className="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function InputField({ label, value, onChange, placeholder = '', type = 'text' }) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
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

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
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

function convertFrom24h(value) {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  const numHours = Number(hours);
  const modifier = numHours >= 12 ? 'PM' : 'AM';
  const displayHour = numHours % 12 === 0 ? 12 : numHours % 12;
  return `${displayHour}:${minutes} ${modifier}`;
}
