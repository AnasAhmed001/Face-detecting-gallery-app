import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Masonry from "react-masonry-css";
import api from "../api/axios";
import END_POINTS from "../constant/endPoints";

const PhotoItem = ({
  img,
  index,
  lastImageElementRef,
  onDownload,
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDownloadClick = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    await onDownload(
      img.rawUrl || img.mdUrl || img.thumbUrl,
      `event-photo-${index + 1}.jpg`
    );
    setIsDownloading(false);
  };

  const animationDelay = `${(index % 15) * 50}ms`;

  return (
    <div
      ref={lastImageElementRef}
      className={`relative group mb-4 break-inside-avoid transform transition-all duration-500 ease-in-out ${
        isMounted
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 translate-y-4"
      }`}
      style={{ transitionDelay: animationDelay }}
    >
      <div
        onClick={() => onClick(index)}
        className="cursor-pointer relative w-full"
      >
        {/* Skeleton while loading */}
        {!isLoaded && (
          <Skeleton
            className="w-full mb-2 !rounded-none animate-pulse"
            style={{ height: `${Math.floor(Math.random() * 150) + 200}px` }}
          />
        )}

        {/* Image */}
        <img
          src={img.thumbUrl || "/placeholder.svg"}
          alt={img.name || `Event photo ${index + 1}`}
          className={`w-full h-auto object-cover transition-opacity duration-700 ease-in-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
        />

        {/* Download Button */}
        <button
          onClick={handleDownloadClick}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/70 text-white p-2 rounded-full transition"
        >
          {isDownloading ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};


export default function DigitalAlbum() {
  const { eventId, userId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const eventName = searchParams.get("eventName") || "Event Gallery";

  const [event] = useState({ name: eventName, cover: "" });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);

  const observer = useRef();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const openModal = (index) => {
    setModalIndex(index);
    setIsModalOpen(true);
    setIsImageLoaded(false);
  };

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const showPrev = useCallback(() => {
    setModalIndex((prev) =>
      prev === 0 ? uploadedImages.length - 1 : prev - 1
    );
    setIsImageLoaded(false);
  }, [uploadedImages]);

  const showNext = useCallback(() => {
    setModalIndex((prev) =>
      prev === uploadedImages.length - 1 ? 0 : prev + 1
    );
    setIsImageLoaded(false);
  }, [uploadedImages]);

  // 🔥 Keyboard navigation
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, showPrev, showNext, closeModal]);

  const lastImageElementRef = useCallback(
    (node) => {
      if (loadingMore || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore]
  );

  const fetchImages = useCallback(
    async (page) => {

      if (!userId) {
        console.error("User ID is missing from URL");
        setLoadingImages(false);
        setLoadingMore(false);
        return;
      }
      
      const isInitialLoad = page === 1;
      if (isInitialLoad) setLoadingImages(true);
      else setLoadingMore(true);

      try {
        const { data } = await api.get(
          `${END_POINTS.GET_IMAGES}/${userId}/${eventId}?page=${page}`
        );
        const imagesWithDimensions = (data.images || []).map((img) => ({
          ...img,
          width: img.width,
          height: img.height,
        }));

        if (isInitialLoad) {
          setUploadedImages(imagesWithDimensions);
        } else {
          setUploadedImages((prev) => [...prev, ...imagesWithDimensions]);
        }
        setTotalPages(data.totalPages || 1);
        setTotalImages(data.total || 0);
        setHasMore(page < (data.totalPages || 1));
      } catch (err) {
        console.error("❌ Failed to fetch images:", err);
        if (isInitialLoad) setUploadedImages([]);
      } finally {
        if (isInitialLoad) setLoadingImages(false);
        else setLoadingMore(false);
      }
    },
    [userId, eventId]
  );

  useEffect(() => {
    if (userId && eventId) {
      setCurrentPage(1);
      setUploadedImages([]);
      setHasMore(true);
      fetchImages(1);
    }
  }, [userId, eventId, fetchImages]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchImages(currentPage);
    }
  }, [currentPage, fetchImages]);

  const downloadImage = async (imageUrl, imageName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageName || `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const SkeletonGallery = () => (
    <Masonry
      breakpointCols={{ default: 4, 1200: 3, 768: 2, 500: 1 }}
      className="flex -ml-4 w-auto"
      columnClassName="pl-4 bg-clip-padding"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          style={{ height: `${Math.floor(Math.random() * 200) + 200}px` }}
          className="w-full mb-4 !rounded-none"
        />
      ))}
    </Masonry>
  );

  return (
    <div className="w-full p-4 space-y-8">
      {/* Event Cover */}
      <Card className="overflow-hidden border-none bg-[#0a0a0a] rounded-none">
        <div className="relative w-full h-64 sm:h-96">
          {!isCoverLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            </div>
          )}
          <img
            src={
              event.cover ||
              uploadedImages[0]?.mdUrl ||
              "/placeholder.svg?height=400&width=800"
            }
            alt={event.name}
            onLoad={() => setIsCoverLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
              isCoverLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-center">
            <h1 className="text-white text-3xl sm:text-5xl font-bold drop-shadow-lg mb-2">
              {event.name}
            </h1>
            <p className="text-white/90 text-lg sm:text-xl drop-shadow-lg">
              Digital Photo Gallery
            </p>
          </div>
        </div>
      </Card>

      {/* Gallery Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Event Gallery</h2>
          {!loadingImages && (
            <Badge variant="outline">
              {totalImages} {totalImages === 1 ? "Photo" : "Photos"}
            </Badge>
          )}
        </div>

        {loadingImages ? (
          <SkeletonGallery />
        ) : uploadedImages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No images found for this event
            </p>
          </div>
        ) : (
          <>
            <Masonry
              breakpointCols={{ default: 4, 1200: 3, 768: 2, 500: 1 }}
              className="flex -ml-4 w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              {uploadedImages.map((img, i) => (
                <PhotoItem
                  key={img.id || i}
                  img={img}
                  index={i}
                  onDownload={downloadImage}
                  onClick={openModal}
                  lastImageElementRef={
                    i === uploadedImages.length - 1 ? lastImageElementRef : null
                  }
                />
              ))}
            </Masonry>

            {loadingMore && <SkeletonGallery />}

            {!hasMore && uploadedImages.length > 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  You've reached the end of the gallery
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && uploadedImages[modalIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onTouchStart={(e) => {
            e.currentTarget.dataset.touchStartX = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchStartX = e.currentTarget.dataset.touchStartX;
            if (!touchStartX) return;
            const diff = touchEndX - touchStartX;
            if (diff > 50) showPrev();
            else if (diff < -50) showNext();
          }}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white text-3xl font-bold bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition-transform duration-300 ease-in-out hover:scale-110"
          >
            &times;
          </button>

          {/* Desktop Arrows */}
          <div className="hidden sm:flex">
            <button
              onClick={showPrev}
              className="absolute left-4 text-white text-3xl font-bold bg-black/40 hover:bg-black/60 rounded-full w-12 h-12 flex items-center justify-center transition-transform duration-300 ease-in-out hover:scale-110"
            >
              &#8592;
            </button>
            <button
              onClick={showNext}
              className="absolute right-4 text-white text-3xl font-bold bg-black/40 hover:bg-black/60 rounded-full w-12 h-12 flex items-center justify-center transition-transform duration-300 ease-in-out hover:scale-110"
            >
              &#8594;
            </button>
          </div>

          {/* Image with fade-in */}
          <div className="relative flex items-center justify-center max-h-[85vh] max-w-full sm:max-w-3xl w-full">
            {!isImageLoaded && (
              <div className="flex items-center justify-center w-full h-[70vh] bg-black/20">
                <div className="w-10 h-10 border-4 border-white/50 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={
                uploadedImages[modalIndex].mdUrl ||
                uploadedImages[modalIndex].thumbUrl
              }
              alt={uploadedImages[modalIndex].name}
              className={`max-h-[85vh] max-w-full sm:max-w-3xl object-contain shadow-2xl transition-opacity duration-500 absolute !rounded-none ${
                isImageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
