import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  Images,
  Share2,
  ArrowLeft,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Masonry from "react-masonry-css";

export default function ImageGallery() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [matchedImages, setMatchedImages] = useState([]);
  const [selfie, setSelfie] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Masonry breakpoints
  const masonryBreakpoints = {
    default: 5,
    1200: 4,
    992: 3,
    768: 2,
    480: 1,
  };

  useEffect(() => {
    if (location.state) {
      const { matchedImages, selfie } = location.state;
      if (matchedImages && matchedImages.length > 0) {
        setMatchedImages(matchedImages);
      }
      if (selfie) {
        setSelfie(selfie);
      }
    } else {
      navigate(`/guest/event/${eventId}`);
    }

    return () => {
      if (selfie && selfie.startsWith("blob:")) {
        URL.revokeObjectURL(selfie);
      }
    };
  }, [location.state, navigate, eventId, selfie]);

  const downloadImage = async (imageUrl, name = "image.jpg") => {
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const shareImage = async (imageUrl) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this photo",
          text: "Check out this amazing photo!",
          url: imageUrl,
        });
      } else {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            imageUrl
          )}`,
          "_blank",
          "width=600,height=400"
        );
      }
    } catch (error) {
      console.log("Share cancelled", error);
    }
  };

  const getImageUrl = (img, type = "display") => {
    if (typeof img === "string") return img;
    switch (type) {
      case "display":
        return (
          img.mdUrl ||
          img.thumbUrl ||
          img.rawUrl ||
          img.url ||
          img.src ||
          ""
        );
      case "download":
        return (
          img.rawUrl ||
          img.mdUrl ||
          img.thumbUrl ||
          img.url ||
          img.src ||
          ""
        );
      default:
        return (
          img.mdUrl ||
          img.thumbUrl ||
          img.rawUrl ||
          img.url ||
          img.src ||
          ""
        );
    }
  };

  const getImageName = (img, index) => {
    if (typeof img === "object" && img.name) return img.name;
    return `photo-${index + 1}.jpg`;
  };

  const showNext = () => {
    setSelectedIndex((prev) => (prev + 1) % matchedImages.length);
  };

  const showPrev = () => {
    setSelectedIndex((prev) =>
      prev === 0 ? matchedImages.length - 1 : prev - 1
    );
  };


  const reloadMatches = async () => {
    setIsLoading(true);
    try {
      const savedData = JSON.parse(localStorage.getItem("guestData"));
      if (!savedData) {
        alert("No saved data found, please try again.");
        navigate(`/guest/event/${eventId}`);
        return;
      }

      // ✅ Convert selfie blob URL back into File
      const response = await fetch(savedData.selfie);
      const blob = await response.blob();
      const file = new File([blob], "selfie.jpg", { type: blob.type });

      // ✅ Build FormData with only selfie
      const formData = new FormData();
      formData.append("selfie", file);

      // 🔥 Call face match API using axios
      const faceMatchResponse = await api.post(`faceMatch/${eventId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMatchedImages(faceMatchResponse.data.images || []);
    } catch (error) {
      console.error("Reload error:", error);
      alert("Failed to reload matches. Try again.");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Back Button */}
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/guest/event/${eventId}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </Button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-12 pt-8">
          <div className="w-32 h-32 mb-4 rounded-full overflow-hidden ring-4 ring-border shadow-lg bg-muted">
            {selfie ? (
              <img
                src={selfie}
                alt="Your Selfie"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Gallery */}
        {matchedImages.length > 0 && (
          <div className="w-full px-4">
            {/* Header */}
            <div className="container mx-auto px-4 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Images className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Your Matched Photos</h2>
              </div>
              <Badge variant="secondary" className="text-sm">
                {matchedImages.length}{" "}
                {matchedImages.length === 1 ? "photo" : "photos"} found
              </Badge>
            </div>

            <Masonry
              breakpointCols={masonryBreakpoints}
              className="flex w-full -mx-1"
              columnClassName="px-1"
            >
              {matchedImages.map((img, index) => {
                const displayImageUrl = getImageUrl(img, "display");
                return (
                  <div
                    key={img.id || index}
                    className="relative cursor-pointer mb-2"
                    onClick={() => setSelectedIndex(index)}
                  >
                    <img
                      src={displayImageUrl}
                      alt={`Matched photo ${index + 1}`}
                      className="w-full h-auto transition-transform hover:scale-102"
                      loading="lazy"
                    />
                  </div>
                );
              })}
            </Masonry>
          </div>
        )}
        {/* Reload Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <Button
            onClick={reloadMatches}
            size="lg"
            disabled={isLoading}
            className="shadow-lg"
          >
            {isLoading ? "Reloading..." : "Reload Matches"}
          </Button>
        </div>

        {/* Modal */}
        {selectedIndex !== null && (
          <Dialog open={true} onOpenChange={() => setSelectedIndex(null)}>
            <DialogContent className="max-w-5xl p-0 bg-black border-0 shadow-none">
              <div className="relative flex items-center justify-center">
                {/* Close */}
                <button
                  className="absolute top-4 right-4 text-white"
                  onClick={() => setSelectedIndex(null)}
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Prev */}
                <button
                  className="absolute left-4 text-white"
                  onClick={showPrev}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                {/* Image */}
                <img
                  src={getImageUrl(matchedImages[selectedIndex], "display")}
                  alt={`Preview ${selectedIndex + 1}`}
                  className="max-h-[90vh] rounded-lg object-contain"
                />

                {/* Next */}
                <button
                  className="absolute right-4 text-white"
                  onClick={showNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadImage(
                      getImageUrl(matchedImages[selectedIndex], "download"),
                      getImageName(matchedImages[selectedIndex], selectedIndex)
                    )
                  }
                  disabled={isDownloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    shareImage(
                      getImageUrl(matchedImages[selectedIndex], "display")
                    )
                  }
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Empty state */}
        {matchedImages.length === 0 && (
          <div className="mt-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Images className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No matching photos found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We couldn't find any photos matching your selfie. Try uploading a clearer photo or check back later for new photos.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(`/guest/event/${eventId}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}

      </div>
    </TooltipProvider>
  );
}
