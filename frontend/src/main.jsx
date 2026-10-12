import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

class Boundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err)
      return (
        <pre style={{ padding: 24, color: "#991B1B", whiteSpace: "pre-wrap", fontSize: 12 }}>
          {"Frontend error (send this to your assistant):\n\n" + String(this.state.err.stack || this.state.err)}
        </pre>
      );
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <Boundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Boundary>
);