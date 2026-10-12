import { ArrowRight } from "lucide-react";
import { useApi } from "../api";
import { Card, Status } from "../ui";

const stack = [
  ["Frontend", "React 18 + Vite, Tailwind CSS, React Router"],
  ["Map", "React Leaflet with OpenStreetMap tiles"],
  ["Network graph", "Cytoscape.js"],
  ["Charts", "Recharts"],
  ["Backend", "FastAPI with Pydantic validation, served by Uvicorn"],
  ["Graph analysis", "NetworkX (degree, centrality, components, shortest path)"],
  ["Data handling", "Pandas, loading and validating two CSV files"],
  ["Testing", "pytest and FastAPI TestClient"],
];

const metrics = [
  ["Degree", "The number of stations directly linked to a station in this dataset."],
  ["Degree centrality", "Degree divided by (n - 1). It lets graphs of different sizes be compared. It is not passenger traffic."],
  ["Betweenness centrality", "How often a station lies on shortest paths between other pairs of stations. A high rank means the station acts as a bridge in this graph."],
  ["Density", "Existing edges divided by all possible edges. Railway networks are sparse, so the value is small."],
  ["Connected component", "A group of stations that can all reach each other through the graph. One component means the whole network is connected."],
  ["Shortest path (BFS)", "The route with the fewest edges between two stations, found with breadth-first search on an unweighted graph."],
];

const pages = [
  ["Overview", "KPI cards, degree and state charts, top stations and automatically calculated insights."],
  ["Railway Map", "Stations and connections on a real map. Filter by state and minimum degree, search a station, and inspect it in the side panel."],
  ["Network Graph", "The same network as an abstract graph. Choose a layout, explore a station's neighbourhood, and highlight direct neighbours."],
  ["Station Explorer", "A sortable, filterable, paginated table of every station with a detail panel."],
  ["Route Analysis", "Pick a source and destination to get the shortest graph path, shown as a list and on the map."],
];

const flow = ["CSV files", "Pandas + validation", "NetworkX graph", "FastAPI endpoints", "React pages"];

const limits = [
  "Connections are illustrative. They join consecutive major stops along trunk corridors and are not verified track-level links.",
  "Station names and codes are real. Coordinates were entered by hand and are approximate (about 0.01 degrees).",
  "Many intermediate stations are missing, so degree values do not reflect the real importance of a station.",
  "The shortest path counts edges only. It is not the fastest or shortest real journey and does not imply a train service exists.",
  "Distances in the inspector are straight-line, not rail distance. The app has no timetables, fares, delays or ticket data.",
];

const future = [
  "Replace the sample data with verified OpenStreetMap or timetable data (keeping the same CSV columns).",
  "Add weighted edges using rail distance, and weighted shortest paths.",
  "Add closeness and PageRank centralities, and community detection.",
];

const Stat = ({ label, value }) => (
  <div className="bg-white border border-line rounded-lg p-4">
    <div className="lbl">{label}</div>
    <div className="font-head text-2xl font-bold text-[#1D4ED8] mt-1">{value}</div>
  </div>
);

