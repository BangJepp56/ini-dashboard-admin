import React, { useState } from 'react';
import { X, Calendar, FileText, Save, AlertCircle } from 'lucide-react';
import { Schedule } from '../types';

interface HolidayModalProps {
  schedule: Schedule;
  onClose: () => void;
  onSave: (holidayData: { reason: string; startDate: string; endDate: string }) => void;
}

const HolidayModal: React.FC<HolidayModalProps> = ({ schedule, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    reason: schedule.holidayReason || '',
    startDate: schedule.holidayStartDate || '',
    endDate: schedule.holidayEndDate || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.reason.trim()) {
      newErrors.reason = 'Alasan libur wajib diisi';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Tanggal mulai libur wajib diisi';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Tanggal selesai libur wajib diisi';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Tanggal selesai harus setelah tanggal mulai';
    }

    if (formData.startDate && formData.startDate < new Date().toISOString().split('T')[0]) {
      newErrors.startDate = 'Tanggal mulai tidak boleh sebelum hari ini';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving holiday:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatShifts = (shifts: any[]) => {
    return shifts
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(shift => `${shift.name} (${shift.startTime} - ${shift.endTime})`)
      .join(', ');
  };

  const formatDays = (days: string[]) => {
    const dayNames = {
      'monday': 'Senin',
      'tuesday': 'Selasa',
      'wednesday': 'Rabu',
      'thursday': 'Kamis',
      'friday': 'Jumat',
      'saturday': 'Sabtu',
      'sunday': 'Minggu'
    };
    
    return days
      .map(day => dayNames[day as keyof typeof dayNames] || day)
      .join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Atur Libur Dokter</h2>
              <p className="text-sm text-gray-600">
                Tetapkan periode libur untuk jadwal praktek
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Schedule Info */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Informasi Jadwal</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-medium">Dokter:</span>
                <span className="text-blue-800">{schedule.doctorName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-medium">Poli:</span>
                <span className="text-blue-800">{schedule.poly}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-medium">Hari:</span>
                <span className="text-blue-800">{formatDays(schedule.days)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-medium">Shift:</span>
                <span className="text-blue-800">{formatShifts(schedule.shifts)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span>Alasan Libur *</span>
                </div>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Contoh: Cuti tahunan, sakit, pelatihan, dll."
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all duration-300 resize-none ${
                  errors.reason ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>Tanggal Mulai Libur *</span>
                  </div>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all duration-300 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>Tanggal Selesai Libur *</span>
                  </div>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-all duration-300 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Duration Info */}
            {formData.startDate && formData.endDate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Durasi Libur: {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1)} hari
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Jadwal akan otomatis diaktifkan kembali setelah periode libur selesai.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors duration-200 font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Menyimpan...' : 'Simpan Libur'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HolidayModal;