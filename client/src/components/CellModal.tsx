import { useState } from "react";


type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (char: string) => void;
  cellIndex: number | null;
  restrictInfo?: { allowed: boolean; secondsLeft?: number; mode?: string };
};

export default function CellModal({ open, onClose, onSubmit, cellIndex, restrictInfo }: Props) {
  const [value, setValue] = useState("");
  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)"
    }}>
      <div style={{ background: "#071028", padding: 16, borderRadius: 12, minWidth: 320 }}>
        <h3 style={{ marginTop: 0 }}>Edit cell {cellIndex}</h3>
        <div style={{ marginBottom: 8, color: "#9fb0cf" }}>
          Enter a single Unicode character (emoji, symbol, letter).
        </div>
        <input autoFocus value={value} onChange={(e)=> setValue(e.target.value)} placeholder="e.g. 😊 or A"
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "#071830", color: "white" }} />
        {restrictInfo && !restrictInfo.allowed && (
          <div style={{ color: "#ffb4b4", marginTop: 8 }}>
            You cannot submit now. {restrictInfo.mode === "single_shot" ? "Already submitted once." : `Wait ${restrictInfo.secondsLeft}s`}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <button className="button small" onClick={()=>{
            setValue("");
            onClose();
          }}>Cancel</button>
          <button className="button small" onClick={()=>{
            if (value.length === 0) return;
             onSubmit(value);
            // onSubmit(Array.from(value)[0]); // take the first full Unicode character
            setValue("");
            onClose();
          }} disabled={!value || (restrictInfo && !restrictInfo.allowed)}>Submit</button>
        </div>
      </div>
    </div>
  );
}
