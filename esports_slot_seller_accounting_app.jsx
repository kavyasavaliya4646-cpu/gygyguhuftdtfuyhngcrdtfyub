import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator, Trophy, Users, IndianRupee, Plus, Trash2, Search, Copy, FileText } from "lucide-react";

const initialRows = [
  { id: 1, time: "12 PM", lobby: "16¹", slotPrice: 16, seller: "Rishi", slots: 12, amount: 192 },
  { id: 2, time: "12 PM", lobby: "16²", slotPrice: 16, seller: "Rishi", slots: 10, amount: 160 },
  { id: 3, time: "12 PM", lobby: "16²", slotPrice: 16, seller: "Shubh", slots: 2, amount: 32 },
];

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function EsportsSlotAccountingApp() {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState({
    time: "12 PM",
    lobby: "",
    slotPrice: "",
    seller: "",
    slots: "",
    amount: "",
  });
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const calculatedAmount = Number(form.amount || 0) || Number(form.slotPrice || 0) * Number(form.slots || 0);

  const addEntry = () => {
    if (!form.lobby || !form.seller || !form.slots || !form.slotPrice) return;

    const newRow = {
      id: Date.now(),
      time: form.time || "-",
      lobby: form.lobby.trim(),
      slotPrice: Number(form.slotPrice),
      seller: form.seller.trim(),
      slots: Number(form.slots),
      amount: calculatedAmount,
    };

    setRows((prev) => [...prev, newRow]);
    setForm({ ...form, lobby: "", seller: "", slots: "", amount: "" });
  };

  const updateEntry = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = {
          ...row,
          [field]: field === "slotPrice" || field === "slots" || field === "amount" ? Number(value) : value,
        };

        if (field === "slotPrice" || field === "slots") {
          updatedRow.amount = Number(updatedRow.slotPrice || 0) * Number(updatedRow.slots || 0);
        }

        return updatedRow;
      })
    );
  };

  const deleteEntry = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const clearAll = () => setRows([]);

  const filteredRows = rows.filter((row) => {
    const value = `${row.time} ${row.lobby} ${row.seller}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

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
      const key = `${row.time}-${row.lobby}`;
      if (!map.has(key)) {
        map.set(key, { time: row.time, lobby: row.lobby, slotPrice: row.slotPrice, slots: 0, amount: 0, sellers: [] });
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
      .join("\n");

    const lobbyLines = lobbySummary
      .map((lobby) => {
        const sellers = lobby.sellers
          .map((seller) => `${seller.slots} ${seller.seller} (${seller.amount})`)
          .join(", ");
        return `${lobby.time} Lobby ${lobby.lobby} - ${sellers}`;
      })
      .join("\n");

    return `SCRIMS SLOT ACCOUNTING REPORT\n\nTotal Lobbies: ${totalLobbies}\nTotal Slots Sold: ${totalSlots}\nTotal Collection: ${formatMoney(totalAmount)}\n\nSeller Wise Report:\n${sellerLines}\n\nLobby Wise Report:\n${lobbyLines}`;
  }, [sellerSummary, lobbySummary, totalLobbies, totalSlots, totalAmount]);

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-3 py-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/20">
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">Scrims Slot Accounting</h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1">Mobile-friendly accounting for esports paid scrim slots.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button onClick={copyReport} className="w-full sm:w-auto rounded-2xl bg-indigo-600 hover:bg-indigo-500 h-11">
              <Copy className="w-4 h-4 mr-2" /> {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={clearAll} className="w-full sm:w-auto rounded-2xl bg-red-600 hover:bg-red-500 h-11">
              <Trash2 className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={<FileText />} label="Lobbies" value={totalLobbies} />
          <StatCard icon={<Users />} label="Slots" value={totalSlots} />
          <StatCard icon={<IndianRupee />} label="Collection" value={formatMoney(totalAmount)} />
          <StatCard icon={<Calculator />} label="Top Seller" value={topSeller ? topSeller.seller : "-"} sub={topSeller ? formatMoney(topSeller.amount) : ""} />
        </div>

        <Card className="bg-slate-900/70 border-slate-800 rounded-2xl shadow-xl">
          <CardContent className="p-4 sm:p-5 space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Add Slot Sale Entry</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Enter one seller entry. Amount auto-calculates from price × slots.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <InputBox label="Time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} placeholder="12 PM" />
              <InputBox label="Lobby" value={form.lobby} onChange={(v) => setForm({ ...form, lobby: v })} placeholder="16²" />
              <InputBox label="Price" type="number" value={form.slotPrice} onChange={(v) => setForm({ ...form, slotPrice: v })} placeholder="16" />
              <InputBox label="Seller" value={form.seller} onChange={(v) => setForm({ ...form, seller: v })} placeholder="Rishi" />
              <InputBox label="Slots" type="number" value={form.slots} onChange={(v) => setForm({ ...form, slots: v })} placeholder="12" />
              <InputBox label="Amount" type="number" value={form.amount || calculatedAmount || ""} onChange={(v) => setForm({ ...form, amount: v })} placeholder="Auto" />
            </div>

            <Button onClick={addEntry} className="w-full sm:w-auto rounded-2xl bg-emerald-600 hover:bg-emerald-500 h-11">
              <Plus className="w-4 h-4 mr-2" /> Add Entry
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <Card className="xl:col-span-1 bg-slate-900/70 border-slate-800 rounded-2xl shadow-xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Seller Summary</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Total per seller.</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 rounded-xl">
                  {sellerSummary.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {sellerSummary.length === 0 && <EmptyState text="No seller data added yet." />}
                {sellerSummary.map((seller) => (
                  <div key={seller.seller} className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="font-bold text-base sm:text-lg break-words">{seller.seller}</h3>
                      <span className="shrink-0 font-semibold text-emerald-300">{formatMoney(seller.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-slate-400 mt-2">
                      <span>{seller.slots} slots</span>
                      <span>{seller.lobbies} lobbies</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2 bg-slate-900/70 border-slate-800 rounded-2xl shadow-xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">All Entries</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Edit entries anytime.</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search lobby or seller"
                    className="pl-9 bg-slate-950 border-slate-800 rounded-2xl h-11"
                  />
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {filteredRows.length === 0 && <EmptyState text="No entries found." />}
                {filteredRows.map((row) => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Entry</p>
                        <h3 className="font-bold text-lg">Lobby {row.lobby || "-"}</h3>
                      </div>
                      <Button size="sm" onClick={() => deleteEntry(row.id)} className="rounded-xl bg-red-600 hover:bg-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MobileEdit label="Time" value={row.time} onChange={(v) => updateEntry(row.id, "time", v)} />
                      <MobileEdit label="Lobby" value={row.lobby} onChange={(v) => updateEntry(row.id, "lobby", v)} />
                      <MobileEdit label="Price" type="number" value={row.slotPrice} onChange={(v) => updateEntry(row.id, "slotPrice", v)} />
                      <MobileEdit label="Slots" type="number" value={row.slots} onChange={(v) => updateEntry(row.id, "slots", v)} />
                      <div className="col-span-2">
                        <MobileEdit label="Seller" value={row.seller} onChange={(v) => updateEntry(row.id, "seller", v)} />
                      </div>
                      <div className="col-span-2">
                        <MobileEdit label="Amount" type="number" value={row.amount} onChange={(v) => updateEntry(row.id, "amount", v)} amount />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-800">
                      <th className="py-3 pr-4">Time</th>
                      <th className="py-3 pr-4">Lobby</th>
                      <th className="py-3 pr-4">Price</th>
                      <th className="py-3 pr-4">Seller</th>
                      <th className="py-3 pr-4">Slots</th>
                      <th className="py-3 pr-4 text-right">Amount</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="border-b border-slate-800/70 hover:bg-slate-800/40">
                        <td className="py-3 pr-4 min-w-[110px]">
                          <Input value={row.time} onChange={(e) => updateEntry(row.id, "time", e.target.value)} className="bg-slate-950 border-slate-800 rounded-xl h-9" />
                        </td>
                        <td className="py-3 pr-4 min-w-[110px]">
                          <Input value={row.lobby} onChange={(e) => updateEntry(row.id, "lobby", e.target.value)} className="bg-slate-950 border-slate-800 rounded-xl h-9 font-semibold" />
                        </td>
                        <td className="py-3 pr-4 min-w-[110px]">
                          <Input type="number" value={row.slotPrice} onChange={(e) => updateEntry(row.id, "slotPrice", e.target.value)} className="bg-slate-950 border-slate-800 rounded-xl h-9" />
                        </td>
                        <td className="py-3 pr-4 min-w-[150px]">
                          <Input value={row.seller} onChange={(e) => updateEntry(row.id, "seller", e.target.value)} className="bg-slate-950 border-slate-800 rounded-xl h-9" />
                        </td>
                        <td className="py-3 pr-4 min-w-[100px]">
                          <Input type="number" value={row.slots} onChange={(e) => updateEntry(row.id, "slots", e.target.value)} className="bg-slate-950 border-slate-800 rounded-xl h-9" />
                        </td>
                        <td className="py-3 pr-4 min-w-[120px]">
                          <Input type="number" value={row.amount} onChange={(e) => updateEntry(row.id, "amount", e.target.value)} className="bg-slate-950 border-slate-800 rounded-xl h-9 text-right font-semibold text-emerald-300" />
                        </td>
                        <td className="py-3 text-right">
                          <Button size="sm" onClick={() => deleteEntry(row.id)} className="rounded-xl bg-red-600 hover:bg-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InputBox({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs sm:text-sm text-slate-400">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-950 border-slate-800 rounded-2xl h-11 text-sm"
      />
    </div>
  );
}

function MobileEdit({ label, value, onChange, type = "text", amount = false }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-slate-500">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-slate-900 border-slate-800 rounded-xl h-10 text-sm ${amount ? "font-semibold text-emerald-300" : ""}`}
      />
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-5 text-center text-sm text-slate-500">{text}</div>;
}

function StatCard({ icon, label, value, sub }) {
  return (
    <Card className="bg-slate-900/70 border-slate-800 rounded-2xl shadow-xl">
      <CardContent className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="w-fit p-2.5 sm:p-3 rounded-2xl bg-slate-800 text-indigo-300">
            {React.cloneElement(icon, { className: "w-4 h-4 sm:w-5 sm:h-5" })}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-slate-400">{label}</p>
            <h3 className="text-lg sm:text-2xl font-bold mt-0.5 truncate">{value}</h3>
            {sub && <p className="text-xs text-emerald-300 mt-1 truncate">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
