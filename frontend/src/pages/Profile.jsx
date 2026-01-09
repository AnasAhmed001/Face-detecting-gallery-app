// // src/pages/Profile.jsx
// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import Masonry from "react-masonry-css";
// import { Button } from "@/components/ui/button";
// import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";
// import { ArrowLeft, Image as ImageIcon } from "lucide-react";
// import api from "../api/axios";

// export default function Profile({
//   eventId: propEventId,
//   faceId: propFaceId,
//   pageSize = 24,
// }) {
//   const params = useParams();
//   const eventId = propEventId || params.eventId;
//   const faceId = propFaceId || params.faceId;

//   const navigate = useNavigate();

//   const [images, setImages] = useState([]);
//   const [faceThumbUrl, setFaceThumbUrl] = useState("");
//   const [cursor, setCursor] = useState(null);
//   const [hasMore, setHasMore] = useState(true);
//   const [initialLoading, setInitialLoading] = useState(true);
//   const [error, setError] = useState("");

//   // ---- Refs to avoid stale state inside observer ----
//   const hasMoreRef = useRef(true);
//   const busyRef = useRef(false);
//   const cursorRef = useRef(null);
//   const lastRequestedCursorRef = useRef("__INIT__");

//   // ---- Modal State ----
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalIndex, setModalIndex] = useState(0);
//   const [isImageLoaded, setIsImageLoaded] = useState(false);

//   const markBusy = (v) => {
//     busyRef.current = v;
//   };
//   const setCursorSafe = (c) => {
//     cursorRef.current = c;
//     setCursor(c);
//   };
//   const setHasMoreSafe = (v) => {
//     hasMoreRef.current = v;
//     setHasMore(v);
//   };

//   const fetchPage = useCallback(
//     async ({ reset = false } = {}) => {
//       if (!eventId || !faceId) return;

//       // determine which cursor to use
//       const useCursor = reset ? null : cursorRef.current;

//       // prevent duplicate request for same cursor
//       if (lastRequestedCursorRef.current === (useCursor ?? "__NULL__")) return;

//       // if already loading or no more pages, stop
//       if (busyRef.current || (!hasMoreRef.current && !reset)) return;

//       // lock for this cursor
//       lastRequestedCursorRef.current = useCursor ?? "__NULL__";

//       markBusy(true);
//       setError("");
//       try {
//         const params = { limit: pageSize };
//         if (useCursor) params.cursor = useCursor;

//         const { data } = await api.get(
//           `/events/${eventId}/faces/${faceId}/images`,
//           { params }
//         );

//         // normalize
//         const newImagesRaw = Array.isArray(data?.images) ? data.images : [];
//         const normalized = newImagesRaw
//           .map((it) => ({
//             id: it.imageSort || it.originalUrl || it.mdUrl,
//             thumbUrl: it.thumbUrl,
//             mdUrl: it.mdUrl,
//             originalUrl: it.originalUrl,
//             capturedAt: it.capturedAt,
//             // For backward compatibility
//             src: it.thumbUrl,
//             raw: it.originalUrl
//           }))
//           .filter((x) => x.thumbUrl && x.mdUrl && x.originalUrl);

//         if (reset) {
//           setImages(normalized);
//         } else {
//           setImages((prev) => [...prev, ...normalized]);
//         }

//         if (data.faceThumbUrl) {
//           setFaceThumbUrl(data.faceThumbUrl);
//         } else if (data.images?.[0]?.thumbUrl) {
//           setFaceThumbUrl(data.images[0].thumbUrl);
//         }

//         setCursorSafe(data?.nextCursor ?? null);
//         setHasMoreSafe(Boolean(data?.nextCursor));
//       } catch (e) {
//         setError("Failed to load photos.");
//         // allow retry on same cursor
//         lastRequestedCursorRef.current = "__ALLOW_RETRY__";
//       } finally {
//         markBusy(false);
//         setInitialLoading(false);
//       }
//     },
//     [eventId, faceId, pageSize]
//   );

//   // initial load / when IDs change
//   useEffect(() => {
//     setImages([]);
//     setFaceThumbUrl("");
//     setCursorSafe(null);
//     setHasMoreSafe(true);
//     setInitialLoading(true);
//     setError("");
//     lastRequestedCursorRef.current = "__INIT__";
//     fetchPage({ reset: true });
//   }, [eventId, faceId, fetchPage]);

//   const coverUrl = useMemo(
//     () => images[0]?.mdUrl || images[0]?.src || faceThumbUrl || "",
//     [images, faceThumbUrl]
//   );

//   // ---- Infinite scroll sentinel (stable observer using refs) ----
//   const sentinelRef = useRef(null);
//   useEffect(() => {
//     if (!sentinelRef.current) return;
//     const el = sentinelRef.current;

