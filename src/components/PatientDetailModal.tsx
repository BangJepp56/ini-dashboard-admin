import React from 'react';
import { X, User, Phone, MapPin, Calendar, Clock, FileText } from 'lucide-react';
import { PatientRegistration } from '../types';

interface PatientDetailModalProps {
  patient: PatientRegistration;
  onClose: () => void;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patient, onClose }) => {
  const getStatusBadge = (status: PatientRegistration['status']) => {
    const statusConfig = {
      'Terjadwal': 'bg-blue-100 text-blue-700',
      'Dalam Antrian': 'bg-yellow-100 text-yellow-700',
      'Selesai': 'bg-green-100 text-green-700',
      'Dibatalkan': 'bg-red-100 text-red-700'
    };
    
    return `inline-block px-3 py-1 text-sm font-medium rounded-full ${statusConfig[status]}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Detail Pasien</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                  <p className="text-gray-800 font-medium">{patient.nama}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">NIK</p>
                  <p className="text-gray-800">{patient.nik}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Jenis Kelamin</p>
                  <p className="text-gray-800">{patient.jenis_kelamin}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Telepon</p>
                  <p className="text-gray-800">{patient.telepon}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Alamat</p>
                  <p className="text-gray-800">{patient.alamat}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Layanan</p>
                  <p className="text-gray-800">{patient.layanan}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Dokter</p>
                  <p className="text-gray-800">{patient.dokter}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 mt-1">
                  <span className={getStatusBadge(patient.status)}>
                    {patient.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Detail Jadwal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal</p>
                  <p className="text-gray-800">{patient.tanggal}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Waktu</p>
                  <p className="text-gray-800">{patient.waktu}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Complaint */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Keluhan</h3>
            <p className="text-gray-700">{patient.keluhan}</p>
          </div>

          {/* Registration Date */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">
              <strong>Tanggal Pendaftaran:</strong> {new Date(patient.tanggal_daftar).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;