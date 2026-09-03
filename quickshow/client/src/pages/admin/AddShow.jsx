import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import DarkSelect from '../../components/admin/DarkSelect';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, ChevronRight, ChevronLeft, Calendar, Clock, MapPin, DollarSign } from 'lucide-react';
import SeatLayoutEditor from '../../components/admin/SeatLayoutEditor';

export default function AddShow() {
  const { apiClient } = useApp();
  const navigate = useNavigate();

  // Step state management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step 1: Movie Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [searchingTMDB, setSearchingTMDB] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Step 2: Cinema Details
  const [cinemas, setCinemas] = useState([]);
  const [screens, setScreens] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [cinemaData, setCinemaData] = useState({
    cinemaName: '',
    screenNumber: '',
    screenType: 'Standard',
  });

  // Step 3: Date Selection
  const [selectedDate, setSelectedDate] = useState('');

  // Step 4: Showtimes
  const [showtimes, setShowtimes] = useState([
    { startTime: '', endTime: '', price: '' }
  ]);

  // Step 5: Seat Configuration & Preview
  const [seatConfig, setSeatConfig] = useState({
    totalSeats: 100,
    rows: 10,
    seatsPerRow: 10,
    seatLayoutEditorData: [],
  });

  const [loading, setLoading] = useState(false);

  // Fetch Cinemas on mount
  useEffect(() => {
    fetchCinemas();
  }, []);

  const fetchCinemas = async () => {
    try {
      const response = await apiClient.get('/api/cinema', { params: { status: 'active' } });
      if (response.data.success) {
        setCinemas(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cinemas:', error);
      toast.error('Failed to load cinemas');
    }
  };

  const fetchScreens = async (cinemaId) => {
    try {
      const response = await apiClient.get(`/api/screen/cinema/${cinemaId}`);
      if (response.data.success) {
        setScreens(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching screens:', error);
      toast.error('Failed to load screens');
    }
  };

  const handleCinemaChange = (e) => {
    const cinemaId = e.target.value;
    setSelectedCinemaId(cinemaId);
    setSelectedScreenId('');
    
    const selectedC = cinemas.find(c => c._id === cinemaId);
    if (selectedC) {
      setCinemaData(prev => ({ ...prev, cinemaName: selectedC.name }));
    }
    
    if (cinemaId) {
      fetchScreens(cinemaId);
    } else {
      setScreens([]);
    }
  };

  const handleScreenChange = (e) => {
    const screenId = e.target.value;
    setSelectedScreenId(screenId);
    
    const selectedS = screens.find(s => s._id === screenId);
    if (selectedS) {
      setCinemaData(prev => ({
        ...prev,
        screenNumber: selectedS.name,
        screenType: selectedS.screenType,
      }));
      
      // Transform DB layout to Editor layout
      let editorLayout = [];
      if (selectedS.seatLayout && selectedS.seatLayout.length > 0) {
        const rowsMap = {};
        selectedS.seatLayout.forEach(seat => {
          if (!rowsMap[seat.row]) rowsMap[seat.row] = [];
          rowsMap[seat.row].push({
            id: seat.seatNumber,
            col: seat.number,
            status: seat.isAvailable ? 'available' : 'disabled'
          });
        });
        
        Object.keys(rowsMap).sort().forEach(r => {
          editorLayout.push({
            row: r,
            cols: rowsMap[r].sort((a,b) => a.col - b.col)
          });
        });
      }

      setSeatConfig({
        totalSeats: selectedS.totalCapacity || (selectedS.rows * selectedS.seatsPerRow),
        rows: selectedS.rows,
        seatsPerRow: selectedS.seatsPerRow,
        seatLayoutEditorData: editorLayout,
      });
    }
  };

  // Search local database movies with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        searchLocalMovies(searchQuery);
      } else {
        setTmdbResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const searchLocalMovies = async (query) => {
    try {
      setSearchingTMDB(true);
      const response = await apiClient.get('/api/movie/search', {
        params: { search: query, localOnly: true },
      });
      if (response.data.success) {
        setTmdbResults(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching local movies:', error);
      toast.error('Error searching movies');
    } finally {
      setSearchingTMDB(false);
    }
  };

  const handleMovieSelect = (movie) => {
    setSelectedMovie({
      id: movie.id,
      _id: movie._id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      poster: movie.poster_path,
      backdrop: movie.backdrop_path,
      releaseDate: movie.release_date,
      rating: movie.vote_average,
    });
    setCurrentStep(2);
  };

  const addShowtime = () => {
    setShowtimes([...showtimes, { startTime: '', endTime: '', price: '' }]);
  };

  const removeShowtime = (index) => {
    if (showtimes.length > 1) {
      setShowtimes(showtimes.filter((_, i) => i !== index));
    }
  };

  const updateShowtime = (index, updates) => {
    const updated = [...showtimes];
    updated[index] = { ...updated[index], ...updates };
    setShowtimes(updated);
  };

  const calculateEndTime = (startTime) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    // Assume 2.5 hours movie duration
    const endDate = new Date(startDate.getTime() + 2.5 * 60 * 60 * 1000);
    return endDate.toTimeString().slice(0, 5);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return selectedMovie !== null;
      case 2:
        return selectedCinemaId && selectedScreenId;
      case 3:
        return selectedDate && new Date(selectedDate) > new Date(new Date().setDate(new Date().getDate()-1));
      case 4:
        return showtimes.every(st => st.startTime && st.endTime && st.price && parseFloat(st.price) > 0);
      case 5:
        return seatConfig.totalSeats > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, totalSteps));
    } else {
      toast.error('Please complete all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const createShows = async () => {
    try {
      setLoading(true);

      const showPromises = showtimes.map(async (showtime) => {
        // Convert internal layout format to MongoDB flat format
        const finalSeatLayout = [];
        if (seatConfig.seatLayoutEditorData) {
          seatConfig.seatLayoutEditorData.forEach(rowItem => {
            rowItem.cols.forEach(colItem => {
              finalSeatLayout.push({
                row: rowItem.row,
                number: colItem.col,
                seatNumber: colItem.id,
                type: 'Standard',
                isAvailable: colItem.status === 'available'
              });
            });
          });
        }

        const payload = {
          movieId: selectedMovie._id,
          tmdbId: selectedMovie.tmdbId || selectedMovie.id,
          movieTitle: selectedMovie.title,
          date: new Date(selectedDate).toISOString(),
          time: showtime.startTime,
          endTime: showtime.endTime,
          theatre: cinemaData.cinemaName,
          screen: cinemaData.screenNumber, // Using actual screen name from DB
          screenType: cinemaData.screenType,
          price: parseFloat(showtime.price),
          totalSeats: seatConfig.totalSeats,
          rows: seatConfig.rows,
          seatsPerRow: seatConfig.seatsPerRow,
          seatLayout: finalSeatLayout,
        };

        return apiClient.post('/api/show/add', payload);
      });

      const results = await Promise.allSettled(showPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.data.success);
      const failed = results.filter(r => r.status === 'rejected' || !r.value.data.success);

      if (successful.length > 0) {
        toast.success(`Successfully created ${successful.length} show(s)`);
        if (failed.length > 0) {
          toast.warning(`${failed.length} show(s) failed to create`);
        }
        navigate('/admin/list-shows');
      } else {
        toast.error('Failed to create any shows');
      }
    } catch (error) {
      console.error('Error creating shows:', error);
      toast.error('Error creating shows');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold
            ${step <= currentStep 
              ? 'bg-red-600 border-indigo-600 text-white' 
              : 'border-slate-700 text-slate-400'
            }`}>
            {step}
          </div>
          {step < totalSteps && (
            <div className={`w-12 h-0.5 mx-2 
              ${step < currentStep ? 'bg-red-600' : 'bg-slate-300'}
            `} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Movie</h2>
        <p className="text-slate-400">Search and select a movie from your database</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search imported movies by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600"
        />
      </div>

      {searchingTMDB && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Searching...</p>
        </div>
      )}

      {!searchingTMDB && tmdbResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tmdbResults.map((movie) => (
            <button
              key={movie.id}
              onClick={() => handleMovieSelect(movie)}
              className="card card-hover text-left p-4 transition-all hover:shadow-lg"
            >
              <div className="flex items-start space-x-4">
                <div className="w-16 h-24 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1 line-clamp-2">{movie.title}</h3>
                  <div className="text-sm text-slate-400 space-y-1">
                    {movie.release_date && (
                      <p>{new Date(movie.release_date).getFullYear()}</p>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {searchQuery && !searchingTMDB && tmdbResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">No movies found for "{searchQuery}"</p>
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-400">Start typing to search your local catalog</p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Cinema & Screen Details</h2>
        <p className="text-slate-400">Select the cinema and screen for the show</p>
      </div>

      {selectedMovie && (
        <div className="card p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-18 bg-slate-800 rounded overflow-hidden">
              {selectedMovie.poster && (
                <img
                  src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster}`}
                  alt={selectedMovie.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">{selectedMovie.title}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-slate-300 font-semibold mb-2">
            <MapPin size={16} className="inline mr-2" />
            Cinema Location
          </label>
          <DarkSelect
            value={selectedCinemaId}
            onChange={handleCinemaChange}
            options={[
              { value: '', label: 'Select a Cinema' },
              ...cinemas.map(cinema => ({
                value: cinema._id,
                label: `${cinema.name} - ${cinema.city}`
              }))
            ]}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-2">Screen</label>
          <DarkSelect
            value={selectedScreenId}
            onChange={handleScreenChange}
            disabled={!selectedCinemaId || screens.length === 0}
            options={[
              { value: '', label: selectedCinemaId ? 'Select a Screen' : 'Select Cinema first' },
              ...screens.map(screen => ({
                value: screen._id,
                label: `${screen.name} (${screen.screenType})`
              }))
            ]}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Select Date</h2>
        <p className="text-slate-400">Choose the date for the shows</p>
      </div>

      <div className="max-w-md mx-auto">
        <label className="block text-slate-300 font-semibold mb-2">
          <Calendar size={16} className="inline mr-2" />
          Show Date
        </label>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Configure Showtimes</h2>
        <p className="text-slate-400">Add multiple showtimes for this movie</p>
      </div>

      <div className="space-y-4">
        {showtimes.map((showtime, index) => (
          <div key={index} className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Showtime #{index + 1}</h3>
              {showtimes.length > 1 && (
                <button
                  onClick={() => removeShowtime(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={showtime.startTime}
                  onChange={(e) => {
                    updateShowtime(index, {
                      startTime: e.target.value,
                      endTime: calculateEndTime(e.target.value)
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={showtime.endTime}
                  onChange={(e) => updateShowtime(index, { endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  <DollarSign size={16} className="inline mr-2" />
                  Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="200"
                  value={showtime.price}
                  onChange={(e) => updateShowtime(index, { price: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addShowtime}
          className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-indigo-600 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Showtime
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Review & Create</h2>
        <p className="text-slate-400">Review all details before scheduling</p>
      </div>

      <div className="card p-6 mb-6 pointer-events-none">
        <h3 className="font-semibold text-white mb-4">Screen Layout Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-500">Total Available Seats</p>
            <p className="font-bold text-red-500 text-lg">{seatConfig.totalSeats}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Rows</p>
            <p className="font-bold text-white text-lg">{seatConfig.rows}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Seats per Row</p>
            <p className="font-bold text-white text-lg">{seatConfig.seatsPerRow}</p>
          </div>
        </div>
        
        {seatConfig.seatLayoutEditorData.length > 0 && (
          <div className="opacity-80 scale-95 origin-top mt-4">
             <SeatLayoutEditor
                rows={seatConfig.rows}
                seatsPerRow={seatConfig.seatsPerRow}
                layout={seatConfig.seatLayoutEditorData}
                onChange={() => {}}
              />
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-white mb-4">Show Preview</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-24 bg-slate-800 rounded overflow-hidden">
              {selectedMovie?.poster && (
                <img
                  src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster}`}
                  alt={selectedMovie.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-white">{selectedMovie?.title}</h4>
              <p className="text-slate-400">{cinemaData.cinemaName}</p>
              <p className="text-slate-400">{cinemaData.screenNumber} ({cinemaData.screenType})</p>
              <p className="text-slate-400">{new Date(selectedDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-white mb-2">Showtimes:</h5>
            <div className="space-y-2">
              {showtimes.map((showtime, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-[#09090b] rounded">
                  <span>{showtime.startTime} - {showtime.endTime}</span>
                  <span className="font-semibold">₹{showtime.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center bg-[#0f172a] p-6 rounded-xl shadow-sm border border-slate-800/50">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedule New Show</h1>
          <p className="text-sm text-slate-500 mt-1">Configure movie, cinema, and timings</p>
        </div>
      </div>

      {renderStepIndicator()}

      <div className="bg-[#0f172a] p-8 rounded-xl shadow-sm border border-slate-800/50 mb-8 min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      <div className="flex justify-between items-center bg-[#0f172a] p-6 rounded-xl shadow-sm border border-slate-800/50">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="btn-outline flex items-center gap-2"
        >
          <ChevronLeft size={20} />
          Back
        </button>
        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
            className="btn-primary flex items-center gap-2"
          >
            Next Step
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={createShows}
            disabled={loading || !validateStep(5)}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? 'Creating...' : `Create ${showtimes.length} Show(s)`}
          </button>
        )}
      </div>
    </div>
  );
}