//     const io = new IntersectionObserver(
//       (entries) => {
//         const ent = entries[0];
//         if (!ent.isIntersecting) return;
//         // read from refs to avoid stale closures
//         if (busyRef.current) return;
//         if (!hasMoreRef.current) return;
//         fetchPage(); // will self-guard on lastRequestedCursorRef
//       },
//       { root: null, rootMargin: "600px", threshold: 0.01 }
//     );

//     io.observe(el);
//     return () => io.disconnect();
//   }, [fetchPage]);

//   const openModal = (index) => {
//     setModalIndex(index);
//     setIsModalOpen(true);
//     setIsImageLoaded(false);
//     document.body.style.overflow = "hidden";
//   };

//   const closeModal = useCallback(() => {
//     setIsModalOpen(false);
//     document.body.style.overflow = "auto";
//   }, []);

//   const showPrev = useCallback(() => {
//     setModalIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
//     setIsImageLoaded(false);
//   }, [images.length]);

//   const showNext = useCallback(() => {
//     setModalIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
//     setIsImageLoaded(false);
//   }, [images.length]);

//   useEffect(() => {
//     if (!isModalOpen) return;
    
//     const handleKeyDown = (e) => {
//       if (e.key === 'Escape') closeModal();
//       if (e.key === 'ArrowLeft') showPrev();
//       if (e.key === 'ArrowRight') showNext();
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [isModalOpen, closeModal, showPrev, showNext]);

//   const downloadImage = async (imageUrl, imageName = "photo.jpg") => {
//     try {
//       const response = await fetch(imageUrl);
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = imageName;
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//     } catch (error) {
//       console.error("Download failed:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full bg-muted/30">
//       {/* Cover Banner */}
//       <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
//         <div className="h-[280px] sm:h-[320px] lg:h-[380px] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-muted">
//           {coverUrl ? (
//             <img
//               src={coverUrl}
//               alt="Cover photo"
//               className="w-full h-full object-cover"
//             />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center">
//               <div className="text-center text-muted-foreground">
//                 <ImageIcon className="h-12 w-12 mx-auto mb-2" />
//                 <p className="text-sm">No cover image</p>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Profile Avatar */}
//         <div className="absolute -bottom-10 left-6 sm:left-8">
//           <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden ring-4 ring-background shadow-xl bg-muted">
//             {faceThumbUrl ? (
//               <img
//                 src={faceThumbUrl}
//                 alt="Profile"
//                 className="w-full h-full object-cover"
//                 onError={(e) => {
//                   e.target.style.display = "none";
//                   e.target.nextSibling.style.display = "flex";
//                 }}
//               />
//             ) : (
//               <div className="w-full h-full flex items-center justify-center bg-muted">
//                 <ImageIcon className="h-6 w-6 text-muted-foreground" />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="mx-auto w-full pt-12 sm:pt-14 px-4 sm:px-6 lg:px-8">
//         {/* Error State */}
//         {error && (
//           <Alert variant="destructive" className="mb-6">
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {/* Loading Skeleton */}
//         {initialLoading && (
//           <Masonry
//             breakpointCols={{
//               default: 4,
//               1100: 3,
//               700: 2,
//               500: 1,
//             }}
//             className="flex -ml-4 w-auto"
//             columnClassName="pl-4 bg-clip-padding"
//           >
//             {Array.from({ length: 12 }).map((_, i) => (
//               <div key={i} className="mb-4">
//                 <Skeleton className="w-full h-64 rounded-lg" />
//               </div>
//             ))}
//           </Masonry>
//         )}

//         {/* Empty State */}
//         {!initialLoading && !error && images.length === 0 && (
//           <Card>
//             <CardContent className="p-8 sm:p-12">
//               <div className="text-center">
//                 <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
//                 <h3 className="text-lg font-medium mb-2">No photos found</h3>
//                 <p className="text-sm text-muted-foreground">
//                   There are no photos available for this profile.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Photo Grid with Masonry Layout */}
//         {!initialLoading && images.length > 0 && (
//           <div className="space-y-6">
//             <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
//             <Masonry
//               breakpointCols={{
//                 default: 4,
//                 1100: 3,
//                 700: 2,
//                 500: 1,
//               }}
//               className="flex -ml-4 w-auto"
//               columnClassName="pl-4 bg-clip-padding"
//             >
//               {images.map((img, idx) => (
//                 <div key={img.id || idx} className="mb-4">
//                   <Card
//                     className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
//                     onClick={() => openModal(idx)}
//                   >
//                     <div className="relative group">
//                       <img
//                         src={img.thumbUrl}
//                         alt=""
//                         loading="lazy"
//                         className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-200"
//                         style={{
//                           maxWidth: "100%",
//                           height: "auto",
//                           display: "block",
//                         }}
//                       />
//                     </div>
//                   </Card>
//                 </div>
                
//               ))}
//             </Masonry>

