import React, { useState, useEffect } from "react";
import { UserState, ViewType } from "./types";
import { loadState, saveState, updateHeartsByTime, completeConcept, concepts } from "./lib/state";
import Dashboard from "./components/Dashboard";
import Lesson from "./components/Lesson";
import Result from "./components/Result";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import PremiumPortal from "./components/PremiumPortal";
import AuthManager from "./components/AuthManager";
import SurgicalCertificate from "./components/SurgicalCertificate";
import { Heart, Zap, Flame, Sparkles, BookOpen, User, Settings as SettingsIcon, Award, Crown, LogOut, UserCheck, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [userState, setUserState] = useState<UserState>(loadState());
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [activeChapterId, setActiveChapterId] = useState<string>("ch1");
  const [isReviewSession, setIsReviewSession] = useState(false);
  const [lastSessionResult, setLastSessionResult] = useState<{ xp: number; failedConceptIds: string[] } | null>(null);

  // Portal visibility states
  const [showPremium, setShowPremium] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Background heart regeneration check every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setUserState((prevState) => {
        const updated = updateHeartsByTime(prevState);
        if (updated.hearts !== prevState.hearts) {
          saveState(updated);
        }
        return updated;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Sync state changes with localStorage & active account DB
  const handleUpdateState = (newState: UserState) => {
    // Premium users get infinite hearts (kept fully charged at 5)
    if (newState.isPremium) {
      newState.hearts = 5;
    }
    
    setUserState(newState);
    saveState(newState);

    // Sync to user list database if authenticated
    if (newState.email) {
      try {
        const STORAGE_ACCOUNTS_KEY = "medophil_registered_accounts";
        const rawAccounts = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
        const accounts = rawAccounts ? JSON.parse(rawAccounts) : [];
        const index = accounts.findIndex((acc: any) => acc.email.toLowerCase() === newState.email?.toLowerCase());
        if (index !== -1) {
          accounts[index].state = newState;
          localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      } catch (e) {
        console.error("Failed to sync account progress", e);
      }
    }
  };

  // Logout handler
  const handleLogout = () => {
    // Reset to generic default state
    const defaultState: UserState = {
      xp: 0,
      hearts: 5,
      lastHeartRefillTime: null,
      dailyStreak: 0,
      lastActiveDate: null,
      diagnosisStreak: 0,
      completedConcepts: [],
      unlockedChapters: ["ch1"],
      chapterProgress: {},
      weakConcepts: {},
      exerciseHistory: {},
    };
    handleUpdateState(defaultState);
  };

  // Start a lesson or a review session
  const handleStartLesson = (chapterId: string, isReview: boolean) => {
    setActiveChapterId(chapterId);
    setIsReviewSession(isReview);
    setCurrentView("lesson");
  };

  // Complete a lesson/review session
  const handleLessonComplete = (xpEarned: number, failedConceptIds: string[]) => {
    let updated = { ...userState };

    if (isReviewSession) {
      // Review session success recharges all hearts as reward!
      updated.hearts = 5;
      updated.lastHeartRefillTime = null;
      updated.xp += xpEarned;
    } else {
      // Standard chapter lesson completion:
      // Award XP for each completed concept in that chapter
      const chapterId = activeChapterId;
      const chConcepts = concepts.filter((c: any) => c.chapterId === chapterId);
      
      // Filter out concepts that were failed in this session
      const succeededConcepts = chConcepts.filter((c: any) => !failedConceptIds.includes(c.id));
      
      succeededConcepts.forEach((c: any) => {
        updated = completeConcept(updated, c.id, 0); // completeConcept handles chapter progress
      });

      // Award the earned XP
      updated.xp += xpEarned;

      // Update the diagnosis streak (consecutive case study correct replies)
      if (failedConceptIds.length === 0 && xpEarned > 0) {
        updated.diagnosisStreak += 1;
      } else if (failedConceptIds.length > 0) {
        // Reset streak or decrease slightly
        updated.diagnosisStreak = 0;
      }
    }

    // Save final stats
    handleUpdateState(updated);
    setLastSessionResult({ xp: xpEarned, failedConceptIds });
    setCurrentView("result");
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-[#1a202c] font-sans selection:bg-blue-100 selection:text-blue-900 relative overflow-x-hidden pb-12" dir="rtl">
      {/* Background Decorative Glowing Orbs */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-blue-200/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-emerald-100/35 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Top Application Navbar */}
      <header className="sticky top-0 bg-white/70 backdrop-blur-md border-b border-slate-200/60 z-30 shadow-xs relative">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView("dashboard")}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm">
              <span className="text-lg">M</span>
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-none">مدوفیل (Medophil)</h1>
              <span className="text-[10px] text-blue-600 font-bold tracking-wider uppercase">یادگیری جراحی بالینی</span>
            </div>
          </div>

          {/* Quick Right side stats when on home/profile pages */}
          {currentView !== "lesson" && (
            <div className="flex items-center gap-3 md:gap-4">
              {/* Premium Upgrade Button */}
              {!userState.isPremium ? (
                <button
                  onClick={() => setShowPremium(true)}
                  className="hidden sm:flex items-center gap-1.5 text-[11px] font-black text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-400 border border-amber-300 px-3 py-1.5 rounded-xl hover:brightness-105 transition-all shadow-xs"
                >
                  <Crown className="w-3.5 h-3.5 fill-amber-950/20" />
                  <span>عضویت طلایی</span>
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-amber-700 font-mono bg-amber-50/60 border border-amber-200 px-3 py-1.5 rounded-xl">
                  <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                  <span>کاربر طلایی</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-1 text-xs font-bold text-orange-600 font-mono bg-orange-50/50 backdrop-blur-xs border border-orange-100 px-2 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                <span>{userState.dailyStreak} روز</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600 font-mono bg-blue-50/50 backdrop-blur-xs border border-blue-100 px-2 py-1 rounded-full">
                <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                <span>{userState.xp} XP</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-rose-600 font-mono bg-rose-50/50 backdrop-blur-xs border border-rose-100 px-2 py-1 rounded-full">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>{userState.isPremium ? "∞" : userState.hearts}</span>
              </div>

              <div className="h-5 w-px bg-slate-200/80 mx-1"></div>

              {/* Multi-Account Authentication Controls */}
              {userState.email ? (
                <div className="flex items-center gap-2">
                  <div 
                    onClick={() => setCurrentView("profile")}
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-xl transition-all"
                  >
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 text-[10px] font-bold">
                      {userState.fullName ? userState.fullName.substring(0, 1) : "د"}
                    </div>
                    <span className="text-[11px] font-black text-slate-700 hidden md:inline">دکتر {userState.fullName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="خروج از حساب"
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50/80 border border-blue-100 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ورود / عضویت</span>
                </button>
              )}
            </div>
          )}

        </div>
      </header>

      {/* Main Container Stage */}
      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* Dashboard View */}
          {currentView === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <Dashboard
                userState={userState}
                onStartLesson={handleStartLesson}
                onNavigateTo={(view) => setCurrentView(view as any)}
                onTriggerPremium={() => setShowPremium(true)}
              />
            </motion.div>
          )}

          {/* Lesson Active View */}
          {currentView === "lesson" && (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Lesson
                chapterId={activeChapterId}
                isReview={isReviewSession}
                userState={userState}
                onLessonComplete={handleLessonComplete}
                onLessonExit={() => setCurrentView("dashboard")}
              />
            </motion.div>
          )}

          {/* Results Summary View */}
          {currentView === "result" && lastSessionResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Result
                xpEarned={lastSessionResult.xp}
                failedConceptIds={lastSessionResult.failedConceptIds}
                heartsRemaining={userState.hearts}
                isReview={isReviewSession}
                onNavigateHome={() => setCurrentView("dashboard")}
              />
            </motion.div>
          )}

          {/* User Profile View */}
          {currentView === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <Profile
                userState={userState}
                onNavigateHome={() => setCurrentView("dashboard")}
                onTriggerReview={() => handleStartLesson("review", true)}
                onTriggerCertificate={() => setShowCertificate(true)}
                onTriggerPremium={() => setShowPremium(true)}
              />
            </motion.div>
          )}

          {/* Settings View */}
          {currentView === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
            >
              <Settings
                userState={userState}
                onUpdateState={handleUpdateState}
                onNavigateHome={() => setCurrentView("dashboard")}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Premium, Authentication, and Certificate Overlays */}
      <AnimatePresence>
        {showPremium && (
          <PremiumPortal
            userState={userState}
            onUpdateState={handleUpdateState}
            onClose={() => setShowPremium(false)}
          />
        )}

        {showAuth && (
          <AuthManager
            userState={userState}
            onUpdateState={handleUpdateState}
            onClose={() => setShowAuth(false)}
          />
        )}

        {showCertificate && (
          <SurgicalCertificate
            userState={userState}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>

      {/* Footer Branding credits */}
      <footer className="bg-white/40 backdrop-blur-md border-t border-slate-200/50 py-6 mt-16 text-center text-xs text-slate-500 font-medium relative z-10 rounded-t-3xl">
        <p>مدوفیل (Medophil) © {new Date().getFullYear()} - پلتفرم گیمیفاید آموزش جراحی بالینی</p>
        <p className="text-[10px] text-slate-400 mt-1">توسعه یافته توسط مهندس نرم‌افزار ارشد و طراح محصولات آموزشی</p>
      </footer>
    </div>
  );
}
