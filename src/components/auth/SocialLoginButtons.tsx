"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

interface SocialLoginButtonsProps {
  callbackUrl?: string;
  showEmailForm?: boolean;
}

export function SocialLoginButtons({
  callbackUrl = "/",
  showEmailForm = true,
}: SocialLoginButtonsProps) {
  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsEmailLoading(true);
    try {
      await signIn("nodemailer", {
        email,
        callbackUrl,
        redirect: false,
      });
      setEmailSent(true);
    } catch {
      console.error("Email sign in failed");
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* LINE Login */}
      <button
        type="button"
        onClick={() => signIn("line", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-[#00B900] hover:bg-[#00a000] transition-colors text-white font-medium"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        <span>LINEでログイン</span>
      </button>

      {/* X (Twitter) Login */}
      <button
        type="button"
        onClick={() => signIn("twitter", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-white font-medium"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>Xでログイン</span>
      </button>

      {/* Email Login */}
      {showEmailForm && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">または</span>
            </div>
          </div>

          {emailSent ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">
                メールを送信しました
              </p>
              <p className="text-green-600 text-sm mt-1">
                {email} に送信されたリンクをクリックしてログインしてください
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isEmailLoading || !email}
                className="w-full px-4 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white font-medium rounded-lg transition-colors"
              >
                {isEmailLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    送信中...
                  </span>
                ) : (
                  "マジックリンクを送信"
                )}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
