import { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import Grid from "./components/Grid";
import CellModal from "./components/CellModal";

type HistoryEntry = {
  cellIndex: number;
  char: string;
  by: string;
  timestamp: number;
};

const SERVER = "http://localhost:4000";

export default function App() {
  const [grid, setGrid] = useState<string[]>(() => Array(100).fill(""));
  const [online, setOnline] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [restrictInfo, setRestrictInfo] = useState<
    { allowed: boolean; secondsLeft?: number; mode?: string } | undefined
  >(undefined);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SERVER);
    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("connected", socket.id);
      socket.emit("can_submit", null, (res: any) => {
        if (res) setRestrictInfo(res);
      });
    });

    socket.on("init", (data: any) => {
      setGrid(data.grid);
      setHistory(data.history ?? []);
      setOnline(data.online ?? 1);
    });

    socket.on("grid_update", (update: any) => {
      setGrid((g) => {
        const copy = [...g];
        copy[update.cellIndex] = update.char;
        return copy;
      });
    });

    socket.on("history_update", (entry: HistoryEntry) => {
      setHistory((h) => [...h, entry]);
    });

    socket.on("online_count", (d: any) => {
      setOnline(d.online ?? 0);
    });

    // server can emit can_submit periodically or client can ask
    socket.on("connect_error", (e) => console.error("socket connect_error", e));

    // poll can_submit every second to update UI
    const poll = setInterval(() => {
      socket.emit("can_submit", null, (res: any) => {
        if (res) setRestrictInfo(res);
      });
    }, 1000);

    return () => {
      clearInterval(poll);
      socket.disconnect();
    };
  }, []);

  const handleCellClick = (index: number) => {
    setSelectedCell(index);
  };

  const submitChar = (char: string) => {
    const s = socketRef.current;
    if (!s || selectedCell === null) return;
    s.emit("submit_cell", { cellIndex: selectedCell, char }, (res: any) => {
      if (!res || !res.ok) {
        const reason = res?.reason ?? "unknown";
        alert("Update failed: " + reason);
      } else {
        // success: UI will be updated by grid_update event
      }
    });
  };

  // Add this handler function somewhere above the return() in your App component
  const handleRefreshHistory = async () => {
    try {
      const res = await fetch(`${SERVER}/api/history`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("Error refreshing history:", err);
      alert("Failed to refresh history. Please try again.");
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Shared Unicode Grid</h1>
        <div className="meta">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="count-bubble">Online: {online}</div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid-card">
          <Grid grid={grid} onCellClick={handleCellClick} />
        </div>

        <div className="sidebar">
          <div className="panel">
            <h3 style={{ margin: "0 0 8px 0" }}>Your restriction</h3>
            <div style={{ color: "#9fb0cf", marginBottom: 8 }}>
              {restrictInfo
                ? restrictInfo.allowed
                  ? "You can submit now."
                  : restrictInfo.mode === "single_shot"
                  ? "Single-shot mode: already submitted once."
                  : `You must wait ${restrictInfo.secondsLeft}s before next submit.`
                : "Checking..."}
            </div>
            <button className="button small" onClick={handleRefreshHistory}>
              Refresh History
            </button>
          </div>

          <div className="panel">
            <h4 style={{ margin: "0 0 8px 0" }}>Recent updates</h4>
            <div className="history-list">
              {history
                .slice()
                .reverse()
                .slice(0, 30)
                .map((h, i) => (
                  <div key={i} className="history-item">
                    <div>
                      <strong>Cell {h.cellIndex + 1}</strong> → {h.char}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>
                      {new Date(h.timestamp).toLocaleString()} by{" "}
                      {h.by.slice(0, 6)}
                    </div>
                  </div>
                ))}
              {history.length === 0 && (
                <div style={{ color: "#6b7280" }}>No updates yet</div>
              )}
            </div>
          </div>

          <div className="panel">
            <h4 style={{ margin: "0 0 8px 0" }}>Playback</h4>
            <div style={{ color: "#9fb0cf", marginBottom: 8 }}>
              Use the history to inspect how grid changed.
            </div>
            <button
              className="button small"
              onClick={() => {
                // simple naive playback: apply events one by one on client side
                const copy = Array(100).fill("");
                setGrid(copy);
                history.forEach((h, idx) => {
                  setTimeout(() => {
                    setGrid((g) => {
                      const c = [...g];
                      c[h.cellIndex] = h.char;
                      return c;
                    });
                  }, idx * 300); // 300ms between events
                });
              }}
            >
              Play Last {Math.min(history.length, 30)}
            </button>
          </div>
        </div>
      </div>

      <CellModal
        open={selectedCell !== null}
        cellIndex={selectedCell}
        onClose={() => setSelectedCell(null)}
        onSubmit={submitChar}
        restrictInfo={restrictInfo}
      />
    </div>
  );
}
