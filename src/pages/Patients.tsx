"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Download, Edit, Calendar, Eye, Users, Filter, CalendarDays, Hash } from "lucide-react"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "../config/firebase"
import type { PatientRegistration } from "../types"
import PatientStatusModal from "../components/PatientStatusModal"
import FollowUpModal from "../components/FollowUpModal"
import PatientDetailModal from "../components/PatientDetailModal"
import * as XLSX from "xlsx"

// Tambahkan tipe untuk status agar string indexing valid
type PatientStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled"
  | "Terjadwal"
  | "Dalam Antrian"
  | "Selesai"
  | "Dibatalkan"

type QueueStatus = "waiting" | "in_progress" | "completed" | "skipped"

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<PatientRegistration[]>([])
  const [filteredPatients, setFilteredPatients] = useState<PatientRegistration[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [customMonth, setCustomMonth] = useState("")
  const [groupByDate, setGroupByDate] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientRegistration | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // NEW STATE FOR LAYANAN FILTER
  const [layananFilter, setLayananFilter] = useState("all")
  const [uniqueLayananOptions, setUniqueLayananOptions] = useState<string[]>([])

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    // Update unique layanan options whenever patients data changes
    const layananSet = new Set<string>()
    patients.forEach((patient) => {
      if (patient.layanan) {
        layananSet.add(patient.layanan)
      }
    })
    setUniqueLayananOptions(Array.from(layananSet).sort())
  }, [patients])

  useEffect(() => {
    filterPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients, searchTerm, statusFilter, dateFilter, customDateFrom, customDateTo, customMonth, layananFilter]) // ADD layananFilter HERE

  const fetchPatients = async () => {
    try {
      const snapshot = await getDocs(collection(db, "patients"))
      const patientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PatientRegistration[]
      setPatients(patientsData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching patients:", error)
      setLoading(false)
    }
  }

  const getDayName = (dateString: string) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    let date: Date
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/")
      date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    } else {
      date = new Date(dateString)
    }
    return days[date.getDay()]
  }

  const getMonthName = (month: number) => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ]
    return months[month]
  }

  const formatDate = (dateString: string) => {
    let date: Date
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/")
      date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
    } else {
      date = new Date(dateString)
    }
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const normalizeDate = (dateString: string) => {
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      return date.toISOString().split("T")[0]
    } else {
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    }
  }

  const isDateInRange = (patientDate: string, fromDate: string, toDate: string) => {
    const normalizedPatientDate = normalizeDate(patientDate)
    const pDate = new Date(normalizedPatientDate)
    const fDate = new Date(fromDate)
    const tDate = new Date(toDate)
    return pDate >= fDate && pDate <= tDate
  }

  const isDateInMonth = (patientDate: string, monthYear: string) => {
    const normalizedPatientDate = normalizeDate(patientDate)
    const pDate = new Date(normalizedPatientDate)
    const [year, month] = monthYear.split("-")
    return pDate.getFullYear() === Number.parseInt(year) && pDate.getMonth() === Number.parseInt(month) - 1
  }

  const filterPatients = () => {
    let filtered = patients

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.nik.includes(searchTerm) ||
          patient.telepon.includes(searchTerm) ||
          (patient.id && patient.id.toString().includes(searchTerm)),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((patient) => patient.status === statusFilter)
    }

    // NEW: Filter by layanan
    if (layananFilter !== "all") {
      filtered = filtered.filter((patient) => patient.layanan === layananFilter)
    }

    // Filter by date
    const today = new Date()
    const todayString = today.toISOString().split("T")[0]
    switch (dateFilter) {
      case "today":
        filtered = filtered.filter((patient) => normalizeDate(patient.tanggal) === todayString)
        break
      case "yesterday":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayString = yesterday.toISOString().split("T")[0]
        filtered = filtered.filter((patient) => normalizeDate(patient.tanggal) === yesterdayString)
        break
      case "this_week":
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        filtered = filtered.filter((patient) =>
          isDateInRange(patient.tanggal, weekStart.toISOString().split("T")[0], weekEnd.toISOString().split("T")[0]),
        )
        break
      case "this_month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        filtered = filtered.filter((patient) =>
          isDateInRange(patient.tanggal, monthStart.toISOString().split("T")[0], monthEnd.toISOString().split("T")[0]),
        )
        break
      case "custom_date":
        if (customDateFrom && customDateTo) {
          filtered = filtered.filter((patient) => isDateInRange(patient.tanggal, customDateFrom, customDateTo))
        }
        break
      case "custom_month":
        if (customMonth) {
          filtered = filtered.filter((patient) => isDateInMonth(patient.tanggal, customMonth))
        }
        break
    }

    // Sort by date and queue number
    filtered.sort((a, b) => {
      const dateA = normalizeDate(a.tanggal)
      const dateB = normalizeDate(b.tanggal)
      const dateCompare = new Date(dateA).getTime() - new Date(dateB).getTime()
      if (dateCompare !== 0) return dateCompare
      const aQueueNo = a.queue_number || 0
      const bQueueNo = b.queue_number || 0
      return aQueueNo - bQueueNo
    })

    setFilteredPatients(filtered)
  }

  const handleStatusUpdate = async (patientId: string, newStatus: PatientRegistration["status"]) => {
    try {
      await updateDoc(doc(db, "patients", patientId), {
        status: newStatus,
        updated_at: new Date(),
      })
      setPatients(patients.map((patient) => (patient.id === patientId ? { ...patient, status: newStatus } : patient)))
      setShowStatusModal(false)
      setSelectedPatient(null)
    } catch (error) {
      console.error("Error updating patient status:", error)
    }
  }

  const exportToExcel = () => {
    const excelData = filteredPatients.map((patient, index) => ({
      No: index + 1,
      "ID Registrasi": patient.id || "-",
      "Nomor Antrian": patient.queue_number || "-",
      "Nama Pasien": patient.nama,
      NIK: patient.nik,
      "Jenis Kelamin": patient.jenis_kelamin,
      "No. Telepon": patient.telepon,
      Alamat: patient.alamat,
      Layanan: patient.layanan,
      Spesialisasi: patient.spesialisasi_dokter,
      Dokter: patient.dokter,
      "Tanggal Periksa": patient.tanggal,
      "Estimasi Waktu": patient.estimated_time,
      Hari: getDayName(patient.tanggal),
      Status: patient.status,
      "Status Antrian": patient.queue_status,
      Keluhan: patient.keluhan,
      "Sumber Booking": patient.booking_source,
      "Tanggal Daftar": patient.tanggal_daftar,
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    const colWidths = [
      { wch: 5 }, // No
      { wch: 20 }, // ID Registrasi
      { wch: 12 }, // Nomor Antrian
      { wch: 20 }, // Nama Pasien
      { wch: 20 }, // NIK
      { wch: 15 }, // Jenis Kelamin
      { wch: 15 }, // No. Telepon
      { wch: 30 }, // Alamat
      { wch: 15 }, // Layanan
      { wch: 20 }, // Spesialisasi
      { wch: 20 }, // Dokter
      { wch: 15 }, // Tanggal Periksa
      { wch: 12 }, // Estimasi Waktu
      { wch: 10 }, // Hari
      { wch: 15 }, // Status
      { wch: 15 }, // Status Antrian
      { wch: 30 }, // Keluhan
      { wch: 15 }, // Sumber Booking
      { wch: 20 }, // Tanggal Daftar
    ]
    ws["!cols"] = colWidths

    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws["!ref"] || "A1")
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: col })]
      if (headerCell) {
        headerCell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } },
          alignment: { horizontal: "center", vertical: "center" },
        }
      }
    }

    // Add borders to all cells
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1")
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: "s", v: "" }
        }
        if (!ws[cellAddress].s) {
          ws[cellAddress].s = {}
        }
        ws[cellAddress].s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Data Pasien")

    let filename = "Data_Pasien_"
    if (dateFilter === "custom_date" && customDateFrom && customDateTo) {
      filename += `${customDateFrom}_sampai_${customDateTo}`
    } else if (dateFilter === "custom_month" && customMonth) {
      const [year, month] = customMonth.split("-")
      filename += `${getMonthName(Number.parseInt(month) - 1)}_${year}`
    } else if (dateFilter === "today") {
      filename += `Hari_Ini_${new Date().toISOString().split("T")[0]}`
    } else if (dateFilter === "this_week") {
      filename += `Minggu_Ini`
    } else if (dateFilter === "this_month") {
      filename += `Bulan_Ini`
    } else {
      filename += `Semua_Data_${new Date().toISOString().split("T")[0]}`
    }
    filename += ".xlsx"

    XLSX.writeFile(wb, filename)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<PatientStatus, string> = {
      Pending: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-200",
      Confirmed: "bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-200",
      Completed: "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-200",
      Cancelled: "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-200",
      Terjadwal: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-200",
      "Dalam Antrian": "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border border-yellow-200",
      Selesai: "bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-200",
      Dibatalkan: "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-200",
    }
    return `inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
      statusConfig[status as PatientStatus] || "bg-gray-100 text-gray-700"
    }`
  }

  const getQueueStatusBadge = (queueStatus: string) => {
    const statusConfig: Record<QueueStatus, string> = {
      waiting: "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-200",
      in_progress: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-200",
      completed: "bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-200",
      skipped: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200",
    }
    const statusLabels: Record<QueueStatus, string> = {
      waiting: "Menunggu",
      in_progress: "Sedang Dilayani",
      completed: "Selesai",
      skipped: "Dilewati",
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          statusConfig[queueStatus as QueueStatus] || "bg-gray-100 text-gray-700"
        }`}
      >
        {statusLabels[queueStatus as QueueStatus] || queueStatus}
      </span>
    )
  }

  const groupPatientsByDate = () => {
    const grouped = filteredPatients.reduce(
      (acc, patient) => {
        const date = normalizeDate(patient.tanggal)
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(patient)
        return acc
      },
      {} as Record<string, PatientRegistration[]>,
    )
    return Object.entries(grouped).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
  }

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "today":
        return "Hari Ini"
      case "yesterday":
        return "Kemarin"
      case "this_week":
        return "Minggu Ini"
      case "this_month":
        return "Bulan Ini"
      case "custom_date":
        return customDateFrom && customDateTo ? `${customDateFrom} - ${customDateTo}` : "Pilih Tanggal"
      case "custom_month":
        if (customMonth) {
          const [year, month] = customMonth.split("-")
          return `${getMonthName(Number.parseInt(month) - 1)} ${year}`
        }
        return "Pilih Bulan"
      default:
        return "Semua Tanggal"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent absolute top-0"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
              Manajemen Pasien
            </h1>
            <p className="text-lg text-gray-600">Kelola data registrasi pasien dengan mudah</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setGroupByDate(!groupByDate)}
              className={`group relative px-6 py-3 rounded-xl flex items-center space-x-3 transition-all duration-300 hover:scale-105 ${
                groupByDate
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-200 hover:shadow-md"
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="font-medium">Grup Tanggal</span>
            </button>
            <button
              onClick={exportToExcel}
              className="group relative bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center space-x-3 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Export Excel</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama, NIK, telepon, atau ID registrasi..."
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
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Layanan Filter (NEW) */}
              <div>
                <select
                  value={layananFilter}
                  onChange={(e) => setLayananFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-300"
                >
                  <option value="all">Semua Layanan</option>
                  {uniqueLayananOptions.map((layanan) => (
                    <option key={layanan} value={layanan}>
                      {layanan}
                    </option>
                  ))}
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
                  <option value="yesterday">Kemarin</option>
                  <option value="this_week">Minggu Ini</option>
                  <option value="this_month">Bulan Ini</option>
                  <option value="custom_date">Pilih Tanggal</option>
                  <option value="custom_month">Pilih Bulan</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === "custom_date" && (
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

            {/* Custom Month */}
            {dateFilter === "custom_month" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Bulan</label>
                <input
                  type="month"
                  value={customMonth}
                  onChange={(e) => setCustomMonth(e.target.value)}
                  className="w-full md:w-1/2 px-4 py-3 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-300"
                />
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
                  Menampilkan {filteredPatients.length} dari {patients.length} pasien
                </span>
              </div>
              {dateFilter !== "all" && <div className="text-sm text-gray-600">Filter: {getDateFilterLabel()}</div>}
              {layananFilter !== "all" && ( // Display active layanan filter
                <div className="text-sm text-gray-600">Layanan: {layananFilter}</div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden">
            <div className="overflow-x-auto">
              {groupByDate ? (
                // Grouped by date view
                <div className="divide-y divide-gray-200">
                  {groupPatientsByDate().map(([date, datePatients]) => (
                    <div key={date} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-emerald-500" />
                          <span>{formatDate(datePatients[0].tanggal)}</span>
                          <span className="text-sm font-normal text-gray-500">({datePatients.length} pasien)</span>
                        </h3>
                      </div>
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Antrian
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Pasien
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Kontak
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Layanan
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Waktu
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50">
                          {datePatients.map((patient) => (
                            <tr key={patient.id} className="group hover:bg-white/60 transition-all duration-300">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <Hash className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {patient.queue_number || "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-white font-semibold">
                                      {patient.nama.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{patient.nama}</div>
                                    <div className="text-sm text-gray-500">{patient.nik}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{patient.telepon}</div>
                                <div className="text-sm text-gray-500">{patient.jenis_kelamin}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{patient.layanan}</div>
                                <div className="text-sm text-gray-500">{patient.dokter}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{patient.estimated_time}</div>
                                <div className="text-sm text-gray-500">{getDayName(patient.tanggal)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <span className={getStatusBadge(patient.status)}>{patient.status}</span>
                                  {patient.queue_status && <div>{getQueueStatusBadge(patient.queue_status)}</div>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedPatient(patient)
                                      setShowDetailModal(true)
                                    }}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPatient(patient)
                                      setShowStatusModal(true)
                                    }}
                                    className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Update Status"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPatient(patient)
                                      setShowFollowUpModal(true)
                                    }}
                                    className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Follow Up"
                                  >
                                    <Users className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                // Regular table view
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Antrian
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Pasien
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Kontak
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Layanan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="group hover:bg-white/60 transition-all duration-300">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{patient.queue_number || "-"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 flex items-center justify-center text-white font-semibold">
                                {patient.nama.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{patient.nama}</div>
                              <div className="text-sm text-gray-500">{patient.nik}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{patient.telepon}</div>
                          <div className="text-sm text-gray-500">{patient.jenis_kelamin}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{patient.layanan}</div>
                          <div className="text-sm text-gray-500">{patient.dokter}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{patient.tanggal}</div>
                          <div className="text-sm text-gray-500">{patient.estimated_time}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={getStatusBadge(patient.status)}>{patient.status}</span>
                            {patient.queue_status && <div>{getQueueStatusBadge(patient.queue_status)}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient)
                                setShowDetailModal(true)
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatient(patient)
                                setShowStatusModal(true)
                              }}
                              className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Update Status"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatient(patient)
                                setShowFollowUpModal(true)
                              }}
                              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Follow Up"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Empty State */}
            {filteredPatients.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data pasien</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all" || dateFilter !== "all" || layananFilter !== "all"
                    ? "Tidak ada pasien yang sesuai dengan filter yang dipilih."
                    : "Belum ada pasien yang terdaftar."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showStatusModal && selectedPatient && (
        <PatientStatusModal
          patient={selectedPatient}
          onClose={() => {
            setShowStatusModal(false)
            setSelectedPatient(null)
          }}
          onUpdateStatus={handleStatusUpdate}
        />
      )}
      {showFollowUpModal && selectedPatient && (
        <FollowUpModal
          patient={selectedPatient}
          onClose={() => {
            setShowFollowUpModal(false)
            setSelectedPatient(null)
          }}
        />
      )}
      {showDetailModal && selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedPatient(null)
          }}
        />
      )}
    </div>
  )
}

export default Patients
