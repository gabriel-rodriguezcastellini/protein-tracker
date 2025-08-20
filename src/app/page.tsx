"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Trash2,
  Download,
  Upload,
  RefreshCcw,
  Calendar,
  Droplets,
  Leaf,
  Edit2,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient, Session, SupabaseClient } from "@supabase/supabase-js";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Button({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-medium transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none";
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
  } as const;
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800 shadow",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-300 bg-white hover:bg-slate-50",
    destructive: "bg-red-600 text-white hover:bg-red-500",
    ghost: "hover:bg-slate-100",
  } as const;
  return (
    <button
      className={cx(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cx("rounded-2xl border bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}
function CardHeader({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cx("border-b p-4", className)}>{children}</div>;
}
function CardTitle({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <h2 className={cx("text-lg font-semibold", className)}>{children}</h2>;
}

function CardContent({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cx("p-4", className)}>{children}</div>;
}

function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx("text-sm font-medium text-slate-700", className)}
    >
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300",
        props.className
      )}
    />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300",
        props.className
      )}
    />
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
        <div className="mb-2 text-lg font-semibold">{title}</div>
        {children}
      </div>
    </div>
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

type Entry = {
  id: string;
  user_id?: string | null;
  date: string;
  time: string;
  protein: number;
  water: number;
  note?: string | null;
  created_at?: string;
};

type Goals = {
  user_id?: string | null;
  dailyProtein: number;
  dailyWater: number;
};

const STORAGE_KEY = "pwt_entries_v1";
const GOALS_KEY = "pwt_goals_v1";

const nowLocal = () => new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toHM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const roundTo = (val: number, step: number) => Math.round(val / step) * step;

const exampleQuickAdds = [
  { protein: 35, water: 0, label: "+35g" },
  { protein: 49, water: 0, label: "+49g" },
  { protein: 0, water: 0.5, label: "+0.5L" },
];