export default function About() {
  const a = useApi("/analytics");
  const top = a.data?.top_stations?.[0];
  return (
    <div className="space-y-5 max-w-5xl">
      <Card title="Project">
        <h2 className="font-head text-lg font-semibold text-navy mb-2">Visual Analytics of the Indian Railway Network</h2>
        <p className="text-[13px] leading-relaxed text-[#334155]">
          An interactive graph and geographic visualization. Selected Indian railway stations are modelled as graph
          vertices and the connections between them as edges. The project shows how a network can be studied in two ways:
          as <b>geography</b> (real coordinates on a map) and as <b>relationships</b> (an abstract graph where only the
          links matter). It was built as a college project to demonstrate graph concepts with a working analytics dashboard.
        </p>
      </Card>

      <Status loading={a.loading} error={a.error}>
        {a.data && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Stations (nodes)" value={a.data.nodes} />
            <Stat label="Connections (edges)" value={a.data.edges} />
            <Stat label="Average degree" value={a.data.average_degree} />
            <Stat label="Density" value={a.data.density} />
            <Stat label="Components" value={a.data.component_count} />
          </div>
        )}
      </Status>
      {top && (
        <p className="text-[12px] text-[#64748B] -mt-2">
          Live values from the backend. Highest-degree station in this dataset: <span className="code">{top.code}</span> {top.name} with {top.degree} connections.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Problem statement">
          <p className="text-[13px] leading-relaxed text-[#334155]">
            Railway systems are complex networks, and a list of stations does not show how they connect. This project
            asks: which stations act as hubs, how well connected is the network, and how can two stations be linked
            through it? It answers these with graph theory and shows the results visually.
          </p>
        </Card>
        <Card title="Objectives">
          <ul className="text-[13px] space-y-1.5 list-disc pl-5 text-[#334155]">
            <li>Represent stations and connections as a graph with NetworkX.</li>
            <li>Show the network geographically and as a node-link diagram.</li>
            <li>Calculate real graph metrics in the backend, not in the browser.</li>
            <li>Let users search, filter, sort and analyse routes.</li>
            <li>Be clear about the limits of the data.</li>
          </ul>
        </Card>
      </div>

      <Card title="How the graph is built">
        <div className="grid md:grid-cols-3 gap-4 text-[13px] text-[#334155]">
          <div><div className="font-semibold text-navy mb-1">Vertices</div>Each vertex is a station with a code, name, state, latitude and longitude.</div>
          <div><div className="font-semibold text-navy mb-1">Edges</div>Each edge joins two stations. The graph is undirected and unweighted, so a link works both ways and all links count equally.</div>
          <div><div className="font-semibold text-navy mb-1">Visual encoding</div>Circle size shows degree. Colour shows level: blue for degree 6+, amber for 4 to 5, grey below 4, teal for the selected station.</div>
        </div>
      </Card>

      <Card title="Pages in this app">
        <div className="divide-y divide-line">
          {pages.map(([n, d]) => (
            <div key={n} className="py-2.5 flex gap-4 text-[13px]">
              <div className="w-36 shrink-0 font-semibold text-navy">{n}</div>
              <div className="text-[#334155]">{d}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Graph metrics explained">
        <div className="divide-y divide-line">
          {metrics.map(([k, v]) => (
            <div key={k} className="py-2.5 flex gap-4 text-[13px]">
              <div className="w-44 shrink-0 font-semibold text-navy">{k}</div>
              <div className="text-[#334155]">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[#64748B] mt-3">These measure the structure of this sample graph only. They do not measure passenger traffic or real-world importance.</p>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Technology stack">
          <div className="space-y-2">
            {stack.map(([k, v]) => (
              <div key={k} className="flex gap-3 text-[13px]">
                <span className="w-28 shrink-0 font-mono text-[11px] uppercase text-[#64748B] pt-0.5">{k}</span>
                <span className="text-[#334155]">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="System architecture">
          <div className="flex flex-col gap-1.5">
            {flow.map((f, i) => (
              <div key={f}>
                <div className="border border-line rounded-lg px-3 py-2 text-[13px] bg-[#F8FAFC]">{f}</div>
                {i < flow.length - 1 && <div className="flex justify-center py-0.5"><ArrowRight size={14} className="rotate-90 text-[#94A3B8]" /></div>}
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#64748B] mt-3">The frontend only displays what the API returns, so every number comes from the backend.</p>
        </Card>
      </div>

      <Card title="Dataset and data quality">
        <p className="text-[13px] leading-relaxed text-[#334155] mb-3">
          The data lives in two CSV files: <span className="font-mono text-[12px]">stations.csv</span> and <span className="font-mono text-[12px]">connections.csv</span>.
          A validation step runs when the backend starts and checks for duplicate stations, coordinates outside India,
          unknown station codes, self-loops and duplicate edges.
        </p>
        <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-lg px-3 py-2 text-[12px]">
          This is a demonstration dataset. Read the limitations below before drawing conclusions from any result.
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Limitations">
          <ul className="text-[13px] space-y-2 list-disc pl-5 text-[#334155]">{limits.map((l) => <li key={l}>{l}</li>)}</ul>
        </Card>
        <Card title="Future enhancements">
          <ul className="text-[13px] space-y-2 list-disc pl-5 text-[#334155]">{future.map((l) => <li key={l}>{l}</li>)}</ul>
        </Card>
      </div>
    </div>
  );
}