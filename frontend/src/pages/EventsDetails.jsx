import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import imageCompression from "browser-image-compression";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserContext } from "../context/UserContext";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Guests from "./Guests";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  X,
  Trash2,
  Image,
  Check,
  Link,
  Copy,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Constants
const MAX_UPLOAD_LIMIT = 500;
const COMPRESSION_THRESHOLD_MB = 2;

// Filename sanitization function
function sanitizeFilename(filename) {
  // Agar filename missing hai
  if (!filename) return `image-${Date.now()}.jpeg`;

  // Remove extension
  const lastDotIndex = filename.lastIndexOf(".");
  let name =
    lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;

  // Sanitize the name
  let sanitizedName = name
    .replace(/[^\p{L}\p{N}\s-]/gu, "-") // Replace special chars with -
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, "") // Trim - from start and end
    .toLowerCase();

  if (!sanitizedName) {
    sanitizedName = `image-${Date.now()}`;
  }

  // Ensure not too long
  const maxLength = 200;
  if (sanitizedName.length > maxLength) {
    sanitizedName = sanitizedName.substring(0, maxLength);
  }

  // Always save as .jpeg
  const timestamp = Date.now();
  return `${sanitizedName}-${timestamp}.jpeg`;
}

const compressImage = async (file) => {
  if (
    !file.type.startsWith("image/") ||
    file.size < COMPRESSION_THRESHOLD_MB * 1024 * 1024
  ) {
    // Convert small files to jpeg anyway
    return new File([file], sanitizeFilename(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  const options = {
    maxSizeMB: 3,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/jpeg", // force output jpeg
    initialQuality: 0.8,
    alwaysKeepResolution: true,
  };

  try {
    console.log(
      `Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
    );
    const compressedFile = await imageCompression(file, options);
    console.log(
      `Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(
        2
      )} MB`
    );

    // ✅ Force jpeg name + type
    return new File([compressedFile], sanitizeFilename(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("Error during image compression:", error);
    // Agar compression fail ho bhi jaye, tab bhi convert kar ke jpeg save karo
    return new File([file], sanitizeFilename(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }
};

export default function EventsDetails() {
  const { id: eventId } = useParams();
  const { userId } = useUserContext();
  const { state } = useLocation();
  const [copiedSelfie, setCopiedSelfie] = useState(false);
  const [copiedAlbum, setCopiedAlbum] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCoverLoaded, setIsCoverLoaded] = useState(false);
  const [event] = useState({
    name: state?.name || `Event ${eventId || "-"}`,
    cover: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fileInputRef = useRef(null);
  const shareableLink = `${window.location.origin}/guest/event/${eventId}`;
  const shareableAlbumLink = `${
    window.location.origin
  }/album/event/${eventId}/${userId}?eventName=${encodeURIComponent(event?.name || "")}`;

  const handleCopyLink = async (type) => {
    try {
      const textToCopy = type === "selfie" ? shareableLink : shareableAlbumLink;
      await navigator.clipboard.writeText(textToCopy);

      if (type === "selfie") {
        setCopiedSelfie(true);
        setTimeout(() => setCopiedSelfie(false), 2000);
      } else {
        setCopiedAlbum(true);
        setTimeout(() => setCopiedAlbum(false), 2000);
      }
    } catch (err) {
      console.error("❌ Failed to copy link:", err);
    }
  };

  async function fetchImages(page = 1) {
    try {
      setLoadingImages(true);
      const { data } = await api.get(`images/${userId}/${eventId}`, {
        params: { page },
      });
      setUploadedImages(data.images || []);
      setCurrentPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotalImages(data.total || 0);
    } catch (err) {
      console.error("❌ Failed to fetch images:", err);
    } finally {
      setLoadingImages(false);
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }

  // Initial fetch when component mounts
  useEffect(() => {
    if (userId && eventId) {
      // Only fetch if it's the initial load or if the page changes
      if (isInitialLoad || !isInitialLoad) {
        fetchImages(currentPage);
      }
    }
  }, [userId, eventId, currentPage, isInitialLoad]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show truncated pagination for many pages
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
              className="cursor-pointer"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  // All other functions remain the same
  async function getPresignedPostsBatch(userIdParam, eventIdParam, filesMeta) {
    try {
      const { data } = await api.post("s3/generate-presigned-post", {
        userId: userIdParam,
        eventId: eventIdParam,
        files: filesMeta,
      });
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to get presigned URLs: ${errorMessage}`);
    }
  }

  function uploadFileWithFields(url, fields, file, sanitizedName, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      let keyFieldValue = fields.key || fields.Key || "";
      if (
        typeof keyFieldValue === "string" &&
        keyFieldValue.includes("${filename}")
      ) {
        keyFieldValue = keyFieldValue.replace("${filename}", sanitizedName);
      }
      Object.entries(fields || {}).forEach(([k, v]) => {
        formData.append(k === "key" || k === "Key" ? "key" : k, v);
      });
      if (!formData.has("key")) formData.set("key", keyFieldValue);
      formData.append("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && typeof onProgress === "function") {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 204 || (xhr.status >= 200 && xhr.status < 300)) {
          resolve(
            `${url.replace(/\/$/, "")}/${keyFieldValue || sanitizedName}`
          );
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("XHR upload error"));
      xhr.send(formData);
    });
  }

  function onFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check if adding these files would exceed the limit
    const totalFilesAfterAddition = selectedFiles.length + files.length;
    if (totalFilesAfterAddition > MAX_UPLOAD_LIMIT) {
      alert(
        `You can only upload a maximum of ${MAX_UPLOAD_LIMIT} images at once. You are trying to add ${files.length} files, but you already have ${selectedFiles.length} selected.`
      );
      return;
    }

    // Check if any files need compression
    const filesToCompress = files.filter(
      (file) =>
        file.type.startsWith("image/") &&
        file.size >= COMPRESSION_THRESHOLD_MB * 1024 * 1024
    );

    if (filesToCompress.length > 0) {
      setIsCompressing(true);
    }

    const processFiles = async () => {
      for (const file of files) {
        try {
          const compressedFile = await compressImage(file);
          const sanitizedName = sanitizeFilename(file.name);
          const url = URL.createObjectURL(compressedFile);

          setSelectedFiles((s) => [
            ...s,
            {
              file: new File([compressedFile], sanitizedName, {
                type: compressedFile.type,
              }),
              url,
              progress: 0,
              sanitizedName,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio:
                file.size > 0 ? (1 - compressedFile.size / file.size) * 100 : 0,
            },
          ]);
        } catch (error) {
          console.error("Error processing file:", file.name, error);
          // Fallback to original file if compression fails
          const url = URL.createObjectURL(file);
          setSelectedFiles((s) => [
            ...s,
            {
              file,
              url,
              progress: 0,
              sanitizedName: sanitizeFilename(file.name),
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 0,
              error: "Compression failed",
            },
          ]);
        }
      }
      setIsCompressing(false);
    };

    processFiles();
  }

  function onDropFiles(filesList) {
    const files = Array.from(filesList || []);
    if (!files.length) return;

    const fileInputEvent = { target: { files: filesList } };
    onFilesSelected(fileInputEvent);
  }

  const handleDragEvents = (setter) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setter(e.type === "dragenter" || e.type === "dragover");
  };

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) onDropFiles(e.dataTransfer.files);
  }

  function removeSelected(index) {
    setSelectedFiles((s) => {
      const next = [...s];
      if (next[index]?.url) URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  }

  function recomputeGlobalProgress(currentSelected) {
    if (!currentSelected?.length) return 0;
    const sum = currentSelected.reduce((acc, f) => acc + (f.progress || 0), 0);
    return Math.round(sum / currentSelected.length);
  }

  async function uploadSelected() {
    if (!selectedFiles.length) return;
    setLoading(true);
    setUploadProgress(0);
    const filesToUpload = [...selectedFiles];
    try {
      const filesMeta = filesToUpload.map((f) => ({
        fileName: f.sanitizedName,
        fileType: f.file.type || "application/octet-stream",
      }));
      const postsResp = await getPresignedPostsBatch(
        userId,
        eventId,
        filesMeta
      );
      const postsMap = Array.isArray(postsResp)
        ? Object.fromEntries(
            postsResp.map((p) => [p.fileName, { url: p.url, fields: p.fields }])
          )
        : Object.fromEntries(
            filesMeta.map((m) => [
              m.fileName,
              { url: postsResp.url, fields: postsResp.fields },
            ])
          );
      const uploadPromises = filesToUpload.map((s) =>
        (async () => {
          const match = postsMap[s.sanitizedName];
          if (!match)
            throw new Error(`No presigned post for ${s.sanitizedName}`);
          const finalUrl = await uploadFileWithFields(
            match.url,
            match.fields,
            s.file,
            s.sanitizedName,
            (percent) => {
              setSelectedFiles((prev) => {
                const copy = [...prev];
                const idx = copy.findIndex((f) => f.file.name === s.file.name);
                if (idx !== -1) copy[idx] = { ...copy[idx], progress: percent };
                setUploadProgress(recomputeGlobalProgress(copy));
                return copy;
              });
            }
          );
          return {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: s.sanitizedName,
            rawUrl: finalUrl,
            thumbUrl: finalUrl,
            mdUrl: finalUrl,
          };
        })()
      );
      const uploaded = await Promise.all(uploadPromises);
      filesToUpload.forEach((sf) => sf.url && URL.revokeObjectURL(sf.url));
      // Add uploaded images to the beginning of the current list
      setUploadedImages((prev) => [...uploaded, ...prev]);
      // Update total count
      setTotalImages((prev) => prev + uploaded.length);
      setSelectedFiles([]);
      setUploadProgress(100);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 400);
    }
  }

  async function deleteImage(image) {
    setDeletingImageId(image.id);
    try {
      // Extract the filename from the image URL or ID and remove extension
      let fileName = image.rawUrl?.split("/").pop() || image.id;
      // Remove file extension if it exists
      const lastDotIndex = fileName.lastIndexOf(".");
      if (lastDotIndex > 0) {
        fileName = fileName.substring(0, lastDotIndex);
      }
      await api.delete(`/images/${userId}/${eventId}/${fileName}`);
      // Remove image from local state
      setUploadedImages((prev) => prev.filter((p) => p.id !== image.id));
      // Update total count
      setTotalImages((prev) => prev - 1);
      // If current page becomes empty after deletion and we're not on page 1, go to previous page
      if (uploadedImages.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
    } finally {
      setDeletingImageId(null);
    }
  }

  return (
    <TooltipProvider>
      <div className="w-full p-4 space-y-8">
        <Tabs defaultValue="deliverables" className="w-full">
          <TabsList className="mb-4 h-12 px-1">
            <TabsTrigger
              value="deliverables"
              className="px-4 py-3 text-base data-[state=active]:bg-primary/10 cursor-pointer"
            >
              Deliverables
            </TabsTrigger>
            <TabsTrigger
              value="guests"
              className="px-4 py-3 text-base data-[state=active]:bg-primary/10 cursor-pointer"
            >
              Guests
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deliverables">
            <Card className="overflow-hidden border-none bg-[#oaoaoa] ">
              <div className="relative w-full h-64 sm:h-96">
                {" "}
                {/* Height yahan define ki hai, gray background remove ho gaya */}
                {/* Loader - Jab tak image load nahi hoti */}
                {!isCoverLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background">
                    {" "}
                    {/* Loader ka background */}
                    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                  </div>
                )}
                {/* Asal Image - Jo load honay par fade-in hogi */}
                <img
                  src={
                    event.cover ||
                    uploadedImages[0]?.mdUrl ||
                    "/placeholder.svg?height=400&width=800"
                  }
                  alt={event.name}
                  onLoad={() => setIsCoverLoaded(true)} // Image load honay par state update hogi
                  className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                    isCoverLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {/* Text aur Share Button */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex items-center justify-between">
                  <h1 className="text-white text-3xl sm:text-5xl font-bold drop-shadow-lg">
                    {event.name}
                  </h1>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full"
                      >
                        <Link className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Share Digital Album Link</DialogTitle>
                        <DialogDescription>
                          Anyone with this link can view the event Digital
                          Album.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            id="album-link"
                            defaultValue={shareableAlbumLink}
                            readOnly
                            className="h-9 flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0"
                            onClick={() => handleCopyLink("album")}
                          >
                            <span className="sr-only">Copy album link</span>
                            {copiedAlbum ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0"
                            onClick={() =>
                              window.open(
                                shareableAlbumLink,
                                "_blank",
                                "noopener noreferrer"
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <DialogHeader className="pt-2">
                          <DialogTitle>
                            Share Personalized Gallery Link
                          </DialogTitle>
                          <DialogDescription>
                            Guests can scan their face to view
                            the event photos.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center space-x-2 pt-2">
                          <Input
                            id="event-link"
                            defaultValue={shareableLink}
                            readOnly
                            className="h-9 flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0"
                            onClick={() => handleCopyLink("selfie")}
                          >
                            <span className="sr-only">Copy selfie link</span>
                            {copiedSelfie ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0"
                            onClick={() =>
                              window.open(
                                shareableLink,
                                "_blank",
                                "noopener noreferrer"
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <DialogFooter className="sm:justify-end gap-2">
                        <DialogClose asChild>
                          <Button type="button">Done</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>

            {/* Upload Section */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Upload Photos</h2>
                    <div className="flex items-center gap-2">
                      {selectedFiles.length > 0 && (
                        <Badge variant="outline">
                          {selectedFiles.length}/{MAX_UPLOAD_LIMIT} selected
                        </Badge>
                      )}
                      {selectedFiles.length >= MAX_UPLOAD_LIMIT && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Maximum upload limit reached ({MAX_UPLOAD_LIMIT}{" "}
                            images)
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "border-2 rounded-xl py-12 px-6 text-center transition-all duration-200 cursor-pointer group",
                      selectedFiles.length >= MAX_UPLOAD_LIMIT
                        ? "border-muted-foreground/25 bg-muted/30 cursor-not-allowed"
                        : isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                    )}
                    onClick={() =>
                      selectedFiles.length < MAX_UPLOAD_LIMIT &&
                      fileInputRef.current?.click()
                    }
                    onDragEnter={
                      selectedFiles.length < MAX_UPLOAD_LIMIT
                        ? handleDragEvents(true)
                        : undefined
                    }
                    onDragOver={
                      selectedFiles.length < MAX_UPLOAD_LIMIT
                        ? handleDragEvents(true)
                        : undefined
                    }
                    onDragLeave={
                      selectedFiles.length < MAX_UPLOAD_LIMIT
                        ? handleDragEvents(false)
                        : undefined
                    }
                    onDrop={
                      selectedFiles.length < MAX_UPLOAD_LIMIT
                        ? handleDrop
                        : undefined
                    }
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={onFilesSelected}
                      disabled={selectedFiles.length >= MAX_UPLOAD_LIMIT}
                    />
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                          selectedFiles.length >= MAX_UPLOAD_LIMIT
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary group-hover:bg-primary/20"
                        )}
                      >
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium">
                          {selectedFiles.length >= MAX_UPLOAD_LIMIT
                            ? "Upload limit reached"
                            : isDragging
                            ? "Drop your images here"
                            : "Drag & drop images, or click to browse"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedFiles.length >= MAX_UPLOAD_LIMIT
                            ? `Maximum ${MAX_UPLOAD_LIMIT} images per upload`
                            : `PNG, JPG up to 10MB each (Max ${MAX_UPLOAD_LIMIT} images)`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading images...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {selectedFiles.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Selected Images</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              selectedFiles.forEach(
                                (x) => x.url && URL.revokeObjectURL(x.url)
                              );
                              setSelectedFiles([]);
                            }}
                            disabled={isCompressing || loading}
                          >
                            Clear All
                          </Button>
                          <Button
                            size="sm"
                            onClick={uploadSelected}
                            disabled={loading || isCompressing}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isCompressing
                              ? "Compressing..."
                              : loading
                              ? "Uploading..."
                              : `Upload ${selectedFiles.length}`}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        {selectedFiles.map((s, idx) => (
                          <div key={idx} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                              <img
                                src={s.url}
                                alt={s.file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100"
                                  onClick={() => removeSelected(idx)}
                                  disabled={isCompressing}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove image</TooltipContent>
                            </Tooltip>
                            <div className="mt-2 text-xs">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-green-500 h-1.5 rounded-full"
                                  style={{ width: `${s.progress || 0}%` }}
                                ></div>
                              </div>
                              <p className="text-muted-foreground mt-1 truncate">
                                {s.sanitizedName}
                              </p>
                              {s.compressionRatio > 0 && (
                                <p className="text-xs text-green-600">
                                  Compressed {s.compressionRatio.toFixed(0)}%
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gallery Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Event Gallery</h2>
                <Badge variant="outline">
                  {totalImages} {totalImages === 1 ? "Photo" : "Photos"}
                </Badge>
              </div>

              {loadingImages ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading images...</p>
                </div>
              ) : !uploadedImages.length ? (
                <div className="text-center py-12">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No photos yet</h3>
                  <p className="text-muted-foreground">
                    Upload some images to get started
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {uploadedImages.map((img, i) => {
                      const thumbSrc = img.thumbUrl;
                      const fullSrc = img.mdUrl || img.rawUrl;
                      const isDeleting = deletingImageId === img.id;
                      return (
                        <div key={img.id || i} className="group relative">
                          <div className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            <div className="aspect-square relative">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div className="cursor-pointer w-full h-full">
                                    <img
                                      src={
                                        thumbSrc ||
                                        "/placeholder.svg?height=200&width=200"
                                      }
                                      alt={img.name || `photo-${i}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl bg-transparent border-0 p-0 shadow-none">
                                  <img
                                    src={
                                      fullSrc ||
                                      "/placeholder.svg?height=800&width=1200"
                                    }
                                    alt={img.name || `photo-${i}`}
                                    className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                                  />
                                </DialogContent>
                              </Dialog>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 pointer-events-none" />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className={`w-8 h-8 rounded-full ${
                                        isDeleting ? "opacity-70" : ""
                                      }`}
                                      onClick={() => deleteImage(img)}
                                      disabled={isDeleting}
                                    >
                                      {isDeleting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Remove photo</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Page Info */}
                  {totalPages > 1 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Showing page {currentPage} of {totalPages} (
                      {uploadedImages.length} images on this page)
                    </div>
                  )}

                  {/* Pagination Component - Below Gallery */}
                  {totalPages > 1 && (
                    <div className="flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(currentPage - 1)}
                              className={cn(
                                "cursor-pointer",
                                currentPage === 1 &&
                                  "pointer-events-none opacity-50"
                              )}
                            />
                          </PaginationItem>

                          {generatePaginationItems()}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(currentPage + 1)}
                              className={cn(
                                "cursor-pointer",
                                currentPage === totalPages &&
                                  "pointer-events-none opacity-50"
                              )}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
          <TabsContent value="guests">
            <Guests eventId={eventId} />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
