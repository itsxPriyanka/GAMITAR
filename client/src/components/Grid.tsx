import React from "react";

type Props = {
  grid: string[];
  onCellClick: (index: number) => void;
  disabledCells?: boolean;
};

export default function Grid({ grid, onCellClick }: Props) {
  return (
    <div className="grid">
      {grid.map((c, idx) => {
        const empty = !c;
        return (
          <div
            key={idx}
            className={`cell ${empty ? "empty" : ""}`}
            onClick={() => onCellClick(idx)}
            title={empty ? `Cell ${idx + 1} (Empty)` : `Cell ${idx + 1}: ${c}`}
          >
            {empty ? "+" : c}
          </div>
        );
      })}
    </div>
  );
}
