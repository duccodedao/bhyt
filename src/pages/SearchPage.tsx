import React, { useState } from "react";
import { Search, ShieldCheck, AlertCircle, CreditCard, Calendar, User, MapPin, CheckCircle2, Activity, RefreshCw } from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'cccd' | 'name'>('cccd');
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError(searchType === 'cccd' ? "Vui lòng nhập số CCCD" : "Vui lòng nhập Họ và tên");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      if (searchType === 'cccd') {
        const docRef = doc(db, "refund_records", searchValue.trim());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setResults([docSnap.data()]);
        } else {
          setError("Không tìm thấy thông tin hoàn trả cho CCCD này. Vui lòng kiểm tra lại.");
        }
      } else {
        // Search by name
        const searchName = searchValue.trim();
        let q = query(collection(db, "refund_records"), where("fullName", "==", searchName));
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Try Title Case
          const titleCaseName = searchName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          if (titleCaseName !== searchName) {
            q = query(collection(db, "refund_records"), where("fullName", "==", titleCaseName));
            querySnapshot = await getDocs(q);
          }
        }

        if (querySnapshot.empty) {
          // Try UPPERCASE
          const upperName = searchName.toUpperCase();
          if (upperName !== searchName) {
            q = query(collection(db, "refund_records"), where("fullName", "==", upperName));
            querySnapshot = await getDocs(q);
          }
        }

        if (!querySnapshot.empty) {
          const docsData = querySnapshot.docs.map(d => d.data());
          setResults(docsData);
        } else {
          setError("Không tìm thấy thông tin hoàn trả cho Họ và tên này. Vui lòng nhập chính xác (có dấu).");
        }
      }
    } catch (err: any) {
      console.error("Search error:", err);
      if (err.message?.includes("Missing or insufficient permissions")) {
        setError("Hệ thống đang bảo trì hoặc lỗi quyền truy cập. Vui lòng thử lại sau.");
      } else {
        setError("Đã xảy ra lỗi khi kết nối đến máy chủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl space-y-8"
      >
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="mx-auto h-20 w-20 bg-white shadow-xl shadow-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-100"
          >
            <ShieldCheck className="h-10 w-10 text-blue-600" />
          </motion.div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Tra Cứu Hoàn Trả BHYT
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Cổng thông tin tra cứu trực tuyến số tiền hoàn trả Bảo hiểm y tế nhanh chóng và chính xác.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-12 border border-white"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex justify-center space-x-6 mb-6">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${searchType === 'cccd' ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full bg-blue-600 transition-transform ${searchType === 'cccd' ? 'scale-100' : 'scale-0'}`} />
                </div>
                <input
                  type="radio"
                  className="hidden"
                  checked={searchType === 'cccd'}
                  onChange={() => { setSearchType('cccd'); setResults([]); setError(""); }}
                />
                <span className={`text-sm font-semibold transition-colors ${searchType === 'cccd' ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-900'}`}>
                  Tra cứu theo CCCD
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${searchType === 'name' ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full bg-blue-600 transition-transform ${searchType === 'name' ? 'scale-100' : 'scale-0'}`} />
                </div>
                <input
                  type="radio"
                  className="hidden"
                  checked={searchType === 'name'}
                  onChange={() => { setSearchType('name'); setResults([]); setError(""); }}
                />
                <span className={`text-sm font-semibold transition-colors ${searchType === 'name' ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-900'}`}>
                  Tra cứu theo Họ và tên
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="searchValue" className="block text-sm font-semibold text-slate-700 mb-2">
                {searchType === 'cccd' ? 'Số Căn cước công dân' : 'Họ và tên'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="searchValue"
                  id="searchValue"
                  className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-blue-500 transition-colors bg-slate-50/50 focus:bg-white placeholder:text-slate-400"
                  placeholder={searchType === 'cccd' ? "Nhập 12 số CCCD của bạn..." : "Nhập chính xác họ và tên (có dấu)..."}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              {searchType === 'name' && (
                <p className="mt-2 text-xs text-slate-500 italic">
                  * Vui lòng nhập chính xác họ và tên có dấu (VD: Nguyễn Văn A)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden flex justify-center py-4 px-4 rounded-2xl shadow-lg text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 transition-all transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center">
                  <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Đang xử lý...
                </span>
              ) : (
                "Tra Cứu Ngay"
              )}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-3 text-sm font-medium text-red-800">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {searchType === 'name' && results.length > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-medium text-blue-800">
                    Tìm thấy <span className="font-bold text-blue-900">{results.length}</span> kết quả phù hợp với tên "{searchValue}". Vui lòng kiểm tra CCCD để xác nhận đúng người.
                  </p>
                </div>
              )}

              {results.map((result, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: index * 0.1 }}
                  className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold flex items-center">
                        <CheckCircle2 className="w-6 h-6 mr-2 text-blue-200" />
                        Thông tin hợp lệ
                      </h3>
                      <p className="text-blue-100 text-sm mt-1 opacity-90">Cập nhật lần cuối: {new Date(result.updatedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                      <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-500">Họ và tên</p>
                          <p className="mt-1 text-lg text-slate-900 font-bold">{result.fullName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-500">Số CCCD</p>
                          <p className="mt-1 text-lg text-slate-900 font-semibold font-mono">{result.cccd}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-500">Ngày sinh</p>
                          <p className="mt-1 text-base text-slate-900">{result.dob}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Activity className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-500">Mã BHYT</p>
                          <p className="mt-1 text-base text-slate-900 font-semibold text-blue-700">{result.insuranceCode}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 md:col-span-2">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-500">Địa chỉ</p>
                          <p className="mt-1 text-base text-slate-900">{result.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-dashed border-slate-200">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Chi tiết hoàn trả</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Thời hạn BHYT</p>
                          <p className="text-sm font-semibold text-slate-900">{result.purchaseDate} - {result.expirationDate}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-medium text-slate-500 mb-1">Số tháng còn lại</p>
                          <p className="text-sm font-semibold text-slate-900">
                            <span className="text-orange-600 text-lg">{result.monthsRemaining}</span> / {result.monthsPurchased} tháng
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end relative z-10">
                          <div className="mb-4 sm:mb-0">
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wider">Số tiền hoàn trả</p>
                            <p className="text-sm text-blue-600 mt-1 font-medium flex items-center">
                              <Calendar className="w-4 h-4 mr-1.5" />
                              Dự kiến: {result.refundDate}
                            </p>
                          </div>
                          <p className="text-4xl font-black text-blue-700 tracking-tight">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.refundAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
