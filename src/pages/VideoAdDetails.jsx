import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Layout from '../components/Layout';
import { Video, Eye, Calendar, ArrowLeft, ExternalLink, Play } from 'lucide-react';

const VideoAdDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [videoAd, setVideoAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    fetchVideoAd();
  }, [id]);

  const fetchVideoAd = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/video-ads/${id}`);
      const data = response.data.data || response.data;
      setVideoAd(data);
    } catch (error) {
      console.error('Error fetching video ad details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!videoAd) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isRTL ? 'الإعلان غير موجود' : 'Video Ad Not Found'}
          </h2>
          <button
            onClick={() => navigate('/')}
            className="text-primary font-medium hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen pb-12">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs / Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{isRTL ? 'رجوع' : 'Back'}</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content: Video and Description */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video">
                <video
                  src={videoAd.videoUrl}
                  poster={videoAd.thumbnailUrl}
                  className="w-full h-full"
                  controls
                  autoPlay
                />
              </div>

              {/* Title and Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {isRTL ? videoAd.titleAr : videoAd.titleEn}
                </h1>
                
                <div className="flex flex-wrap gap-6 text-sm text-gray-500 border-b border-gray-100 pb-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span>{videoAd.views || 0} {isRTL ? 'مشاهدة' : 'Views'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{new Date(videoAd.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {isRTL ? 'الوصف' : 'Description'}
                  </h3>
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed mb-8">
                    {isRTL ? videoAd.descriptionAr : videoAd.descriptionEn}
                  </p>

                  {(videoAd.contentAr || videoAd.contentEn) && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 pt-6 border-t">
                        {isRTL ? 'التفاصيل الكاملة' : 'Full Details'}
                      </h3>
                      <div className="text-gray-700 leading-loose whitespace-pre-line">
                        {isRTL ? (videoAd.contentAr || videoAd.contentEn) : (videoAd.contentEn || videoAd.contentAr)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar: Actions and Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border-t-4 border-primary">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  {isRTL ? 'عن هذا العرض' : 'About this offer'}
                </h3>
                
                {videoAd.linkUrl && (
                  <a
                    href={videoAd.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    {isRTL ? 'زيارة الرابط' : 'Visit Link'}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      {isRTL ? 'تاريخ النشر' : 'Published On'}
                    </p>
                    <p className="font-medium text-gray-700">
                      {new Date(videoAd.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Related/Share placeholder */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">
                  {isRTL ? 'مشاركة الإعلان' : 'Share Advertisement'}
                </h3>
                <div className="flex gap-3">
                  {/* Mock share buttons */}
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors cursor-pointer">
                      <Play className="w-4 h-4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoAdDetails;
