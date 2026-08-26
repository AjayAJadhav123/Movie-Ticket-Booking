import React, { useEffect, useMemo } from 'react';
import { Maximize } from 'lucide-react';

export default function SeatLayoutEditor({ rows, seatsPerRow, layout, onChange }) {
  // Use `layout` directly if it matches dimensions. Otherwise, generate a default grid.
  const currentLayout = useMemo(() => {
    if (layout && layout.length === rows && layout[0]?.cols?.length === seatsPerRow) {
      return layout;
    }
    
    // Generate new layout based on dimensions
    const newLayout = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let r = 0; r < rows; r++) {
      const rowLabel = r < 26 ? alphabet[r] : `${alphabet[Math.floor(r/26)-1]}${alphabet[r%26]}`;
      const cols = [];
      for (let c = 1; c <= seatsPerRow; c++) {
        cols.push({
          id: `${rowLabel}${c}`,
          col: c,
          status: 'available'
        });
      }
      newLayout.push({ row: rowLabel, cols });
    }
    return newLayout;
  }, [rows, seatsPerRow, layout]);

  // Sync back to parent if we generated a new layout
  useEffect(() => {
    if (layout !== currentLayout) {
      onChange(currentLayout);
    }
  }, [currentLayout, layout, onChange]);

  const toggleSeat = (rowIndex, colIndex) => {
    const newLayout = currentLayout.map((rowItem, rIdx) => {
      if (rIdx !== rowIndex) return rowItem;
      return {
        ...rowItem,
        cols: rowItem.cols.map((colItem, cIdx) => {
          if (cIdx !== colIndex) return colItem;
          return {
            ...colItem,
            status: colItem.status === 'available' ? 'disabled' : 'available'
          };
        })
      };
    });
    
    onChange(newLayout);
  };

  const getActiveSeatCount = () => {
    let count = 0;
    currentLayout.forEach(row => {
      row.cols.forEach(seat => {
        if (seat.status === 'available') count++;
      });
    });
    return count;
  };

  if (!currentLayout || currentLayout.length === 0) return null;

  return (
    <div className="bg-[#09090b] border border-slate-800/50 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Maximize size={16} className="text-primary" />
          Visual Seat Map Editor
        </h3>
        <div className="text-sm font-medium text-slate-400">
          Active Seats: <span className="text-primary font-bold">{getActiveSeatCount()}</span>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mb-6">
        Click on seats to toggle them on/off. Use this to create gaps for aisles or remove seats that don't exist in reality.
      </p>

      {/* Screen Curve */}
      <div className="mb-8 relative flex justify-center">
        <div className="w-3/4 h-8 border-t-4 border-indigo-300 rounded-t-[100%] shadow-[0_-10px_20px_rgba(99,102,241,0.1)] flex items-end justify-center pb-1">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Screen</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-flex flex-col gap-2 min-w-full items-center">
          {currentLayout.map((rowItem, rIdx) => (
            <div key={rowItem.row} className="flex items-center gap-3">
              <div className="w-6 text-xs font-bold text-slate-400 text-right shrink-0">
                {rowItem.row}
              </div>
              <div className="flex gap-1.5">
                {rowItem.cols.map((seat, cIdx) => (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => toggleSeat(rIdx, cIdx)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg rounded-b-sm text-[9px] sm:text-[10px] font-semibold flex items-center justify-center transition-colors
                      ${seat.status === 'available' 
                        ? 'bg-indigo-100 text-red-400 border border-indigo-200 hover:bg-indigo-200' 
                        : 'bg-slate-700 text-slate-400 border border-slate-700 hover:bg-slate-300 opacity-50'
                      }`}
                    title={seat.id}
                  >
                    {seat.col}
                  </button>
                ))}
              </div>
              <div className="w-6 text-xs font-bold text-slate-400 text-left shrink-0">
                {rowItem.row}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-800/50 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-100 border border-indigo-200"></div>
          <span className="text-slate-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-700 border border-slate-700 opacity-50"></div>
          <span className="text-slate-400">Hidden / Aisle</span>
        </div>
      </div>
    </div>
  );
}
