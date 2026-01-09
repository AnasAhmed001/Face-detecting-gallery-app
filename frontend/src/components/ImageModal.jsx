import React from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

const ImageModal = React.memo(function ImageModal({
  isOpen,
  images,
  modalIndex,
  closeModal,
  showPrev,
  showNext,
  isImageLoaded,
  setIsImageLoaded,
  downloadImage,
}) {
  if (!isOpen || !images[modalIndex]) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onTouchStart={(e) => {
        e.currentTarget.dataset.touchStartX = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchStartX = e.currentTarget.dataset.touchStartX;
        if (touchStartX === undefined) return;
        const diff = touchEndX - touchStartX;
        if (diff > 50) showPrev();
        else if (diff < -50) showNext();
      }}
    >
      {/* Close Button */}
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-white text-3xl font-bold bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition-transform duration-300 ease-in-out hover:scale-110 z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Download Button */}
      <button
        onClick={() =>
          downloadImage(images[modalIndex].originalUrl, `photo-${modalIndex + 1}.jpg`)
        }
        className="absolute top-4 right-16 text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-transform duration-300 ease-in-out hover:scale-110 z-10"
        title="Download"
      >
        <Download className="w-5 h-5" />
      </button>

      {/* Desktop Arrows */}
      <div className="hidden sm:flex w-full max-w-7xl mx-auto justify-between px-4 absolute left-0 right-0">
        <button
          onClick={showPrev}
          className="text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-transform duration-300 ease-in-out hover:scale-110"
          aria-label="Previous"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={showNext}
          className="text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-transform duration-300 ease-in-out hover:scale-110"
          aria-label="Next"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Image with fade-in */}
      <div className="relative flex items-center justify-center max-h-[85vh] max-w-full w-full">
        {!isImageLoaded && (
          <div className="flex items-center justify-center w-full h-[70vh]">
            <div className="w-10 h-10 border-4 border-white/50 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={images[modalIndex].mdUrl || images[modalIndex].src}
          alt=""
          className={`max-h-[85vh] max-w-full object-contain transition-opacity duration-500 ${
            isImageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>
    </div>
  );
});

export default ImageModal;
