import { Microscope, WandSparkles, Shield, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-1.5 mb-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
            <Sparkles className="h-4 w-4 mr-2" /> AI-Powered Technology
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
            Medical-Grade Ghibli Detoxification
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Has your imagery been infected with excessive whimsy? Our cutting-edge AI will diagnose
            and cleanse your images of Ghibli contamination.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow duration-300">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Microscope className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Clinical Analysis</h3>
            <p className="text-gray-600 text-sm">
              Our AI analyzes your images to detect Ghibli contamination with medical precision
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow duration-300">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <WandSparkles className="h-7 w-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Whimsy Removal</h3>
            <p className="text-gray-600 text-sm">
              We carefully extract whimsical elements with our proprietary detoxification process
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center hover:shadow-lg transition-shadow duration-300">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Reality Restoration</h3>
            <p className="text-gray-600 text-sm">
              We restore your image to a practical, mundane state free from magical influences
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
