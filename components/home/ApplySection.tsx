"use client";

import { useState } from "react";
import { CompatibilityQuiz } from "@/components/CompatibilityQuiz";
import { ContactForm } from "@/components/home/ContactForm";
import { GenderSelection } from "@/components/home/GenderSelection";
import type { QuizResult } from "@/components/quiz/quizTypes";

export function ApplySection() {
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  return (
    <>
      <GenderSelection />
      <CompatibilityQuiz onComplete={setQuizResult} completed={quizResult} />
      <ContactForm quizResult={quizResult} />
    </>
  );
}
