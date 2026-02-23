'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './videos.module.css';

/* ---------- Types ---------- */

interface Video {
  id: number;
  video_url: string;
  video_type: string;
  thumbnail_url: string | null;
  title: string;
  description: string | null;
  submitter_name: string;
  submitter_email: string;
  location: string | null;
  views: number;
  likes: number;
  featured: boolean;
  approved: boolean;
  created_at: string;
}

interface FilterState {
  sort: string;
  featured: boolean;
}

/* ---------- Utilities ---------- */

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch]);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('video_session_id');
  if (!id) {
    id =
      'sess_' +
      Math.random().toString(36).substring(2, 11) +
      Date.now().toString(36);
    localStorage.setItem('video_session_id', id);
  }
  return id;
}

/* ---------- Filter Tabs Config ---------- */

const FILTER_TABS: { label: string; sort: string; featured: boolean }[] = [
  { label: 'Newest', sort: 'newest', featured: false },
  { label: 'Most Liked', sort: 'popular', featured: false },
  { label: 'Most Viewed', sort: 'views', featured: false },
  { label: 'Featured', sort: 'newest', featured: true },
];

/* ---------- Component ---------- */

export default function VideosPage() {
  /* --- State --- */
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    sort: 'newest',
    featured: false,
  });
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());

  // Video player modal
  const [playerVideo, setPlayerVideo] = useState<Video | null>(null);

  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Refs for form
  const formRef = useRef<HTMLFormElement>(null);

  /* --- Session ID (stable across renders) --- */
  const sessionIdRef = useRef<string>('');
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  /* --- Data Fetching --- */

  const checkLikedVideos = useCallback(async (videoIds: number[]) => {
    if (videoIds.length === 0) return;
    try {
      const res = await fetch('/api/videos/check-likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          video_ids: videoIds,
        }),
      });
      const data = await res.json();
      if (data.likedIds) {
        setLikedVideos(new Set(data.likedIds));
      }
    } catch (err) {
      // silently handled
    }
  }, []);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/videos?sort=${filter.sort}`;
      if (filter.featured) {
        url += '&featured=true';
      }
      const res = await fetch(url);
      const data: Video[] = await res.json();
      setVideos(data);

      // Check which videos the user has liked
      const ids = data.map((v) => v.id);
      await checkLikedVideos(ids);
    } catch (err) {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [filter, checkLikedVideos]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  /* --- Like Toggle --- */

  const toggleLike = async (videoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      });
      const data = await res.json();

      setLikedVideos((prev) => {
        const next = new Set(prev);
        if (data.liked) {
          next.add(videoId);
        } else {
          next.delete(videoId);
        }
        return next;
      });

      setVideos((prev) =>
        prev.map((v) => {
          if (v.id !== videoId) return v;
          return {
            ...v,
            likes: data.liked ? v.likes + 1 : v.likes - 1,
          };
        })
      );

      // Haptic feedback on mobile
      if (data.liked && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch (err) {
      // silently handled
    }
  };

  /* --- Filter Handling --- */

  const handleFilterClick = (tab: (typeof FILTER_TABS)[number]) => {
    setFilter({ sort: tab.sort, featured: tab.featured });
  };

  /* --- Video Modal --- */

  const openVideoModal = (video: Video) => {
    setPlayerVideo(video);
    document.body.style.overflow = 'hidden';
  };

  const closeVideoModal = useCallback(() => {
    setPlayerVideo(null);
    document.body.style.overflow = '';
  }, []);

  /* --- Submit Modal --- */

  const openSubmitModal = () => {
    setShowSubmitModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeSubmitModal = useCallback(() => {
    setShowSubmitModal(false);
    document.body.style.overflow = '';
    if (formRef.current) formRef.current.reset();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);

    try {
      const res = await fetch('/api/videos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        closeSubmitModal();
        alert('Video submitted successfully! It will appear after approval.');
      } else {
        alert('Error: ' + (data.error || 'Failed to submit video'));
      }
    } catch (err) {
      alert('Error submitting video. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* --- Keyboard / Backdrop Close --- */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (playerVideo) closeVideoModal();
        if (showSubmitModal) closeSubmitModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [playerVideo, showSubmitModal, closeVideoModal, closeSubmitModal]);

  /* --- Stats from loaded data --- */

  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);

  /* ---------- Render ---------- */

  return (
    <main>
      {/* Hero */}
      <header className={styles.videoHero}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>
            Video <span className={styles.heroTitleAccent}>Wall</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Watch epic Water Blob&reg; launches from our amazing community. Got
            a video? Share it!
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>{videos.length}</span>
              <span className={styles.heroStatLabel}>Videos</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>
                {formatNumber(totalViews)}
              </span>
              <span className={styles.heroStatLabel}>Views</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>
                {formatNumber(totalLikes)}
              </span>
              <span className={styles.heroStatLabel}>Likes</span>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarInner}>
          <div className={styles.filterTabs}>
            {FILTER_TABS.map((tab) => {
              const isActive =
                filter.sort === tab.sort &&
                filter.featured === tab.featured;
              return (
                <button
                  key={tab.label}
                  className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ''}`}
                  onClick={() => handleFilterClick(tab)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button className={styles.submitBtn} onClick={openSubmitModal}>
            <span>&#x1F4F9;</span> Submit Your Video
          </button>
        </div>
      </div>

      {/* Video Wall */}
      <section className={styles.videoWallSection}>
        <div className={styles.sectionContainer}>
          {/* Loading */}
          {loading && (
            <div className={styles.loadingSpinner}>
              <div className={styles.spinner} />
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>&#x1F3AC;</div>
              <h3 className={styles.emptyStateTitle}>No videos yet!</h3>
              <p className={styles.emptyStateText}>
                Be the first to share your Water Blob&reg; adventure.
              </p>
              <button className={styles.submitBtn} onClick={openSubmitModal}>
                Submit Your Video
              </button>
            </div>
          )}

          {/* Video Grid */}
          {!loading && videos.length > 0 && (
            <div className={styles.videoGrid}>
              {videos.map((video) => {
                const isLiked = likedVideos.has(video.id);
                const initials = getInitials(video.submitter_name);
                return (
                  <div
                    key={video.id}
                    className={styles.videoCard}
                    onClick={() => openVideoModal(video)}
                  >
                    <div className={styles.videoThumbnail}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.videoThumbnailImg}
                        src={video.thumbnail_url || '/assets/homepage/logo.png'}
                        alt={escapeHtml(video.title)}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            '/assets/homepage/logo.png';
                        }}
                      />
                      <div className={styles.playOverlay}>
                        <div className={styles.playButton} />
                      </div>
                      {video.featured && (
                        <span className={styles.featuredBadge}>Featured</span>
                      )}
                    </div>

                    <div className={styles.videoInfo}>
                      <h3 className={styles.videoTitle}>
                        {escapeHtml(video.title)}
                      </h3>
                      <div className={styles.videoMeta}>
                        <span className={styles.videoMetaItem}>
                          &#x1F441; {formatNumber(video.views || 0)}
                        </span>
                        <span className={styles.videoMetaItem}>
                          &#x2764;&#xFE0F; {formatNumber(video.likes || 0)}
                        </span>
                        {video.location && (
                          <span className={styles.videoMetaItem}>
                            &#x1F4CD; {escapeHtml(video.location)}
                          </span>
                        )}
                      </div>
                      <div className={styles.videoSubmitter}>
                        <div className={styles.submitterInfo}>
                          <div className={styles.submitterAvatar}>
                            {initials}
                          </div>
                          <span className={styles.submitterName}>
                            {escapeHtml(video.submitter_name)}
                          </span>
                        </div>
                        <button
                          className={`${styles.likeBtn} ${isLiked ? styles.likeBtnLiked : ''}`}
                          onClick={(e) => toggleLike(video.id, e)}
                        >
                          <span>{isLiked ? '\u2764\uFE0F' : '\u{1F90D}'}</span>
                          <span>{video.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Video Player Modal */}
      {playerVideo && (
        <div
          className={styles.videoModal}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeVideoModal();
          }}
        >
          <div className={styles.videoModalContent}>
            <button
              className={styles.videoModalClose}
              onClick={closeVideoModal}
              aria-label="Close video"
            >
              &times;
            </button>
            <div className={styles.videoModalPlayer}>
              {(() => {
                const ytId = extractYouTubeId(playerVideo.video_url);
                if (ytId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title={escapeHtml(playerVideo.title)}
                    />
                  );
                }
                return (
                  <p
                    style={{
                      color: 'white',
                      textAlign: 'center',
                      padding: '2rem',
                    }}
                  >
                    Video format not supported for inline playback.
                  </p>
                );
              })()}
            </div>
            <div className={styles.videoModalInfo}>
              <h3 className={styles.videoModalTitle}>
                {escapeHtml(playerVideo.title)}
              </h3>
              {playerVideo.description && (
                <p className={styles.videoModalDescription}>
                  {escapeHtml(playerVideo.description)}
                </p>
              )}
              <div className={styles.videoModalMeta}>
                <span>By {escapeHtml(playerVideo.submitter_name)}</span>
                {playerVideo.location && (
                  <span>
                    &#x1F4CD; {escapeHtml(playerVideo.location)}
                  </span>
                )}
                <span>
                  &#x1F441; {formatNumber(playerVideo.views || 0)} views
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Video Modal */}
      {showSubmitModal && (
        <div
          className={styles.submitModal}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSubmitModal();
          }}
        >
          <div className={styles.submitModalContent}>
            <h2 className={styles.submitModalTitle}>Share Your Video</h2>
            <p className={styles.submitModalSubtitle}>
              Show the world your epic Water Blob&reg; moments!
            </p>

            <form ref={formRef} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>YouTube URL *</label>
                <input
                  className={styles.formInput}
                  type="url"
                  name="video_url"
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
                <div className={styles.formHint}>
                  Paste your YouTube video link
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title *</label>
                <input
                  className={styles.formInput}
                  type="text"
                  name="title"
                  placeholder="Epic summer blob launch!"
                  maxLength={255}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  name="description"
                  placeholder="Tell us about this moment..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Your Name *</label>
                <input
                  className={styles.formInput}
                  type="text"
                  name="submitter_name"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email *</label>
                <input
                  className={styles.formInput}
                  type="email"
                  name="submitter_email"
                  placeholder="john@example.com"
                  required
                />
                <div className={styles.formHint}>
                  We&apos;ll notify you when your video is approved
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location</label>
                <input
                  className={styles.formInput}
                  type="text"
                  name="location"
                  placeholder="Camp Sunshine, Maine"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={closeSubmitModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnFormSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
