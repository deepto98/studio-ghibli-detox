import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Image } from "@shared/schema";

export default function Gallery() {
  // State to track hover for each gallery item
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [autoTransitionItems, setAutoTransitionItems] = useState<number[]>([]);
  const isMobile = useIsMobile();

  // Pagination state with animation
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const itemsPerPage = isMobile ? 1 : 3;

  // Sorting state
  type SortOption = "most-contaminated" | "least-contaminated" | "latest";
  const [sortBy, setSortBy] = useState<SortOption>("most-contaminated");

  // Fetch all images for the gallery
  const {
    data: originalData,
    isLoading,
    error,
  } = useQuery<Image[]>({
    queryKey: ["/api/images"],
  });

  // Apply sorting to the data
  const data = useMemo(() => {
    if (!originalData) return [];

    let sortedData = [...originalData];

    switch (sortBy) {
      case "latest":
        // Sort by ID in descending order (assuming higher IDs are newer)
        // If createdAt is available, use that instead
        sortedData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
          return b.id - a.id;
        });
        break;
      case "most-contaminated":
        sortedData.sort((a, b) => b.contaminationLevel - a.contaminationLevel);
        break;
      case "least-contaminated":
        sortedData.sort((a, b) => a.contaminationLevel - b.contaminationLevel);
        break;
    }

    return sortedData;
  }, [originalData, sortBy]);

  // Calculate pagination values
  const totalItems = data?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when sorting changes
  useEffect(() => {
    setCurrentPage(0);
    setIsTransitioning(false);
  }, [sortBy]);

  // Get current page items
  const getCurrentPageItems = useCallback(() => {
    if (!data) return [];
    const startIndex = currentPage * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const currentItems = getCurrentPageItems();

  // Navigation functions with smooth transitions
  const goToNextPage = () => {
    if (currentPage < totalPages - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 150);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }, 150);
    }
  };

  // Setup auto-transition effect
  useEffect(() => {
    if (data && data.length > 0) {
      // Initialize with all images showing originals
      setAutoTransitionItems(data.map((item) => item.id));

      // Setup interval to toggle images
      const interval = setInterval(() => {
        setAutoTransitionItems((prev) => {
          // If hovering over an item, don't include it in auto-transition
          if (hoveredItem !== null) {
            return prev.filter((id) => id !== hoveredItem);
          }
          return prev.length === 0 ? data.map((item) => item.id) : [];
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [data, hoveredItem]);

  // Reset to first page when items per page changes (mobile/desktop switch)
  useEffect(() => {
    setCurrentPage(0);
  }, [isMobile]);

  if (isLoading) {
    return (
      <div className="text-clinic-text">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center my-8 md:my-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
              Ghibli Detox Gallery
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="text-clinic-text">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center my-8 md:my-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
              Ghibli Detox Gallery
            </h1>
            {error ? (
              <p>
                An error occurred loading the gallery. Please try again later.
              </p>
            ) : (
              <p>
                No transformed images found. Be the first to deGhiblify an
                image!
              </p>
            )}
            <Button className="mt-6" asChild>
              <Link href="/">Upload an Image</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-clinic-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center my-8 md:my-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
            Ghibli Detox Gallery
          </h1>
          <p className="text-center text-muted-foreground mb-4">
            Browse the before and after transformations from our Ghibli Detox
            Clinic
          </p>

          {/* Sorting filter */}
          <div className="flex justify-center items-center mb-4">
            <div className="flex items-center bg-gray-50 rounded-lg p-2">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-[180px] border-none bg-transparent focus:ring-0">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-contaminated">
                    Most Contaminated
                  </SelectItem>
                  <SelectItem value="least-contaminated">
                    Least Contaminated
                  </SelectItem>
                  <SelectItem value="latest">Latest Uploads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gallery Grid - Responsive layout with animation */}
          <div
            className={`grid gap-6 ${
              isMobile
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            } relative min-h-[400px] transition-opacity duration-300 ${
              isTransitioning ? "opacity-50" : "opacity-100"
            }`}
          >
            {currentItems.map((item: Image) => (
              <Card
                key={item.id}
                className="overflow-hidden group border shadow-sm transition-all duration-300 hover:shadow-md transform hover:scale-[1.01]"
              >
                <CardHeader className="pb-2 bg-card">
                  <CardTitle className="text-lg">Case #{item.id}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 aspect-square relative bg-white">
                  <Badge
                    variant="destructive"
                    className="absolute top-2 right-2 z-10"
                  >
                    {item.contaminationLevel}% Contaminated
                  </Badge>

                  {/* Show original image on hover, otherwise show detoxified */}
                  <div
                    className="relative w-full h-full"
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onTouchStart={() => {
                      // Toggle on touch for mobile
                      if (hoveredItem === item.id) {
                        setHoveredItem(null);
                      } else {
                        setHoveredItem(item.id);
                      }
                    }}
                  >
                    {/* Detoxified Image */}
                    <img
                      src={item.detoxifiedImageUrl || undefined}
                      alt="Detoxified image"
                      loading="lazy"
                      decoding="async"
                      fetchPriority={item.id <= 3 ? "high" : "low"}
                      className={`object-contain w-full h-full p-2 transition-opacity duration-700 ${
                        hoveredItem === item.id ||
                        autoTransitionItems.includes(item.id)
                          ? "opacity-0"
                          : "opacity-100"
                      }`}
                    />

                    {/* Original Ghibli Image - Load with lower priority since it's not visible initially */}
                    <img
                      src={item.originalImageUrl || undefined}
                      alt="Original Ghibli image"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className={`object-contain w-full h-full p-2 absolute inset-0 transition-opacity duration-700 ${
                        hoveredItem === item.id ||
                        autoTransitionItems.includes(item.id)
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  </div>

                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white font-medium px-3 py-1 rounded">
                      {hoveredItem === item.id ||
                      autoTransitionItems.includes(item.id)
                        ? "Original"
                        : "Detoxified"}
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
          {/* Navigation Controls - Bottom */}
          <div className="flex justify-between items-center mt-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous page</span>
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              className="transition-all duration-300 hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
          <div className="text-center mt-0">
            <Button
              asChild
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Link href="/">Transform Your Own Image</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
