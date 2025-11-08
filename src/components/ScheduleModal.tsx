import React, { useState, useEffect } from 'react';
import { X, Plus, Clock, Trash2, User, Stethoscope, Calendar, Save, AlertCircle } from 'lucide-react';
import { Schedule, Doctor, Shift } from '../types';

interface ScheduleModalProps {
  schedule: Schedule | null;
  doctors: Doctor[];
  onClose: () => void;
  onSave: (schedule: Omit<Schedule, 'id'>) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ schedule, doctors, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorName: '',
    poly: '',
    days: [] as string[],
    shifts: [] as Shift[],
    status: 'active' as 'active' | 'holiday' | 'inactive'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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

  const dayOptions = [
    { value: 'monday', label: 'Senin' },
    { value: 'tuesday', label: 'Selasa' },
    { value: 'wednesday', label: 'Rabu' },
    { value: 'thursday', label: 'Kamis' },
    { value: 'friday', label: 'Jumat' },
    { value: 'saturday', label: 'Sabtu' },
    { value: 'sunday', label: 'Minggu' }
  ];

  const shiftTemplates = [
    { name: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { name: 'Siang', startTime: '13:00', endTime: '17:00' },
    { name: 'Malam', startTime: '18:00', endTime: '22:00' }
  ];

  useEffect(() => {
    if (schedule) {
      setFormData({
        doctorId: schedule.doctorId || '',
        doctorName: schedule.doctorName,
        poly: schedule.poly,
        days: schedule.days,
        shifts: schedule.shifts || [],
        status: schedule.status
      });
    }
  }, [schedule]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctorId) {
      newErrors.doctorId = 'Pilih dokter';
    }

    if (!formData.poly.trim()) {
      newErrors.poly = 'Poli wajib diisi';
    }

    if (formData.days.length === 0) {
      newErrors.days = 'Pilih minimal satu hari';
    }

    if (formData.shifts.length === 0) {
      newErrors.shifts = 'Tambahkan minimal satu shift';
    }

    // Validate shifts
    formData.shifts.forEach((shift, index) => {
      if (!shift.name.trim()) {
        newErrors[`shift_${index}_name`] = 'Nama shift wajib diisi';
      }
      if (!shift.startTime) {
        newErrors[`shift_${index}_startTime`] = 'Jam mulai wajib diisi';
      }
      if (!shift.endTime) {
        newErrors[`shift_${index}_endTime`] = 'Jam selesai wajib diisi';
      }
      if (shift.startTime && shift.endTime && shift.startTime >= shift.endTime) {
        newErrors[`shift_${index}_time`] = 'Jam mulai harus lebih awal dari jam selesai';
      }
    });

    // Check for overlapping shifts
    for (let i = 0; i < formData.shifts.length; i++) {
      for (let j = i + 1; j < formData.shifts.length; j++) {
        const shift1 = formData.shifts[i];
        const shift2 = formData.shifts[j];
        
        if (shift1.startTime < shift2.endTime && shift2.startTime < shift1.endTime) {
          newErrors[`shift_overlap`] = 'Waktu shift tidak boleh bertumpang tindih';
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDoctorChange = (doctorId: string) => {
    const selectedDoctor = doctors.find(d => d.id === doctorId);
    if (selectedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctorId,
        doctorName: selectedDoctor.name,
        poly: selectedDoctor.poly || selectedDoctor.specialization || ''
      }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const addShift = (template?: { name: string; startTime: string; endTime: string }) => {
    const newShift: Shift = {
      id: Date.now().toString(),
      name: template?.name || '',
      startTime: template?.startTime || '08:00',
      endTime: template?.endTime || '17:00',
      maxPatients: 20
    };

    setFormData(prev => ({
      ...prev,
      shifts: [...prev.shifts, newShift]
    }));
  };

  const updateShift = (index: number, field: keyof Shift, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      shifts: prev.shifts.map((shift, i) => 
        i === index ? { ...shift, [field]: value } : shift
      )
    }));
  };

  const removeShift = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shifts: prev.shifts.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedShifts = [...formData.shifts].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {schedule ? 'Edit Jadwal Praktek' : 'Tambah Jadwal Praktek'}
              </h2>
              <p className="text-sm text-gray-600">
                Kelola jadwal praktek dokter dengan multiple shift
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
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Doctor Selection */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-800">Informasi Dokter</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dokter *
                  </label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => handleDoctorChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all duration-300 ${
                      errors.doctorId ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Pilih Dokter</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                  {errors.doctorId && (
                    <p className="mt-1 text-sm text-red-600">{errors.doctorId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      <span>Poli Layanan *</span>
                    </div>
                  </label>
                  <select
                    value={formData.poly}
                    onChange={(e) => setFormData(prev => ({ ...prev, poly: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-all duration-300 ${
                      errors.poly ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Pilih Poli Layanan</option>
                    {polyOptions.map(poly => (
                      <option key={poly} value={poly}>
                        {poly}
                      </option>
                    ))}
                  </select>
                  {errors.poly && (
                    <p className="mt-1 text-sm text-red-600">{errors.poly}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Days Selection */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-800">Hari Praktek</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {dayOptions.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      formData.days.includes(day.value)
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {errors.days && (
                <p className="mt-2 text-sm text-red-600">{errors.days}</p>
              )}
            </div>

            {/* Shifts Management */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Shift Praktek</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const selectedTemplate = shiftTemplates.find(t => t.name === e.target.value);
                        if (selectedTemplate) {
                          addShift(selectedTemplate);
                          e.target.value = '';
                        }
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                    >
                      <option value="">Template Shift</option>
                      {shiftTemplates.map(template => (
                        <option key={template.name} value={template.name}>
                          {template.name} ({template.startTime} - {template.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => addShift()}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Shift</span>
                  </button>
                </div>
              </div>

              {errors.shifts && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{errors.shifts}</p>
                  </div>
                </div>
              )}

              {errors.shift_overlap && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{errors.shift_overlap}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {sortedShifts.map((shift, index) => {
                  const originalIndex = formData.shifts.findIndex(s => s.id === shift.id);
                  return (
                    <div key={shift.id} className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">Shift {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeShift(originalIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Shift *
                          </label>
                          <input
                            type="text"
                            value={shift.name}
                            onChange={(e) => updateShift(originalIndex, 'name', e.target.value)}
                            placeholder="Contoh: Pagi"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm ${
                              errors[`shift_${originalIndex}_name`] ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                          {errors[`shift_${originalIndex}_name`] && (
                            <p className="mt-1 text-xs text-red-600">{errors[`shift_${originalIndex}_name`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Jam Mulai *
                          </label>
                          <input
                            type="time"
                            value={shift.startTime}
                            onChange={(e) => updateShift(originalIndex, 'startTime', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm ${
                              errors[`shift_${originalIndex}_startTime`] ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                          {errors[`shift_${originalIndex}_startTime`] && (
                            <p className="mt-1 text-xs text-red-600">{errors[`shift_${originalIndex}_startTime`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Jam Selesai *
                          </label>
                          <input
                            type="time"
                            value={shift.endTime}
                            onChange={(e) => updateShift(originalIndex, 'endTime', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm ${
                              errors[`shift_${originalIndex}_endTime`] ? 'border-red-500' : 'border-gray-200'
                            }`}
                          />
                          {errors[`shift_${originalIndex}_endTime`] && (
                            <p className="mt-1 text-xs text-red-600">{errors[`shift_${originalIndex}_endTime`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maks Pasien
                          </label>
                          <input
                            type="number"
                            value={shift.maxPatients || 20}
                            onChange={(e) => updateShift(originalIndex, 'maxPatients', parseInt(e.target.value))}
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          />
                        </div>
                      </div>

                      {errors[`shift_${originalIndex}_time`] && (
                        <p className="mt-2 text-xs text-red-600">{errors[`shift_${originalIndex}_time`]}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {formData.shifts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Belum ada shift yang ditambahkan</p>
                  <p className="text-sm">Klik "Tambah Shift" untuk memulai</p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Status</h3>
              <div className="flex space-x-4">
                {[
                  { value: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800 border-green-200' },
                  { value: 'inactive', label: 'Tidak Aktif', color: 'bg-gray-100 text-gray-800 border-gray-200' }
                ].map(status => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: status.value as any }))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      formData.status === status.value
                        ? status.color
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
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
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Menyimpan...' : 'Simpan Jadwal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;