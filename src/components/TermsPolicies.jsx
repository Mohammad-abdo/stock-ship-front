import React from 'react'
import { useTranslation } from "react-i18next";

export default function TermsPolicies() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={currentDir} className=" bg-white my-25">
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 pt-30">
       

        {/* Content box */}
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-5 sm:p-6">
             {/* Title */}
        <div className="flex justify-start">
          <h1 className="text-xl font-bold text-blue-900">{t("termsPolicies.title")}</h1>
        </div>
          <p className="text-lg leading-8 text-slate-700 whitespace-pre-line">
            {t("termsPolicies.content")}
          </p>
        </div>
      </div>
    </div>
  );
}
