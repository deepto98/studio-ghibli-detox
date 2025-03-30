import Hero from "@/components/hero";
import ImageUploadArea from "@/components/image-upload-area";
import HowItWorksSection from "@/components/how-it-works-section";
import Testimonials from "@/components/testimonials";

export default function Home() {
  return (
    <div className="bg-gray-50 text-clinic-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Hero /> 
        <ImageUploadArea />
        <HowItWorksSection />
        <Testimonials />
      </div>
    </div>
  );
}
