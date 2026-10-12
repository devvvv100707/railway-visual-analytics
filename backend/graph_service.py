"""Data loading, validation and graph analytics (NetworkX)."""
from pathlib import Path
import math
import networkx as nx
import pandas as pd

DATA = Path(__file__).parent / "data"


def load_frames():
    return pd.read_csv(DATA / "stations.csv"), pd.read_csv(DATA / "connections.csv")


def validate(stations, conns):
    """Return a list of problems (empty list = data is clean)."""
    p = []
    for c in stations[stations.code.duplicated()].code:
        p.append(f"duplicate station code: {c}")
    bad = stations[~stations.latitude.between(6, 37) | ~stations.longitude.between(68, 98)]
    p += [f"coordinates outside India: {c}" for c in bad.code]
    codes = set(stations.code)
    for _, r in conns.iterrows():
        for c in (r.source, r.destination):
            if c not in codes:
                p.append(f"unknown station code in connection: {c}")
        if r.source == r.destination:
            p.append(f"self loop: {r.source}")
    keys = conns.apply(lambda r: tuple(sorted((r.source, r.destination))), axis=1)
    p += [f"duplicate edge: {k}" for k in keys[keys.duplicated()]]
    return p


class RailGraph:
    def __init__(self, stations, conns):
        problems = validate(stations, conns)
        if problems:
            raise ValueError("; ".join(problems))
        self.G = nx.Graph()
        for r in stations.itertuples():
            self.G.add_node(r.code, code=r.code, name=r.name, state=r.state,
                            latitude=float(r.latitude), longitude=float(r.longitude))
        for r in conns.itertuples():
            self.G.add_edge(r.source, r.destination, corridor=getattr(r, "corridor", ""),
                            verified=bool(getattr(r, "verified", False)))
        self.dc = nx.degree_centrality(self.G)
        self.bc = nx.betweenness_centrality(self.G)  # fine for ~50 nodes
        self.bc_rank = {n: i + 1 for i, n in enumerate(sorted(self.G, key=lambda n: -self.bc[n]))}

    def node(self, code):
        d = dict(self.G.nodes[code])
        d["degree"] = self.G.degree(code)
        return d

    def has(self, code):
        return code in self.G

    def stations(self, q="", state="", min_degree=0, sort="name", order="asc", page=1, page_size=15):
        rows = [self.node(c) for c in self.G]
        q = q.lower().strip()
        rows = [r for r in rows if (not q or q in r["name"].lower() or q in r["code"].lower())
                and (not state or r["state"] == state) and r["degree"] >= min_degree]
        rows.sort(key=lambda r: r[sort], reverse=(order == "desc"))
        total = len(rows)
        s = (page - 1) * page_size
        return {"total": total, "page": page, "page_size": page_size, "items": rows[s:s + page_size]}

    def km(self, a, b):
        """Straight-line (haversine) distance in km, not rail distance."""
        A, B = self.G.nodes[a], self.G.nodes[b]
        p1, p2 = math.radians(A["latitude"]), math.radians(B["latitude"])
        dl = math.radians(B["longitude"] - A["longitude"])
        h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        return round(12742 * math.asin(math.sqrt(h)))

    def detail(self, code):
        d = self.node(code)
        d["degree_centrality"] = round(self.dc[code], 4)
        d["betweenness"] = round(self.bc[code], 4)
        d["betweenness_rank"] = self.bc_rank[code]
        d["neighbors"] = [{**self.node(n), "corridor": self.G[code][n]["corridor"],
                           "distance_km": self.km(code, n)} for n in sorted(self.G[code])]
        return d

    def graph(self, center=None, depth=1, min_degree=0):
        nodes = set(self.G)
        if center:
            nodes = set(nx.ego_graph(self.G, center, radius=depth))
        nodes = {n for n in nodes if self.G.degree(n) >= min_degree or n == center}
        sub = self.G.subgraph(nodes)
        return {"nodes": [self.node(n) for n in sub],
                "edges": [{"source": a, "target": b, "corridor": d["corridor"], "verified": d["verified"]}
                          for a, b, d in sub.edges(data=True)]}

    def analytics(self):
        G = self.G
        dc = nx.degree_centrality(G)
        comps = sorted(nx.connected_components(G), key=len, reverse=True)
        dist = {}
        for _, d in G.degree():
            dist[d] = dist.get(d, 0) + 1
        top = sorted(G, key=lambda n: (-G.degree(n), n))
        return {
            "nodes": G.number_of_nodes(), "edges": G.number_of_edges(),
            "average_degree": round(2 * G.number_of_edges() / max(G.number_of_nodes(), 1), 2),
            "density": round(nx.density(G), 4),
            "components": [{"size": len(c), "stations": sorted(c)[:5]} for c in comps],
            "component_count": len(comps),
            "degree_distribution": [{"degree": k, "stations": v} for k, v in sorted(dist.items())],
            "top_stations": [{**self.node(n), "degree_centrality": round(dc[n], 4)} for n in top[:10]],
        }

    def overview(self):
        a = self.analytics()
        states = {}
        for _, d in self.G.nodes(data=True):
            states[d["state"]] = states.get(d["state"], 0) + 1
        top = a["top_stations"][0]
        return {
            "kpis": {"stations": a["nodes"], "connections": a["edges"],
                     "average_degree": a["average_degree"], "most_connected": top},
            "top_stations": a["top_stations"],
            "state_distribution": sorted([{"state": k, "stations": v} for k, v in states.items()],
                                         key=lambda x: -x["stations"]),
            "degree_distribution": a["degree_distribution"],
            "insights": [
                f"{top['name']} ({top['code']}) has the highest degree: {top['degree']} connections.",
                f"Network density is {a['density']} (0 = no edges, 1 = every pair connected).",
                f"The graph has {a['component_count']} connected component(s); the largest holds {a['components'][0]['size']} stations.",
                "Degree counts links in this dataset only; it does not measure passenger traffic.",
            ],
        }

    def route(self, src, dst):
        try:
            path = nx.shortest_path(self.G, src, dst)  # BFS (unweighted)
        except nx.NetworkXNoPath:
            return {"found": False, "path": [], "edges": 0,
                    "message": "No path: these stations are in different connected components."}
        return {"found": True, "path": [self.node(n) for n in path], "edges": len(path) - 1,
                "message": "Shortest path by number of graph edges (BFS). Not a real train journey."}
