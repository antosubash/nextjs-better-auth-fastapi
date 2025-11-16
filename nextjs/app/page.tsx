"use client";

import { Code, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LANDING_PAGE, PAGE_CONTAINER } from "@/lib/constants";
import { useSession } from "@/lib/hooks/api/use-auth";
import { getDashboardPath } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
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
          <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            {LANDING_PAGE.HERO_DESCRIPTION}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">{LANDING_PAGE.CTA_SIGNUP}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/login">{LANDING_PAGE.CTA_LOGIN}</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {LANDING_PAGE.FEATURES_TITLE}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.TITLE}
                  className="flex flex-col gap-4 p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
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
      </div>
    </main>
  );
}
