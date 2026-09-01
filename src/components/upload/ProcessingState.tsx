"use client";

import { CheckCircle, Loader } from "lucide-react";
import {
  getUploadFileKind,
  isSpreadsheetKind,
  type UploadFileKind,
} from "@/lib/upload-file-types";

interface ProcessingStateProps {
  currentStep: 1 | 2;
  isComplete: boolean;
  fileType: string;
  fileName?: string;
}

function resolveKind(fileType: string, fileName?: string): UploadFileKind {
  return getUploadFileKind({ type: fileType, name: fileName ?? "" });
}

export function ProcessingState({
  currentStep,
  isComplete,
  fileType,
  fileName,
}: ProcessingStateProps) {
  const kind = resolveKind(fileType, fileName);
  const spreadsheet = isSpreadsheetKind(kind);

  const steps = spreadsheet
    ? [
        { number: 1 as const, text: "Reading spreadsheet data..." },
        { number: 2 as const, text: "Summarising data with AI..." },
      ]
    : [
        { number: 1 as const, text: "Reading document..." },
        { number: 2 as const, text: "Extracting information with AI..." },
      ];

  return (
    <div className="space-y-6 py-8">
      {steps.map((step) => {
        const isActive = step.number === currentStep;
        const isDone =
          step.number < currentStep ||
          (step.number === currentStep && isComplete);

        return (
          <div key={step.number} className="flex items-center gap-4">
            <div className="relative h-8 w-8 flex-shrink-0">
              {isDone ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : isActive ? (
                <div className="relative h-8 w-8">
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-default" />
              )}
            </div>
            <p
              className={`text-sm font-medium ${
                isActive || isDone ? "text-foreground" : "text-secondary"
              }`}
            >
              {step.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
