export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold mb-3">Ghibli Detox Clinic</h3>
            <p className="text-sm text-gray-600">
              Restoring reality to whimsy-infected imagery since 2023.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Treatment Programs</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-clinic-blue-dark">Basic Detoxification</a></li>
              <li><a href="#" className="hover:text-clinic-blue-dark">Advanced Whimsy Removal</a></li>
              <li><a href="#" className="hover:text-clinic-blue-dark">Emergency Totoro Extraction</a></li>
              <li><a href="#" className="hover:text-clinic-blue-dark">Group Therapy Sessions</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Legal Disclaimer</h3>
            <p className="text-sm text-gray-600">
              Our treatments are not FDA approved. Side effects may include reduced childhood wonder
              and an inability to see magic in ordinary things.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
          <p>© 2023 Ghibli Detox Clinic. This is a parody service. We actually love Studio Ghibli.</p>
        </div>
      </div>
    </footer>
  );
}
