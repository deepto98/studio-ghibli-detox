import HowItWorksSection from "@/components/how-it-works-section";

export default function HowItWorks() {
  return (
    <div className=" text-clinic-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center my-8 md:my-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
            How Our Ghibli Detoxification Works
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our state-of-the-art process uses advanced AI to diagnose and treat
            Ghibli contamination in your images.
          </p>
        </div>

        <HowItWorksSection />

        <div className="max-w-4xl mx-auto my-12 bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              The Science Behind Ghibli Detoxification
            </h2>
            <p className="mb-4 text-center">
              Our clinical process involves several sophisticated steps to
              completely remove all traces of whimsy and fantasy from your
              contaminated images:
            </p>

            <div className="space-y-4 mt-6 text-center">
              <div className="bg-clinic-blue p-4 rounded-lg">
                <h3 className="font-semibold">1. Deep Whimsy Analysis</h3>
                <p className="text-sm">
                  Our AI doctor performs a pixel-by-pixel examination of your
                  image, identifying typical Ghibli contaminants including but
                  not limited to: magical creatures, sentient dust, impossibly
                  delicious food, and unrealistic cloud formations.
                </p>
              </div>

              <div className="bg-clinic-blue p-4 rounded-lg">
                <h3 className="font-semibold">2. Contamination Mapping</h3>
                <p className="text-sm">
                  Once identified, we create a comprehensive map of all fantasy
                  elements, calculating the precise contamination level on our
                  proprietary scale from "Mild Wonder" to "Severe Miyazaki
                  Syndrome."
                </p>
              </div>

              <div className="bg-clinic-blue p-4 rounded-lg">
                <h3 className="font-semibold">3. Reality Restoration</h3>
                <p className="text-sm">
                  Using advanced AI imaging technology, we systematically
                  replace each whimsical element with a scientifically accurate,
                  medically approved alternative. Forest spirits become ordinary
                  woodland creatures, magical bathhouses are converted to
                  regular spas, and flying machines are grounded according to
                  the laws of physics.
                </p>
              </div>

              <div className="bg-clinic-blue p-4 rounded-lg">
                <h3 className="font-semibold">4. Post-Treatment Care</h3>
                <p className="text-sm">
                  We provide a detailed diagnosis and treatment report to help
                  you understand what elements were removed and how to prevent
                  future contamination of your image collection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
