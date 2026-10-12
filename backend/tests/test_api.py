import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pandas as pd
from fastapi.testclient import TestClient
from graph_service import RailGraph, load_frames, validate
from main import app


def test_health_stations_search_analytics_route():
    with TestClient(app) as c:
        assert c.get("/api/health").json()["status"] == "ok"
        assert c.get("/api/stations?page_size=5").json()["total"] >= 50
        r = c.get("/api/stations?q=delhi").json()
        assert any(s["code"] == "NDLS" for s in r["items"])
        assert 0 < c.get("/api/analytics").json()["density"] < 1
        rt = c.get("/api/route?source=NDLS&destination=MAS").json()
        assert rt["found"] and rt["path"][0]["code"] == "NDLS" and rt["edges"] == len(rt["path"]) - 1
        assert c.get("/api/route?source=XXX&destination=MAS").status_code == 404


def test_disconnected_and_validation():
    s = pd.DataFrame([["A", "a", "S", 20, 77], ["B", "b", "S", 21, 78]],
                     columns=["code", "name", "state", "latitude", "longitude"])
    e = pd.DataFrame(columns=["source", "destination", "corridor", "verified"])
    assert RailGraph(s, e).route("A", "B")["found"] is False
    assert validate(*load_frames()) == []
    bad = pd.DataFrame([["A", "Z", "x", False]], columns=e.columns)
    assert any("unknown" in p for p in validate(s, bad))
