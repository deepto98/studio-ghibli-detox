import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Image } from "@shared/schema";

export default function Gallery() {
  // State to track hover for each gallery item
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [autoTransitionItems, setAutoTransitionItems] = useState<number[]>([]);
  
  // Fetch all images for the gallery
  const { data, isLoading, error } = useQuery<Image[]>({
    queryKey: ['/api/images'],
  });
  
  // Setup auto-transition effect
  useEffect(() => {
    if (data && data.length > 0) {
      // Initialize with all images showing originals
      setAutoTransitionItems(data.map(item => item.id));
      
      // Setup interval to toggle images
      const interval = setInterval(() => {
        setAutoTransitionItems(prev => {
          // If hovering over an item, don't include it in auto-transition
          if (hoveredItem !== null) {
            return prev.filter(id => id !== hoveredItem);
          }
          return prev.length === 0 ? data.map(item => item.id) : [];
        });
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [data, hoveredItem]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">DeGhibli Gallery</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">DeGhibli Gallery</h1>
        {error ? (
          <p>An error occurred loading the gallery. Please try again later.</p>
        ) : (
          <p>No transformed images found. Be the first to deGhiblify an image!</p>
        )}
        <Button className="mt-6" asChild>
          <Link href="/">Upload an Image</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-background">
      <h1 className="text-3xl font-bold mb-2 text-center">DeGhibli Gallery</h1>
      <p className="text-center text-muted-foreground mb-8">
        Browse the before and after transformations from our Ghibli Detox Clinic
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {data && data.map((item: Image) => (
          <Card key={item.id} className="overflow-hidden group border shadow-sm">
            <CardHeader className="pb-2 bg-card">
              <CardTitle className="text-lg">Case #{item.id}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 aspect-square relative bg-white">
              <Badge variant="destructive" className="absolute top-2 right-2 z-10">
                {item.contaminationLevel}% Contaminated
              </Badge>
              
              {/* Show original image on hover, otherwise show detoxified */}
              <div 
                className="relative w-full h-full"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Detoxified Image */}
                <img 
                  src={item.detoxifiedImageUrl || undefined} 
                  alt="Detoxified image"
                  className={`object-contain w-full h-full p-2 transition-opacity duration-500 ${
                    hoveredItem === item.id || autoTransitionItems.includes(item.id) ? "opacity-0" : "opacity-100"
                  }`}
                />
                
                {/* Original Ghibli Image */}
                <img 
                  src={item.originalImageUrl || undefined} 
                  alt="Original Ghibli image"
                  className={`object-contain w-full h-full p-2 absolute inset-0 transition-opacity duration-500 ${
                    hoveredItem === item.id || autoTransitionItems.includes(item.id) ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-medium px-3 py-1 rounded">
                  {hoveredItem === item.id || autoTransitionItems.includes(item.id) ? "Original" : "Detoxified"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center p-4 bg-card">
              <Button asChild variant="outline">
                <Link href={`/deghib/${item.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-10">
        <Button asChild>
          <Link href="/">Transform Your Own Image</Link>
        </Button>
      </div>
    </div>
  );
}