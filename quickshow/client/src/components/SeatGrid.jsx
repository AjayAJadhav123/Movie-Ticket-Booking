import React from 'react';
import { useApp } from '../context/AppContext';

export default function SeatGrid({ show, onSeatsChange }) {
  const { selectedSeats, setSelectedSeats } = useApp();

  const generateSeats = (total = 100) => {
    const seats = [];
    for (let i = 1; i <= total; i++) {
      seats.push(i.toString());
    }
    return seats;
  };

  const allSeats = generateSeats(show?.totalSeats || 100);
  const occupiedSeats = show?.occupiedSeats || [];
  
  // Responsive seats per row: 6 on mobile, 8 on tablet, 10 on desktop
  const getSeatsPerRow = () => {
    if (typeof window === 'undefined') return 10;
    if (window.innerWidth < 640) return 6; // sm
    if (window.innerWidth < 1024) return 8; // md to lg
    return 10; // lg+
  };

  const [seatsPerRow, setSeatsPerRow] = React.useState(10);

  React.useEffect(() => {
    const handleResize = () => {
      setSeatsPerRow(getSeatsPerRow());
    };

    setSeatsPerRow(getSeatsPerRow());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSeat = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) return;

    const newSelectedSeats = selectedSeats.includes(seatNumber)
      ? selectedSeats.filter((s) => s !== seatNumber)
      : [...selectedSeats, seatNumber];

    setSelectedSeats(newSelectedSeats);
    if (onSeatsChange) {
      onSeatsChange(newSelectedSeats);
    }
  };

  const getSeatStatus = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) return 'occupied';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  // Responsive button sizes
  const getSeatButtonClasses = () => {
    if (typeof window === 'undefined') return 'w-10 h-10';
    if (window.innerWidth < 640) return 'w-9 h-9 text-xs'; // sm: 36x36
    if (window.innerWidth < 1024) return 'w-10 h-10 text-xs'; // md: 40x40
    return 'w-10 h-10 text-xs'; // lg: 40x40
  };

  return (
    <div className="card p-4 md:p-6 w-full overflow-x-auto">
      <div className="mb-6 md:mb-8">
        <h3 className="text-center text-slate-600 mb-3 md:mb-4 font-semibold text-sm md:text-base uppercase tracking-wide">Screen</h3>
        <div className="h-1 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded"></div>
      </div>

      <div className="flex justify-center mb-6 md:mb-8 w-full">
        <div className="inline-block min-w-fit">
          {Array.from({ length: Math.ceil(allSeats.length / seatsPerRow) }).map(
            (_, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1 md:gap-2 mb-2 md:mb-3">
                <span className="text-xs text-slate-500 w-5 md:w-4 font-bold text-right mr-1 md:mr-2 flex items-center">
                  {String.fromCharCode(65 + rowIndex)}
                </span>
                {allSeats
                  .slice(rowIndex * seatsPerRow, (rowIndex + 1) * seatsPerRow)
                  .map((seatNumber) => {
                    const status = getSeatStatus(seatNumber);
                    return (
                      <button
                        key={seatNumber}
                        onClick={() => toggleSeat(seatNumber)}
                        disabled={status === 'occupied'}
                        className={`
                          rounded-t-lg font-xs transition-all min-h-9 min-w-9 md:w-10 md:h-10 w-9 h-9
                          ${
                            status === 'occupied'
                              ? 'bg-slate-400 cursor-not-allowed text-slate-600'
                              : status === 'selected'
                              ? 'bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700'
                              : 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                          }
                        `}
                        title={`Seat ${String.fromCharCode(65 + rowIndex)}${seatNumber % seatsPerRow || seatsPerRow}`}
                      >
                        <span className="text-xs leading-none">
                          {seatNumber % seatsPerRow || seatsPerRow}
                        </span>
                      </button>
                    );
                  })}
                <span className="text-xs text-slate-500 w-5 md:w-4 font-bold ml-1 md:ml-2 flex items-center">
                  {String.fromCharCode(65 + rowIndex)}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex justify-center gap-3 md:gap-6 text-xs md:text-sm flex-wrap px-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-t flex-shrink-0"></div>
          <span className="text-slate-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded-t flex-shrink-0"></div>
          <span className="text-slate-700">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-400 rounded-t flex-shrink-0"></div>
          <span className="text-slate-700">Occupied</span>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-200">
          <p className="font-semibold mb-2 text-sm md:text-base text-slate-900">Selected Seats:</p>
          <div className="flex gap-2 flex-wrap">
            {selectedSeats.map((seat) => (
              <span
                key={seat}
                className="bg-indigo-100 text-indigo-600 px-2 md:px-3 py-1 rounded font-semibold text-xs md:text-sm border border-indigo-300"
              >
                {seat}
              </span>
            ))}
          </div>
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm md:text-base text-slate-700">Total Price:</span>
              <span className="text-xl md:text-2xl font-bold text-indigo-600">
                ₹{(show?.price * selectedSeats.length).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

