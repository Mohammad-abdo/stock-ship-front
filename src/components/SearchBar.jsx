import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../routes";
import api from "../services/api";
import { Search, ImageIcon, X, Upload } from "lucide-react";

export default function SearchBar({ value = "", onChange, onSubmit, className = "", inputClassName = "", compact = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentDir = i18n.language === "ar" ? "rtl" : "ltr";
  const [showImageModal, setShowImageModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
    else if (value && value.trim()) {
      navigate(`${ROUTES.PRODUCTS_LIST}?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const onDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files[0] && files[0].type.startsWith("image/")) {
      handleFile(files[0]);
    }
  };
  const handleFile = (file) => {
    setUploadError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };
  const clearImage = () => {
    setPreview(null);
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const closeModal = () => {
    setShowImageModal(false);
    clearImage();
  };

  const searchByImage = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      const res = await api.post("/upload/search-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data?.data || res.data;
      const url = data?.url;
      const imagePath = url || (data?.filename ? `/uploads/images/search/${data.filename}` : null);
      if (imagePath) {
        closeModal();
        navigate(`${ROUTES.PRODUCTS_LIST}?searchByImage=1&imageUrl=${encodeURIComponent(imagePath)}`);
      } else {
        setUploadError(t("common.error") || "Upload failed");
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || t("common.error") || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div
        className={`flex flex-1 items-stretch rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-slate-200/90 overflow-hidden transition-all focus-within:shadow-[0_4px_24px_rgba(30,64,175,0.12)] focus-within:border-blue-300/80 ${compact ? "min-h-[40px]" : "min-h-[48px] sm:min-h-[52px]"} ${className}`}
      >
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center min-w-0">
          <button
            type="submit"
            className={`shrink-0 flex items-center justify-center text-slate-500 hover:text-(--primary) transition-colors ${compact ? "w-10 h-10" : "w-11 h-11 sm:w-12 sm:h-12"}`}
            aria-label={t("nav.search")}
          >
            <Search className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder={t("nav.searchPlaceholder")}
            className={`flex-1 min-w-0 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 py-2 ${currentDir === "rtl" ? "text-right pr-2 pl-1" : "text-left pl-2 pr-1"} ${compact ? "text-sm" : "text-sm sm:text-base"} ${inputClassName}`}
            dir={currentDir}
          />
        </form>
        <div className={`w-px bg-slate-200 self-stretch ${compact ? "my-1.5" : "my-2"}`} aria-hidden />
        <button
          type="button"
          onClick={() => setShowImageModal(true)}
          className={`shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 text-slate-600 hover:text-(--primary) hover:bg-blue-50/80 transition-colors font-medium ${currentDir === "rtl" ? "flex-row-reverse" : ""} ${compact ? "text-xs py-2" : "text-sm py-2 sm:px-4"}`}
          aria-label={t("nav.searchByImage")}
          title={t("nav.searchByImageHint")}
        >
          <ImageIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
          <span className="whitespace-nowrap">{t("nav.searchByImageShort")}</span>
        </button>
      </div>

      {/* Search by image modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div
            dir={currentDir}
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{t("nav.searchByImage")}</h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-full hover:bg-slate-100 text-slate-500" aria-label={t("nav.closeMenu")}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="px-5 pt-3 text-sm text-slate-600">{t("nav.searchByImageHint")}</p>
            <div className="p-5 space-y-4">
              <div
                onDragEnter={onDrag}
                onDragLeave={onDrag}
                onDragOver={onDrag}
                onDrop={onDrop}
                className={`relative rounded-xl border-2 border-dashed transition-colors ${dragActive ? "border-(--primary) bg-blue-50/50" : "border-slate-200 bg-slate-50/50 hover:border-slate-300"} ${preview ? "min-h-[140px]" : "min-h-[180px] flex flex-col items-center justify-center"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {preview ? (
                  <div className="relative p-2">
                    <img src={preview} alt="" className="mx-auto max-h-48 rounded-lg object-contain shadow-inner" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); clearImage(); }}
                      className="absolute top-3 end-3 p-1.5 rounded-full bg-white/90 shadow text-slate-600 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="pointer-events-none flex flex-col items-center gap-2 text-slate-500">
                    <Upload className="h-10 w-10 opacity-70" />
                    <span className="text-sm font-medium">{t("nav.uploadOrDrop")}</span>
                    <span className="text-xs">JPEG, PNG, WebP — max 5MB</span>
                  </div>
                )}
              </div>
              {uploadError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>
              )}
              <button
                type="button"
                onClick={searchByImage}
                disabled={!selectedFile || uploading}
                className="w-full py-3 rounded-xl bg-(--primary) text-white font-bold text-center hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("nav.searchingByImage")}
                  </>
                ) : (
                  t("nav.searchByImage")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
