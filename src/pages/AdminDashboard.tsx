import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Upload, LogOut, FileSpreadsheet, RefreshCw, CheckCircle, AlertTriangle, Users, CreditCard, Calendar } from "lucide-react";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import * as xlsx from "xlsx";
import { motion, AnimatePresence } from "motion/react";

export default function AdminDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "refund_records"));
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecords(recordsData);
    } catch (err: any) {
      console.error("Error fetching records:", err);
      if (err.message?.includes("Missing or insufficient permissions")) {
        setMessage({
          type: 'error',
          text: "Lỗi quyền truy cập: Vui lòng kiểm tra Firestore Security Rules."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRecords();
      } else {
        navigate("/admin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/admin");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = xlsx.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = xlsx.utils.sheet_to_json(worksheet);

          let importedCount = 0;
          let errorCount = 0;

          for (const row of json as any[]) {
            try {
              const cccd = String(row["Số cccd"] || row["CCCD"] || row["cccd"] || row["Số CCCD"] || "");
              if (!cccd || cccd === "undefined") continue;

              const record = {
                cccd,
                fullName: row["họ tên"] || row["Họ tên"] || row["Họ và tên"] || row["ho_ten"] || "",
                dob: row["ngày tháng năm sinh"] || row["Ngày sinh"] || row["ngay_sinh"] || "",
                gender: row["giới tính"] || row["Giới tính"] || row["gioi_tinh"] || "",
                insuranceCode: row["mã bhyt"] || row["Mã BHYT"] || row["ma_bhyt"] || "",
                address: row["địa chỉ"] || row["Địa chỉ"] || row["dia_chi"] || "",
                purchaseDate: row["ngày mua"] || row["Ngày mua"] || row["ngay_mua"] || "",
                expirationDate: row["ngày hết hạn"] || row["Ngày hết hạn"] || row["ngay_het_han"] || "",
                monthsPurchased: Number(row["số tháng mua"] || row["Số tháng mua"] || row["so_thang_mua"] || 0),
                monthsRemaining: Number(row["số tháng còn lại"] || row["Số tháng còn lại"] || row["so_thang_con_lai"] || 0),
                refundAmount: Number(row["số tiền hoàn trả"] || row["Số tiền hoàn trả"] || row["so_tien_hoan_tra"] || 0),
                refundDate: row["ngày hoàn trả"] || row["Ngày hoàn trả"] || row["ngay_hoan_tra"] || "",
                updatedAt: new Date().toISOString()
              };

              await setDoc(doc(db, "refund_records", cccd), record);
              importedCount++;
            } catch (err) {
              console.error("Error inserting row:", err);
              errorCount++;
            }
          }

          setMessage({
            type: 'success',
            text: `Import thành công ${importedCount} bản ghi. Lỗi: ${errorCount}`
          });
          fetchRecords();
        } catch (err: any) {
          console.error("Parse error:", err);
          if (err.message?.includes("Missing or insufficient permissions")) {
            setMessage({
              type: 'error',
              text: "Lỗi quyền truy cập ghi: Vui lòng kiểm tra Firestore Security Rules."
            });
          } else {
            setMessage({
              type: 'error',
              text: "Lỗi khi đọc file Excel."
            });
          }
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setMessage({
        type: 'error',
        text: "Đã xảy ra lỗi hệ thống khi upload"
      });
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const totalRefundAmount = records.reduce((sum, record) => sum + (record.refundAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-md shadow-blue-500/20">
                <FileSpreadsheet className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">Quản trị Hệ thống</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-500 hidden sm:block bg-slate-100 px-3 py-1.5 rounded-full">
                {auth.currentUser?.email || "Admin"}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors shadow-sm"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="md:flex md:items-center md:justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-extrabold leading-7 text-slate-900 sm:text-3xl sm:truncate tracking-tight">
                Tổng quan dữ liệu
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Quản lý và cập nhật danh sách hoàn trả BHYT cho người dân.
              </p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row md:mt-0 md:ml-4 space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={fetchRecords}
                className="inline-flex items-center justify-center px-5 py-2.5 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              <div>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Đang xử lý..." : "Import Excel"}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {message.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                        {message.text}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-slate-100 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-50 rounded-2xl p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Tổng số hồ sơ</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-slate-900">{records.length}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-slate-100 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-50 rounded-2xl p-3">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Tổng tiền hoàn trả dự kiến</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-slate-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRefundAmount)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-slate-100 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-50 rounded-2xl p-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Cập nhật gần nhất</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-bold text-slate-900">
                        {records.length > 0 ? new Date(Math.max(...records.map(r => new Date(r.updatedAt).getTime()))).toLocaleDateString('vi-VN') : "Chưa có"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Người thụ hưởng
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mã BHYT
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Thời hạn
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Hoàn trả
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có dữ liệu</h3>
                        <p className="text-sm text-slate-500">Vui lòng import file Excel để bắt đầu.</p>
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                              {record.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-slate-900">
                                {record.fullName}
                              </div>
                              <div className="text-sm text-slate-500 font-mono mt-0.5">
                                {record.cccd}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {record.insuranceCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {record.purchaseDate} - {record.expirationDate}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Còn lại: <span className="font-semibold text-orange-600">{record.monthsRemaining}</span> / {record.monthsPurchased} tháng
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.refundAmount)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {record.refundDate}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
