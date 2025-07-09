import React, { useState, useEffect } from 'react';
import { X, User, Stethoscope } from 'lucide-react';
import { Doctor } from '../types';

interface DoctorModalProps {
  doctor: Doctor | null;
  onClose: () => void;
  onSave: (doctor: Omit<Doctor, 'id'>) => void;
}

const DoctorModal: React.FC<DoctorModalProps> = ({ doctor, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doctor) {
      setName(doctor.name || '');
      setSpecialization(doctor.specialization || '');
    } else {
      setName('');
      setSpecialization('');
    }
    setError(null);
  }, [doctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input
    if (!name.trim()) {
      setError('Nama dokter harus diisi');
      return;
    }

    if (!specialization.trim()) {
      setError('Spesialisasi harus dipilih');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Hanya kirim data yang diperlukan - HAPUS field poli yang bermasalah
      const doctorData = {
        name: name.trim(),
        specialization: specialization.trim(),
      };
      
      console.log('Sending doctor data:', doctorData); // Debug log
      
      await onSave(doctorData);
      
      // Reset form jika berhasil
      setName('');
      setSpecialization('');
      
    } catch (error) {
      console.error('Error saving doctor:', error);
      setError('Gagal menyimpan data dokter');
    } finally {
      setLoading(false);
    }
  };

  const specializationOptions = [
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {doctor ? 'Edit Dokter' : 'Tambah Dokter Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nama Dokter
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama dokter"
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
              <Stethoscope className="w-4 h-4 inline mr-1" />
              Spesialisasi
            </label>
            <select
              id="specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
            >
              <option value="">Pilih Spesialisasi</option>
              {specializationOptions.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

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
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : doctor ? 'Simpan Perubahan' : 'Tambah Dokter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorModal;