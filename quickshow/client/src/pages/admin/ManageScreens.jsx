import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Trash2, Monitor, XCircle } from 'lucide-react';
import Loading from '../../components/Loading';
import { toast } from 'react-hot-toast';

import SeatLayoutEditor from '../../components/admin/SeatLayoutEditor';

export default function ManageScreens() {
  const { apiClient } = useApp();
  const [cinemas, setCinemas] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState('');
  
  const [seatLayoutEditorData, setSeatLayoutEditorData] = useState([]);

  const [formData, setFormData] = useState({
    cinemaId: '',
    name: '',
    screenType: 'Standard',
    rows: 10,
    seatsPerRow: 10,
    facilities: [],
    priceMultiplier: 1.0,
    status: 'active',
  });

  const screenTypeOptions = ['Standard', 'Premium', 'IMAX', 'Recliner', '4DX', 'Dolby Atmos'];
  const facilityOptions = ['3D', 'IMAX', '4DX', 'Dolby Atmos', 'Laser Projection', 'Recliner Seats', 'Premium Sound', 'Air Conditioning'];

  useEffect(() => {
    fetchCinemas();
  }, []);

  useEffect(() => {
    if (selectedCinema) {
      fetchScreens(selectedCinema);
    }
  }, [selectedCinema]);

  const fetchCinemas = async () => {
    try {
      const response = await apiClient.get('/api/cinema', { params: { status: 'active' } });
      if (response.data.success) {
        setCinemas(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCinema(response.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching cinemas:', error);
      toast.error('Failed to fetch cinemas');
    }
  };

  const fetchScreens = async (cinemaId) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/screen/cinema/${cinemaId}`);
      if (response.data.success) {
        setScreens(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching screens:', error);
      toast.error('Failed to fetch screens');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert internal layout format to MongoDB flat format
      const finalSeatLayout = [];
      seatLayoutEditorData.forEach(rowItem => {
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

      const payload = {
        ...formData,
        cinemaId: formData.cinemaId || selectedCinema,
        seatLayout: finalSeatLayout,
      };

      if (editMode) {
        await apiClient.put(`/api/screen/${currentScreen._id}`, payload);
        toast.success('Screen updated successfully');
      } else {
        await apiClient.post('/api/screen', payload);
        toast.success('Screen created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchScreens(selectedCinema);
      fetchCinemas(); // Refresh to update cinema stats
    } catch (error) {
      console.error('Error saving screen:', error);
      toast.error(error.response?.data?.message || 'Failed to save screen');
    }
  };

  const handleDelete = async (screenId, permanent = false) => {
    if (!confirm(permanent ? 'Permanently delete this screen? This cannot be undone.' : 'Deactivate this screen?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/screen/${screenId}?permanent=${permanent}`);
      toast.success(permanent ? 'Screen deleted' : 'Screen deactivated');
      fetchScreens(selectedCinema);
      fetchCinemas();
    } catch (error) {
      console.error('Error deleting screen:', error);
      toast.error(error.response?.data?.message || 'Failed to delete screen');
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentScreen(null);
    resetForm();
    setFormData(prev => ({ ...prev, cinemaId: selectedCinema }));
    setShowModal(true);
  };

  const openEditModal = (screen) => {
    setEditMode(true);
    setCurrentScreen(screen);
    setFormData({
      cinemaId: screen.cinemaId._id,
      name: screen.name,
      screenType: screen.screenType,
      rows: screen.rows,
      seatsPerRow: screen.seatsPerRow,
      facilities: screen.facilities || [],
      priceMultiplier: screen.priceMultiplier,
      status: screen.status,
    });

    // Convert MongoDB flat format back to internal format
    if (screen.seatLayout && screen.seatLayout.length > 0) {
      const editorLayout = [];
      const rowsMap = {};
      screen.seatLayout.forEach(seat => {
        if (!rowsMap[seat.row]) {
          rowsMap[seat.row] = [];
        }
        rowsMap[seat.row].push({
          id: seat.seatNumber,
          col: seat.number,
          status: seat.isAvailable ? 'available' : 'disabled'
        });
      });
      
      // Sort rows alphabetically (or in correct sequence A,B,C..)
      Object.keys(rowsMap).sort().forEach(r => {
        editorLayout.push({
          row: r,
          cols: rowsMap[r].sort((a,b) => a.col - b.col)
        });
      });
      setSeatLayoutEditorData(editorLayout);
    } else {
      setSeatLayoutEditorData([]);
    }

    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      cinemaId: selectedCinema,
      name: '',
      screenType: 'Standard',
      rows: 10,
      seatsPerRow: 10,
      facilities: [],
      priceMultiplier: 1.0,
      status: 'active',
    });
    setSeatLayoutEditorData([]);
  };

  const toggleFacility = (facility) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  if (cinemas.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="card p-12 text-center">
            <p className="text-slate-600 text-lg mb-4">No cinemas available. Please add a cinema first.</p>
            <a href="/admin/cinemas" className="btn-primary inline-block">
              Manage Cinemas
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Screens</h1>
          <p className="text-sm text-slate-500 mt-1">Configure screens for cinemas</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Screen
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
        <label className="block text-sm font-medium">Select Cinema</label>
        <select
          value={selectedCinema}
          onChange={(e) => setSelectedCinema(e.target.value)}
          className="input w-full md:w-auto min-w-[300px]"
        >
          {cinemas.map((cinema) => (
            <option key={cinema._id} value={cinema._id}>
              {cinema.name} - {cinema.city}
            </option>
          ))}
        </select>
      </div>

      {/* Screen List */}
      {loading ? (
        <Loading />
      ) : screens.length === 0 ? (
        <div className="card p-12 text-center">
          <Monitor size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 text-lg">No screens found for this cinema</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screens.map((screen) => (
            <div key={screen._id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Monitor size={20} className="text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900">{screen.name}</h3>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    screen.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : screen.status === 'inactive'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {screen.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-semibold text-slate-900">{screen.screenType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Layout:</span>
                  <span className="font-semibold text-slate-900">
                    {screen.rows} × {screen.seatsPerRow}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(screen)}
                  className="flex-1 btn-outline text-xs py-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(screen._id)}
                  className="flex-1 btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs py-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">{editMode ? 'Edit Screen' : 'Add New Screen'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cinema*</label>
                <select
                  required
                  value={formData.cinemaId}
                  onChange={(e) => setFormData({ ...formData, cinemaId: e.target.value })}
                  className="input w-full"
                  disabled={editMode}
                >
                  <option value="">Select Cinema</option>
                  {cinemas.map((cinema) => (
                    <option key={cinema._id} value={cinema._id}>
                      {cinema.name} - {cinema.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Screen Name*</label>
                <input type="text" required placeholder="e.g., Screen 1, Audi 1" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Screen Type*</label>
                <select value={formData.screenType} onChange={(e) => setFormData({ ...formData, screenType: e.target.value })} className="input w-full">
                  {screenTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rows*</label>
                  <input type="number" required min="1" max="50" value={formData.rows} onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Seats Per Row*</label>
                  <input type="number" required min="1" max="100" value={formData.seatsPerRow} onChange={(e) => setFormData({ ...formData, seatsPerRow: parseInt(e.target.value) })} className="input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-500">
                  Total Capacity: <span className="font-bold text-indigo-600">{formData.rows * formData.seatsPerRow} seats max</span>
                </label>
              </div>
              
              {/* Seat Layout Editor */}
              <div className="mt-4 mb-4">
                <SeatLayoutEditor
                  rows={formData.rows}
                  seatsPerRow={formData.seatsPerRow}
                  layout={seatLayoutEditorData}
                  onChange={setSeatLayoutEditorData}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price Multiplier*</label>
                <input type="number" required min="0.5" max="5" step="0.1" value={formData.priceMultiplier} onChange={(e) => setFormData({ ...formData, priceMultiplier: parseFloat(e.target.value) })} className="input w-full" />
                <p className="text-xs text-slate-500 mt-1">Base price will be multiplied by this value for this screen</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Facilities</label>
                <div className="grid grid-cols-2 gap-2">
                  {facilityOptions.map((facility) => (
                    <label key={facility} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.facilities.includes(facility)} onChange={() => toggleFacility(facility)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                      {facility}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status*</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input w-full">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="btn-primary flex-1">Save Screen</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
