"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { trpc } from "@/lib/trpc";
import {
  getDiagnosisSession,
  clearDiagnosisSession,
} from "@/lib/diagnosis-session";
import { convertPublicToAuthAnswers } from "./session-migration";
import type {
  DiagnosisStep,
  DiagnosisAnswers,
  ChatMessage,
  QuestionOption,
  AnswerValue,
  DiagnosisProgress,
} from "./types";
import {
  QUESTIONS,
  getNextQuestion,
  getNextUnansweredQuestion,
  calculateProgress,
  getCompletionMessage,
} from "./question-flow";

// コンテキストの型
interface DiagnosisContextType {
  // 状態
  sessionId: string | null;
  currentStep: DiagnosisStep;
  currentQuestionIndex: number;
  answers: DiagnosisAnswers;
  messages: ChatMessage[];
  isTyping: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  progress: DiagnosisProgress;

  // アクション
  startDiagnosis: () => Promise<void>;
  submitAnswer: (value: AnswerValue) => Promise<void>;
  selectOption: (option: QuestionOption) => Promise<void>;
  skipQuestion: () => Promise<void>;
  completeDiagnosis: () => Promise<void>;
  resetDiagnosis: () => Promise<void>;
}

const DiagnosisContext = createContext<DiagnosisContextType | null>(null);

// プロバイダーのProps
interface DiagnosisProviderProps {
  children: ReactNode;
}

