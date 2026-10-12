import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { Minus, Plus, Maximize2, Locate, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { useApi } from "../api";
import { COLORS, Inspector, Legend, Status, StationSelect, degColor, degSize } from "../ui";

const INDIA = [22.5, 79];
const BASES = {
  osm: ["OpenStreetMap", "https://tile.openstreetmap.org/{z}/{x}/{y}.png", "&copy; OpenStreetMap contributors"],
  topo: ["OpenTopoMap", "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", "&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)"],
};
const Grab = ({ onMap }) => {
  const m = useMap();
  useEffect(() => { onMap(m); }, [m]);
  return null;
};

export default function MapPage({ tick, selected, setSelected }) {
  const [minDeg, setMinDeg] = useState(0), [state, setState] = useState(""), [lines, setLines] = useState(true), [labels, setLabels] = useState(false);
  const [base, setBase] = useState("osm"), [tileErr, setTileErr] = useState(false), [panel, setPanel] = useState(true);
  const mapRef = useRef();
  const nav = useNavigate();
  const g = useApi("/graph", { min_degree: minDeg }, tick);
  const all = useApi("/stations", { page_size: 200 }, tick);
  const states = useApi("/states", {}, tick);
  const nodes = useMemo(() => (g.data?.nodes || []).filter((n) => !state || n.state === state), [g.data, state]);
  const codes = new Set(nodes.map((n) => n.code));
  const edges = (g.data?.edges || []).filter((e) => codes.has(e.source) && codes.has(e.target));
  const by = Object.fromEntries(nodes.map((n) => [n.code, n]));
  const nb = new Set(selected ? edges.filter((e) => e.source === selected || e.target === selected).flatMap((e) => [e.source, e.target]) : []);
  const pos = by[selected] ? [by[selected].latitude, by[selected].longitude] : null;
  const lat = nodes.map((n) => n.latitude), lon = nodes.map((n) => n.longitude);
  const bounds = nodes.length ? `${Math.min(...lon).toFixed(1)}°E - ${Math.max(...lon).toFixed(1)}°E, ${Math.min(...lat).toFixed(1)}°N - ${Math.max(...lat).toFixed(1)}°N` : "n/a";
  useEffect(() => { if (pos && mapRef.current) mapRef.current.flyTo(pos, 7); }, [selected]);
  const resetAll = () => { setSelected(""); setState(""); setMinDeg(0); setLines(true); setLabels(false); mapRef.current?.setView(INDIA, 5); };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="h-10 bg-white border-b border-line flex items-center justify-between px-4 shrink-0 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-primary font-semibold">Spatial projection:</span><span className="text-on-surface hidden sm:inline">EPSG:3857 (WGS 84 / Web Mercator)</span>
          <span className="hidden md:inline">/ Bounds:</span><span className="font-semibold text-on-surface hidden md:inline">{bounds}</span>
          <span className="hidden lg:flex items-center gap-1 text-tertiary">/ Showing {nodes.length} stations, {edges.length} links (illustrative)</span>
        </div>
        <div className="flex items-center bg-[#F1F5F9] rounded-lg p-0.5 shrink-0">
          {Object.entries(BASES).map(([k, [label]]) => (
            <button key={k} onClick={() => { setBase(k); setTileErr(false); }} className={`px-2 py-0.5 rounded-lg font-sans text-[11px] normal-case ${base === k ? "bg-white border border-line text-primary font-semibold" : ""}`}>{label}</button>))}
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <Status loading={g.loading && !g.data} error={g.error}>
          <MapContainer center={INDIA} zoom={5} zoomControl={false} className="h-full w-full !bg-[#F8FAFC]">
            <TileLayer key={base} attribution={BASES[base][2]} url={BASES[base][1]} eventHandlers={{ tileerror: () => setTileErr(true) }} />
            <Grab onMap={(m) => (mapRef.current = m)} />
            {lines && edges.map((e, i) => { const hot = e.source === selected || e.target === selected;
              return <Polyline key={i} positions={[[by[e.source].latitude, by[e.source].longitude], [by[e.target].latitude, by[e.target].longitude]]}
                pathOptions={{ color: hot ? COLORS.selected : "#1D4ED8", weight: hot ? 3 : 1.5, opacity: hot ? 1 : 0.45, dashArray: hot ? "6 4" : null }} />; })}
            {selected && by[selected] && <CircleMarker center={pos} radius={degSize(by[selected].degree) + 9} pathOptions={{ stroke: false, fillColor: COLORS.selected, fillOpacity: 0.18 }} />}
            {nodes.map((n) => {
              const sel = n.code === selected, near = nb.has(n.code);
              return (
                <CircleMarker key={n.code} center={[n.latitude, n.longitude]} radius={degSize(n.degree)}
                  pathOptions={{ color: sel || near ? COLORS.selected : "#fff", weight: sel ? 3 : near ? 2.5 : 1.5, fillOpacity: 1, fillColor: sel ? COLORS.selected : degColor(n.degree) }}
                  eventHandlers={{ click: () => setSelected(n.code) }}>
                  {labels ? <Tooltip permanent direction="right" className="rg-label">{n.code}</Tooltip>
                    : <Tooltip className="rg-tip" direction="top">{n.name} ({n.code}) • deg {n.degree}</Tooltip>}
                </CircleMarker>);
            })}
          </MapContainer>
        </Status>

        {tileErr && <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs rounded-lg px-3 py-2">Map tiles could not load (offline?). Stations and connections are still drawn.</div>}

        <div className="absolute top-4 left-4 z-[1000] float1 w-[320px] max-w-[calc(100%-2rem)]">
          <button className="w-full px-3 py-2 flex items-center justify-between border-b border-line" onClick={() => setPanel(!panel)}>
            <span className="font-head font-semibold text-sm flex items-center gap-2"><Layers size={15} className="text-primary" />Map controls</span>
            <span className="code">{nodes.length} nodes</span></button>
          {panel && <div className="p-3 space-y-3">
            <div>
              <div className="lbl mb-1">Locate station</div>
              <div className="[&>select]:w-full">
                <StationSelect stations={all.data?.items || []} value={selected} onChange={setSelected} placeholder="Search / select..." />
              </div>
            </div>
            <div><div className="lbl mb-1">State / region</div>
              <select className="inp w-full" value={state} onChange={(e) => setState(e.target.value)}><option value="">All states</option>{(states.data || []).map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><div className="flex justify-between lbl mb-1"><span>Min node degree: ≥ {minDeg}</span></div>
              <input type="range" min="0" max="7" value={minDeg} onChange={(e) => setMinDeg(+e.target.value)} className="w-full accent-[#1D4ED8]" /></div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={lines} onChange={(e) => setLines(e.target.checked)} />Connections</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} />Station labels</label></div>
            <button className="btn-ghost w-full justify-center" onClick={resetAll}>Reset filters and view</button>
          </div>}
        </div>

        <div className="absolute top-4 z-[1000] float1 flex flex-col right-4 transition-all" style={{ right: selected ? 376 : 16 }}>
          <button className="icon-btn" title="Zoom in" onClick={() => mapRef.current?.zoomIn()}><Plus size={16} /></button>
          <button className="icon-btn border-t border-line" title="Zoom out" onClick={() => mapRef.current?.zoomOut()}><Minus size={16} /></button>
          <button className="icon-btn border-t border-line" title="Reset to India view" onClick={() => mapRef.current?.setView(INDIA, 5)}><Maximize2 size={15} /></button>
          <button className="icon-btn border-t border-line disabled:opacity-40" disabled={!pos} title="Centre on selected station" onClick={() => mapRef.current?.flyTo(pos, 7)}><Locate size={15} /></button>
        </div>

        <div className="absolute bottom-4 left-4 z-[1000] hidden sm:block"><Legend /></div>

        {selected && (
          <aside className="absolute top-0 right-0 bottom-0 w-[360px] max-w-full z-[1100] bg-white border-l border-line shadow-[0_10px_15px_-3px_rgba(15,23,42,.08)]">
            <Inspector code={selected} tick={tick} onClose={() => setSelected("")} onLocate={() => pos && mapRef.current?.flyTo(pos, 7)} onPick={setSelected}
              actions={<><button className="btn w-full justify-center" onClick={() => nav("/graph")}>Explore in Network Graph</button>
                <button className="btn-ghost w-full justify-center" onClick={() => nav("/route")}>Analyze routes from {selected}</button></>} />
          </aside>)}
      </div>
    </div>
  );
}