//             {/* Infinite Scroll Sentinel */}
//             <div ref={sentinelRef} className="h-16" />

//             {/* Footer Status */}
//             <div className="flex items-center justify-center pb-8">
//               {busyRef.current && hasMoreRef.current && (
//                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
//                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
//                   Loading more photos...
//                 </div>
//               )}
//               {!hasMore && images.length > 0 && (
//                 <p className="text-sm text-muted-foreground">
//                   You've reached the end of your photos.
//                 </p>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//             {/* Image Preview Modal */}
//             {isModalOpen && images[modalIndex] && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
//           onTouchStart={(e) => {
//             e.currentTarget.dataset.touchStartX = e.touches[0].clientX;
//           }}
//           onTouchEnd={(e) => {
//             const touchEndX = e.changedTouches[0].clientX;
//             const touchStartX = e.currentTarget.dataset.touchStartX;
//             if (touchStartX === undefined) return;
//             const diff = touchEndX - touchStartX;
//             if (diff > 50) showPrev();
//             else if (diff < -50) showNext();
//           }}
//         >
//           {/* Close Button */}
//           <button
//             onClick={closeModal}
//             className="absolute top-4 right-4 text-white text-3xl font-bold bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition-transform duration-300 ease-in-out hover:scale-110 z-10"
//           >
//             <X className="w-6 h-6" />
//           </button>

//           {/* Download Button */}
//           <button
//             onClick={() => downloadImage(images[modalIndex].originalUrl, `photo-${modalIndex + 1}.jpg`)}
//             className="absolute top-4 right-16 text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-transform duration-300 ease-in-out hover:scale-110 z-10"
//             title="Download"
//           >
//             <Download className="w-5 h-5" />
//           </button>

//           {/* Desktop Arrows */}
//           <div className="hidden sm:flex w-full max-w-7xl mx-auto justify-between px-4 absolute left-0 right-0">
//             <button
//               onClick={showPrev}
//               className="text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-transform duration-300 ease-in-out hover:scale-110"
//               aria-label="Previous"
//             >
//               <ChevronLeft className="w-8 h-8" />
//             </button>
//             <button
//               onClick={showNext}
//               className="text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-transform duration-300 ease-in-out hover:scale-110"
//               aria-label="Next"
//             >
//               <ChevronRight className="w-8 h-8" />
//             </button>
//           </div>

//           {/* Image with fade-in */}
//           <div className="relative flex items-center justify-center max-h-[85vh] max-w-full w-full">
//             {!isImageLoaded && (
//               <div className="flex items-center justify-center w-full h-[70vh]">
//                 <div className="w-10 h-10 border-4 border-white/50 border-t-transparent rounded-full animate-spin" />
//               </div>
//             )}
//             <img
//               src={images[modalIndex].mdUrl || images[modalIndex].src}
//               alt=""
//               className={`max-h-[85vh] max-w-full object-contain transition-opacity duration-500 ${
//                 isImageLoaded ? 'opacity-100' : 'opacity-0'
//               }`}
//               onLoad={() => setIsImageLoaded(true)}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// src/pages/Profile.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Masonry from "react-masonry-css";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon } from "lucide-react";
import api from "../api/axios";
import ImageModal from "../components/ImageModal";

// Masonry breakpoints (moved outside to avoid recreating objects each render)
const MASONRY_BREAKPOINTS = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

