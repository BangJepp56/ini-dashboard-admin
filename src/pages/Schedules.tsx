import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Calendar, AlertCircle, Search, Trash2, ArrowUpRight, Clock, Stethoscope, Bell, X } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Schedule, Doctor } from '../types';
import ScheduleModal from '../components/ScheduleModal';
import HolidayModal from '../components/HolidayModal';

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredSchedules, setFilteredSchedule] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [poliFilter, setPoliFilter] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [cancelHolidayLoading, setCancelHolidayLoading] = useState<string | null>(null);

  // Function to create notification
  const createNotification = async (
    type: 'holiday_set' | 'holiday_ended' | 'holiday_cancelled' | 'schedule_updated' | 'schedule_created' | 'schedule_deleted',
    scheduleData: Schedule,
    customMessage?: string
  ) => {
    try {
      const messages = {
        'holiday_set': `Dokter ${scheduleData.doctorName} di Poli ${scheduleData.poly} libur dari ${scheduleData.holidayStartDate} hingga ${scheduleData.holidayEndDate} karena ${scheduleData.holidayReason}.`,
        'holiday_ended': `Dokter ${scheduleData.doctorName} di Poli ${scheduleData.poly} telah selesai libur dan kembali aktif.`,
        'holiday_cancelled': `Libur dokter ${scheduleData.doctorName} di Poli ${scheduleData.poly} telah dibatalkan dan kembali aktif.`,
        'schedule_updated': `Jadwal praktek dokter ${scheduleData.doctorName} di Poli ${scheduleData.poly} telah diperbarui.`,
        'schedule_created': `Jadwal praktek baru untuk dokter ${scheduleData.doctorName} di Poli ${scheduleData.poly} telah dibuat.`,
        'schedule_deleted': `Jadwal praktek dokter ${scheduleData.doctorName} di Poli ${scheduleData.poly} telah dihapus.`
      };

      const notificationData = {
        doctorId: scheduleData.doctorId || '',
        doctorName: scheduleData.doctorName,
        message: customMessage || messages[type],
        poly: scheduleData.poly,
        read: false,
        scheduleId: scheduleData.id,
        timestamp: new Date().toISOString(),
        type: type
      };

      await addDoc(collection(db, 'notifications'), notificationData);
      console.log(`Notification created: ${type}`);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  // Function to update doctor status in doctors collection
  const updateDoctorStatus = async (doctorId: string, status: 'active' | 'holiday' | 'inactive') => {
    try {
      if (!doctorId) return;
      
      await updateDoc(doc(db, 'doctors', doctorId), {
        status: status,
        lastUpdated: new Date().toISOString()
      });
      
      // Update local doctors state
      setDoctors(prevDoctors =>
        prevDoctors.map(doctor =>
          doctor.id === doctorId
            ? { ...doctor, status: status, lastUpdated: new Date().toISOString() }
            : doctor
        )
      );
      
      console.log(`Doctor status updated: ${doctorId} -> ${status}`);
    } catch (error) {
      console.error('Error updating doctor status:', error);
    }
  };

  // Enhanced function to check if holiday is expired
  const isHolidayExpired = useCallback((schedule: Schedule) => {
    if (schedule.status !== 'holiday' || !schedule.holidayEndDate) return false;
    
    const now = new Date();
    const endDate = new Date(schedule.holidayEndDate);
    endDate.setHours(23, 59, 59, 999);
    
    return now > endDate;
  }, []);

  // Enhanced function to check if holiday should start
  const shouldHolidayStart = useCallback((schedule: Schedule) => {
    if (schedule.status !== 'active' || !schedule.holidayStartDate) return false;
    
    const now = new Date();
    const startDate = new Date(schedule.holidayStartDate);
    startDate.setHours(0, 0, 0, 0);
    
    return now >= startDate && schedule.holidayEndDate;
  }, []);

  // Enhanced auto-update function
  const checkAndUpdateScheduleStatus = useCallback(async () => {
    const now = new Date();
    console.log('Checking schedule status at:', now.toISOString());
    
    const updatedSchedules = [...schedules];
    let hasChanges = false;

    for (let i = 0; i < updatedSchedules.length; i++) {
      const schedule = updatedSchedules[i];
      let shouldUpdate = false;
      let newStatus = schedule.status;
      let notificationType: 'holiday_ended' | 'holiday_set' | null = null;

      // Check if holiday should end
      if (schedule.status === 'holiday' && isHolidayExpired(schedule)) {
        newStatus = 'active';
        notificationType = 'holiday_ended';
        shouldUpdate = true;
        console.log(`Holiday expired for ${schedule.doctorName}, activating...`);
      }
      
      // Check if holiday should start (for future-dated holidays)
      else if (schedule.status === 'active' && shouldHolidayStart(schedule)) {
        newStatus = 'holiday';
        notificationType = 'holiday_set';
        shouldUpdate = true;
        console.log(`Holiday starting for ${schedule.doctorName}...`);
      }

      if (shouldUpdate) {
        try {
          const updatedSchedule: Schedule = {
            ...schedule,
            status: newStatus,
            ...(newStatus === 'active' && {
              holidayReason: '',
              holidayStartDate: '',
              holidayEndDate: ''
            }),
            lastUpdated: now.toISOString()
          };

          // Update in Firebase
          const updateData = {
            status: newStatus,
            lastUpdated: now.toISOString(),
            ...(newStatus === 'active' && {
              holidayReason: '',
              holidayStartDate: '',
              holidayEndDate: ''
            })
          };

          await updateDoc(doc(db, 'schedules', schedule.id), updateData);
          
          // Update doctor status
          await updateDoctorStatus(schedule.doctorId || '', newStatus);
          
          // Create notification
          if (notificationType) {
            await createNotification(notificationType, updatedSchedule);
          }
          
          // Update local state
          updatedSchedules[i] = updatedSchedule;
          hasChanges = true;
          
        } catch (error) {
          console.error(`Error updating schedule ${schedule.id}:`, error);
        }
      }
    }

    if (hasChanges) {
      setSchedules(updatedSchedules);
      console.log('Schedule status updated successfully');
    }
  }, [schedules, isHolidayExpired, shouldHolidayStart]);

  // Get unique poli categories from schedules
  const getPoliCategories = () => {
    const uniquePolis = [...new Set(schedules.map(schedule => schedule.poly))];
    return uniquePolis.sort();
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchTerm, statusFilter, poliFilter]);

  // Enhanced useEffect for auto-update with more frequent checks
  useEffect(() => {
    if (schedules.length === 0) return;

    // Initial check
    checkAndUpdateScheduleStatus();

    // Set up intervals for different check frequencies
    const minuteInterval = setInterval(checkAndUpdateScheduleStatus, 60 * 1000); // Every minute
    const hourInterval = setInterval(checkAndUpdateScheduleStatus, 60 * 60 * 1000); // Every hour

    return () => {
      clearInterval(minuteInterval);
      clearInterval(hourInterval);
    };
  }, [schedules, checkAndUpdateScheduleStatus]);

  const fetchData = async () => {
    try {
      const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
      const schedulesData = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[];

      const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
      const doctorsData = doctorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Doctor[];
      
      const doctorIds = new Set(doctorsData.map(doctor => doctor.id));
      const validSchedules = schedulesData.filter(schedule => {
        if (schedule.doctorId && !doctorIds.has(schedule.doctorId)) {
          deleteDoc(doc(db, 'schedules', schedule.id)).catch(console.error);
          return false;
        }
        return true;
      });
      
      setSchedules(validSchedules);
      setDoctors(doctorsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = schedules;

    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.poly.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    if (poliFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.poly === poliFilter);
    }

    setFilteredSchedule(filtered);
  };

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setShowScheduleModal(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowScheduleModal(true);
  };

  const handleSetHoliday = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowHolidayModal(true);
  };

  // New function to cancel holiday
  const handleCancelHoliday = async (schedule: Schedule) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan libur dan mengaktifkan kembali jadwal ini?')) {
      return;
    }

    setCancelHolidayLoading(schedule.id);
    try {
      const updatedSchedule: Schedule = {
        ...schedule,
        status: 'active',
        holidayReason: '',
        holidayStartDate: '',
        holidayEndDate: '',
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(doc(db, 'schedules', schedule.id), {
        status: 'active',
        holidayReason: '',
        holidayStartDate: '',
        holidayEndDate: '',
        lastUpdated: new Date().toISOString()
      });

      // Update doctor status
      await updateDoctorStatus(schedule.doctorId || '', 'active');
      
      // Create notification
      await createNotification('holiday_cancelled', updatedSchedule);

      setSchedules(schedules.map(s =>
        s.id === schedule.id ? updatedSchedule : s
      ));
      
      console.log(`Holiday cancelled for ${schedule.doctorName}`);
    } catch (error) {
      console.error('Error cancelling holiday:', error);
      alert('Gagal membatalkan libur');
    } finally {
      setCancelHolidayLoading(null);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      return;
    }

    setDeleteLoading(scheduleId);
    try {
      const scheduleToDelete = schedules.find(s => s.id === scheduleId);
      
      if (scheduleToDelete) {
        await deleteDoc(doc(db, 'schedules', scheduleId));
        
        // Update doctor status to inactive if no other active schedules
        const doctorOtherSchedules = schedules.filter(s => 
          s.doctorId === scheduleToDelete.doctorId && s.id !== scheduleId
        );
        
        if (doctorOtherSchedules.length === 0) {
          await updateDoctorStatus(scheduleToDelete.doctorId || '', 'inactive');
        }
        
        // Create notification
        await createNotification('schedule_deleted', scheduleToDelete);
        
        setSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Gagal menghapus jadwal');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSaveSchedule = async (scheduleData: Omit<Schedule, 'id'>) => {
    try {
      if (selectedSchedule) {
        // Update existing schedule
        await updateDoc(doc(db, 'schedules', selectedSchedule.id), {
          ...scheduleData,
          lastUpdated: new Date().toISOString()
        });
        
        const updatedSchedule = { ...selectedSchedule, ...scheduleData };
        
        // Update doctor status
        await updateDoctorStatus(scheduleData.doctorId || '', scheduleData.status);
        
        // Create notification
        await createNotification('schedule_updated', updatedSchedule);
        
        setSchedules(schedules.map(schedule =>
          schedule.id === selectedSchedule.id
            ? { ...schedule, ...scheduleData }
            : schedule
        ));
      } else {
        // Add new schedule
        const docRef = await addDoc(collection(db, 'schedules'), {
          ...scheduleData,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
        
        const newSchedule: Schedule = { 
          id: docRef.id, 
          ...scheduleData,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        // Update doctor status
        await updateDoctorStatus(scheduleData.doctorId || '', scheduleData.status);
        
        // Create notification
        await createNotification('schedule_created', newSchedule);
        
        setSchedules([...schedules, newSchedule]);
      }
      
      setShowScheduleModal(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Gagal menyimpan jadwal');
    }
  };

  const handleSaveHoliday = async (holidayData: { reason: string; startDate: string; endDate: string }) => {
    if (!selectedSchedule) return;

    try {
      const updatedSchedule = {
        ...selectedSchedule,
        status: 'holiday',
        holidayReason: holidayData.reason,
        holidayStartDate: holidayData.startDate,
        holidayEndDate: holidayData.endDate,
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(doc(db, 'schedules', selectedSchedule.id), updatedSchedule);
      
      // Update doctor status to holiday
      await updateDoctorStatus(selectedSchedule.doctorId || '', 'holiday');
      
      // Create notification
      await createNotification('holiday_set', updatedSchedule);
      
      setSchedules(schedules.map(schedule =>
        schedule.id === selectedSchedule.id ? updatedSchedule : schedule
      ));
      
      setShowHolidayModal(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error('Error setting holiday:', error);
      alert('Gagal mengatur libur');
    }
  };

  const handleActivateExpiredHoliday = async (schedule: Schedule) => {
    try {
      const updatedSchedule: Schedule = {
        ...schedule,
        status: 'active',
        holidayReason: '',
        holidayStartDate: '',
        holidayEndDate: '',
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(doc(db, 'schedules', schedule.id), {
        status: 'active',
        holidayReason: '',
        holidayStartDate: '',
        holidayEndDate: '',
        lastUpdated: new Date().toISOString()
      });

      // Update doctor status
      await updateDoctorStatus(schedule.doctorId || '', 'active');
      
      // Create notification
      await createNotification('holiday_ended', updatedSchedule);

      setSchedules(schedules.map(s =>
        s.id === schedule.id ? updatedSchedule : s
      ));
    } catch (error) {
      console.error('Error activating schedule:', error);
      alert('Gagal mengaktifkan jadwal');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'holiday': 'bg-red-100 text-red-800 border-red-200',
      'inactive': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const statusText = {
      'active': 'Aktif',
      'holiday': 'Libur',
      'inactive': 'Tidak Aktif'
    };

    type StatusKey = keyof typeof statusConfig;
    const safeStatus = (['active', 'holiday', 'inactive'].includes(status) ? status : 'inactive') as StatusKey;

    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${statusConfig[safeStatus]}`}>
        {statusText[safeStatus] || 'Tidak Diketahui'}
      </span>
    );
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

  const getRemainingHolidayDays = (schedule: Schedule) => {
    if (schedule.status !== 'holiday' || !schedule.holidayEndDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(schedule.holidayEndDate);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPoliFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (poliFilter !== 'all') count++;
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data jadwal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between text-left">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3 md:mb-1">
              Jadwal Praktek Dokter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8 md:mb-0">
              Kelola jadwal praktek dan libur dokter dengan mudah dan efisien
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/60 px-4 py-2 rounded-xl border border-white/50">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>Auto-update aktif</span>
            </div>
            <button
              onClick={handleAddSchedule}
              className="group relative bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center space-x-3 hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Tambah Jadwal Baru</span>
              <ArrowUpRight className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pencarian
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama dokter atau poli..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 xl:gap-6">
                <div className="sm:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-300"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="holiday">Libur</option>
                    <option value="inactive">Tidak Aktif</option>
                  </select>
                </div>

                <div className="sm:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      <span>Poli Layanan</span>
                    </div>
                  </label>
                  <select
                    value={poliFilter}
                    onChange={(e) => setPoliFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-300"
                  >
                    <option value="all">Semua Poli</option>
                    {getPoliCategories().map((poli) => (
                      <option key={poli} value={poli}>
                        {poli}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Indicator */}
            {getActiveFiltersCount() > 0 && (
              <div className="mt-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-emerald-700 font-medium">
                    {getActiveFiltersCount()} filter aktif
                  </span>
                  <div className="flex items-center space-x-2">
                    {searchTerm && (
                      <span className="px-2 py-1 bg-emerald-200 text-emerald-800 rounded-lg text-xs">
                        "{searchTerm}"
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="px-2 py-1 bg-emerald-200 text-emerald-800 rounded-lg text-xs">
                        Status: {statusFilter === 'active' ? 'Aktif' : statusFilter === 'holiday' ? 'Libur' : 'Tidak Aktif'}
                      </span>
                    )}
                    {poliFilter !== 'all' && (
                      <span className="px-2 py-1 bg-emerald-200 text-emerald-800 rounded-lg text-xs">
                        Poli: {poliFilter}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium hover:underline"
                >
                  Bersihkan Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jadwal</p>
                <p className="text-2xl font-bold text-gray-800">{schedules.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Jadwal Aktif</p>
                <p className="text-2xl font-bold text-green-600">{schedules.filter(s => s.status === 'active').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sedang Libur</p>
                <p className="text-2xl font-bold text-red-600">{schedules.filter(s => s.status === 'holiday').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tidak Aktif</p>
                <p className="text-2xl font-bold text-gray-600">{schedules.filter(s => s.status === 'inactive').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSchedules.map((schedule) => (
            <div key={schedule.id} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 hover:border-emerald-200 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Dr. {schedule.doctorName}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">{schedule.poly}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatDays(schedule.days)} • {schedule.timeStart} - {schedule.timeEnd}
                      </span>
                    </div>
                    {getStatusBadge(schedule.status)}
                  </div>
                </div>

                {/* Holiday Information */}
                {schedule.status === 'holiday' && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Informasi Libur</span>
                    </div>
                    <p className="text-sm text-red-700 mb-2">
                      <strong>Alasan:</strong> {schedule.holidayReason}
                    </p>
                    <p className="text-sm text-red-700 mb-2">
                      <strong>Periode:</strong> {schedule.holidayStartDate} - {schedule.holidayEndDate}
                    </p>
                    {isHolidayExpired(schedule) ? (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Libur telah berakhir - Akan diaktifkan otomatis</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Sisa {getRemainingHolidayDays(schedule)} hari
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleEditSchedule(schedule)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors duration-200 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>

                  {schedule.status === 'active' && (
                    <button
                      onClick={() => handleSetHoliday(schedule)}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors duration-200 text-sm font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Atur Libur</span>
                    </button>
                  )}

                  {schedule.status === 'holiday' && (
                    <>
                      {isHolidayExpired(schedule) ? (
                        <button
                          onClick={() => handleActivateExpiredHoliday(schedule)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-200 text-sm font-medium"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Aktifkan</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCancelHoliday(schedule)}
                          disabled={cancelHolidayLoading === schedule.id}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
                        >
                          {cancelHolidayLoading === schedule.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-700 border-t-transparent" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          <span>Batal Libur</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    disabled={deleteLoading === schedule.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
                  >
                    {deleteLoading === schedule.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 border-t-transparent" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Hapus</span>
                  </button>
                </div>

                {/* Last Updated */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Terakhir diperbarui: {new Date(schedule.lastUpdated || '').toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSchedules.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-12 shadow-lg">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Tidak ada jadwal ditemukan
              </h3>
              <p className="text-gray-600 mb-6">
                {getActiveFiltersCount() > 0 
                  ? "Coba ubah filter pencarian atau buat jadwal baru."
                  : "Belum ada jadwal praktek dokter. Mulai dengan menambahkan jadwal baru."
                }
              </p>
              {getActiveFiltersCount() > 0 ? (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Bersihkan Filter
                  </button>
                  <button
                    onClick={handleAddSchedule}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-200 font-medium"
                  >
                    Tambah Jadwal Baru
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddSchedule}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors duration-200 font-medium"
                >
                  Tambah Jadwal Baru
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedSchedule(null);
          }}
          onSave={handleSaveSchedule}
          schedule={selectedSchedule}
          doctors={doctors}
        />
      )}

      {showHolidayModal && (
        <HolidayModal
          isOpen={showHolidayModal}
          onClose={() => {
            setShowHolidayModal(false);
            setSelectedSchedule(null);
          }}
          onSave={handleSaveHoliday}
          schedule={selectedSchedule}
        />
      )}
    </div>
  );
};

export default Schedules;