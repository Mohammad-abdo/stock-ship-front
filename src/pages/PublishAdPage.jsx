import React, { useState, useEffect } from "react";
import { ChevronDown, Upload, X } from "lucide-react";
import Header from "../components/Header";
import FooterArabic from "../components/FooterArabic";
import { ROUTES } from "../routes";
import { Link } from "react-router-dom";
import { categoryService } from "../services/categoryService";
import { offerService } from "../services/offerService";

export default function PublishAdPage() {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [country, setCountry] = useState("السعودية");
  const [city, setCity] = useState("جده");
  const [description, setDescription] = useState("");
  const [acceptNegotiation, setAcceptNegotiation] = useState(false);
  const [negotiationText, setNegotiationText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryService.getCategories();
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("حدث خطأ في جلب الأقسام");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 10) {
      alert("يمكنك رفع 10 صور كحد أقصى");
      return;
    }
    setUploadedImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (uploadedImages.length + files.length > 10) {
      alert("يمكنك رفع 10 صور كحد أقصى");
      return;
    }
    setUploadedImages((prev) => [...prev, ...files]);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptTerms) {
      alert("يجب الموافقة على الشروط والأحكام");
      return;
    }
    if (!description.trim()) {
      alert("يجب إدخال وصف البضائع");
      return;
    }
    if (!categoryId) {
      alert("يجب اختيار القسم");
      return;
    }

    try {
      setSubmitting(true);

      // Upload images first (if any)
      let imageUrls = [];
      if (uploadedImages.length > 0) {
        // TODO: Implement image upload service
        // For now, we'll skip image upload
        console.log("Images to upload:", uploadedImages);
      }

      // Create offer
      const offerData = {
        title: description.substring(0, 100) || "عرض جديد",
        description: description,
        metadata: {
          categoryId: parseInt(categoryId),
          category: categories.find(c => c.id === parseInt(categoryId))?.slug || "",
          acceptsNegotiation: acceptNegotiation,
          country: country,
          city: city,
          adImages: imageUrls,
        },
      };

      const offerResponse = await offerService.createOffer(offerData);

      if (offerResponse.data.success) {
        const createdOffer = offerResponse.data.data;

        // Upload Excel file if provided
        if (excelFile) {
          try {
            await offerService.uploadExcel(createdOffer.id, excelFile);
          } catch (excelError) {
            console.error("Error uploading Excel:", excelError);
            alert("تم إنشاء العرض لكن حدث خطأ في رفع ملف Excel");
          }
        }

        alert("تم نشر الإعلان بنجاح!");
        // TODO: Navigate to offer details or offers list
      } else {
        alert("حدث خطأ في نشر الإعلان");
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      alert(error.response?.data?.message || "حدث خطأ في نشر الإعلان");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />
      <div dir="rtl" className="min-h-screen bg-white pt-40 pb-20">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">نشر إعلان</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* رسوم Stockship */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">رسوم Stockship</h2>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-2 border-red-500 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    موافقة علي الشروط والأحكام
                  </span>
                </label>
              </div>

              {/* اختيار الدولة */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اختر الدولة
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="السعودية">السعودية</option>
                    <option value="الإمارات">الإمارات</option>
                    <option value="الكويت">الكويت</option>
                    <option value="مصر">مصر</option>
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* اختيار المدينة */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  اختر المدينة
                </label>
                <div className="relative">
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="جده">جده</option>
                    <option value="الرياض">الرياض</option>
                    <option value="الدمام">الدمام</option>
                    <option value="مكة">مكة</option>
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* تحميل الصور */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">تحميل الصور</h2>
                
                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-700 mb-2">
                    اسحب و أفلت الصور هنا
                  </p>
                  <p className="text-slate-500 mb-4">أو</p>
                  <label className="inline-block">
                    <span className="inline-flex items-center justify-center px-6 py-3 bg-[#F5AF00] text-[#194386] font-bold rounded-lg cursor-pointer hover:bg-[#E5A000] transition-colors">
                      اختر الصور
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* File Requirements */}
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>لكل منها أقصى 100 ملفات MB حتى 100 image/jpeg, image/png, image/webp</p>
                  <p>رفع صور الاعلان ( كحد اقصى ۱۰ صور )</p>
                </div>

                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="حذف الصورة"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg">
                          {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Excel Template Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    className="px-6 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    تحميل تمبلت الاكسل الجاهز للتعبئه
                  </button>
                  <label className="inline-block">
                    <span className="inline-flex items-center justify-center px-6 py-3 bg-blue-900 text-white font-semibold rounded-lg cursor-pointer hover:bg-blue-800 transition-colors">
                      رفع ملف الاكسل من الجهاز
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleExcelUpload}
                    />
                  </label>
                </div>
              </div>

              {/* بيانات الإعلان */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">بيانات الإعلان</h2>
                
                {/* وصف البضائع */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    وصف البضائع *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="أدخل وصف البضائع..."
                    required
                  />
                </div>

                {/* هل تقبل التفاوض */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    هل تقبل التفاوض في السعر و الكمية؟
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptNegotiation}
                        onChange={(e) => setAcceptNegotiation(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    {acceptNegotiation && (
                      <input
                        type="text"
                        value={negotiationText}
                        onChange={(e) => setNegotiationText(e.target.value)}
                        placeholder="أدخل تفاصيل التفاوض..."
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>

                {/* اختيار القسم */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    إختر القسم المناسب *
                  </label>
                  <div className="relative">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loadingCategories}
                    >
                      <option value="">
                        {loadingCategories ? "جاري التحميل..." : "اختر القسم"}
                      </option>
                      {categories
                        .filter(cat => cat.isActive && !cat.parentId) // Show only root categories
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.nameKey || category.slug}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* زر النشر */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-12 py-4 bg-blue-900 text-white font-bold text-lg rounded-lg hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "جاري النشر..." : "نشر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <FooterArabic />
    </div>
  );
}

