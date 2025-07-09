import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, Save } from 'lucide-react';
import { FollowUpAppointment } from '../types';

interface FollowUpEditModalProps {
  appointment: FollowUpAppointment;
  onClose: () => void;
  onSave: (appointmentData: Partial<FollowUpAppointment>) => void;
}

const FollowUpEditModal: React.FC<FollowUpEditModalProps> = ({
  appointment,
  onClose,
  onSave
}) => {
  const [appointmentDate, setAppointmentDate] = useState(appointment.appointmentDate);
  const [appointmentTime, setAppointmentTime] = useState(appointment.appointmentTime);
  const [notes, setNotes] = useState(appointment.notes || '');
  const [status, setStatus] = useState(appointment.status || 'scheduled');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentDate || !appointmentTime) {
      setError('Tanggal dan waktu kontrol harus diisi');
      return;
    }

    // Validate that the appointment is not in the past (unless it's being marked as completed)
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    
    if (status !== 'completed' && appointmentDateTime < now) {
      setError('Jadwal kontrol tidak boleh di masa lalu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedData: Partial<FollowUpAppointment> = {
        appointmentDate,
        appointmentTime,
        notes: notes.trim(),
        status
      };

      await onSave(updatedData);
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Gagal mengupdate jadwal kontrol');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Terjadwal', color: 'text-blue-600' },
    { value: 'completed', label: 'Selesai', color: 'text-green-600' },
    { value: 'cancelled', label: 'Dibatalkan', color: 'text-red-600' },
    { value: 'rescheduled', label: 'Dijadwal Ulang', color: 'text-yellow-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Edit Jadwal Kontrol</h2>
              <p className="text-sm text-gray-600">{appointment.patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Patient Info */}
        <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <h3 className="font-medium text-emerald-800 mb-2">Detail Pasien</h3>
          <p className="text-emerald-700"><strong>Nama:</strong> {appointment.patientName}</p>
          <p className="text-emerald-700"><strong>Dokter:</strong> Dr. {appointment.doctorName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tanggal Kontrol *
            </label>
            <input
              type="date"
              id="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={status === 'completed' ? undefined : today}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Waktu Kontrol *
            </label>
            <input
              type="time"
              id="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Catatan
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan untuk kontrol lanjutan..."
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            />
          </div>

          {/* Status Change Warning */}
          {status !== appointment.status && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-700">
                  Status akan berubah dari <span className="font-medium">{appointment.status || 'Terjadwal'}</span> ke <span className="font-medium">{statusOptions.find(opt => opt.value === status)?.label}</span>
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowUpEditModal;