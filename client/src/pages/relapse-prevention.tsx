import RelapsePrevention from "@/components/relapse-prevention-guide";

export default function RelapsePage() {
  return (
    <div className="bg-gray-50 text-clinic-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center my-8 md:my-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Ghibli Relapse Prevention</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Follow our clinical guidelines to prevent Ghibli recontamination and
            maintain a whimsy-free lifestyle.
          </p>
        </div>

        <RelapsePrevention />

        <div className="max-w-4xl mx-auto my-12 bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Additional Prevention Resources</h2>
            
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-lg">12-Step Program: "From Totoro to Reality: A Journey Back"</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Our comprehensive recovery program for severe cases of Ghibli addiction. Weekly group sessions available online.
                </p>
                <button className="mt-3 px-4 py-2 bg-clinic-blue-dark text-white rounded-md hover:bg-blue-600">
                  Register for Program
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-lg">Monthly Reality Check Newsletter</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Stay updated with the latest techniques to identify and resist emerging Ghibli influences in your daily life.
                </p>
                <div className="mt-3 flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="px-3 py-2 border border-gray-300 rounded-md flex-grow"
                  />
                  <button className="px-4 py-2 bg-clinic-blue-dark text-white rounded-md hover:bg-blue-600">
                    Subscribe
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-lg">Emergency Helpline</h3>
                <p className="text-sm text-gray-600 mt-2">
                  For moments of weakness when you feel the urge to add sparkles to ordinary objects or believe your cat might be a forest spirit in disguise.
                </p>
                <div className="mt-3 bg-gray-100 p-3 rounded-md text-center font-medium">
                  1-800-NO-GHIBLI
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