// ユニークIDを生成
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function DiagnosisProvider({ children }: DiagnosisProviderProps) {
  // 状態
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>("BASIC_INFO");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosisFinalized, setIsDiagnosisFinalized] = useState(false);

  // tRPC mutations
  const startSessionMutation = trpc.diagnosis.startSession.useMutation();
  const saveAnswerMutation = trpc.diagnosis.saveAnswer.useMutation();
  const completeDiagnosisMutation = trpc.diagnosis.completeDiagnosis.useMutation();
  const resetDiagnosisMutation = trpc.diagnosis.resetDiagnosis.useMutation();

  // 進捗を計算
  const progress: DiagnosisProgress = {
    ...calculateProgress(answers),
    currentStep,
    completedSteps: [],
  };

  // AIメッセージを追加（タイピングエフェクト付き）
  const addAiMessage = useCallback(
    async (
      content: string,
      options?: QuestionOption[],
      questionId?: string
    ) => {
      setIsTyping(true);

      // タイピング遅延（自然な感じを出すため）
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

      const message: ChatMessage = {
        id: generateId(),
        type: "ai",
        content,
        options,
        timestamp: new Date(),
        questionId,
      };

      setMessages((prev) => [...prev, message]);
      setIsTyping(false);
    },
    []
  );

  // ユーザーメッセージを追加
  const addUserMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: generateId(),
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  // 次の質問を表示
  const showNextQuestion = useCallback(
    async (currentAnswers: DiagnosisAnswers) => {
      const currentQuestion = QUESTIONS[currentQuestionIndex];
      const nextQuestion = getNextQuestion(
        currentQuestion?.id || null,
        currentAnswers
      );

      if (!nextQuestion) {
        // 質問がなくなったら完了 → サーバー側で診断データをCastプロフィールに反映
        try {
          await completeDiagnosisMutation.mutateAsync();
          setIsDiagnosisFinalized(true);
        } catch (error) {
          console.error("診断完了エラー（自動完了）:", error);
        }
        setIsCompleted(true);
        await addAiMessage(getCompletionMessage(currentAnswers));
        return;
      }

      // 新しいステップに移行した場合
      if (nextQuestion.step !== currentStep) {
        setCurrentStep(nextQuestion.step);
      }

      // 質問インデックスを更新
      const newIndex = QUESTIONS.findIndex((q) => q.id === nextQuestion.id);
      setCurrentQuestionIndex(newIndex);

      // 質問を表示
      await addAiMessage(
        nextQuestion.content,
        nextQuestion.options,
        nextQuestion.id
      );
    },
    [currentQuestionIndex, currentStep, addAiMessage, completeDiagnosisMutation]
  );

  // 診断を開始
  const startDiagnosis = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await startSessionMutation.mutateAsync();

      setSessionId(result.session.id);
      setIsCompleted(result.session.isCompleted);

      // 既存の回答を復元
      let existingAnswers = (result.session.answers as DiagnosisAnswers) || {};

      // 公開診断のデータがあれば引き継ぐ
      const publicSession = getDiagnosisSession();
      if (publicSession?.answers && Object.keys(publicSession.answers).length > 0) {
        const convertedAnswers = convertPublicToAuthAnswers(publicSession.answers);
        existingAnswers = { ...existingAnswers, ...convertedAnswers };

        // 引き継いだ回答をサーバーに一括保存
        for (const [questionId, value] of Object.entries(convertedAnswers)) {
          if (value !== undefined) {
            await saveAnswerMutation.mutateAsync({ questionId, value });
          }
        }

        // 公開診断のsessionStorageをクリア
        clearDiagnosisSession();
      }

      setAnswers(existingAnswers);

      if (result.session.isCompleted) {
        // 既に完了している場合
        setIsDiagnosisFinalized(true);
        await addAiMessage(getCompletionMessage(existingAnswers));
      } else {
        // 引き継ぎデータがある場合は未回答質問から再開
        const hasPrefilledData = Object.keys(existingAnswers).length > 0;
        const firstQuestion = hasPrefilledData
          ? getNextUnansweredQuestion(null, existingAnswers)
          : QUESTIONS[0];

        if (!firstQuestion) {
          // 全質問回答済み
          setIsCompleted(true);
          await addAiMessage(getCompletionMessage(existingAnswers));
        } else {
          if (hasPrefilledData) {
            // 引き継ぎメッセージを表示
            const newIndex = QUESTIONS.findIndex((q) => q.id === firstQuestion.id);
            setCurrentQuestionIndex(newIndex);
            if (firstQuestion.step !== currentStep) {
              setCurrentStep(firstQuestion.step);
            }
          }

          await addAiMessage(
            firstQuestion.content,
            firstQuestion.options,
            firstQuestion.id
          );
        }
      }
    } catch (error) {
      console.error("診断開始エラー:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [startSessionMutation, saveAnswerMutation, addAiMessage, currentStep]);

  // 回答を送信
  const submitAnswer = useCallback(
    async (value: AnswerValue) => {
      const currentQuestion = QUESTIONS[currentQuestionIndex];
      if (!currentQuestion || !sessionId) return;

      // ユーザーの回答をメッセージとして追加
      const displayValue = Array.isArray(value)
        ? value.join(", ")
        : String(value);
      addUserMessage(displayValue);

      // 回答を保存
      const newAnswers = { ...answers, [currentQuestion.id]: value };
      setAnswers(newAnswers);

      try {
        // サーバーに保存
        await saveAnswerMutation.mutateAsync({
          questionId: currentQuestion.id,
          value,
        });

        // フォローアップメッセージがあれば表示
        if (currentQuestion.followUp) {
          await addAiMessage(currentQuestion.followUp);
        }

        // 次の質問へ
        await showNextQuestion(newAnswers);
      } catch (error) {
        console.error("回答保存エラー:", error);
      }
    },
    [
      currentQuestionIndex,
      sessionId,
      answers,
      addUserMessage,
      saveAnswerMutation,
      addAiMessage,
      showNextQuestion,
    ]
  );

  // 選択肢を選択
  const selectOption = useCallback(
    async (option: QuestionOption) => {
      await submitAnswer(option.value);
    },
    [submitAnswer]
  );

  // 質問をスキップ
  const skipQuestion = useCallback(async () => {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    if (!currentQuestion) return;

    // スキップのメッセージを追加
    addUserMessage("スキップ");

    // 次の質問へ
    await showNextQuestion(answers);
  }, [currentQuestionIndex, answers, addUserMessage, showNextQuestion]);

  // 診断を完了
  const completeDiagnosis = useCallback(async () => {
    // showNextQuestion で既に完了済みの場合はスキップ
    if (isDiagnosisFinalized) return;

    setIsLoading(true);
    try {
      await completeDiagnosisMutation.mutateAsync();
      setIsDiagnosisFinalized(true);
      setIsCompleted(true);
    } catch (error) {
      console.error("診断完了エラー:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [completeDiagnosisMutation, isDiagnosisFinalized]);

  // 診断をリセット
  const resetDiagnosis = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await resetDiagnosisMutation.mutateAsync();
      setSessionId(result.session.id);
      setCurrentStep("BASIC_INFO");
      setCurrentQuestionIndex(0);
      setAnswers({});
      setMessages([]);
      setIsCompleted(false);
      setIsDiagnosisFinalized(false);

      // 最初の質問を表示
      const firstQuestion = QUESTIONS[0];
      await addAiMessage(
        firstQuestion.content,
        firstQuestion.options,
        firstQuestion.id
      );
    } catch (error) {
      console.error("診断リセットエラー:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [resetDiagnosisMutation, addAiMessage]);

  const value: DiagnosisContextType = {
    sessionId,
    currentStep,
    currentQuestionIndex,
    answers,
    messages,
    isTyping,
    isCompleted,
    isLoading,
    progress,
    startDiagnosis,
    submitAnswer,
    selectOption,
    skipQuestion,
    completeDiagnosis,
    resetDiagnosis,
  };

  return (
    <DiagnosisContext.Provider value={value}>
      {children}
    </DiagnosisContext.Provider>
  );
}

// カスタムフック
export function useDiagnosis() {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error("useDiagnosis must be used within a DiagnosisProvider");
  }
  return context;
}
