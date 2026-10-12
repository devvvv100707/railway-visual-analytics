import { useEffect, useRef, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MapPin, Network, Table2, Route as RouteIcon, BookOpen, TrainFront, RefreshCw, Search, Download, Maximize } from "lucide-react";
import { api, useApi } from "./api";
import Overview from "./pages/Overview";
import MapPage from "./pages/MapPage";
import GraphPage from "./pages/GraphPage";
import Explorer from "./pages/Explorer";
import RoutePage from "./pages/RoutePage";
import About from "./pages/About";

const nav = [["/", "Overview", LayoutDashboard], ["/map", "Railway Map", MapPin], ["/graph", "Network Graph", Network],
  ["/explorer", "Station Explorer", Table2], ["/route", "Route Analysis", RouteIcon], ["/about", "About Project", BookOpen]];
const titles = {
  "/": ["Network Overview", "Key statistics calculated by the backend from the loaded dataset."],
  "/explorer": ["Station Explorer", "Search, sort and filter every station in the dataset."],
  "/route": ["Route Analysis", "Shortest path between two stations, measured in graph edges."],
  "/about": ["About Project", "Problem statement, method and dataset limitations."],
};

export default function App() {
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState("");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [synced, setSynced] = useState(new Date());
  const inputRef = useRef();
  const nav2 = useNavigate();
  const loc = useLocation().pathname;
  const health = useApi("/health", {}, tick);
  useEffect(() => { if (health.data) setSynced(new Date()); }, [health.data]);
  useEffect(() => {
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);
  const search = async (v) => { setQ(v); setHits(v.length > 1 ? (await api("/stations", { q: v, page_size: 6 }).catch(() => ({ items: [] }))).items : []); };
  const pick = (c) => { setSelected(c); setQ(""); setHits([]); if (loc !== "/map" && loc !== "/graph") nav2("/explorer"); };
  const exportJson = async () => {
    const data = await api("/graph");
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    Object.assign(document.createElement("a"), { href: url, download: "railway-graph.json" }).click(); URL.revokeObjectURL(url);
  };
  const props = { tick, selected, setSelected };
  const h = health.data;
  const full = loc === "/map" || loc === "/graph";
  const t = titles[loc];
  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-64 bg-inverse-surface text-inverse-on-surface z-50 hidden md:flex flex-col justify-between">
        <div>
          <div className="p-4 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center"><TrainFront size={18} className="text-tertiary-fixed" /></div>
            <div><div className="font-head font-bold text-[15px] tracking-tight text-surface">RAILGRAPH</div><div className="font-mono text-[10px] tracking-wider text-surface-dim">INDIA NETWORK ANALYTICS</div></div>
          </div>
          <div className="px-4 mb-3"><div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10 text-tertiary-fixed font-mono text-[10px]">
            <span className={`w-2 h-2 rounded-full ${h ? "bg-tertiary-fixed animate-pulse" : "bg-red-400"}`} /><span className="truncate">{h ? `DEMO DATASET • ${h.stations} STATIONS` : "BACKEND OFFLINE"}</span></div></div>
          <nav className="flex flex-col gap-1 px-2">
            {nav.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${isActive ? "bg-primary-container text-white font-bold" : "text-surface-dim hover:bg-white/10 hover:text-surface"}`}>
                <Icon size={17} />{label}</NavLink>))}
          </nav>
        </div>
        <div className="p-4 bg-white/5 font-mono text-[10px] space-y-1">
          <div className="flex justify-between text-surface-dim"><span>ENGINE CORE</span><span className="text-tertiary-fixed">FASTAPI + NETWORKX</span></div>
          <div className="text-outline-variant">Cytoscape.js + Leaflet + Recharts</div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white/90 backdrop-blur-xl z-40 border-b border-line flex items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input ref={inputRef} className="w-full h-8 pl-9 pr-12 bg-surface-container-low rounded-lg text-xs outline-none focus:bg-surface-container" placeholder="Search station by name or code e.g. NDLS, HWH, CSMT..." value={q} onChange={(e) => search(e.target.value)} />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 bg-surface-container-highest rounded text-[10px] font-mono text-on-surface-variant">⌘K</kbd>
              {hits.length > 0 && <div className="absolute z-[2000] bg-white border border-[#CBD5E1] rounded-lg w-full mt-1 float1">
                {hits.map((s) => <button key={s.code} onClick={() => pick(s.code)} className="flex justify-between w-full text-left px-3 py-2 text-[13px] hover:bg-[#F1F5F9]">{s.name}<span className="code">{s.code}</span></button>)}</div>}
            </div>
            <div className="hidden xl:flex items-center gap-2 px-2 py-1 bg-surface-container rounded-lg font-mono text-[10px] text-on-surface-variant">
              <span className={`w-2 h-2 rounded-full ${h ? "bg-primary-container animate-pulse" : "bg-red-500"}`} />
              {h ? `Graph loaded • ${h.stations} nodes • ${h.connections} edges • demo data` : health.error ? "Backend offline" : "Connecting..."}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="h-8 px-2 flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container rounded-lg" title="Reload all data from the API" onClick={() => setTick((x) => x + 1)}>
              <RefreshCw size={14} /><span className="hidden lg:flex flex-col text-left leading-none"><span className="text-[11px] font-semibold">Refresh</span><span className="font-mono text-[10px] text-on-surface-variant">{synced.toLocaleTimeString("en-IN", { hour12: false })}</span></span></button>
            <button className="h-8 px-2 flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container rounded-lg" title="Download graph as JSON" onClick={exportJson}><Download size={14} /><span className="text-[11px] font-semibold hidden md:inline">Export JSON</span></button>
            <button className="w-8 h-8 flex items-center justify-center bg-surface-container-low hover:bg-surface-container rounded-lg" title="Toggle fullscreen" onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}><Maximize size={14} /></button>
          </div>
        </header>

        <main className="pt-16 pb-14 md:pb-0">
          {full ? (
            <Routes>
              <Route path="/map" element={<MapPage {...props} />} />
              <Route path="/graph" element={<GraphPage {...props} />} />
            </Routes>
          ) : (
            <div className="p-6 max-w-[1400px]">
              {t && <div className="mb-5"><h1 className="font-head text-2xl font-semibold tracking-tight text-navy">{t[0]}</h1><p className="text-[13px] text-[#64748B]">{t[1]}</p></div>}
              <Routes>
                <Route path="/" element={<Overview {...props} />} />
                <Route path="/explorer" element={<Explorer {...props} />} />
                <Route path="/route" element={<RoutePage {...props} />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </div>)}
        </main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-14 bg-inverse-surface z-50 flex justify-around items-center">
        {nav.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === "/"} title={label} className={({ isActive }) => `p-2 rounded-lg ${isActive ? "bg-primary-container text-white" : "text-surface-dim"}`}><Icon size={20} /></NavLink>)}
      </nav>
    </div>
  );
}
