import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Calendar, Clock, Activity, ArrowUpRight } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PatientRegistration, Doctor, Schedule } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayPatients: 0,
    totalDoctors: 0,
    activeSchedules: 0
  });

  const [recentPatients, setRecentPatients] = useState<PatientRegistration[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch patients
      const patientsSnapshot = await getDocs(collection(db, 'patients'));
      const patients = patientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PatientRegistration[];
      
      // Fetch doctors
      const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
      const doctors = doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Doctor[];
      
      // Fetch schedules
      const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
      const schedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];

      // Calculate today's patients
      const today = new Date().toISOString().split('T')[0];
      const todayPatients = patients.filter(patient => patient.tanggal === today);

      // Active schedules (not on holiday)
      const activeSchedules = schedules.filter(schedule => schedule.status !== 'holiday');

      setStats({
        totalPatients: patients.length,
        todayPatients: todayPatients.length,
        totalDoctors: doctors.length,
        activeSchedules: activeSchedules.length
      });

      // Recent patients (last 8)
      const sortedPatients = patients
        .sort((a, b) => new Date(b.tanggal_daftar).getTime() - new Date(a.tanggal_daftar).getTime())
        .slice(0, 8);
      setRecentPatients(sortedPatients);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Pasien',
      value: stats.totalPatients,
      icon: Users,
      gradient: 'from-blue-600 to-blue-700',
      bgGradient: 'from-blue-50 to-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Pasien Hari Ini',
      value: stats.todayPatients,
      icon: Clock,
      gradient: 'from-emerald-600 to-emerald-700',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Total Dokter',
      value: stats.totalDoctors,
      icon: UserCheck,
      gradient: 'from-purple-600 to-purple-700',
      bgGradient: 'from-purple-50 to-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Jadwal Aktif',
      value: stats.activeSchedules,
      icon: Calendar,
      gradient: 'from-orange-600 to-orange-700',
      bgGradient: 'from-orange-50 to-orange-100',
      iconColor: 'text-orange-600'
    }
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Terjadwal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Dalam Antrian':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Selesai':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Dibatalkan':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
        Dashboard Admin
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
        Selamat datang di sistem manajemen RSIA Prima Qonita. Monitor aktivitas dan kelola data dengan mudah.
        </p>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl" />
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.bgGradient} p-3 rounded-xl shadow-sm`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  <span>Data terkini</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Patients - Full Width */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-xl">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Aktivitas Pasien Terbaru</h2>
                  <p className="text-gray-600">Pantau registrasi dan status pasien terkini</p>
                </div>
              </div>
            </div>

            {recentPatients.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="group">
                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 p-6 transition-all duration-300 group-hover:shadow-md group-hover:border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {patient.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800 text-lg">{patient.nama}</h3>
                              <p className="text-sm text-gray-600">{patient.layanan}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Tanggal:</span> {patient.tanggal}
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(patient.status)}`}>
                              {patient.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Belum Ada Data Pasien</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Sistem belum memiliki data pasien. Data akan muncul setelah ada registrasi pasien baru.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;