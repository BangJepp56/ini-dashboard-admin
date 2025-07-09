import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Clock, Calendar } from 'lucide-react';
import { Schedule, Doctor } from '../types';

interface ScheduleModalProps {
  schedule: Schedule | null;
  doctors: Doctor[];
  onClose: () => void;
  onSave: (schedule: Omit<Schedule, 'id'>) => void;
  isOpen?: boolean;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ schedule, doctors, onClose, onSave }) => {
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [poly, setPoly] = useState('');
  const [days, setDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);

  const dayOptions = [
    { value: 'monday', label: 'Senin' },
    { value: 'tuesday', label: 'Selasa' },
    { value: 'wednesday', label: 'Rabu' },
    { value: 'thursday', label: 'Kamis' },
    { value: 'friday', label: 'Jumat' },
    { value: 'saturday', label: 'Sabtu' },
    { value: 'sunday', label: 'Minggu' }
  ];

  const polyOptions = [
    'Kebidanan dan Kandungan',
    'Anak',
    'Bedah',
    'Bedah Mulut',
    'Penyakit Dalam',
    'THT',
    'Kulit dan Kelamin',
    'Umum',
    'Gigi',
  ];

  // Reset form ketika modal dibuka/tutup
  const resetForm = () => {
    setDoctorId('');
    setDoctorName('');
    setPoly('');
    setDays([]);
    setStartTime('');
    setEndTime('');
    setStatus('active');
  };

  // Initialize form data
  useEffect(() => {
    if (schedule) {
      // Edit mode - populate with existing data
      setDoctorId(schedule.doctorId || '');
      setDoctorName(schedule.doctorName || '');
      setPoly(schedule.poly || '');
      setDays(schedule.days || []);
      setStartTime(schedule.startTime || '');
      setEndTime(schedule.endTime || '');
      setStatus(schedule.status || 'active');
    } else {
      // Add mode - reset to defaults
      resetForm();
    }
  }, [schedule]);

  // Update doctor info when doctor selection changes
  const handleDoctorChange = (selectedDoctorId: string) => {
    setDoctorId(selectedDoctorId);
    
    if (selectedDoctorId) {
      const selectedDoctor = doctors.find(doc => doc.id === selectedDoctorId);
      if (selectedDoctor) {
        setDoctorName(selectedDoctor.name);
        // Auto-fill poly only if it's empty or in add mode
        if (!schedule || !poly) {
          setPoly(selectedDoctor.specialization);
        }
      }
    } else {
      // Clear related fields when no doctor selected
      setDoctorName('');
      if (!schedule) { // Only clear poly in add mode
        setPoly('');
      }
    }
  };

  const handleDayChange = (day: string) => {
    setDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const validateForm = () => {
    const errors = [];
    
    if (!doctorId) errors.push('Dokter harus dipilih');
    if (!poly) errors.push('Poli harus dipilih');
    if (days.length === 0) errors.push('Minimal pilih 1 hari praktek');
    if (!startTime) errors.push('Jam mulai harus diisi');
    if (!endTime) errors.push('Jam selesai harus diisi');
    if (startTime && endTime && startTime >= endTime) {
      errors.push('Jam selesai harus lebih besar dari jam mulai');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const scheduleData = {
        doctorId,
        doctorName,
        poly,
        days,
        startTime,
        endTime,
        status,
        holidayReason: schedule?.holidayReason || '',
        holidayStartDate: schedule?.holidayStartDate || '',
        holidayEndDate: schedule?.holidayEndDate || '',
        createdAt: schedule?.createdAt || new Date().toISOString()
      };

      await onSave(scheduleData);
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Gagal menyimpan jadwal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Get available doctors (could filter based on status if needed)
  const availableDoctors = doctors.filter(doctor => doctor.id && doctor.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {schedule ? 'Edit Jadwal Praktek' : 'Tambah Jadwal Praktek'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            disabled={loading}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Dokter *
              </label>
              <select
                id="doctor"
                value={doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Pilih Dokter</option>
                {availableDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              {doctorName && (
                <p className="text-xs text-gray-500 mt-1">
                  Dokter terpilih: {doctorName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="poly" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Poli *
              </label>
              <select
                id="poly"
                value={poly}
                onChange={(e) => setPoly(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Pilih Poli</option>
                {polyOptions.map((option) => (
                  <option key={option} value={option}>
                    Poli {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4 inline mr-1" />
              Hari Praktek *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {dayOptions.map((day) => (
                <label 
                  key={day.value} 
                  className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                    days.includes(day.value) 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'hover:bg-gray-50 border-gray-300'
                  } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={days.includes(day.value)}
                    onChange={() => handleDayChange(day.value)}
                    disabled={loading}
                    className="text-emerald-500 focus:ring-emerald-500 rounded"
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              ))}
            </div>
            {days.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Hari terpilih: {days.map(day => dayOptions.find(d => d.value === day)?.label).join(', ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Jam Mulai *
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Jam Selesai *
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status Jadwal
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Status jadwal ini (bukan status dokter)
            </p>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                schedule ? 'Simpan Perubahan' : 'Tambah Jadwal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;