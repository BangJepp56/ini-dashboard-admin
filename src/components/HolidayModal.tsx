import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Schedule } from '../types';

interface HolidayModalProps {
  schedule: Schedule;
  onClose: () => void;
  onSave: (holidayData: { reason: string; startDate: string; endDate: string }) => void;
  isOpen?: boolean;
}

const HolidayModal: React.FC<HolidayModalProps> = ({ schedule, onClose, onSave }) => {
  const [reason, setReason] = useState(schedule.holidayReason || '');
  const [startDate, setStartDate] = useState(schedule.holidayStartDate || '');
  const [endDate, setEndDate] = useState(schedule.holidayEndDate || '');
  const [loading, setLoading] = useState(false);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim() || !startDate || !endDate) {
      alert('Semua field harus diisi');
      return;
    }

    if (startDate > endDate) {
      alert('Tanggal mulai tidak boleh lebih dari tanggal selesai');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        reason: reason.trim(),
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Error setting holiday:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelHoliday = async () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan libur?')) {
      setLoading(true);
      try {
        await onSave({
          reason: '',
          startDate: '',
          endDate: ''
        });
        // Also need to update the status back to active
        // This should be handled in the parent component
      } catch (error) {
        console.error('Error cancelling holiday:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Atur Libur Dokter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Detail Jadwal</h3>
          <p className="text-blue-700"><strong>Dokter:</strong> {schedule.doctorName}</p>
          <p className="text-blue-700"><strong>Poli:</strong> {schedule.poly}</p>
          <p className="text-blue-700"><strong>Waktu:</strong> {schedule.startTime} - {schedule.endTime}</p>
        </div>

        {schedule.status === 'holiday' && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Dokter sedang libur</p>
                <p className="text-sm text-red-700">{schedule.holidayReason}</p>
                {schedule.holidayStartDate && schedule.holidayEndDate && (
                  <p className="text-xs text-red-600 mt-1">
                    {schedule.holidayStartDate} s/d {schedule.holidayEndDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Libur
            </label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Cuti tahunan, Sakit, dll."
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tanggal Mulai
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tanggal Selesai
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            
            {schedule.status === 'holiday' && (
              <button
                type="button"
                onClick={handleCancelHoliday}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Batalkan Libur
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Atur Libur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HolidayModal;