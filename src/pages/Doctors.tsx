import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, UserCheck, Stethoscope } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Doctor } from '../types';
import DoctorModal from '../components/DoctorModal';

const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const snapshot = await getDocs(collection(db, 'doctors'));
      const doctorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      
      console.log('Fetched doctors:', doctorsData); // Debug log
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Gagal mengambil data dokter');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleAddDoctor = () => {
    setSelectedDoctor(null);
    setShowModal(true);
    setError(null);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
    setError(null);
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokter ini?')) {
      try {
        await deleteDoc(doc(db, 'doctors', doctorId));
        setDoctors(doctors.filter(doctor => doctor.id !== doctorId));
        setError(null);
      } catch (error) {
        console.error('Error deleting doctor:', error);
        setError('Gagal menghapus dokter');
      }
    }
  };

  const handleSaveDoctor = async (doctorData: Omit<Doctor, 'id'>) => {
    try {
      setError(null);
      
      // Validasi data sebelum menyimpan
      if (!doctorData.name || !doctorData.specialization) {
        throw new Error('Nama dan spesialisasi dokter harus diisi');
      }

      console.log('Saving doctor data:', doctorData); // Debug log
      
      if (selectedDoctor) {
        // Update existing doctor
        console.log('Updating doctor with ID:', selectedDoctor.id); // Debug log
        await updateDoc(doc(db, 'doctors', selectedDoctor.id), doctorData);
        setDoctors(doctors.map(doctor =>
          doctor.id === selectedDoctor.id
            ? { ...doctor, ...doctorData }
            : doctor
        ));
      } else {
        // Add new doctor
        console.log('Adding new doctor'); // Debug log
        const docRef = await addDoc(collection(db, 'doctors'), doctorData);
        const newDoctor: Doctor = { id: docRef.id, ...doctorData };
        setDoctors([...doctors, newDoctor]);
      }
      
      setShowModal(false);
      setSelectedDoctor(null);
      console.log('Doctor saved successfully'); // Debug log
      
    } catch (error) {
      console.error('Error saving doctor:', error);
      const message = error instanceof Error ? error.message : String(error);
      setError(`Gagal menyimpan data dokter: ${message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
            Manajemen Dokter
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mb-6">
            Kelola data dokter dan spesialisasi dengan mudah dan efisien
          </p>
          <button
            onClick={handleAddDoctor}
            className="group relative bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center space-x-3 hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Tambah Dokter Baru</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Pencarian Dokter</h2>
                <p className="text-gray-600">Cari berdasarkan nama atau spesialisasi</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Masukkan nama dokter atau spesialisasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/70 backdrop-blur-sm transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-xl">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Daftar Dokter</h2>
                <p className="text-gray-600">Total {filteredDoctors.length} dokter tersedia</p>
              </div>
            </div>

            {filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="group">
                    <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 p-6 transition-all duration-300 group-hover:shadow-lg group-hover:border-gray-200 group-hover:scale-105">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {doctor.name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">{doctor.name || 'Nama tidak tersedia'}</h3>
                            <div className="flex items-center space-x-2">
                              <Stethoscope className="w-4 h-4 text-emerald-600" />
                              <p className="text-emerald-600 font-medium">{doctor.specialization || 'Spesialisasi tidak tersedia'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditDoctor(doctor)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-300 group-hover:scale-110"
                            title="Edit Dokter"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doctor.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-300 group-hover:scale-110"
                            title="Hapus Dokter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {searchTerm ? 'Tidak ada dokter yang ditemukan' : 'Belum ada data dokter'}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Coba ubah kata kunci pencarian atau tambah dokter baru'
                    : 'Mulai dengan menambahkan dokter pertama ke sistem'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <DoctorModal
            doctor={selectedDoctor}
            onClose={() => {
              setShowModal(false);
              setSelectedDoctor(null);
              setError(null);
            }}
            onSave={handleSaveDoctor}
          />
        )}
      </div>
    </div>
  );
};

export default Doctors;