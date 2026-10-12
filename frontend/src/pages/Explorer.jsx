import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useApi } from "../api";
import { Card, Inspector, Status } from "../ui";

export default function Explorer({ tick, selected, setSelected }) {
  const [q, setQ] = useState(""), [state, setState] = useState(""), [sort, setSort] = useState("name"), [order, setOrder] = useState("asc"), [page, setPage] = useState(1);
  const nav = useNavigate();
  useEffect(() => setPage(1), [q, state, sort, order]);
  const list = useApi("/stations", { q, state, sort, order, page, page_size: 12 }, tick);
  const states = useApi("/states", {}, tick);
  const head = (key, label) => (
    <th className="cursor-pointer select-none text-left py-2 lbl" onClick={() => { key === sort ? setOrder(order === "asc" ? "desc" : "asc") : (setSort(key), setOrder("asc")); }}>
      {label}{sort === key && (order === "asc" ? <ArrowUp size={11} className="inline ml-1" /> : <ArrowDown size={11} className="inline ml-1" />)}</th>);
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / 12)) : 1;
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
      <Card title="Station table">
        <div className="flex gap-2 mb-3 flex-wrap">
          <input className="inp" placeholder="Search name or code" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="inp" value={state} onChange={(e) => setState(e.target.value)}><option value="">All states</option>{(states.data || []).map((s) => <option key={s}>{s}</option>)}</select>
          <button className="btn-ghost" onClick={() => { setQ(""); setState(""); setSort("name"); setOrder("asc"); }}>Reset</button>
        </div>
        <Status loading={list.loading} error={list.error}>{list.data && (list.data.items.length === 0 ? <p className="text-[13px] text-[#64748B]">No stations match these filters.</p> : <>
          <table className="w-full text-[13px]"><thead><tr className="border-b border-line">{head("name", "Name")}{head("code", "Code")}<th className="text-left lbl">State</th>{head("degree", "Degree")}</tr></thead>
            <tbody>{list.data.items.map((s) => <tr key={s.code} onClick={() => setSelected(s.code)} className={`border-b border-line cursor-pointer hover:bg-[#F8FAFC] ${s.code === selected ? "bg-[#EFF6FF]" : ""}`}>
              <td className="py-2">{s.name}</td><td><span className="code">{s.code}</span></td><td>{s.state}</td><td className="font-mono">{s.degree}</td></tr>)}</tbody></table>
          <div className="flex items-center gap-3 mt-3 text-[13px]">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
            <span className="font-mono text-[11px] text-[#64748B]">PAGE {page}/{pages} • {list.data.total} STATIONS</span>
            <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div></>)}</Status>
      </Card>
      <div className="bg-white border border-line rounded-lg overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]">
        <Inspector code={selected} tick={tick} onPick={setSelected} onClose={selected ? () => setSelected("") : undefined}
          actions={selected && <div className="flex gap-2"><button className="btn flex-1 justify-center" onClick={() => nav("/map")}>Show on map</button><button className="btn-ghost flex-1 justify-center" onClick={() => nav("/graph")}>Show in graph</button></div>} />
      </div>
    </div>);
}
