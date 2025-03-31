import { Ban } from "lucide-react";

const preventionTips = [
  {
    title: "Avoid Adding Soot Sprites",
    description: "Your household dust does not need eyes or personalities. Regular cleaning, not befriending, is the appropriate treatment."
  },
  {
    title: "Stop Anthropomorphizing Vehicles",
    description: "Your car should not have a face or emotions. This is a sign of advanced Ghibli syndrome."
  },
  {
    title: "Resist Magical Food Imagery",
    description: "Food should not sparkle, float, or look impossibly delicious. Real food has flaws."
  },
  {
    title: "Limit Sky Detail",
    description: "Realistic clouds do not resemble animals or tell stories. Excessive cloud detail is a warning sign."
  },
  {
    title: "Beware of Spirit Bathhouses",
    description: "Regular spas are sufficient for hygiene. No need for magical transformations during your self-care routine."
  },
  {
    title: "Keep Forests Ordinary",
    description: "Trees should remain static and uninhabited by spirits. The rustling you hear is just wind, not forest gods communicating."
  }
];

export default function RelapsePrevention() {
  return (
    <section className="max-w-4xl mx-auto my-12 ">
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-clinic-blue p-4 text-center">
          <h2 className="text-xl font-semibold">Relapse Prevention Guide</h2>
          <p className="text-sm text-gray-600">Follow these guidelines to prevent Ghibli recontamination</p>
        </div>
        
        <div className="p-6 grid gap-6 md:grid-cols-2">
          {preventionTips.map((tip, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-clinic-blue flex items-center justify-center">
                  <Ban className="h-5 w-5 text-clinic-blue-dark" />
                </div>
                <div>
                  <h3 className="font-medium">{tip.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-sm text-gray-600 flex items-center">
            <span className="text-clinic-blue-dark mr-2">ⓘ</span>
            For severe cases, we recommend our 12-step program: "From Totoro to Reality: A Journey Back"
          </p>
        </div>
      </div>
    </section>
  );
}
