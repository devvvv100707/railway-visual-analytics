import { Loader2, AlertTriangle, Info, X, Locate } from "lucide-react";
import { useApi } from "./api";

export const COLORS = { selected: "#0D9488", hub: "#1D4ED8", junction: "#D97706", way: "#64748B" };
export const degColor = (d) => (d >= 6 ? COLORS.hub : d >= 4 ? COLORS.junction : COLORS.way);
export const degSize = (d) => 4 + d * 1.5;

export const Card = ({ title, tip, children, className = "" }) => (
  <div className={`bg-white border border-line rounded-lg ${className}`}>
    {title && <div className="px-4 py-2.5 border-b border-line flex items-center gap-1.5 lbl">{title}
      {tip && <span title={tip} className="text-[#94A3B8] cursor-help normal-case"><Info size={13} /></span>}</div>}
    <div className="p-4">{children}</div>
  </div>
);

export const Status = ({ loading, error, children }) =>
  loading ? <div className="flex items-center gap-2 text-[#64748B] p-6"><Loader2 className="animate-spin" size={16} />Loading data...</div>
  : error ? <div className="flex items-center gap-2 text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-[13px]"><AlertTriangle size={16} />{error}</div>
  : children;

export function Legend({ title = "Map symbology" }) {
  const dots = [[COLORS.selected, "Selected node"], [COLORS.hub, "Mega hub (degree 6+)"], [COLORS.junction, "Junction (degree 4-5)"], [COLORS.way, "Waystation (degree < 4)"]];
  return (
    <div className="float1 p-3 w-60">
      <div className="lbl border-b border-line pb-1.5 mb-2">{title}</div>
      <div className="space-y-1 text-xs">
        {dots.map(([c, t]) => <div key={t} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{t}</div>)}
        <div className="flex items-center gap-2"><span className="w-5 h-0 border-t-2 border-[#1D4ED8]" />Connection (illustrative)</div>
        <div className="flex items-center gap-2"><span className="w-5 h-0 border-t-2 border-dashed border-[#0D9488]" />Selected node's links</div>
        <div className="text-[11px] text-[#64748B] pt-1">Larger circle = more connections.</div>
      </div>
    </div>
  );
}

export function StationSelect({ stations, value, onChange, placeholder = "Select station" }) {
  return (
    <select className="inp min-w-[170px]" value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {stations.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
    </select>
  );
}

const Tile = ({ label, value, note }) => (
  <div className="border border-line rounded-lg p-2 text-center bg-white">
    <div className="lbl !text-[10px]">{label}</div>
    <div className="font-head text-xl font-bold text-[#1D4ED8]">{value}</div>
    <div className="text-[10px] text-[#64748B]">{note}</div>
  </div>
);

// Station inspector (right-docked on map/graph, inline on explorer)
export function Inspector({ code, tick, onClose, onLocate, actions, onPick }) {
  const { data: d, loading, error } = useApi(code ? `/stations/${code}` : "/health", {}, tick);
  if (!code) return <p className="text-[13px] text-[#64748B] p-4">Select a station to inspect it.</p>;
  return (
    <Status loading={loading} error={error}>{d?.name && (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-line">
          <div className="flex items-center justify-between">
            <span className="lbl flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0D9488]" />Node inspection</span>
            <span className="flex">{onLocate && <button className="icon-btn" title="Centre on station" onClick={onLocate}><Locate size={15} /></button>}
              {onClose && <button className="icon-btn" title="Close" onClick={onClose}><X size={15} /></button>}</span>
          </div>
          <div className="flex items-start justify-between gap-2 mt-1">
            <h2 className="font-head text-2xl font-semibold text-navy leading-tight">{d.name}</h2>
            <span className="code mt-1">{d.code}</span>
          </div>
          <div className="text-xs text-[#475569] mt-1">{d.state}</div>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-2">
            <Tile label="Degree" value={d.degree} note="direct links" />
            <Tile label="Betweenness" value={`#${d.betweenness_rank}`} note={`score ${d.betweenness}`} />
            <Tile label="Deg. centrality" value={d.degree_centrality} note="degree / (n-1)" />
          </div>
          <div className="text-[11px] text-[#64748B]">Metrics are computed from this sample graph only. They are not passenger traffic or real-world importance.</div>
          <div className="border border-line rounded-lg p-3 text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-[#64748B]">Coordinates</span><span className="font-mono">{d.latitude.toFixed(4)}° N, {d.longitude.toFixed(4)}° E</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">State</span><span>{d.state}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Station code</span><span className="font-mono">{d.code}</span></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><h3 className="font-head font-semibold text-sm">Immediate neighbours</h3><span className="lbl">{d.neighbors.length} links</span></div>
            <div className="space-y-1.5">
              {d.neighbors.map((n) => (
                <button key={n.code} onClick={() => onPick?.(n.code)} className="w-full text-left border border-line rounded-lg px-3 py-2 flex justify-between items-center hover:bg-[#F8FAFC]">
                  <span><span className="text-[13px] font-medium">{n.name} <span className="font-mono text-[11px] text-[#64748B]">({n.code})</span></span>
                    <span className="block text-[11px] text-[#64748B]">{n.corridor}</span></span>
                  <span className="text-right font-mono text-[11px] text-[#475569]">{n.distance_km} km<span className="block text-[10px] text-[#94A3B8]">straight-line</span></span>
                </button>))}
            </div>
          </div>
        </div>
        {actions && <div className="p-3 border-t border-line space-y-2">{actions}</div>}
      </div>)}</Status>
  );
}
