import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import DiagnosisReport from "@/components/diagnosis-report";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardFooter } from "@/components/ui/card";
import { ClipboardCopy, Share2, Twitter } from "lucide-react";
import { ImageAnalysisResponse } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DeGhibResult() {
  const { id } = useParams();
  const { toast } = useToast();
  const [imageId] = useState(parseInt(id || "0"));
  const isMobile = useIsMobile();

  // Function to copy shareable link to clipboard
  const copyLinkToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          title: "Success!",
          description: "Link copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Please try again or copy the URL manually",
          variant: "destructive",
        });
      });
  };

  // Fetch image analysis data
  const { data, isLoading, error } = useQuery<ImageAnalysisResponse>({
    queryKey: [`/api/images/${imageId}`],
    enabled: !!imageId && imageId > 0,
  });

  // Log request status for debugging
  useEffect(() => {
    if (isLoading) {
      console.log(`Loading data for image ID: ${imageId}`);
    } else if (error) {
      console.error(`Error loading image ID ${imageId}:`, error);
    } else if (data) {
      console.log(`Successfully loaded data for image ID: ${imageId}`, data);
    }
  }, [isLoading, error, data, imageId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Error Loading Results</h1>
        <p>We couldn't find the deGhibli result you're looking for.</p>
        <p className="mt-2 text-muted-foreground">
          Please check the URL and try again.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 ">
          <div>
            <h1
              className={`${
                isMobile ? "text-2xl" : "text-3xl"
              } font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700`}
            >
              Detox Result
            </h1>
            <p className="text-muted-foreground">Patient ID: #{data.id}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={copyLinkToClipboard}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <ClipboardCopy size={16} />
              <span className="hidden sm:inline">Copy Link</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-300 transition-colors"
              onClick={() => {
                const url = window.location.href;
                window.open(
                  `https://wa.me/?text=Check%20out%20my%20detoxified%20Ghibli%20image:%20${encodeURIComponent(
                    url
                  )}`,
                  "_blank"
                );
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 transition-colors"
              onClick={() => {
                const url = window.location.href;
                window.open(
                  `https://twitter.com/intent/tweet?text=Check%20out%20my%20detoxified%20Ghibli%20image&url=${encodeURIComponent(
                    url
                  )}`,
                  "_blank"
                );
              }}
            >
              <Twitter size={16} />
              <span className="hidden sm:inline">Twitter</span>
            </Button>

            {/* Native share button if supported */}
            {typeof navigator.share !== "undefined" && (
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 transition-colors"
                onClick={() => {
                  const url = window.location.href;
                  const title = "My DeGhibli Treatment Results";
                  const text = "Check out my detoxified Ghibli image:";

                  navigator
                    .share({
                      title,
                      text,
                      url,
                    })
                    .catch((err) => {
                      console.error("Error sharing:", err);
                    });
                }}
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share</span>
              </Button>
            )}
          </div>
        </div>

        {/* Contamination Level Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Ghibli Contamination Level
            </span>
            <span className="text-sm font-medium">
              {data.contaminationLevel}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5">
            <div
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 h-5 rounded-full"
              style={{ width: `${data.contaminationLevel}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="overflow-hidden rounded-xl border">
            <div className="bg-gradient-to-r from-red-500 to-red-700 px-4 py-3 text-white">
              <h3 className="font-semibold text-lg">Contaminated Image</h3>
              <p className="text-sm text-red-100">Ghibli Influence Detected</p>
            </div>
            <div className="p-0 aspect-square relative bg-white">
              <img
                src={data.originalImageUrl || undefined}
                alt="Original Ghibli-contaminated image"
                className="object-contain w-full h-full p-2"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <div className="bg-gradient-to-r from-green-500 to-green-700 px-4 py-3 text-white">
              <h3 className="font-semibold text-lg">Detoxified Image</h3>
              <p className="text-sm text-green-100">Reality Restored</p>
            </div>
            <div className="p-0 aspect-square relative bg-white">
              <img
                src={data.detoxifiedImageUrl || undefined}
                alt="Detoxified realistic version of the image"
                className="object-contain w-full h-full p-2"
              />
            </div>
          </div>
        </div>

        <DiagnosisReport
          diagnosisPoints={data.diagnosisPoints}
          treatmentPoints={data.treatmentPoints}
        />

        <CardFooter className="flex justify-center gap-4 mt-6">
          <Button asChild variant="secondary" className="shadow-sm">
            <Link href="/gallery">View Gallery</Link>
          </Button>
          <Button
            asChild
            variant="default"
            className="shadow-sm bg-blue-600 hover:bg-blue-700"
          >
            <Link href="/">DeGhib Another Image</Link>
          </Button>
        </CardFooter>
      </div>
    </div>
  );
}
