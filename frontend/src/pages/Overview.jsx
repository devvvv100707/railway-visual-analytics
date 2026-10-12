import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApi } from "../api";
import { Card, Status } from "../ui";

const Chart = ({ data, x, y, color }) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data}><CartesianGrid stroke="#E2E8F0" vertical={false} /><XAxis dataKey={x} fontSize={11} /><YAxis allowDecimals={false} fontSize={11} />
      <Tooltip /><Bar dataKey={y} fill={color} radius={[2, 2, 0, 0]} /></BarChart>
  </ResponsiveContainer>);

export default function Overview({ tick }) {
  const { data, loading, error } = useApi("/overview", {}, tick);
  return (
    <Status loading={loading} error={error}>{data && (<div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[["Stations", data.kpis.stations], ["Connections", data.kpis.connections], ["Average degree", data.kpis.average_degree],
          ["Most connected", `${data.kpis.most_connected.code} (${data.kpis.most_connected.degree})`]].map(([l, v]) =>
          <div key={l} className="bg-white border border-line rounded-lg p-4"><div className="lbl">{l}</div><div className="font-head text-2xl font-bold text-[#1D4ED8] mt-1">{v}</div></div>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Connections of top stations" tip="Degree = number of stations directly linked to a station."><Chart data={data.top_stations} x="code" y="degree" color="#1D4ED8" /></Card>
        <Card title="Degree distribution" tip="How many stations have each degree value."><Chart data={data.degree_distribution} x="degree" y="stations" color="#0D9488" /></Card>
        <Card title="Stations by state"><Chart data={data.state_distribution} x="state" y="stations" color="#2563EB" /></Card>
        <Card title="Network insights"><ul className="text-[13px] space-y-2 list-disc pl-5">{data.insights.map((i) => <li key={i}>{i}</li>)}</ul></Card>
      </div>
      <Card title="Top connected stations"><table className="w-full text-[13px]"><thead><tr className="text-left"><th className="py-2 font-normal lbl">#</th><th className="py-2 font-normal lbl">Station</th><th className="py-2 font-normal lbl">Code</th><th className="py-2 font-normal lbl">State</th><th className="py-2 font-normal lbl">Degree</th></tr></thead>
        <tbody>{data.top_stations.map((s, i) => <tr key={s.code} className="border-t border-line"><td className="py-2 font-mono">{i + 1}</td><td>{s.name}</td><td><span className="code">{s.code}</span></td><td>{s.state}</td><td>{s.degree}</td></tr>)}</tbody></table></Card>
    </div>)}</Status>);
}
