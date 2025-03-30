import { Upload, Beaker, WandSparkles } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="max-w-4xl mx-auto my-12">
      <h2 className="text-2xl font-bold mb-6 text-center">How Our Treatment Works</h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-clinic-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-6 w-6 text-clinic-blue-dark" />
          </div>
          <h3 className="font-semibold mb-2">1. Upload</h3>
          <p className="text-sm text-gray-600">
            Submit your Ghibli-contaminated image for clinical evaluation
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-clinic-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <Beaker className="h-6 w-6 text-clinic-blue-dark" />
          </div>
          <h3 className="font-semibold mb-2">2. Analyze</h3>
          <p className="text-sm text-gray-600">
            Our AI diagnoses specific Ghibli contaminants in your image
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-clinic-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <WandSparkles className="h-6 w-6 text-clinic-blue-dark" />
          </div>
          <h3 className="font-semibold mb-2">3. Detoxify</h3>
          <p className="text-sm text-gray-600">
            We strip away whimsy and restore your image to clinical normalcy
          </p>
        </div>
      </div>
    </section>
  );
}