export default function Profile({ eventId: propEventId, faceId: propFaceId, pageSize = 24 }) {
  const params = useParams();
  const eventId = propEventId || params.eventId;
  const faceId = propFaceId || params.faceId;
  const [images, setImages] = useState([]);
  const [faceThumbUrl, setFaceThumbUrl] = useState("");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- Refs to avoid stale state inside observer ----
  const hasMoreRef = useRef(true);
  const busyRef = useRef(false);
  const cursorRef = useRef(null);
  const lastRequestedCursorRef = useRef("__INIT__");

  // ---- Modal State ----
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const markBusy = (v) => {
    busyRef.current = v;
  };
  const setCursorSafe = (c) => {
    cursorRef.current = c;
    setCursor(c);
  };
  const setHasMoreSafe = (v) => {
    hasMoreRef.current = v;
    setHasMore(v);
  };

  // ---- Fetch function (memoized) ----
  const fetchPage = useCallback(
    async ({ reset = false } = {}) => {
      if (!eventId || !faceId) return;

      const useCursor = reset ? null : cursorRef.current;
      if (lastRequestedCursorRef.current === (useCursor ?? "__NULL__")) return;
      if (busyRef.current || (!hasMoreRef.current && !reset)) return;
      lastRequestedCursorRef.current = useCursor ?? "__NULL__";

      markBusy(true);
      setError("");
      try {
        const params = { limit: pageSize };
        if (useCursor) params.cursor = useCursor;

        const { data } = await api.get(
          `/events/${eventId}/faces/${faceId}/images`,
          { params }
        );

        const newImagesRaw = Array.isArray(data?.images) ? data.images : [];
        const normalized = newImagesRaw
          .map((it) => ({
            id: it.imageSort || it.originalUrl || it.mdUrl,
            thumbUrl: it.thumbUrl,
            mdUrl: it.mdUrl,
            originalUrl: it.originalUrl,
            capturedAt: it.capturedAt,
            src: it.thumbUrl,
            raw: it.originalUrl,
          }))
          .filter((x) => x.thumbUrl && x.mdUrl && x.originalUrl);

        setImages((prev) => (reset ? normalized : [...prev, ...normalized]));

        if (data.faceThumbUrl) {
          setFaceThumbUrl(data.faceThumbUrl);
        } else if (data.images?.[0]?.thumbUrl) {
          setFaceThumbUrl(data.images[0].thumbUrl);
        }

        setCursorSafe(data?.nextCursor ?? null);
        setHasMoreSafe(Boolean(data?.nextCursor));
      } catch (e) {
        setError("Failed to load photos.");
        lastRequestedCursorRef.current = "__ALLOW_RETRY__";
      } finally {
        markBusy(false);
        setInitialLoading(false);
      }
    },
    [eventId, faceId, pageSize]
  );

  // ---- Initial load ----
  useEffect(() => {
    setImages([]);
    setFaceThumbUrl("");
    setCursorSafe(null);
    setHasMoreSafe(true);
    setInitialLoading(true);
    setError("");
    lastRequestedCursorRef.current = "__INIT__";
    fetchPage({ reset: true });
  }, [eventId, faceId, fetchPage]);

  const coverUrl = useMemo(
    () => images[0]?.mdUrl || images[0]?.src || faceThumbUrl || "",
    [images, faceThumbUrl]
  );

  // ---- Infinite scroll observer ----
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (!ent.isIntersecting) return;
        if (busyRef.current) return;
        if (!hasMoreRef.current) return;
        fetchPage();
      },
      { root: null, rootMargin: "600px", threshold: 0.01 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [fetchPage]);

  // ---- Handlers (memoized) ----
  const openModal = useCallback((index) => {
    setModalIndex(index);
    setIsModalOpen(true);
    setIsImageLoaded(false);
    document.body.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto";
  }, []);

  const showPrev = useCallback(() => {
    setModalIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsImageLoaded(false);
  }, [images.length]);

  const showNext = useCallback(() => {
    setModalIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsImageLoaded(false);
  }, [images.length]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal, showPrev, showNext]);

  // ---- Download handler (stable) ----
  const downloadImage = useCallback(async (imageUrl, imageName = "photo.jpg") => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, []);

  // ---- Memoized image list ----
  const renderedImages = useMemo(
    () =>
      images.map((img, idx) => (
        <div key={img.id || idx} className="mb-4">
          <Card
            className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => openModal(idx)}
          >
            <div className="relative group">
              <img
                src={img.thumbUrl}
                alt="image"
                loading="lazy"
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
              />
            </div>
          </Card>
        </div>
      )),
    [images, openModal]
  );

  return (
    <div className="min-h-screen w-full bg-muted/30">
      {/* Cover Banner */}
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="h-[280px] sm:h-[320px] lg:h-[380px] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-muted">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover photo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">No cover image</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="absolute -bottom-10 left-6 sm:left-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden ring-4 ring-background shadow-xl bg-muted">
            {faceThumbUrl ? (
              <img
                src={faceThumbUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full pt-12 sm:pt-14 px-4 sm:px-6 lg:px-8">
        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading Skeleton */}
        {initialLoading && (
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="w-full h-64 rounded-lg" />
              </div>
            ))}
          </Masonry>
        )}

        {/* Empty State */}
        {!initialLoading && !error && images.length === 0 && (
          <Card>
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No photos found</h3>
                <p className="text-sm text-muted-foreground">
                  There are no photos available for this profile.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Grid with Masonry Layout */}
        {!initialLoading && images.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
            <Masonry
              breakpointCols={MASONRY_BREAKPOINTS}
              className="flex -ml-4 w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              {renderedImages}
            </Masonry>

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} className="h-16" />

            {/* Footer Status */}
            <div className="flex items-center justify-center pb-8">
              {busyRef.current && hasMoreRef.current && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Loading more photos...
                </div>
              )}
              {!hasMore && images.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  You've reached the end of your photos.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <ImageModal
        isOpen={isModalOpen}
        images={images}
        modalIndex={modalIndex}
        closeModal={closeModal}
        showPrev={showPrev}
        showNext={showNext}
        isImageLoaded={isImageLoaded}
        setIsImageLoaded={setIsImageLoaded}
        downloadImage={downloadImage}
      />
    </div>
  );
}
