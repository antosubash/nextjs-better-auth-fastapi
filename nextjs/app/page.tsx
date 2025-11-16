"use client";

import { Code, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { LANDING_PAGE, PAGE_CONTAINER } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";
import { getDashboardPath } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const { data: session, isLoading } = useSession();

  const isAuthenticated = !!session?.session;

  useEffect(() => {
    if (isAuthenticated && session?.user?.role) {
      router.push(getDashboardPath(session.user.role));
    }
  }, [isAuthenticated, session, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const features = [
    { icon: Shield, ...LANDING_PAGE.FEATURES[0] },
    { icon: Zap, ...LANDING_PAGE.FEATURES[1] },
    { icon: Code, ...LANDING_PAGE.FEATURES[2] },
  ];

  return (
    <main className="w-full">
      <div className={PAGE_CONTAINER.CLASS}>
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16 lg:mb-24 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gray-900 dark:text-white">
            {LANDING_PAGE.HERO_TITLE}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-4 font-medium">
            {LANDING_PAGE.HERO_SUBTITLE}
          </p>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {LANDING_PAGE.HERO_DESCRIPTION}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start w-full">
          {/* Features Section */}
          <div className="w-full space-y-6 lg:order-1">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {LANDING_PAGE.FEATURES_TITLE}
            </h2>
            <div className="space-y-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.TITLE}
                    className="flex gap-4 p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                  >
                    <div className="shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-linear-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white dark:text-gray-900" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {feature.TITLE}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{feature.DESCRIPTION}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auth Form Section */}
          <div className="w-full lg:order-2">
            <div className="lg:sticky lg:top-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 lg:p-10">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isLogin ? LANDING_PAGE.GET_STARTED : LANDING_PAGE.CREATE_ACCOUNT}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isLogin ? LANDING_PAGE.SIGN_IN_DESCRIPTION : LANDING_PAGE.SIGN_UP_DESCRIPTION}
                  </p>
                </div>
                {isLogin ? (
                  <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
                ) : (
                  <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
