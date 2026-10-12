import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { Minus, Plus, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../api";
import { COLORS, Inspector, Legend, Status, StationSelect, degColor, degSize } from "../ui";

export default function GraphPage({ tick, selected, setSelected }) {
  const [center, setCenter] = useState(""), [depth, setDepth] = useState(2), [minDeg, setMinDeg] = useState(0), [layout, setLayout] = useState("cose");
  const el = useRef(), cy = useRef();
  const nav = useNavigate();
  const g = useApi("/graph", { center, depth, min_degree: minDeg }, tick);
  const all = useApi("/stations", { page_size: 200 }, tick);

  useEffect(() => {
    if (!g.data) return;
    cy.current?.destroy();
    cy.current = cytoscape({
      container: el.current,
      elements: [...g.data.nodes.map((n) => ({ data: { id: n.code, label: n.code, d: n.degree } })),
        ...g.data.edges.map((e) => ({ data: { source: e.source, target: e.target } }))],
      style: [
        { selector: "node", style: { label: "data(label)", "font-size": 9, "font-family": "JetBrains Mono, monospace", color: "#0F172A", "text-valign": "bottom", "text-margin-y": 3,
          width: (n) => degSize(n.data("d")) * 2, height: (n) => degSize(n.data("d")) * 2, "background-color": (n) => degColor(n.data("d")), "border-width": 1.5, "border-color": "#fff" } },
        { selector: "edge", style: { width: 1.2, "line-color": "#94A3B8", opacity: 0.7 } },
        { selector: "edge.hot", style: { "line-color": COLORS.selected, width: 2.5, "line-style": "dashed", opacity: 1 } },
        { selector: "node.hot", style: { "border-color": COLORS.selected, "border-width": 3 } },
        { selector: "node.sel", style: { "background-color": COLORS.selected } },
        { selector: ".dim", style: { opacity: 0.2 } }],
      layout: { name: layout, animate: false },
    });
    cy.current.on("tap", "node", (e) => setSelected(e.target.id()));
  }, [g.data, layout]);

  useEffect(() => {
    const c = cy.current; if (!c) return;
    c.elements().removeClass("hot dim sel");
    const n = selected && c.getElementById(selected);
    if (n && n.length) { const h = n.closedNeighborhood(); c.elements().not(h).addClass("dim"); h.addClass("hot"); n.addClass("sel"); }
  }, [selected, g.data, layout]);

  const zoom = (f) => { const c = cy.current; c?.zoom({ level: c.zoom() * f, renderedPosition: { x: c.width() / 2, y: c.height() / 2 } }); };
  const reset = () => { setCenter(""); setDepth(2); setMinDeg(0); setLayout("cose"); setSelected(""); };
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="h-10 bg-white border-b border-line flex items-center px-4 shrink-0 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant gap-3">
        <span className="text-primary font-semibold">Topological graph</span>
        <span className="hidden md:inline normal-case font-sans text-[11px]">Layout positions are computed by an algorithm and carry no geographic meaning. Compare with the Railway Map.</span>
        <span className="ml-auto text-tertiary">{g.data ? `${g.data.nodes.length} nodes • ${g.data.edges.length} edges` : ""}</span>
      </div>
      <div className="relative flex-1 min-h-0 bg-[#F8FAFC]">
        <div ref={el} className="absolute inset-0" />
        {(g.loading || g.error) && <div className="absolute inset-0 z-10 bg-white/70 flex items-start justify-center pt-20"><Status loading={g.loading} error={g.error} /></div>}
        <div className="absolute top-4 left-4 z-20 float1 w-[320px] max-w-[calc(100%-2rem)]">
          <div className="px-3 py-2 border-b border-line font-head font-semibold text-sm">Graph controls</div>
          <div className="p-3 space-y-3">
            <div>
              <div className="lbl mb-1">Neighbourhood of</div>
              <div className="[&>select]:w-full">
                <StationSelect stations={all.data?.items || []} value={center} onChange={setCenter} placeholder="Whole network" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="lbl mb-1">Hops</div><select className="inp w-full" value={depth} onChange={(e) => setDepth(+e.target.value)}>{[1, 2, 3, 4].map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><div className="lbl mb-1">Layout</div><select className="inp w-full" value={layout} onChange={(e) => setLayout(e.target.value)}>{["cose", "circle", "concentric", "grid"].map((l) => <option key={l}>{l}</option>)}</select></div>
            </div>
            <div><div className="lbl mb-1">Min node degree: ≥ {minDeg}</div><input type="range" min="0" max="7" value={minDeg} onChange={(e) => setMinDeg(+e.target.value)} className="w-full accent-[#1D4ED8]" /></div>
            <div className="lbl !normal-case !tracking-normal">Select a node, or choose one above, to highlight its direct neighbours.</div>
            <button className="btn-ghost w-full justify-center" onClick={reset}>Reset controls</button>
          </div>
        </div>
        <div className="absolute top-4 z-20 float1 flex flex-col" style={{ right: selected ? 376 : 16 }}>
          <button className="icon-btn" title="Zoom in" onClick={() => zoom(1.3)}><Plus size={16} /></button>
          <button className="icon-btn border-t border-line" title="Zoom out" onClick={() => zoom(0.77)}><Minus size={16} /></button>
          <button className="icon-btn border-t border-line" title="Fit to screen" onClick={() => cy.current?.fit(undefined, 40)}><Maximize2 size={15} /></button>
        </div>
        <div className="absolute bottom-4 left-4 z-20 hidden sm:block"><Legend title="Graph symbology" /></div>
        {selected && (
          <aside className="absolute top-0 right-0 bottom-0 w-[360px] max-w-full z-30 bg-white border-l border-line">
            <Inspector code={selected} tick={tick} onClose={() => setSelected("")} onPick={setSelected}
              actions={<><button className="btn w-full justify-center" onClick={() => setCenter(selected)}>Show only this neighbourhood</button>
                <button className="btn-ghost w-full justify-center" onClick={() => nav("/map")}>Locate on Railway Map</button></>} />
          </aside>)}
      </div>
    </div>
  );
}