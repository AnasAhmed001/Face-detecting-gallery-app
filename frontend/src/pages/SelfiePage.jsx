import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, Upload, RotateCcw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SelfiePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "Pakistan",
    phone: "",
    company: "",
    designation: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  const handleFileButtonClick = () => fileInputRef.current?.click();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);


  useEffect(() => {
  const savedData = localStorage.getItem("guestData");
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);

      // Restore formData if present
      if (parsed.formData) {
        setFormData(parsed.formData);
      }

      // Restore selfie preview if present
      // if (parsed.selfie) {
      //   setPreviewUrl(parsed.selfie);
      // }
    } catch (err) {
      console.error("Failed to parse guestData:", err);
      toast.error("Failed to load saved data. Please refresh the page.");
    }
  }
}, []);


  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const capture = useCallback(() => {
    if (!webcamRef.current?.video) return;
    const video = webcamRef.current.video;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
    }, "image/jpeg");
  }, [previewUrl]);

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPhotoFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    if (!formData.phone) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number (10-15 digits)";
    }
    if (!formData.country) {
      errors.country = "Country is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    if (!photoFile) {
      toast.error("Please capture or upload a photo first.");
      return;
    }

    setIsUploading(true);
    try {
      // First, send only the photo to get face match results
      const faceMatchFormData = new FormData();
      faceMatchFormData.append("selfie", photoFile);

      const faceMatchResponse = await api.post(`faceMatch/${eventId}`, faceMatchFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const matchedImages = faceMatchResponse.data?.images;

      if (!matchedImages || matchedImages.length === 0) {
        toast.error("No face match found. Please try again with a clearer photo.");
        throw new Error("No face match found. Please try again with a clearer photo.");
      }

      // ✅ Use "id" from API
      const matchedFaceId = matchedImages[0]?.id;

      if (!matchedFaceId) {
        toast.error("No face match ID found in response. Please contact support.");
        throw new Error("No face match ID found in response. Please contact support.");
      }

      // Prepare data for the second API call
      const saveFaceData = {
        ...formData,
        matchedFaceId,
        eventId
      };

      // Send data to save endpoint
      await api.post("guest/save-matched-face-data", saveFaceData, {
        headers: { "Content-Type": "application/json" },
      });


      const selfieBlob = new Blob([photoFile], { type: photoFile.type });
      const selfieUrl = URL.createObjectURL(selfieBlob);

      navigate(`/gallery/${eventId}`, {
        state: {
          matchedImages: faceMatchResponse.data.images || [],
          selfie: selfieUrl,
          matchCount: faceMatchResponse.data.matchCount || faceMatchResponse.data.images?.length || 0,
          confidence: faceMatchResponse.data.confidence || null,
          originalFileName: photoFile.name,
          originalFileSize: photoFile.size,
        },


      });

      // ✅ Save formData + selfie locally
      localStorage.setItem(
        "guestData",
        JSON.stringify({
          formData,
          selfie: selfieUrl,
          eventId,
        })
      );


    } catch (error) {
      console.error("Face match error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong while uploading.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            Find Your Photos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Fill in your details and upload a selfie to find your photos
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Enter your country"
                    className={formErrors.country ? "border-red-500" : ""}
                  />
                  {formErrors.country && (
                    <p className="text-sm text-red-500">{formErrors.country}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="3XX-XXXXXXX"
                    className={formErrors.phone ? "border-red-500" : ""}
                  />
                  {formErrors.phone && (
                    <p className="text-sm text-red-500">{formErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Enter your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="Enter your designation"
                  />
                </div>
              </div>

              {/* Right Column - Selfie Upload */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Your Selfie <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Selfie preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        mirrored={true}
                        className="w-full h-full object-cover"
                        videoConstraints={{ facingMode: "user" }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Take a selfie or upload a clear photo of your face
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  {!previewUrl ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={capture}
                        className="flex-1 gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Take Photo
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                        capture="user"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFileButtonClick}
                        className="flex-1 gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Photo
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={retake}
                      className="w-full gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retake Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!previewUrl || isUploading}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Finding Your Photos...
                  </>
                ) : (
                  "Find My Photos"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}