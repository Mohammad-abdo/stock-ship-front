import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Mousewheel, FreeMode, Navigation } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getFileUrl } from '../services/api';
import {
  Play, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Volume2, VolumeX, ExternalLink, Heart, MessageCircle, Share2, Send, Pause, ThumbsDown, Reply
} from 'lucide-react';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';

// تعليق مع ردود — مثل فيسبوك
function CommentThread({ comment, videoId, isRTL, replyingToId, setReplyingToId, replyText, setReplyText, addComment, commentSubmitting }) {
  const isReplying = replyingToId === comment.id;
  const replies = comment.replies || [];

  return (
    <div className={`rounded-xl bg-gray-800 overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="p-3">
        <p className="text-white text-sm">{comment.text}</p>
        <div className={`flex items-center gap-3 mt-2 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
          <span className="text-white/50 text-xs">{new Date(comment.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>
          <button
            type="button"
            onClick={() => { setReplyingToId(isReplying ? null : comment.id); setReplyText(''); }}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium"
          >
            <Reply className="w-3.5 h-3.5" />
            {isRTL ? 'رد' : 'Reply'}
            {replies.length > 0 && <span className="text-white/60">({replies.length})</span>}
          </button>
        </div>
        {isReplying && (
          <div className={`mt-3 flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={isRTL ? 'اكتب رداً...' : 'Write a reply...'}
              className="flex-1 rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => { if (e.key === 'Enter') addComment(videoId, replyText, comment.id); }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => addComment(videoId, replyText, comment.id)}
              disabled={commentSubmitting || !replyText.trim()}
              className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {replies.length > 0 && (
        <div className={`border-t border-gray-700/50 ${isRTL ? 'pr-4 pl-2' : 'pl-4 pr-2'} py-2 space-y-2`}>
          {replies.map((r) => (
            <CommentThread
              key={r.id}
              comment={r}
              videoId={videoId}
              isRTL={isRTL}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              replyText={replyText}
              setReplyText={setReplyText}
              addComment={addComment}
              commentSubmitting={commentSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const VideoAdsSection = () => {
  const { i18n } = useTranslation();
  const [videoAds, setVideoAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reelsOpen, setReelsOpen] = useState(false);
  const [reelsStartIndex, setReelsStartIndex] = useState(0);
  const [currentReelsIndex, setCurrentReelsIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [commentsByVideoId, setCommentsByVideoId] = useState({});
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [likingId, setLikingId] = useState(null);
  const [dislikingId, setDislikingId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const videoRefs = useRef({});
  const reelsSwiperRef = useRef(null);
  const isRTL = i18n.language === 'ar';

  const getLikerId = () => {
    let id = localStorage.getItem('videoAdLikerId');
    if (!id) {
      id = 'guest:' + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem('videoAdLikerId', id);
    }
    return id;
  };

  const updateVideoInList = (id, updates) => {
    setVideoAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, ...updates } : ad)));
  };

  const fetchVideoAds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/video-ads?activeOnly=true');
      const data = response.data.data || response.data;
      setVideoAds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching video ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (id, likerIdForHasLiked) => {
    try {
      const url = likerIdForHasLiked ? `/video-ads/${id}?likerId=${encodeURIComponent(likerIdForHasLiked)}` : `/video-ads/${id}`;
      const res = await api.get(url);
      const data = res.data.data ?? res.data;
      if (data && id) updateVideoInList(id, { views: data.views, hasLiked: data.hasLiked, hasDisliked: data.hasDisliked, likes: data.likes, dislikes: data.dislikes, commentsCount: data.commentsCount });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const fetchComments = async (videoId) => {
    if (commentsByVideoId[videoId]) return;
    try {
      const res = await api.get(`/video-ads/${videoId}/comments`);
      const list = res.data.data ?? res.data;
      setCommentsByVideoId((prev) => ({ ...prev, [videoId]: Array.isArray(list) ? list : [] }));
    } catch (e) {
      setCommentsByVideoId((prev) => ({ ...prev, [videoId]: [] }));
    }
  };

  const addComment = async (videoId, text, parentId = null) => {
    if (!text.trim()) return;
    setCommentSubmitting(true);
    try {
      const body = parentId ? { text: text.trim(), parentId } : { text: text.trim() };
      const res = await api.post(`/video-ads/${videoId}/comments`, body);
      const comment = res.data.data ?? res.data;
      setCommentsByVideoId((prev) => {
        const list = prev[videoId] || [];
        if (!parentId) return { ...prev, [videoId]: [comment, ...list] };
        const injectReply = (arr) => {
          return arr.map((c) => {
            if (c.id === parentId) return { ...c, replies: [comment, ...(c.replies || [])] };
            if (c.replies?.length) return { ...c, replies: injectReply(c.replies) };
            return c;
          });
        };
        return { ...prev, [videoId]: injectReply(list) };
      });
      const ad = videoAds.find((a) => a.id === videoId);
      if (ad) updateVideoInList(videoId, { commentsCount: (ad.commentsCount || 0) + 1 });
      setCommentText('');
      setReplyText('');
      setReplyingToId(null);
    } catch (e) {
      console.error('Add comment error:', e);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleLike = async (videoId) => {
    if (likingId) return;
    setLikingId(videoId);
    try {
      const res = await api.post(`/video-ads/${videoId}/like`, { likerId: getLikerId() });
      const data = res.data.data ?? res.data;
      updateVideoInList(videoId, { likes: data.likes ?? 0, hasLiked: data.liked ?? false });
    } catch (e) {
      console.error('Like error:', e);
    } finally {
      setLikingId(null);
    }
  };

  const handleDislike = async (videoId) => {
    if (dislikingId) return;
    setDislikingId(videoId);
    try {
      const res = await api.post(`/video-ads/${videoId}/dislike`, { dislikerId: getLikerId() });
      const data = res.data.data ?? res.data;
      updateVideoInList(videoId, { dislikes: data.dislikes ?? 0, hasDisliked: data.disliked ?? false });
    } catch (e) {
      console.error('Dislike error:', e);
    } finally {
      setDislikingId(null);
    }
  };

  const handleLinkClick = async (e, ad) => {
    if (ad?.linkUrl) {
      e.preventDefault();
      try {
        await api.post(`/video-ads/${ad.id}/link-click`);
      } catch (err) {}
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ url: window.location.href, title: videoAds[currentReelsIndex]?.titleEn || 'Video' }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {});
    }
  };

  const onReelsSlideChange = (swiper) => {
    const idx = swiper.activeIndex;
    setCurrentReelsIndex(idx);
    setProgress(0);
    Object.keys(videoRefs.current).forEach((i) => {
      const el = videoRefs.current[i];
      if (el) {
        if (Number(i) === idx) {
          el.play().catch(() => {});
          setIsPlaying(true);
        } else {
          el.pause();
        }
      }
    });
    if (videoAds[idx]?.id) {
      incrementViews(videoAds[idx].id, getLikerId());
      fetchComments(videoAds[idx].id);
    }
    setShowCommentsPanel(false);
  };

  useEffect(() => {
    fetchVideoAds();
  }, []);

  // قفل تمرير الصفحة عند فتح الريلز (مثل يوتيوب شورتس)
  useEffect(() => {
    if (!reelsOpen) return;
    const prev = document.body.style.overflow;
    const prevHeight = document.body.style.height;
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      document.body.style.height = prevHeight;
      document.documentElement.style.overflow = '';
    };
  }, [reelsOpen]);

  useEffect(() => {
    if (!reelsOpen || !videoAds[currentReelsIndex]) return;
    const el = videoRefs.current[currentReelsIndex];
    if (!el) return;
    const onTimeUpdate = () => {
      if (el.duration && el.duration > 0) setProgress((el.currentTime / el.duration) * 100);
    };
    const onLoadedMetadata = () => setProgress(0);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [reelsOpen, currentReelsIndex, videoAds.length]);

  const gridVideos = videoAds.slice(0, 4);
  const restVideos = videoAds.slice(4);

  if (loading || videoAds.length === 0) return null;

  const VideoCard = ({ ad, index, className = '' }) => (
    <button
      type="button"
      onClick={() => {
        setReelsStartIndex(index);
        setReelsOpen(true);
        if (videoAds[index]?.id) incrementViews(videoAds[index].id, getLikerId());
      }}
      className={`group relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 hover:border-primary/50 transition-all flex-shrink-0 ${className || 'max-h-[380px]'}`}
    >
      <div className="absolute inset-0">
        {ad.thumbnailUrl ? (
          <img src={getFileUrl(ad.thumbnailUrl)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <video src={getFileUrl(ad.videoUrl)} className="w-full h-full object-cover group-hover:scale-105 transition-transform" muted playsInline loop preload="metadata" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <Play className={`w-7 h-7 text-gray-900 fill-gray-900 ml-0.5 ${isRTL ? 'rotate-180' : ''}`} />
        </span>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 p-3 ${isRTL ? 'text-right' : 'text-left'}`}>
        <p className="text-white font-semibold text-sm line-clamp-2 drop-shadow-md">{isRTL ? ad.titleAr : ad.titleEn}</p>
      </div>
    </button>
  );

  return (
    <section className="w-full bg-white py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className={`flex items-center gap-4 mb-10 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 px-5 py-2.5 rounded-full">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-gray-700 text-sm font-bold uppercase">{isRTL ? 'عرض فيديو حصري' : 'Exclusive Video Deals'}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">{isRTL ? 'الفيديوهات' : 'Video Showcase'}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {gridVideos.map((ad, index) => (
            <motion.div key={ad.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <VideoCard ad={ad} index={index} className="max-h-[420px]" />
            </motion.div>
          ))}
        </div>

        {restVideos.length > 0 && (
          <div className="mt-14">
            <h3 className={`text-xl font-bold text-gray-900 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المزيد من الفيديوهات' : 'More videos'}</h3>
            <div className="relative px-12 md:px-16">
              <Swiper
                modules={[Navigation]}
                spaceBetween={16}
                slidesPerView={2}
                breakpoints={{ 640: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 }, 1280: { slidesPerView: 5 } }}
                navigation={{ nextEl: '.video-slider-next', prevEl: '.video-slider-prev' }}
                className="video-more-slider"
              >
                {restVideos.map((ad, index) => (
                  <SwiperSlide key={ad.id}>
                    <VideoCard ad={ad} index={4 + index} />
                  </SwiperSlide>
                ))}
              </Swiper>
              <button type="button" aria-label={isRTL ? 'السابق' : 'Previous'} className={`video-slider-prev absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white ${isRTL ? 'right-0 md:-right-6' : 'left-0 md:-left-6'}`}>
                {isRTL ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
              </button>
              <button type="button" aria-label={isRTL ? 'التالي' : 'Next'} className={`video-slider-next absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white ${isRTL ? 'left-0 md:-left-6' : 'right-0 md:-right-6'}`}>
                {isRTL ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )}

        <p className="text-gray-500 text-center mt-6 text-sm">{isRTL ? 'اضغط على أي فيديو لفتح العرض' : 'Click any video to open'}</p>
      </div>

      {/* واجهة الريلز — فيديو عمودي 9:16 في المنتصف مع أشرطة سوداء على الجانبين (مثل الصورة) */}
      <AnimatePresence>
        {reelsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="reels-overlay fixed inset-0 z-[999] bg-black"
            style={{ width: '100vw', height: '100dvh', maxHeight: '100vh' }}
          >
            <div className="reels-swiper-wrapper">
              <Swiper
                ref={reelsSwiperRef}
                direction="vertical"
                slidesPerView={1}
                spaceBetween={0}
                speed={320}
                initialSlide={reelsStartIndex}
                keyboard={{ enabled: true }}
                mousewheel={{ forceToAxis: true, sensitivity: 0.85 }}
                modules={[Keyboard, Mousewheel, FreeMode]}
                className="reels-fullscreen"
                onSwiper={() => {
                  setCurrentReelsIndex(reelsStartIndex);
                  if (videoAds[reelsStartIndex]?.id) fetchComments(videoAds[reelsStartIndex].id);
                  setTimeout(() => {
                    const el = videoRefs.current[reelsStartIndex];
                    if (el) el.play().catch(() => {});
                  }, 80);
                }}
                onSlideChange={onReelsSlideChange}
              >
                {videoAds.map((ad, index) => (
                  <SwiperSlide key={ad.id} className="reels-slide">
                    <div className="reels-slide-grid" style={{ gridTemplateColumns: '1fr min(56.25dvh, 100vw) 1fr' }}>
                      <div className="bg-black" aria-hidden />
                      <div className="reels-video-column">
                        <video
                          ref={(el) => { videoRefs.current[index] = el; }}
                          src={getFileUrl(ad.videoUrl)}
                          className="reels-video"
                          muted={isMuted}
                          playsInline
                          loop
                          autoPlay={false}
                          onClick={() => {
                            const el = videoRefs.current[currentReelsIndex];
                            if (!el) return;
                            if (el.paused) {
                              el.play();
                              setIsPlaying(true);
                            } else {
                              el.pause();
                              setIsPlaying(false);
                            }
                          }}
                        />
                        {/* نص على الفيديو — أسفل يسار العمود */}
                        <div className={`absolute bottom-16 left-0 right-0 px-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                          <p className="text-white text-base font-medium drop-shadow-lg">{isRTL ? ad.titleAr : ad.titleEn}</p>
                          <p className="text-white/80 text-sm mt-0.5 drop-shadow-lg">{isRTL ? ad.descriptionAr : ad.descriptionEn}</p>
                        </div>
                      </div>
                      <div className="bg-black" aria-hidden />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* طبقة التحكم — لا تمنع السحب: pointer-events فقط على الأزرار */}
            <div className="reels-controls-grid" style={{ gridTemplateColumns: '1fr min(56.25dvh, 100vw) 1fr' }}>
              <div className="pointer-events-none" />
              <div className="reels-controls-cell flex items-start justify-between px-2 pt-3 pointer-events-none">
                <div className={`reels-controls-buttons flex items-center gap-2 z-50 pointer-events-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => {
                      const el = videoRefs.current[currentReelsIndex];
                      if (el) {
                        if (el.paused) {
                          el.play();
                          setIsPlaying(true);
                        } else {
                          el.pause();
                          setIsPlaying(false);
                        }
                      }
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10"
                    aria-label={isPlaying ? (isRTL ? 'إيقاف' : 'Pause') : (isRTL ? 'تشغيل' : 'Play')}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                  </button>
                  <button
                    onClick={() => setIsMuted((m) => !m)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10"
                    aria-label={isMuted ? (isRTL ? 'تشغيل الصوت' : 'Unmute') : (isRTL ? 'كتم' : 'Mute')}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
                <button onClick={() => setReelsOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 pointer-events-auto" aria-label={isRTL ? 'إغلاق' : 'Close'}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="pointer-events-none" />
            </div>

            {/* أيقونات لايك، تعليق، مشاركة، متجر — فقط الشريط يلتقط النقر، باقي المنطقة للسحب */}
            {videoAds[currentReelsIndex] && (
              <div className="reels-controls-grid reels-actions-grid" style={{ gridTemplateColumns: '1fr min(56.25dvh, 100vw) 1fr' }}>
                <div className="pointer-events-none" />
                <div className={`reels-actions-cell flex flex-col items-center gap-4 justify-center min-h-0 py-4 pointer-events-none ${isRTL ? 'items-start pl-0' : 'items-end pr-0'}`}>
                  <div className={`reels-actions-strip flex flex-col items-center gap-4 px-3 py-4 rounded-xl pointer-events-auto ${isRTL ? 'rounded-l-xl' : 'rounded-r-xl'}`}>
                    <button
                      type="button"
                      onClick={() => handleLike(videoAds[currentReelsIndex].id)}
                      disabled={likingId === videoAds[currentReelsIndex].id}
                      className="flex flex-col items-center gap-1 text-white hover:opacity-90 transition-opacity"
                    >
                      <span className="w-12 h-12 rounded-full flex items-center justify-center text-white reels-action-icon">
                        <Heart className={`w-6 h-6 ${videoAds[currentReelsIndex].hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </span>
                      <span className="text-xs font-semibold tabular-nums drop-shadow-md">{videoAds[currentReelsIndex].likes ?? 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDislike(videoAds[currentReelsIndex].id)}
                      disabled={dislikingId === videoAds[currentReelsIndex].id}
                      className="flex flex-col items-center gap-1 text-white hover:opacity-90 transition-opacity"
                    >
                      <span className="w-12 h-12 rounded-full flex items-center justify-center text-white reels-action-icon">
                        <ThumbsDown className={`w-6 h-6 ${videoAds[currentReelsIndex].hasDisliked ? 'fill-gray-400 text-gray-400' : ''}`} />
                      </span>
                      <span className="text-xs font-semibold tabular-nums drop-shadow-md">{videoAds[currentReelsIndex].dislikes ?? 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCommentsPanel(true); fetchComments(videoAds[currentReelsIndex].id); }}
                      className="flex flex-col items-center gap-1 text-white hover:opacity-90 transition-opacity"
                    >
                      <span className="w-12 h-12 rounded-full flex items-center justify-center text-white reels-action-icon">
                        <MessageCircle className="w-6 h-6" />
                      </span>
                      <span className="text-xs font-semibold tabular-nums drop-shadow-md">{videoAds[currentReelsIndex].commentsCount ?? 0}</span>
                    </button>
                    <button type="button" onClick={handleShare} className="flex flex-col items-center gap-1 text-white hover:opacity-90 transition-opacity">
                      <span className="w-12 h-12 rounded-full flex items-center justify-center text-white reels-action-icon">
                        <Share2 className="w-6 h-6" />
                      </span>
                      <span className="text-xs font-semibold drop-shadow-md">{isRTL ? 'مشاركة' : 'Share'}</span>
                    </button>
                    {videoAds[currentReelsIndex].linkUrl && (
                      <button
                        type="button"
                        onClick={(e) => handleLinkClick(e, videoAds[currentReelsIndex])}
                        className="flex flex-col items-center gap-1 text-white hover:opacity-90 transition-opacity"
                      >
                        <span className="w-12 h-12 rounded-full flex items-center justify-center text-white reels-action-icon reels-action-icon-store">
                          <ExternalLink className="w-6 h-6" />
                        </span>
                        <span className="text-xs font-semibold drop-shadow-md">{isRTL ? 'المتجر' : 'Store'}</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="pointer-events-none" />
              </div>
            )}

            {/* شريط التقدم — لا يمنع السحب */}
            <div className="absolute bottom-0 left-0 right-0 z-50 h-1 bg-white/20 pointer-events-none">
              <motion.div className="h-full bg-red-500" style={{ width: `${progress}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* لوحة التعليقات — بدون اسم */}
      <AnimatePresence>
        {reelsOpen && showCommentsPanel && videoAds[currentReelsIndex] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/60 flex items-end justify-center p-4 pb-0" onClick={() => setShowCommentsPanel(false)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-4xl max-h-[70vh] bg-gray-900 rounded-t-2xl border-t border-gray-700 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex items-center justify-between p-4 border-b border-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h4 className="text-white font-bold text-sm">{isRTL ? 'التعليقات' : 'Comments'}</h4>
                <button type="button" onClick={() => setShowCommentsPanel(false)} className="p-2 rounded-lg hover:bg-gray-700 text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(commentsByVideoId[videoAds[currentReelsIndex].id] || []).length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-4">{isRTL ? 'لا تعليقات بعد.' : 'No comments yet.'}</p>
                ) : (
                  (commentsByVideoId[videoAds[currentReelsIndex].id] || []).map((c) => (
                    <CommentThread
                      key={c.id}
                      comment={c}
                      videoId={videoAds[currentReelsIndex].id}
                      isRTL={isRTL}
                      replyingToId={replyingToId}
                      setReplyingToId={setReplyingToId}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      addComment={addComment}
                      commentSubmitting={commentSubmitting}
                    />
                  ))
                )}
              </div>
              <div className={`p-4 border-t border-gray-700 flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  type="text"
                  value={replyingToId ? replyText : commentText}
                  onChange={(e) => (replyingToId ? setReplyText(e.target.value) : setCommentText(e.target.value))}
                  placeholder={replyingToId ? (isRTL ? 'اكتب رداً...' : 'Write a reply...') : (isRTL ? 'اكتب تعليقاً...' : 'Write a comment...')}
                  className="flex-1 rounded-full bg-gray-800 border border-gray-600 px-4 py-2.5 text-white text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    const text = replyingToId ? replyText : commentText;
                    addComment(videoAds[currentReelsIndex].id, text, replyingToId || undefined);
                  }}
                />
                <button
                  type="button"
                  onClick={() => addComment(videoAds[currentReelsIndex].id, replyingToId ? replyText : commentText, replyingToId || undefined)}
                  disabled={commentSubmitting || !(replyingToId ? replyText : commentText).trim()}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ريلز مثل الصورة: فيديو عمودي 9:16 في المنتصف مع أشرطة سوداء على الجانبين */
        .reels-overlay { top: 0; left: 0; right: 0; bottom: 0; }
        .reels-swiper-wrapper { position: absolute; inset: 0; }
        .reels-fullscreen {
          width: 100% !important;
          height: 100dvh !important;
          max-height: 100vh !important;
        }
        .reels-fullscreen .reels-slide,
        .reels-fullscreen .swiper-slide {
          width: 100% !important;
          height: 100dvh !important;
          max-height: 100vh !important;
        }
        .reels-slide-grid {
          display: grid;
          width: 100%;
          height: 100%;
          min-height: 100dvh;
        }
        .reels-video-column {
          position: relative;
          width: 100%;
          height: 100dvh;
          max-height: 100vh;
          background: #000;
          overflow: hidden;
        }
        .reels-video-column .reels-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
        }
        .reels-controls-grid {
          position: absolute;
          inset: 0;
          display: grid;
          pointer-events: none;
          z-index: 50;
        }
        .reels-controls-grid .reels-controls-cell {
          pointer-events: none;
        }
        .reels-controls-grid .reels-controls-buttons,
        .reels-controls-grid .reels-controls-cell button {
          pointer-events: auto;
        }
        .reels-actions-grid {
          position: absolute;
          inset: 0;
          display: grid;
          pointer-events: none;
          z-index: 50;
          align-items: center;
        }
        .reels-actions-grid .reels-actions-cell {
          pointer-events: none;
          justify-content: center;
        }
        .reels-actions-grid .reels-actions-strip {
          pointer-events: auto;
        }
        /* شريط الأيقونات بجوار الفيديو — خلفية خفيفة ووضوح */
        .reels-actions-strip {
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        }
        .reels-action-icon {
          filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
        }
        .reels-action-icon-store {
          background: rgba(255, 255, 255, 0.15);
        }
      `}} />
    </section>
  );
};

export default VideoAdsSection;
