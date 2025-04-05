import { Bug, Pill, FileText, Stethoscope, ClipboardCheck } from "lucide-react";

interface DiagnosisReportProps {
  diagnosisPoints: string[] | null;
  treatmentPoints: string[] | null;
  isLoading?: boolean;
}

export default function DiagnosisReport({
  diagnosisPoints = [],
  treatmentPoints = [],
  isLoading = false,
}: DiagnosisReportProps) {
  // Create safe arrays to iterate over
  const safePoints = diagnosisPoints || [];
  const safeTreatments = treatmentPoints || [];

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {/* Clinical Diagnosis Card */}
      <div className="ai-card p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <Stethoscope className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Clinical Diagnosis</h3>
          </div>
        </div>

        <div className="p-4 bg-white">
          <div className="space-y-4">
            {safePoints.map((point, index) => (
              <div
                key={`diagnosis-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-rose-100 bg-rose-50"
              >
                <span className="text-rose-500 bg-rose-100 p-1.5 rounded-full shrink-0">
                  <Bug className="h-4 w-4" />
                </span>
                <span className="text-gray-700 text-sm">{point}</span>
              </div>
            ))}
            {safePoints.length === 0 && (
              <div className="text-gray-500 text-center p-4">
                No diagnosis points available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Treatment Plan Card */}
      <div className="ai-card p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg">Treatment Plan</h3>
          </div>
        </div>

        <div className="p-4 bg-white">
          <div className="space-y-4">
            {isLoading
              ? /* Loading placeholders for treatment points */
                Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={`loading-${index}`}
                      className="flex items-start gap-3 p-3 rounded-lg border border-green-100 bg-green-50"
                    >
                      <span className="text-green-500 bg-green-100 p-1.5 rounded-full shrink-0 animate-pulse">
                        <Pill className="h-4 w-4" />
                      </span>
                      <span className="w-full">
                        <div className="h-2 bg-gray-200 rounded animate-pulse my-1"></div>
                        <div className="h-2 bg-gray-200 rounded animate-pulse my-1 w-3/4"></div>
                      </span>
                    </div>
                  ))
              : /* Actual treatment points */
                safeTreatments.map((point, index) => (
                  <div
                    key={`treatment-${index}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-green-100 bg-green-50"
                  >
                    <span className="text-green-500 bg-green-100 p-1.5 rounded-full shrink-0">
                      <Pill className="h-4 w-4" />
                    </span>
                    <span className="text-gray-700 text-sm">{point}</span>
                  </div>
                ))}
            {!isLoading && safeTreatments.length === 0 && (
              <div className="text-gray-500 text-center p-4">
                No treatment points available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
