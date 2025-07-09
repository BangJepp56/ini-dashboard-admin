import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Filter, Eye, Edit, Trash2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FollowUpAppointment, PatientRegistration } from '../types';
import FollowUpDetailModal from '../components/FollowUpDetailModal';
import FollowUpEditModal from '../components/FollowUpEditModal';
import * as XLSX from 'xlsx';

const FollowUpAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [, setPatients] = useState<PatientRegistration[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<FollowUpAppointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<FollowUpAppointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter, dateFilter, customDateFrom, customDateTo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch follow-up appointments
      const appointmentsSnapshot = await getDocs(collection(db, 'followUpAppointments'));
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FollowUpAppointment[];

      // Fetch patients for reference
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const patientsData = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PatientRegistration[];

      setAppointments(appointmentsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Date filter
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(appointment => appointment.appointmentDate === todayString);
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        filtered = filtered.filter(appointment => appointment.appointmentDate === tomorrowString);
        break;
      case 'this_week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filtered = filtered.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          return appointmentDate >= weekStart && appointmentDate <= weekEnd;
        });
        break;
      case 'custom':
        if (customDateFrom && customDateTo) {
          filtered = filtered.filter(appointment => {
            const appointmentDate = appointment.appointmentDate;
            return appointmentDate >= customDateFrom && appointmentDate <= customDateTo;
          });
        }
        break;
    }

    // Sort by appointment date and time
    filtered.sort((a, b) => {
      const dateCompare = new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.appointmentTime.localeCompare(b.appointmentTime);
    });

    setFilteredAppointments(filtered);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'followUpAppointments', appointmentId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setAppointments(appointments.map(appointment =>
        appointment.id === appointmentId
          ? { ...appointment, status: newStatus, updatedAt: new Date().toISOString() }
          : appointment
      ));
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Gagal mengupdate status');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal kontrol ini?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'followUpAppointments', appointmentId));
      setAppointments(appointments.filter(appointment => appointment.id !== appointmentId));
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Gagal menghapus jadwal kontrol');
    }
  };

  const handleEditAppointment = async (appointmentData: Partial<FollowUpAppointment>) => {
    if (!selectedAppointment) return;

    try {
      await updateDoc(doc(db, 'followUpAppointments', selectedAppointment.id), {
        ...appointmentData,
        updatedAt: new Date().toISOString()
      });

      setAppointments(appointments.map(appointment =>
        appointment.id === selectedAppointment.id
          ? { ...appointment, ...appointmentData, updatedAt: new Date().toISOString() }
          : appointment
      ));

      setShowEditModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Gagal mengupdate jadwal kontrol');
    }
  };

  const exportToExcel = () => {
    const excelData = filteredAppointments.map((appointment, index) => ({
      No: index + 1,
      'ID Jadwal': appointment.id,
      'Nama Pasien': appointment.patientName,
      'Dokter': appointment.doctorName,
      'Tanggal Kontrol': appointment.appointmentDate,
      'Waktu Kontrol': appointment.appointmentTime,
      'Status': appointment.status || 'Terjadwal',
      'Catatan': appointment.notes || '-',
      'Tanggal Dibuat': new Date(appointment.createdAt).toLocaleDateString('id-ID'),
      'Terakhir Update': appointment.updatedAt ? new Date(appointment.updatedAt).toLocaleDateString('id-ID') : '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, 
      { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Kontrol');
    XLSX.writeFile(wb, `Jadwal_Kontrol_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'rescheduled': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const statusText = {
      'scheduled': 'Terjadwal',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan',
      'rescheduled': 'Dijadwal Ulang'
    };

    const safeStatus = status || 'scheduled';
    const config = statusConfig[safeStatus as keyof typeof statusConfig] || statusConfig.scheduled;
    const text = statusText[safeStatus as keyof typeof statusText] || 'Terjadwal';

    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${config}`}>
        {text}
      </span>
    );
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate >= today && appointmentDate <= nextWeek && 
             (appointment.status === 'scheduled' || !appointment.status);
    }).length;
  };

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(appointment => 
      appointment.appointmentDate === today && 
      (appointment.status === 'scheduled' || !appointment.status)
    ).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data jadwal kontrol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
              Jadwal Kontrol Pasien
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Kelola dan pantau jadwal kontrol lanjutan pasien dengan mudah
            </p>
          </div>
          <button
            onClick={exportToExcel}
            className="mt-4 md:mt-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center space-x-3 hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Export Excel</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jadwal</p>
                <p className="text-2xl font-bold text-gray-800">{appointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hari Ini</p>
                <p className="text-2xl font-bold text-emerald-600">{getTodayAppointments()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Minggu Ini</p>
                <p className="text-2xl font-bold text-orange-600">{getUpcomingAppointments()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama pasien, dokter, atau ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-300"
                >
                  <option value="all">Semua Status</option>
                  <option value="scheduled">Terjadwal</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                  <option value="rescheduled">Dijadwal Ulang</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-300"
                >
                  <option value="all">Semua Tanggal</option>
                  <option value="today">Hari Ini</option>
                  <option value="tomorrow">Besok</option>
                  <option value="this_week">Minggu Ini</option>
                  <option value="custom">Pilih Tanggal</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700">
                  Menampilkan {filteredAppointments.length} dari {appointments.length} jadwal kontrol
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Pasien
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Dokter
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Jadwal Kontrol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Catatan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="group hover:bg-white/60 transition-all duration-300">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-white font-semibold">
                              {appointment.patientName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                            <div className="text-sm text-gray-500">ID: {appointment.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{appointment.doctorName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(appointment.appointmentDate).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{appointment.appointmentTime}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(appointment.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {appointment.notes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {appointment.status !== 'completed' && (
                            <button
                              onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                              title="Tandai Selesai"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada jadwal kontrol</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                    ? "Tidak ada jadwal kontrol yang sesuai dengan filter yang dipilih."
                    : "Belum ada jadwal kontrol yang dibuat."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && selectedAppointment && (
        <FollowUpDetailModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAppointment(null);
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {showEditModal && selectedAppointment && (
        <FollowUpEditModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAppointment(null);
          }}
          onSave={handleEditAppointment}
        />
      )}
    </div>
  );
};

export default FollowUpAppointments;