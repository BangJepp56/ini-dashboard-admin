import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { PatientRegistration, FollowUpAppointment } from '../types';

interface FollowUpModalProps {
  patient: PatientRegistration;
  onClose: () => void;
}

const FollowUpModal: React.FC<FollowUpModalProps> = ({ patient, onClose }) => {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const followUpData: Omit<FollowUpAppointment, 'id'> = {
        patientId: patient.id,
        patientName: patient.nama,
        doctorName: patient.dokter,
        appointmentDate,
        appointmentTime,
        notes,
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };

      await addDoc(collection(db, 'followUpAppointments'), followUpData);
      
      alert('Jadwal kontrol berhasil disimpan!');
      onClose();
    } catch (error) {
      console.error('Error saving follow-up appointment:', error);
      alert('Gagal menyimpan jadwal kontrol');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Jadwal Kontrol Lanjutan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-medium text-green-800 mb-2">Detail Pasien</h3>
          <p className="text-green-700"><strong>Nama:</strong> {patient.nama}</p>
          <p className="text-green-700"><strong>Dokter:</strong> {patient.dokter}</p>
          <p className="text-green-700"><strong>Layanan:</strong> {patient.layanan}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tanggal Kontrol
            </label>
            <input
              type="date"
              id="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={minDateString}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Waktu Kontrol
            </label>
            <input
              type="time"
              id="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan untuk kontrol lanjutan..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowUpModal;