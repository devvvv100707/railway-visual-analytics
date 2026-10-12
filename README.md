# Visual Analytics of the Indian Railway Network

Interactive graph + geographic visualization. FastAPI + NetworkX backend, React + Leaflet + Cytoscape.js frontend.

## Run on macOS
```bash
# Terminal 1 - backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/validate_data.py     # check dataset
pytest -q                           # backend tests
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs

# Terminal 2 - frontend
cd frontend
npm install
npm run dev                         # http://localhost:5173
```
Troubleshooting: "Backend offline" in header -> backend not running or port 8000 busy (`lsof -i :8000`). CORS error -> open the app at `localhost:5173` exactly. Blank map -> OSM tiles need internet; lines/markers still draw. Different API URL -> set `VITE_API_URL`.

## UI
Styled after the RailGraph India design reference (navy sidebar, floating map/graph control panels, docked station inspector, JetBrains Mono for station codes). Values shown in the UI are all computed by the backend; the reference mockup's traffic, elevation and FPS figures are intentionally not included because the dataset has no such data.

## Problem statement & objectives
Model railway stations as a graph to study connectivity, hubs and reachability, and compare the abstract graph with the geographic map.

## Graph representation
Vertex = station (code, name, state, lat, lon). Edge = a connection between two stations (undirected, unweighted). Library: `networkx.Graph`.

## Dataset and limitations (read this)
- `backend/data/stations.csv`: 54 real stations with real station codes. Coordinates were entered from general knowledge, approximate to ~0.01 degrees, **not downloaded from a verified source**. Cross-check against OpenStreetMap / Wikipedia / data.gov.in before submission.
- `backend/data/connections.csv`: 78 links joining consecutive major stops along main trunk corridors (column `corridor`, `verified=false`). They are **illustrative**, not verified track connections; many intermediate stations are omitted, so degree values do not reflect real importance.
- To improve: replace the CSVs with a verified source (e.g. OSM railway data via Overpass, or an Indian Railways timetable dataset with its licence) keeping the same columns, then run `validate_data.py`.

## Algorithms
Degree, degree centrality, density, connected components (NetworkX); shortest path via BFS (`nx.shortest_path`); ego-graph for neighbourhood subgraphs.

## Architecture
React pages -> `src/api.js` -> FastAPI (`main.py`) -> `RailGraph` in `graph_service.py` -> CSV files. All statistics are computed by the backend.
Endpoints: `/api/health /overview /analytics /states /stations /stations/{code} /graph /route`.

## Manual frontend checklist
Sidebar opens 6 pages; header search jumps to Explorer; Refresh re-fetches; map filters/toggle/reset/locate work; graph layout, min degree, neighbourhood, zoom, fit, reset work; explorer sorting, paging, filters; route finds path, errors on empty selection.

## Viva questions
1. *Why NetworkX?* Ready-made, tested graph algorithms.
2. *Degree centrality?* Degree/(n-1): share of other stations directly linked.
3. *Density?* Edges / possible edges; low for railways.
4. *Connected component?* Maximal set of mutually reachable stations.
5. *Shortest path algorithm?* BFS, as the graph is unweighted.
6. *Why map and graph?* Map = geography; graph = topology.
7. *Does degree equal importance?* No; it ignores traffic and train frequency.
8. *Is the shortest path a real journey?* No; fewest edges only.
9. *Limitation of data?* Illustrative edges, approximate coordinates.
10. *Future work?* Verified OSM data, weighted edges (distance), betweenness centrality.
