import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import DiagnosisReport from "@/components/diagnosis-report";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy, Share2 } from "lucide-react";
import { Image, ImageAnalysisResponse } from "@shared/schema";

export default function DeGhibResult() {
  const { id } = useParams();
  const { toast } = useToast();
  const [imageId] = useState(parseInt(id || "0"));
  
  // Function to copy shareable link to clipboard
  const copyLinkToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
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
        <p className="mt-2 text-muted-foreground">Please check the URL and try again.</p>
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
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">DeGhibli Treatment Results</h1>
            <p className="text-muted-foreground">Patient ID: #{data.id}</p>
          </div>
          <Button onClick={copyLinkToClipboard} variant="outline" className="flex gap-2">
            <Share2 size={16} />
            Share Results
          </Button>
        </div>

        {/* Contamination Level Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Ghibli Contamination Level</span>
            <span className="text-sm font-medium">{data.contaminationLevel}%</span>
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

        <CardFooter className="flex justify-center mt-6">
          <Button onClick={copyLinkToClipboard} variant="outline" className="flex gap-2">
            <ClipboardCopy size={16} />
            Copy Link
          </Button>
        </CardFooter>
      </div>
    </div>
  );
}