import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Trash2, Eye, MapPin, Phone, Mail, XCircle, CheckCircle } from 'lucide-react';
import Loading from '../../components/Loading';
import { toast } from 'react-hot-toast';
import DarkSelect from '../../components/admin/DarkSelect';

export default function ManageCinemas() {
  const { apiClient } = useApp();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCinema, setCurrentCinema] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    facilities: [],
    status: 'active',
  });

  const facilityOptions = [
    'Parking',
    'Food Court',
    'Wheelchair Access',
    'Recliner Seats',
    '3D',
    'IMAX',
    '4DX',
    'Dolby Atmos',
    'Air Conditioning',
    'Online Booking',
  ];

  useEffect(() => {
    fetchCinemas();
    fetchCities();
  }, [searchTerm, cityFilter, statusFilter]);

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (cityFilter) params.city = cityFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await apiClient.get('/api/cinema', { params });
      if (response.data.success) {
        setCinemas(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cinemas:', error);
      toast.error('Failed to fetch cinemas');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await apiClient.get('/api/cinema/cities');
      if (response.data.success) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        contact: {
          phone: formData.phone,
          email: formData.email,
        },
      };

      if (editMode) {
        await apiClient.put(`/api/cinema/${currentCinema._id}`, payload);
        toast.success('Cinema updated successfully');
      } else {
        await apiClient.post('/api/cinema', payload);
        toast.success('Cinema created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchCinemas();
      fetchCities();
    } catch (error) {
      console.error('Error saving cinema:', error);
      toast.error(error.response?.data?.message || 'Failed to save cinema');
    }
  };

  const handleDelete = async (cinemaId, permanent = false) => {
    if (!confirm(permanent ? 'Permanently delete this cinema? This cannot be undone.' : 'Deactivate this cinema?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/cinema/${cinemaId}?permanent=${permanent}`);
      toast.success(permanent ? 'Cinema deleted' : 'Cinema deactivated');
      fetchCinemas();
    } catch (error) {
      console.error('Error deleting cinema:', error);
      toast.error(error.response?.data?.message || 'Failed to delete cinema');
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setCurrentCinema(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (cinema) => {
    setEditMode(true);
    setCurrentCinema(cinema);
    setFormData({
      name: cinema.name,
      city: cinema.city,
      address: cinema.address,
      phone: cinema.contact.phone,
      email: cinema.contact.email,
      facilities: cinema.facilities || [],
      status: cinema.status,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      city: '',
      address: '',
      phone: '',
      email: '',
      facilities: [],
      status: 'active',
    });
  };

  const toggleFacility = (facility) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-[#0f172a] p-6 rounded-xl shadow-sm border border-slate-800/50">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Cinemas</h1>
          <p className="text-sm text-slate-500 mt-1">Add and configure cinemas</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add Cinema
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#0f172a] p-4 rounded-xl shadow-sm border border-slate-800/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search cinemas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
          <DarkSelect
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            options={[
              { value: '', label: 'All Cities' },
              ...cities.map((city) => ({ value: city, label: city }))
            ]}
          />
          <DarkSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'maintenance', label: 'Maintenance' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : cinemas.length === 0 ? (
        <div className="bg-[#0f172a] p-12 text-center rounded-xl shadow-sm border border-slate-800/50">
          <p className="text-slate-500 mb-4">No cinemas found.</p>
          <button
            onClick={() => {
              setEditMode(false);
              resetForm();
              setShowModal(true);
            }}
            className="text-red-500 font-semibold hover:underline"
          >
            Add your first cinema
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cinemas.map((cinema) => (
            <div key={cinema._id} className="bg-[#0f172a] p-6 rounded-xl shadow-sm border border-slate-800/50 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white">{cinema.name}</h3>
                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    cinema.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : cinema.status === 'inactive'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {cinema.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{cinema.address}, {cinema.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <span>{cinema.contact.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} />
                  <span>{cinema.contact.email}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800/50 flex justify-end gap-2">
                <button onClick={() => openEditModal(cinema)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(cinema._id, false)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                  <XCircle size={18} />
                </button>
                <button onClick={() => handleDelete(cinema._id, true)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] p-6 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">{editMode ? 'Edit Cinema' : 'Add New Cinema'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cinema Name*</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City*</label>
                <input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address*</label>
                <textarea required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input w-full" rows="3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone*</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email*</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Facilities</label>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
                  {facilityOptions.map((facility) => (
                    <label key={facility} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.facilities.includes(facility)} onChange={() => toggleFacility(facility)} className="rounded text-red-500 focus:ring-red-500/20" />
                      {facility}
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="btn-primary flex-1">Save Cinema</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
