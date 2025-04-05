import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  CloudUpload,
  Download,
  RefreshCw,
  Link2,
  Copy,
  Twitter,
  Share,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  ImageAnalysisResponse,
  PartialAnalysisResponse,
  ImageCreationResponse,
} from "@shared/schema";
import DiagnosisReport from "./diagnosis-report";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type UploadState =
  | "initial"
  | "uploading"
  | "analyzing"
  | "partial_results"
  | "generating"
  | "results";

export default function ImageUploadArea() {
  const [uploadState, setUploadState] = useState<UploadState>("initial");
  const [processingMessage, setProcessingMessage] = useState(
    "Analyzing Ghibli contamination..."
  );
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [partialAnalysis, setPartialAnalysis] =
    useState<PartialAnalysisResponse | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResponse | null>(null);
  const [progressPercent, setProgressPercent] = useState(25); // Start at 25% (first stage)
  const [detoxImageLoaded, setDetoxImageLoaded] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false); // Track when detoxified image is loaded
  const [creationTime, setCreationTime] = useState<Date | null>(null); // Track when the image was created
  const { toast } = useToast();

  // Helper function to handle API errors
  const handleApiError = (error: any) => {
    let errorMessage = "Failed to process image";

    // Extract the error message if available
    if (
      error.response &&
      typeof error.responseBody === "object" &&
      error.responseBody.message
    ) {
      errorMessage = error.responseBody.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = "Unknown error occurred";
    }

    // Provide more specific messages for common errors
    if (
      errorMessage.includes("invalid_image_format") ||
      errorMessage.includes("Image format error") ||
      errorMessage.includes("Invalid input image")
    ) {
      errorMessage =
        "Image format error: Please upload a valid JPG, PNG, or WEBP file. The image will be automatically converted to PNG with transparency for processing.";
    } else if (
      errorMessage.includes("file too large") ||
      errorMessage.includes("exceeds the size limit")
    ) {
      errorMessage =
        "Image is too large. Please upload an image smaller than 4MB.";
    }

    toast({
      title: "Processing Error",
      description: errorMessage,
      variant: "destructive",
    });

    setUploadState("initial");
  };

  // First step: Analyze image
  const analyzeImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await apiRequest("POST", "/api/analyze", formData);
      return response.json() as Promise<PartialAnalysisResponse>;
    },
    onMutate: () => {
      setUploadState("uploading");

      // Simulate state changes for a better UX
      const messages = [
        "Analyzing Ghibli contamination...",
        "Identifying fantasy elements...",
      ];

      let messageIndex = 0;
      const processProgress = 40; // first step represents 40% progress

      const interval = setInterval(() => {
        if (messageIndex < messages.length - 1) {
          messageIndex++;
          setProcessingMessage(messages[messageIndex]);
          setProgressPercent(
            ((messageIndex + 1) * processProgress) / messages.length
          );
        } else {
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    },
    onSuccess: (data) => {
      setPartialAnalysis(data);
      setUploadState("partial_results");
      setProgressPercent(50); // First phase complete

      // Automatically proceed to generate the detoxified image in the background
      if (data) {
        generateDetoxifiedImage.mutate({
          originalImageKey: data.originalImageKey || "",
          promptForDalle: data.promptForDalle || "",
          diagnosisPoints: data.diagnosisPoints,
          contaminationLevel: data.contaminationLevel,
        });
      }
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });

  // Second step: Generate detoxified image
  const generateDetoxifiedImage = useMutation({
    mutationFn: async (data: {
      originalImageKey: string;
      promptForDalle: string;
      diagnosisPoints: string[];
      contaminationLevel: number;
    }) => {
      const response = await apiRequest("POST", "/api/generate", data);
      return response.json() as Promise<ImageCreationResponse>;
    },
    onMutate: () => {
      // Keep the partial_results state visible while generating the detoxified image
      // We're no longer setting uploadState to "generating" to keep showing the comparison view
      setProcessingMessage("Creating detoxified image...");

      // Simulate state changes for a better UX
      const messages = [
        "Neutralizing excessive whimsy...",
        "Finalizing clinical detoxification...",
      ];

      let messageIndex = 0;
      const startProgress = 50; // Starting from 50% after analysis
      const endProgress = 90; // End at 90% (leave 10% for loading the image)
      const progressStep = (endProgress - startProgress) / messages.length;

      const interval = setInterval(() => {
        if (messageIndex < messages.length) {
          setProcessingMessage(messages[messageIndex]);
          setProgressPercent(startProgress + (messageIndex + 1) * progressStep);
          messageIndex++;
        } else {
          clearInterval(interval);
        }
      }, 2500);

      return () => clearInterval(interval);
    },
    onSuccess: (data) => {
      if (partialAnalysis) {
        // Combine partial analysis with treatment data
        const fullAnalysis: ImageAnalysisResponse = {
          id: data.id,
          diagnosisPoints: partialAnalysis.diagnosisPoints || [],
          treatmentPoints: data.treatmentPoints || [],
          contaminationLevel: partialAnalysis.contaminationLevel || 50,
          detoxifiedImageUrl: data.detoxifiedImageUrl || "",
          originalImageUrl: partialAnalysis.originalImageUrl || "",
          description: partialAnalysis.description,
          shareableUrl: `/deghib/${data.id}`,
        };

        setAnalysis(fullAnalysis);
        setCreationTime(new Date()); // Record when the image was created for deletion window
        setUploadState("results");
      }
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploadState !== "initial",
    useFsAccessApi: false, // Disable File System Access API for faster initialization
    noKeyboard: true, // Disable keyboard events for performance
    preventDropOnDocument: true, // Prevent document-wide drag events for better performance
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        let errorMessage = "File upload error";

        if (error.code === "file-too-large") {
          errorMessage = "File is too large. Maximum size is 10MB.";
        } else if (error.code === "file-invalid-type") {
          errorMessage = "Only JPEG, PNG, and WEBP images are allowed.";
        }

        toast({
          title: "Upload Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setOriginalImage(URL.createObjectURL(file));
        analyzeImage.mutate(file);
      }
    },
  });

  const handleRestart = () => {
    if (originalImage) {
      URL.revokeObjectURL(originalImage);
    }
    setOriginalImage(null);
    setPartialAnalysis(null);
    setAnalysis(null);
    setCreationTime(null);
    setUploadState("initial");
  };

  const handleDownload = () => {
    if (analysis?.detoxifiedImageUrl) {
      const link = document.createElement("a");
      link.href = analysis.detoxifiedImageUrl;
      link.download = "detoxified-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteImage = () => {
    // Only allow deletion within 2 minutes of creation
    if (!analysis?.id || !creationTime) return;

    const currentTime = new Date();
    const timeDiffInMinutes =
      (currentTime.getTime() - creationTime.getTime()) / (1000 * 60);

    if (timeDiffInMinutes > 2) {
      toast({
        title: "Deletion Not Allowed",
        description:
          "Images can only be deleted within 2 minutes of creation. Please contact support for removal requests.",
        variant: "destructive",
      });
      return;
    }

    // Proceed with deletion
    try {
      apiRequest("DELETE", `/api/images/${analysis.id}`);
      toast({
        title: "Image Deleted",
        description:
          "Your image has been successfully deleted from our servers.",
      });
      handleRestart();
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description:
          "Failed to delete image. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    if (!analysis?.shareableUrl) return;

    // Get the full URL including domain
    const fullShareableUrl = window.location.origin + analysis.shareableUrl;

    try {
      navigator.clipboard.writeText(fullShareableUrl);
      toast({
        title: "Link Copied!",
        description:
          "Shareable link copied to clipboard. You can now paste and share it.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description:
          "Could not copy to clipboard. Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleShareToTwitter = () => {
    if (!analysis?.shareableUrl) return;

    const fullShareableUrl = window.location.origin + analysis.shareableUrl;
    window.open(
      `https://twitter.com/intent/tweet?text=Check%20out%20my%20detoxified%20Ghibli%20image&url=${encodeURIComponent(
        fullShareableUrl
      )}`,
      "_blank"
    );
  };

  const handleShareToWhatsapp = () => {
    if (!analysis?.shareableUrl) return;

    const fullShareableUrl = window.location.origin + analysis.shareableUrl;
    window.open(
      `https://wa.me/?text=Check%20out%20my%20detoxified%20Ghibli%20image:%20${encodeURIComponent(
        fullShareableUrl
      )}`,
      "_blank"
    );
  };

  const handleNativeShare = () => {
    if (!analysis?.shareableUrl || typeof navigator.share === "undefined")
      return;

    const fullShareableUrl = window.location.origin + analysis.shareableUrl;

    navigator
      .share({
        title: "My Ghibli Detoxified Image",
        text: "Check out this image detoxified by Studio Ghibli Detox!",
        url: fullShareableUrl,
      })
      .catch((error) => {
        // toast({
        //   title: "Sharing Failed",
        //   description: "Could not share the results: " + error.message,
        //   variant: "destructive",
        // });
      });
  };

  // Calculate if the image is deletable (within 2 minutes of creation)
  const canDeleteImage = () => {
    if (!creationTime) return false;

    const currentTime = new Date();
    const timeDiffInMinutes =
      (currentTime.getTime() - creationTime.getTime()) / (1000 * 60);

    return timeDiffInMinutes <= 2;
  };

  return (
    <div className="ai-card max-w-4xl mx-auto my-8">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800 text-center">
          Ghibli Contamination Analysis
        </h2>

        {uploadState === "initial" && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            {...getRootProps()}
          >
            <div className="space-y-4">
              <CloudUpload className="h-16 w-16 mx-auto text-blue-500" />
              <h3 className="text-lg font-medium text-gray-800">
                Upload an image for detoxification
              </h3>
              <p className="text-sm text-gray-600">
                Drag and drop your Ghibli-contaminated image here, or click to
                select
              </p>
              <div>
                <button
                  className="ai-button-primary"
                  style={{ borderRadius: "0.375rem" }} // Explicit style to ensure rounded corners
                >
                  Select Image
                </button>
                <input {...getInputProps()} />
              </div>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, and WEBP up to 10MB
              </p>
              <div className="bg-yellow-50 border border-yellow-200  text-center items-center rounded-md p-3 mt-3">
                <p className="text-sm font-medium text-yellow-800  text-center items-center">
                  <AlertCircle className="h-4 w-4 mr-2 inline" />
                  Public Gallery Notice
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Images you upload will be visible in the public gallery. If
                  you need an image removed, drop a mail{" "}
                  <a href="mailto:ddepp98@outlook.com" className="underline">
                    here
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Only show the progress spinner during initial upload/analysis phase */}
        {uploadState === "uploading" && (
          <div className="border-2 border-blue-100 rounded-xl p-8 text-center bg-blue-50">
            <div className="space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                {/* Background circle */}
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>

                {/* Progress circle with gradient fill based on progressPercent */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#0EA5E9 ${progressPercent}%, transparent ${progressPercent}%)`,
                    clipPath: "circle(50% at center)",
                    transform: "scale(0.95)",
                  }}
                ></div>

                {/* Spinning indicator */}
                <div className="absolute inset-0 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>

                {/* Progress text in the center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-800">
                {processingMessage}
              </h3>
              <p className="text-sm text-gray-600">
                Our AI doctors are examining your image for signs of excessive
                whimsy
              </p>
            </div>
          </div>
        )}

        {/* Show partial results while generating the detoxified image */}
        {uploadState === "partial_results" &&
          partialAnalysis &&
          originalImage && (
            <div>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Original Image with diagnosis */}
                <div className="flex-1 ai-card">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-3 py-2 text-center text-sm font-medium text-white">
                    Contaminated
                  </div>
                  <div className="p-4">
                    <img
                      src={originalImage}
                      alt="Original Ghibli-contaminated image"
                      className="w-full h-64 object-cover rounded-lg shadow-sm"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* Right side - treatment in progress */}
                <div className="flex-1 ai-card">
                  <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-2 text-center text-sm font-medium text-white">
                    Treatment in Progress
                  </div>
                  <div className="p-8 flex flex-col items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-t-sky-500 border-sky-200 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium text-gray-700">
                      {processingMessage}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Generating realistic image...
                    </p>
                  </div>
                </div>
              </div>

              {/* Show diagnosis report with treatment loading state */}
              <DiagnosisReport
                diagnosisPoints={partialAnalysis.diagnosisPoints}
                treatmentPoints={null}
                isLoading={true}
              />

              {/* Contamination Level Meter */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="text-sm font-medium mb-3 text-gray-700">
                  Ghibli Contamination Level
                </h3>
                <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${partialAnalysis.contaminationLevel}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-2 text-gray-600 font-medium">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>
          )}

        {/* Final results with both images and full diagnosis */}
        {uploadState === "results" && analysis && originalImage && (
          <div>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Before Image */}
              <div className="flex-1 ai-card">
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-3 py-2 text-center text-sm font-medium text-white">
                  Contaminated
                </div>
                <div className="p-4">
                  <img
                    src={originalImage}
                    alt="Original Ghibli-contaminated image"
                    className="w-full h-64 object-cover rounded-lg shadow-sm"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              {/* After Image */}
              <div className="flex-1 ai-card">
                <div className="bg-gradient-to-r from-green-500 to-teal-600 px-3 py-2 text-center text-sm font-medium text-white">
                  Detoxified
                </div>
                <div className="p-4 relative">
                  {/* Loading overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-lg z-10"
                    style={{ display: detoxImageLoaded ? "none" : "flex" }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                      <p className="mt-2 text-sm font-medium text-blue-700">
                        Loading detoxified image...
                      </p>
                    </div>
                  </div>
                  <img
                    src={analysis.detoxifiedImageUrl}
                    alt="Detoxified image"
                    className="w-full h-64 object-cover rounded-lg shadow-sm"
                    loading="lazy"
                    decoding="async"
                    onLoad={() => {
                      setDetoxImageLoaded(true);
                      setProgressPercent(100); // Set to 100% only when image is fully loaded
                      setLoadingComplete(true);
                    }}
                  />
                </div>
              </div>
            </div>

            <DiagnosisReport
              diagnosisPoints={analysis.diagnosisPoints}
              treatmentPoints={analysis.treatmentPoints}
            />

            {/* Contamination Level Meter */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium mb-3 text-gray-700">
                Ghibli Contamination Level
              </h3>
              <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${analysis.contaminationLevel}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2 text-gray-600 font-medium">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="ai-button-primary"
                style={{ borderRadius: "0.375rem" }}
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 inline mr-1" /> Download Detoxified
                Image
              </button>
              <button
                className="ai-button-secondary"
                style={{ borderRadius: "0.375rem" }}
                onClick={handleRestart}
              >
                <RefreshCw className="h-4 w-4 inline mr-1" /> Start Over
              </button>

              {/* Delete button - only visible within 2 minutes of creation */}
              {canDeleteImage() && (
                <button
                  className="ai-button-secondary"
                  style={{
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    color: "rgb(220, 38, 38)",
                  }}
                  onClick={handleDeleteImage}
                >
                  <Trash2 className="h-4 w-4 inline mr-1" /> Delete Image
                </button>
              )}

              <button
                className="ai-button-secondary"
                style={{
                  borderRadius: "0.375rem",
                  backgroundColor: "rgba(37, 211, 102, 0.1)",
                  borderColor: "rgba(18, 140, 126, 0.3)",
                  color: "#128C7E",
                }}
                onClick={handleShareToWhatsapp}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3 md:h-4 md:w-4 inline mr-1"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>

              <button
                className="ai-button-secondary"
                style={{
                  borderRadius: "0.375rem",
                  backgroundColor: "rgba(29, 161, 242, 0.1)",
                  borderColor: "rgba(29, 161, 242, 0.3)",
                  color: "#1DA1F2",
                }}
                onClick={handleShareToTwitter}
              >
                <Twitter className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                Twitter
              </button>

              <button
                className="ai-button-secondary text-xs md:text-sm px-2 py-1 md:px-3 md:py-2"
                style={{ borderRadius: "0.375rem" }}
                onClick={handleCopyLink}
              >
                <Copy className="h-3 w-3 md:h-4 md:w-4 inline mr-1" /> Copy
              </button>
              <button
                className="md:hidden ai-button-secondary"
                style={{ borderRadius: "0.375rem" }}
                onClick={handleNativeShare}
              >
                <Share className="h-4 w-4 inline mr-1" /> Share
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
