import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from graph_service import load_frames, validate

problems = validate(*load_frames())
print("Data OK" if not problems else "\n".join(problems))
sys.exit(1 if problems else 0)