export default function ProteinWaterTracker() {
  const [session, setSession] = useState<Session | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goals>({
    dailyProtein: 160,
    dailyWater: 2,
  });
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [water, setWater] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editGoalsOpen, setEditGoalsOpen] = useState(false);
  const [gProtein, setGProtein] = useState<number>(goals.dailyProtein);
  const [gWater, setGWater] = useState<number>(goals.dailyWater);
  const [autoTime, setAutoTime] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setGProtein(goals.dailyProtein);
    setGWater(goals.dailyWater);
  }, [goals]);

  useEffect(() => {
    const now = new Date();
    setDate(toYMD(now));
    setTime(toHM(now));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !autoTime) return;

    const id = setInterval(() => {
      const now = new Date();
      setDate(toYMD(now));
      setTime(toHM(now));
    }, 30_000);

    return () => clearInterval(id);
  }, [mounted, autoTime]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(GOALS_KEY);
      if (raw) setGoals(JSON.parse(raw));
    } catch {}
    const now = new Date();
    setDate(toYMD(now));
    setTime(toHM(now));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => sub?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    const load = async () => {
      setLoading(true);
      const userId = session.user.id;
      const { data: rows } = await supabase
        .from("entries")
        .select("id,user_id,date,time,protein,water,note,created_at")
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      if (rows) setEntries(rows as Entry[]);

      const { data: g } = await supabase
        .from("goals")
        .select("daily_protein,daily_water")
        .eq("user_id", userId)
        .maybeSingle();

      if (g)
        setGoals({
          dailyProtein: Number(g.daily_protein),
          dailyWater: Number(g.daily_water),
        });

      setLoading(false);
    };
    load();
  }, [session]);

  const signInWithGoogle = async () => {
    if (!supabase) return alert("Supabase not configured");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) alert(error.message);
  };

  const upsertGoals = async (g: Goals) => {
    setGoals(g);
    if (!supabase || !session) return;
    await supabase.from("goals").upsert({
      user_id: session.user.id,
      daily_protein: g.dailyProtein,
      daily_water: g.dailyWater,
    });
  };

  const addOrUpdate = async () => {
    if (!protein && !water) return;
    const now = new Date();
    const e: Entry = {
      id: editingId ?? crypto.randomUUID(),
      date: autoTime ? toYMD(now) : date,
      time: autoTime ? toHM(now) : time,
      protein: protein ? Number(protein) : 0,
      water: water ? Number(water) : 0,
      note: note || null,
    };

    setEntries((prev) =>
      editingId
        ? prev.map((x) => (x.id === editingId ? { ...e } : x))
        : [...prev, e]
    );

    if (supabase && session) {
      if (editingId) {
        await supabase
          .from("entries")
          .update({
            date: e.date,
            time: e.time,
            protein: e.protein,
            water: e.water,
            note: e.note,
          })
          .eq("id", e.id)
          .eq("user_id", session.user.id);
      } else {
        const payload = { ...e, user_id: session.user.id };
        await supabase.from("entries").insert(payload);
      }
    }

    clearForm();
  };

  const removeEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (supabase && session) {
      await supabase
        .from("entries")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);
    }
  };

  const clearForm = () => {
    setProtein("");
    setWater("");
    setNote("");
    setEditingId(null);
    setTime(toHM(nowLocal()));
  };

  const editEntry = (e: Entry) => {
    setEditingId(e.id);
    setDate(e.date);
    setTime(e.time);
    setProtein(String(e.protein || ""));
    setWater(String(e.water || ""));
    setNote(e.note || "");
  };

  const exportCSV = () => {
    const headers = [
      "date",
      "time",
      "grams_of_protein",
      "liters_of_water",
      "note",
    ];
    const rows = entries
      .slice()
      .sort((a, b) =>
        a.date === b.date
          ? a.time.localeCompare(b.time)
          : a.date.localeCompare(b.date)
      )
      .map((e) => [e.date, e.time, e.protein, e.water, e.note ?? ""].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `protein_water_${toYMD(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter(Boolean);

      const makeKey = (e: {
        date: string;
        time: string;
        protein: number;
        water: number;
        note?: string | null;
      }) => [e.date, e.time, e.protein, e.water, e.note ?? ""].join("|");
      const existing = new Set(entries.map(makeKey));

      let currentDate = "";
      let lastTime: string | null = null;
      let autoIdx = 0;
      const loaded: Entry[] = [];

      const hasHeader = lines[0] && /date\s*,\s*time/i.test(lines[0]);
      const startIdx = hasHeader ? 1 : 0;

      const isSummaryWord = (s: string) => /^\s*(total|subtotal)\s*$/i.test(s);

      const pad = (n: number) => String(n).padStart(2, "0");
      const normalizeTime = (s: string) => {
        const str = s.trim();
        const m12 = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)/i);
        if (m12) {
          let h = parseInt(m12[1], 10);
          const min = m12[2];
          const ap = m12[3].toLowerCase();
          if (ap === "pm" && h < 12) h += 12;
          if (ap === "am" && h === 12) h = 0;
          return `${pad(h)}:${min}`;
        }
        const m24 = str.match(/(\d{1,2}):(\d{2})/);
        if (m24) return `${pad(parseInt(m24[1], 10))}:${m24[2]}`;
        return "";
      };

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(",");
        let d = (cols[0] || "").trim();
        const tRaw = (cols[1] || "").trim();
        const pRaw = (cols[2] || "").trim();
        const wRaw = (cols[3] || "").trim();
        const n = (cols[4] || "").trim();

        if ([d, tRaw, pRaw, wRaw, n].some(isSummaryWord)) continue;

        if (d) currentDate = d;
        if (!currentDate) continue;

        let time = normalizeTime(tRaw);
        if (!time) {
          if (lastTime) {
            const [hh, mm] = lastTime.split(":").map((x) => parseInt(x, 10));
            const dt = new Date(2000, 0, 1, hh, mm);
            dt.setMinutes(dt.getMinutes() + 1);
            time = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
          } else {
            time = `00:${pad(autoIdx++)}`;
          }
        }
        lastTime = time;

        const protein = Number(pRaw.replace(/[^0-9.]/g, "")) || 0;
        const water = Number(wRaw.replace(/[^0-9.]/g, "")) || 0;

        if (!(protein || water || n)) continue;

        const candidate: Entry = {
          id: crypto.randomUUID(),
          date: currentDate,
          time,
          protein,
          water,
          note: n || null,
        };

        if (!existing.has(makeKey(candidate))) {
          existing.add(makeKey(candidate));
          loaded.push(candidate);
        }
      }

      setEntries((prev) => [...prev, ...loaded]);

      if (supabase && session && loaded.length) {
        const payload = loaded.map((e) => ({ ...e, user_id: session.user.id }));
        await supabase.from("entries").insert(payload);
      }
    };
    reader.readAsText(file);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Entry[]> = {};
    entries
      .slice()
      .sort((a, b) =>
        a.date === b.date
          ? a.time.localeCompare(b.time)
          : b.date.localeCompare(a.date)
      )
      .forEach((e) => {
        (map[e.date] = map[e.date] || []).push(e);
      });
    return map;
  }, [entries]);

  const dailyTotals = useMemo(() => {
    const totals: { date: string; protein: number; water: number }[] = [];
    Object.entries(grouped).forEach(([d, arr]) => {
      const protein = arr.reduce((s, e) => s + (e.protein || 0), 0);
      const water = arr.reduce((s, e) => s + (e.water || 0), 0);
      totals.push({
        date: d,
        protein: roundTo(protein, 0.1),
        water: roundTo(water, 0.01),
      });
    });
    return totals.sort((a, b) => a.date.localeCompare(b.date));
  }, [grouped]);

  const lastNDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1));
    const start = toYMD(d);
    return dailyTotals.filter((t) => t.date >= start);
  };

  const today = toYMD(nowLocal());
  const todayTotals = dailyTotals.find((d) => d.date === today) || {
    protein: 0,
    water: 0,
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            Protein & Water Tracker
          </h1>
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <User className="h-4 w-4" /> {session.user.email}
                </div>
                <Button variant="outline" onClick={signOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => setShowSignIn(true)}
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            )}
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <label className="inline-flex items-center">
              <input
                ref={fileInputRef}
                id="csvFile"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importCSV(f);
                  e.currentTarget.value = "";
                }}
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </label>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Delete all entries?")) setEntries([]);
              }}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </header>

        {loading && (
          <div className="rounded-xl border bg-white p-3 text-sm text-slate-500">
            Syncing…
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle> Add entry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                <div className="col-span-2 md:col-span-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onFocus={() => setAutoTime(false)}
                    onBlur={() => setAutoTime(true)}
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    onFocus={() => setAutoTime(false)}
                    onBlur={() => setAutoTime(true)}
                  />
                </div>
                <div>
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 35"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Water (L)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 0.5"
                    value={water}
                    onChange={(e) => setWater(e.target.value)}
                  />
                </div>
                <div className="md:col-span-6">
                  <Label>Note (optional)</Label>
                  <Textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Shake, chicken, etc."
                  />
                </div>
                <div className="flex gap-2 md:col-span-6">
                  {exampleQuickAdds.map((qa) => (
                    <Button
                      key={qa.label}
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setProtein((p) => String(Number(p || 0) + qa.protein));
                        setWater((w) => String(Number(w || 0) + qa.water));
                      }}
                    >
                      {qa.label}
                    </Button>
                  ))}
                  <Button onClick={addOrUpdate} className="ml-auto">
                    {editingId ? "Update" : "Add"}
                  </Button>
                  {editingId && (
                    <Button
                      variant="outline"
                      onClick={clearForm}
                      className="gap-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <StatRow
                  icon={<Leaf className="h-5 w-5" />}
                  label="Protein"
                  value={`${todayTotals.protein.toFixed(2) || 0} g`}
                  goal={`${goals.dailyProtein} g`}
                  pct={
                    (100 * (todayTotals.protein || 0)) /
                    Math.max(goals.dailyProtein, 1)
                  }
                />
                <StatRow
                  icon={<Droplets className="h-5 w-5" />}
                  label="Water"
                  value={`${todayTotals.water || 0} L`}
                  goal={`${goals.dailyWater} L`}
                  pct={
                    (100 * (todayTotals.water || 0)) /
                    Math.max(goals.dailyWater, 1)
                  }
                />

                {!editGoalsOpen ? (
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div>
                      {session
                        ? "Synced to cloud"
                        : "Local mode (sign in to sync across devices)"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditGoalsOpen(true)}
                    >
                      Edit goals
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Daily protein (g)</Label>
                        <Input
                          type="number"
                          value={gProtein}
                          onChange={(e) =>
                            setGProtein(Number(e.target.value || 0))
                          }
                        />
                      </div>
                      <div>
                        <Label>Daily water (L)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={gWater}
                          onChange={(e) =>
                            setGWater(Number(e.target.value || 0))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditGoalsOpen(false);
                          setGProtein(goals.dailyProtein);
                          setGWater(goals.dailyWater);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          upsertGoals({
                            dailyProtein: Number(gProtein),
                            dailyWater: Number(gWater),
                          });
                          setEditGoalsOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.keys(grouped).length === 0 && (
                <p className="text-sm text-slate-500">
                  No entries yet. Add your first above.
                </p>
              )}
              {Object.entries(grouped).map(([d, arr]) => (
                <div
                  key={d}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-semibold">{d}</div>
                    <div className="text-sm text-slate-500">
                      Total:{" "}
                      <b>
                        {Number(
                          arr.reduce((s, e) => s + (e.protein || 0), 0)
                        ).toFixed(1)}{" "}
                        g
                      </b>{" "}
                      protein •{" "}
                      <b>
                        {Number(
                          arr.reduce((s, e) => s + (e.water || 0), 0)
                        ).toFixed(2)}{" "}
                        L
                      </b>{" "}
                      water
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-2 pr-4">Time</th>
                          <th className="py-2 pr-4">Protein (g)</th>
                          <th className="py-2 pr-4">Water (L)</th>
                          <th className="py-2 pr-4">Note</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {arr
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((e) => (
                            <tr key={e.id} className="border-t">
                              <td className="py-2 pr-4">{e.time}</td>
                              <td className="py-2 pr-4">
                                {Number(e.protein).toFixed(1)}
                              </td>
                              <td className="py-2 pr-4">
                                {Number(e.water).toFixed(2)}
                              </td>
                              <td className="py-2 pr-4">{e.note || ""}</td>
                              <td className="py-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => editEntry(e)}
                                  className="gap-1"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeEntry(e.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last 14 days — Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lastNDays(14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    allowDecimals={false}
                    tickFormatter={(v) => Number(v).toFixed(0)}
                  />
                  <Tooltip formatter={(value) => Number(value).toFixed(1)} />
                  <Bar dataKey="protein" name="protein (g)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <footer className="pb-8 text-center text-xs text-slate-400">
          {session
            ? "Cloud sync via Supabase • RLS-protected"
            : "Data is saved locally in your browser"}
        </footer>
      </div>

      <Modal
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        title="Sign in"
      >
        <div className="space-y-4">
          <Button className="w-full" onClick={signInWithGoogle}>
            Continue with Google
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Only Google sign‑in is enabled for this app.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  goal,
  pct,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  goal: string;
  pct: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div className="font-medium">{label}</div>
        </div>
        <div className="text-sm text-slate-500">Goal: {goal}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-slate-300"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}
