from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from graph_service import RailGraph, load_frames

state = {}


@asynccontextmanager
async def lifespan(app):
    state["g"] = RailGraph(*load_frames())  # validates on startup
    yield


app = FastAPI(title="Indian Railway Network Analytics", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])


def g():
    return state["g"]


def check(code):
    code = code.upper()
    if not g().has(code):
        raise HTTPException(404, f"Unknown station code: {code}")
    return code


@app.get("/api/health")
def health():
    return {"status": "ok", "stations": g().G.number_of_nodes(), "connections": g().G.number_of_edges(),
            "dataset": "Demonstration dataset: connections are illustrative, not verified"}


@app.get("/api/overview")
def overview():
    return g().overview()


@app.get("/api/analytics")
def analytics():
    return g().analytics()


@app.get("/api/states")
def states():
    return sorted({d["state"] for _, d in g().G.nodes(data=True)})


@app.get("/api/stations")
def stations(q: str = "", state: str = "", min_degree: int = Query(0, ge=0),
             sort: str = Query("name", pattern="^(name|code|degree)$"),
             order: str = Query("asc", pattern="^(asc|desc)$"),
             page: int = Query(1, ge=1), page_size: int = Query(15, ge=1, le=200)):
    return g().stations(q, state, min_degree, sort, order, page, page_size)


@app.get("/api/stations/{code}")
def station(code: str):
    return g().detail(check(code))


@app.get("/api/graph")
def graph(center: str = "", depth: int = Query(1, ge=1, le=5), min_degree: int = Query(0, ge=0)):
    return g().graph(check(center) if center else None, depth, min_degree)


@app.get("/api/route")
def route(source: str, destination: str):
    return g().route(check(source), check(destination))
