import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PatientRegistration } from '../types';

interface PatientStatusModalProps {
  patient: PatientRegistration;
  onClose: () => void;
  onUpdateStatus: (patientId: string, status: PatientRegistration['status']) => void;
}

const PatientStatusModal: React.FC<PatientStatusModalProps> = ({
  patient,
  onClose,
  onUpdateStatus
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PatientRegistration['status']>(patient.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStatus === patient.status) {
      onClose();
      return;
    }

    setIsUpdating(true);
    
    try {
      // Simulasi API call - sesuaikan dengan implementasi backend Anda
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUpdateStatus(patient.id, selectedStatus);
      onClose();
    } catch (error) {
      console.error('Error updating patient status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Status options yang disinkronkan dengan Flutter
  const statusOptions: { 
    value: PatientRegistration['status']; 
    label: string; 
    description: string;
    color: string;
    bgColor: string;
  }[] = [
    { 
      value: 'Terjadwal', 
      label: 'Terjadwal', 
      description: 'Pasien sudah terjadwal untuk pemeriksaan',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200'
    },
    { 
      value: 'Dalam Antrian', 
      label: 'Dalam Antrian', 
      description: 'Pasien sedang dalam antrian pemeriksaan',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    { 
      value: 'Selesai', 
      label: 'Selesai', 
      description: 'Pemeriksaan telah selesai dilakukan',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200'
    },
    { 
      value: 'Dibatalkan', 
      label: 'Dibatalkan', 
      description: 'Jadwal pemeriksaan dibatalkan',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200'
    },
  ];

  // Mendapatkan warna status untuk tampilan current status
  const getCurrentStatusColor = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'text-gray-600';
  };

  const getCurrentStatusBgColor = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.bgColor : 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {patient.nama?.charAt(0) || 'P'}
                </span>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Ubah Status Pasien</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-medium text-gray-800 text-lg">{patient.nama}</p>
              <p className="text-sm text-gray-500">NIK: {patient.nik}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getCurrentStatusBgColor(patient.status)} ${getCurrentStatusColor(patient.status)}`}>
              {patient.status}
            </div>
          </div>
          
          {/* Additional patient info jika ada */}
          {patient.tanggal && (
            <div className="flex items-center text-sm text-gray-600 mt-2">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {patient.tanggal} {patient.waktu && `• ${patient.waktu}`}
            </div>
          )}
          
          {patient.layanan && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z" />
              </svg>
              {patient.layanan}
            </div>
          )}
        </div>

        {/* Status Selection Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Pilih Status Baru:
            </label>
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <label 
                  key={option.value} 
                  className={`
                    flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                    ${selectedStatus === option.value 
                      ? `${option.bgColor} border-current ${option.color} shadow-sm` 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => setSelectedStatus(e.target.value as PatientRegistration['status'])}
                    disabled={isUpdating}
                    className="mt-1 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-800">{option.label}</div>
                      {selectedStatus === option.value && (
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUpdating || selectedStatus === patient.status}
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </form>

        {/* Status Change Info */}
        {selectedStatus !== patient.status && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-blue-700">
                Status akan berubah dari <span className="font-medium">{patient.status}</span> ke <span className="font-medium">{selectedStatus}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientStatusModal;