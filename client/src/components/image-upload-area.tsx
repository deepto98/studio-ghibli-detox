import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CloudUpload, Download, RefreshCw, Share } from "lucide-react";
import { ImageAnalysisResponse } from "@shared/schema";
import DiagnosisReport from "./diagnosis-report";
import { useToast } from "@/hooks/use-toast";

type UploadState = "initial" | "uploading" | "analyzing" | "results";

export default function ImageUploadArea() {
  const [uploadState, setUploadState] = useState<UploadState>("initial");
  const [processingMessage, setProcessingMessage] = useState(
    "Analyzing Ghibli contamination..."
  );
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResponse | null>(null);
  const [progressPercent, setProgressPercent] = useState(25); // Start at 25% (first stage)
  const [detoxImageLoaded, setDetoxImageLoaded] = useState(false); // Track when detoxified image is loaded
  const { toast } = useToast();

  const analyzeImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await apiRequest("POST", "/api/analyze", formData);
      return response.json() as Promise<ImageAnalysisResponse>;
    },
    onMutate: () => {
      setUploadState("uploading");

      // Simulate state changes for a better UX
      const messages = [
        "Analyzing Ghibli contamination...",
        "Identifying fantasy elements...",
        "Neutralizing excessive whimsy...",
        "Finalizing clinical detoxification...",
      ];

      let messageIndex = 0;
      const processProgress = 25; // each stage represents 25% progress

      const interval = setInterval(() => {
        if (messageIndex < messages.length - 1) {
          messageIndex++;
          setProcessingMessage(messages[messageIndex]);
          setProgressPercent((messageIndex + 1) * processProgress);
        } else {
          clearInterval(interval);
        }
      }, 1500);

      return () => clearInterval(interval);
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setUploadState("results");
    },
    onError: (error: any) => {
      let errorMessage = "Failed to analyze image";

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
    setAnalysis(null);
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

  const handleShare = () => {
    if (!analysis?.shareableUrl) return;

    // Get the full URL including domain
    const fullShareableUrl = window.location.origin + analysis.shareableUrl;

    if (navigator.share) {
      // Use Web Share API if available
      navigator
        .share({
          title: "My Ghibli Detoxified Image",
          text: "Check out this image detoxified by Ghibli Detox Clinic!",
          url: fullShareableUrl,
        })
        .catch((error) => {
          toast({
            title: "Sharing Failed",
            description: "Could not share the results: " + error.message,
            variant: "destructive",
          });
        });
    } else {
      // Fallback to copying URL to clipboard
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
    }
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
              ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
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
            </div>
          </div>
        )}

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
                    background: `conic-gradient(#3B82F6 ${progressPercent}%, transparent ${progressPercent}%)`,
                    clipPath: "circle(50% at center)",
                    transform: "scale(0.95)", // Scale slightly to fix edge gap issue
                  }}
                ></div>

                {/* Spinning indicator */}
                <div className="absolute inset-0 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>

                {/* Progress text in the center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-800">
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-medium text-blue-800">
                {processingMessage}
              </h3>
              <p className="text-sm text-blue-600">
                Our AI doctors are examining your image for signs of excessive
                whimsy
              </p>
            </div>
          </div>
        )}

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
                    onLoad={() => setDetoxImageLoaded(true)}
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
              <button
                className="ai-button-secondary"
                style={{ borderRadius: "0.375rem" }}
                onClick={handleShare}
              >
                <Share className="h-4 w-4 inline mr-1" /> Share Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
