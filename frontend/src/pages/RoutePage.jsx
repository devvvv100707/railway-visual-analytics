import { useState } from "react";
import { MapContainer, Polyline, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api, useApi } from "../api";
import { Card, StationSelect } from "../ui";

export default function RoutePage({ tick, selected }) {
  const [src, setSrc] = useState(selected || ""), [dst, setDst] = useState(""), [res, setRes] = useState(null), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const all = useApi("/stations", { page_size: 200 }, tick);
  const run = async () => {
    setErr(""); setRes(null);
    if (!src || !dst) return setErr("Please choose both a source and a destination.");
    setBusy(true);
    try { setRes(await api("/route", { source: src, destination: dst })); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const pts = res?.path.map((p) => [p.latitude, p.longitude]) || [];
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap gap-3 items-center">
        <StationSelect stations={all.data?.items || []} value={src} onChange={setSrc} placeholder="Source" />
        <StationSelect stations={all.data?.items || []} value={dst} onChange={setDst} placeholder="Destination" />
        <button className="btn" onClick={run} disabled={busy}>{busy ? "Analysing..." : "Find shortest graph path"}</button>
        <button className="btn-ghost" onClick={() => { setSrc(""); setDst(""); setRes(null); setErr(""); }}>Reset</button>
      </Card>
      <p className="text-xs text-[#64748B] border-l-2 border-[#1D4ED8] pl-3">Shortest path = fewest edges (BFS) in this sample graph. It is not the fastest or shortest real railway journey, and does not imply an available train service.</p>
      {err && <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm rounded-lg p-3">{err}</div>}
      {res && !res.found && <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-sm rounded-lg p-3">{res.message}</div>}
      {res?.found && <div className="grid lg:grid-cols-[300px_1fr] gap-4">
        <Card title={`Path found: ${res.edges} edge(s)`}><ol className="text-sm list-decimal pl-5 space-y-1">{res.path.map((p) => <li key={p.code}>{p.name} <span className="code">{p.code}</span></li>)}</ol></Card>
        <div className="h-[420px] rounded-xl overflow-hidden border"><MapContainer bounds={pts} className="h-full w-full">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={pts} pathOptions={{ color: "#0D9488", weight: 4 }} />
          {res.path.map((p) => <CircleMarker key={p.code} center={[p.latitude, p.longitude]} radius={6} pathOptions={{ color: "#1D4ED8" }}><Tooltip permanent className="rg-tip">{p.code}</Tooltip></CircleMarker>)}
        </MapContainer></div></div>}
    </div>);
}
