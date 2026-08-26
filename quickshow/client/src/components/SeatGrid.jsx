import React from 'react';
import { useApp } from '../context/AppContext';

export default function SeatGrid({ show, onSeatsChange, socketLockedSeats = new Set(), socketOccupiedSeats = new Set() }) {
  const { selectedSeats, setSelectedSeats } = useApp();

  const occupiedSeats = show?.occupiedSeats || [];
  const allLockedSeats = new Set([
    ...(show?.lockedSeats?.map(l => l.seatNumber) || []),
    ...Array.from(socketLockedSeats),
  ]);
  const allOccupiedSeats = new Set([
    ...occupiedSeats,
    ...Array.from(socketOccupiedSeats),
  ]);

  const getLayout = () => {
    if (show?.seatLayout && show.seatLayout.length > 0) {
      const rowsMap = {};
      show.seatLayout.forEach(seat => {
        if (!rowsMap[seat.row]) rowsMap[seat.row] = [];
        rowsMap[seat.row].push({
          id: seat.seatNumber,
          col: seat.number,
          status: seat.isAvailable ? 'available' : 'disabled' // disabled means aisle/removed
        });
      });
      
      const layout = [];
      Object.keys(rowsMap).sort().forEach(r => {
        layout.push({
          row: r,
          cols: rowsMap[r].sort((a,b) => a.col - b.col)
        });
      });
      return layout;
    }
    
    // Fallback if no seatLayout exists
    const rows = show?.rows || 10;
    const cols = show?.seatsPerRow || 10;
    const layout = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let r = 0; r < rows; r++) {
      const rowLabel = r < 26 ? alphabet[r] : `${alphabet[Math.floor(r/26)-1]}${alphabet[r%26]}`;
      const colsArr = [];
      for (let c = 1; c <= cols; c++) {
        colsArr.push({
          id: `${rowLabel}${c}`,
          col: c,
          status: 'available'
        });
      }
      layout.push({ row: rowLabel, cols: colsArr });
    }
    return layout;
  };

  const layout = getLayout();

  const toggleSeat = (seatNumber, isSeatDisabled) => {
    if (isSeatDisabled) return; // Cannot select an aisle/hidden seat
    // Prevent selecting occupied or locked seats
    if (allOccupiedSeats.has(seatNumber) || allLockedSeats.has(seatNumber)) return;

    const newSelectedSeats = selectedSeats.includes(seatNumber)
      ? selectedSeats.filter((s) => s !== seatNumber)
      : [...selectedSeats, seatNumber];

    setSelectedSeats(newSelectedSeats);
    if (onSeatsChange) {
      onSeatsChange(newSelectedSeats);
    }
  };

  const getSeatDisplayStatus = (seatNumber, layoutStatus) => {
    if (layoutStatus === 'disabled') return 'hidden';
    if (allOccupiedSeats.has(seatNumber)) return 'occupied';
    if (allLockedSeats.has(seatNumber)) return 'locked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  return (
    <div className="card p-4 md:p-6 w-full overflow-x-auto">
      <div className="mb-6 md:mb-8">
        <h3 className="text-center text-slate-400 mb-3 md:mb-4 font-semibold text-sm md:text-base uppercase tracking-wide">Screen</h3>
        <div className="h-1 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded shadow-[0_10px_20px_rgba(99,102,241,0.2)]"></div>
      </div>

      <div className="flex justify-center mb-6 md:mb-8 w-full">
        <div className="inline-flex flex-col gap-2 min-w-fit items-center">
          {layout.map((rowItem) => (
            <div key={rowItem.row} className="flex items-center gap-2 md:gap-3">
              <div className="w-5 md:w-6 text-xs font-bold text-slate-400 text-right shrink-0">
                {rowItem.row}
              </div>
              
              <div className="flex gap-1 md:gap-1.5">
                {rowItem.cols.map((seat) => {
                  const status = getSeatDisplayStatus(seat.id, seat.status);
                  
                  if (status === 'hidden') {
                    return (
                      <div key={seat.id} className="w-7 h-7 md:w-9 md:h-9 opacity-0 pointer-events-none"></div>
                    );
                  }

                  return (
                    <button
                      key={seat.id}
                      onClick={() => toggleSeat(seat.id, false)}
                      disabled={status === 'occupied' || status === 'locked'}
                      className={`
                        w-7 h-7 md:w-9 md:h-9 rounded-t-lg rounded-b-sm text-[9px] md:text-[11px] font-semibold flex items-center justify-center transition-all
                        ${
                          status === 'occupied'
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                            : status === 'locked'
                            ? 'bg-yellow-400 text-yellow-800 cursor-not-allowed animate-pulse'
                            : status === 'selected'
                            ? 'bg-primary text-white shadow-md shadow-indigo-200 transform -translate-y-0.5'
                            : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 hover:border-green-300'
                        }
                      `}
                      title={`Seat ${seat.id}${status === 'locked' ? ' (Temporarily Locked)' : ''}`}
                    >
                      {seat.col}
                    </button>
                  );
                })}
              </div>

              <div className="w-5 md:w-6 text-xs font-bold text-slate-400 text-left shrink-0">
                {rowItem.row}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 md:gap-6 text-xs md:text-sm flex-wrap px-2 pt-6 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-200 rounded-t-sm"></div>
          <span className="text-slate-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded-t-sm"></div>
          <span className="text-slate-400">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-t-sm animate-pulse"></div>
          <span className="text-slate-400">Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-300 opacity-60 rounded-t-sm"></div>
          <span className="text-slate-400">Occupied</span>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-800">
          <p className="font-semibold mb-2 text-sm md:text-base text-white">Selected Seats:</p>
          <div className="flex gap-2 flex-wrap">
            {selectedSeats.map((seat) => (
              <span
                key={seat}
                className="bg-primary/10 text-red-400 px-3 py-1.5 rounded-lg font-semibold text-sm border border-indigo-200 shadow-sm"
              >
                {seat}
              </span>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Subtotal:</span>
              <span className="text-xl md:text-2xl font-bold text-white">
                ₹{(show?.price * selectedSeats.length).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
