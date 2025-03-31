import { Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold mb-3">Ghibli Detox Clinic</h3>
            <p className="text-sm text-gray-600">
              Restoring reality to whimsy-infected imagery since 2025.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Treatment Programs</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-clinic-blue-dark">
                  Basic Detoxification
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-clinic-blue-dark">
                  Advanced Whimsy Removal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-clinic-blue-dark">
                  Emergency Totoro Extraction
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-clinic-blue-dark">
                  Group Therapy Sessions
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Legal Disclaimer</h3>
            <p className="text-sm text-gray-600">
              Our treatments are not FDA approved. Side effects may include
              reduced childhood wonder and an inability to see magic in ordinary
              things.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-col justify-between items-center">
          <p className="text-sm text-gray-500 mb-2 sm:mb-0">
            © 2025 Studio Ghibli Detox 
          </p>

          <div className="flex items-center pt-4 space-x-3">
            <span className="text-sm text-gray-500">Created by Deepto</span>
            <a
              href="https://github.com/deepto98"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-600 transition-colors"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href="https://twitter.com/deepto98"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-600 transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
