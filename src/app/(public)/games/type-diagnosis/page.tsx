"use client";

import { TypeDiagnosisGame } from "@/components/type-diagnosis/TypeDiagnosisGame";

export default function PublicTypeDiagnosisPage() {
  return (
    <div className="min-h-screen bg-(--bg-gray)">
      <TypeDiagnosisGame />
    </div>
  );
}
