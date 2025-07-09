import React from 'react';
import { X, User, Calendar, Clock, FileText, Stethoscope, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { FollowUpAppointment } from '../types';

interface FollowUpDetailModalProps {
  appointment: FollowUpAppointment;
  onClose: () => void;
  onStatusUpdate: (appointmentId: string, status: string) => void;
}

const FollowUpDetailModal: React.FC<FollowUpDetailModalProps> = ({
  appointment,
  onClose,
  onStatusUpdate
}) => {
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
      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${config}`}>
        {text}
      </span>
    );
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'rescheduled':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const isUpcoming = () => {
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    return appointmentDateTime > new Date();
  };

  const getTimeUntilAppointment = () => {
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Sudah lewat';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} hari lagi`;
    } else if (diffHours > 0) {
      return `${diffHours} jam lagi`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} menit lagi`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Detail Jadwal Kontrol</h2>
              <p className="text-gray-600">Informasi lengkap jadwal kontrol pasien</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Status and Time Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(appointment.status)}
                <div>
                  <h3 className="font-semibold text-gray-800">Status Jadwal</h3>
                  <p className="text-sm text-gray-600">Status saat ini</p>
                </div>
              </div>
              {getStatusBadge(appointment.status)}
            </div>
            
            {isUpcoming() && appointment.status !== 'cancelled' && (
              <div className="bg-white/60 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {getTimeUntilAppointment()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Patient Information */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
            <h3 className="flex items-center space-x-2 font-semibold text-gray-800 mb-4">
              <User className="w-5 h-5 text-emerald-600" />
              <span>Informasi Pasien</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Nama Pasien</p>
                <p className="text-lg font-semibold text-gray-800">{appointment.patientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">ID Pasien</p>
                <p className="text-gray-800 font-mono text-sm bg-white/60 px-3 py-1 rounded border">
                  {appointment.patientId}
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h3 className="flex items-center space-x-2 font-semibold text-gray-800 mb-4">
              <Stethoscope className="w-5 h-5 text-purple-600" />
              <span>Dokter yang Menangani</span>
            </h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {appointment.doctorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">Dr. {appointment.doctorName}</p>
                <p className="text-sm text-gray-600">Dokter yang menangani</p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
            <h3 className="flex items-center space-x-2 font-semibold text-gray-800 mb-4">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span>Detail Jadwal Kontrol</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tanggal Kontrol</p>
                    <p className="text-gray-800 font-medium">
                      {new Date(appointment.appointmentDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Waktu Kontrol</p>
                    <p className="text-gray-800 font-medium">{appointment.appointmentTime}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Catatan</p>
                    <p className="text-gray-800">
                      {appointment.notes || 'Tidak ada catatan khusus'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Riwayat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Dibuat pada</p>
                <p className="text-gray-800">
                  {new Date(appointment.createdAt).toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {appointment.updatedAt && (
                <div>
                  <p className="font-medium text-gray-600">Terakhir diupdate</p>
                  <p className="text-gray-800">
                    {new Date(appointment.updatedAt).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    onStatusUpdate(appointment.id, 'completed');
                    onClose();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Tandai Selesai</span>
                </button>
                <button
                  onClick={() => {
                    onStatusUpdate(appointment.id, 'rescheduled');
                    onClose();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Jadwal Ulang</span>
                </button>
                <button
                  onClick={() => {
                    onStatusUpdate(appointment.id, 'cancelled');
                    onClose();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Batalkan</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowUpDetailModal;