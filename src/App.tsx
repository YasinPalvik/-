import React, { useState, useEffect } from "react";
import { UserState, ViewType } from "./types";
import { loadState, saveState, updateHeartsByTime, completeConcept, concepts } from "./lib/state";
import { auth } from "./lib/firebase.ts";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import Dashboard from "./components/Dashboard";
import Lesson from "./components/Lesson";
import IslandGlobeWorkspace from "./components/IslandGlobeWorkspace";
import Result from "./components/Result";
import Profile from "./components/Profile";
import PremiumPortal from "./components/PremiumPortal";
import AuthManager from "./components/AuthManager";
import AntigravityCanvas from "./components/AntigravityCanvas";
import MinooChat from "./components/MinooChat";
import { Heart, Zap, Flame, Sparkles, BookOpen, User, Settings as SettingsIcon, Award, Crown, LogOut, UserCheck, Key, LayoutDashboard, Menu, X, BookMarked, Award as AwardIcon, Bot, MessageSquare, Compass, Users } from "lucide-react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Antigravity dynamic simulation control states
  const [gravityValue, setGravityValue] = useState<number>(0);
  const [speedFactor, setSpeedFactor] = useState<number>(1);
  const [magneticMode, setMagneticMode] = useState<"attract" | "repel" | "orbit" | "off">("repel");
  const [themeColor, setThemeColor] = useState<"indigo" | "cyan" | "rose" | "emerald" | "amber">("indigo");

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  // Sync auth state and load user state from database
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const token = await user.getIdToken();
          setIdToken(token);
          
          const res = await fetch("/api/user-state", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUserState({
              ...data.state,
              email: data.email,
              fullName: data.fullName,
            });
            saveState({
              ...data.state,
              email: data.email,
              fullName: data.fullName,
            });
          }
        } catch (e) {
          console.error("Failed to load user state from Cloud SQL:", e);
        }
      } else {
        setCurrentUser(null);
        setIdToken(null);
        setUserState(loadState());
      }
    });
    return () => unsubscribe();
  }, []);

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
  const handleUpdateState = async (newState: UserState) => {
    // Premium users get infinite hearts (kept fully charged at 5)
    if (newState.isPremium) {
      newState.hearts = 5;
    }
    
    setUserState(newState);
    saveState(newState);

    // Sync to Cloud SQL if authenticated
    if (currentUser && idToken) {
      try {
        await fetch("/api/user-state", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({ state: newState })
        });
      } catch (e) {
        console.error("Failed to sync account progress to server", e);
      }
    } else if (newState.email) {
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
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error("Firebase signOut failed:", e);
    }
    
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden flex flex-col md:flex-row-reverse" dir="rtl">
      
      {/* Background Decorative Glowing Orbs (Arjun Next JS Bento Style) */}
      <div className="fixed top-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[10%] left-[5%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-[40%] left-[40%] w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[110px] pointer-events-none z-0"></div>

      {/* 🌌 Antigravity Interactive Starfield Background */}
      <AntigravityCanvas
        gravityValue={gravityValue}
        speedFactor={speedFactor}
        magneticMode={magneticMode}
        themeColor={themeColor}
      />

      {/* 1. RIGHT SIDEBAR: Responsive Collapsible Panel (Cruip Style layout) */}
      {currentView !== "lesson" && currentView !== "result" && (
        <>
          {/* Mobile Overlay Backdrop */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <aside className={`fixed md:sticky top-0 right-0 h-screen w-72 bg-slate-950/60 md:bg-slate-900/20 border-l border-white/5 backdrop-blur-2xl z-40 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 shrink-0 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }`}>
            <div className="p-6 space-y-8">
              {/* Brand Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentView("dashboard"); setIsSidebarOpen(false); }}>
                  <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-extrabold shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    <span className="text-lg">س</span>
                  </div>
                  <div>
                    <h1 className="text-sm font-black text-white leading-none">سگ نزن</h1>
                    <span className="text-[9px] text-indigo-400 font-extrabold tracking-wider uppercase">آموزش جراحی بالینی</span>
                  </div>
                </div>
                
                {/* Close Button Mobile only */}
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">منوی ناوبری</p>
                
                <button
                  onClick={() => { setCurrentView("dashboard"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    currentView === "dashboard"
                      ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>داشبورد بالینی</span>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-80" />
                </button>

                <button
                  onClick={() => { setCurrentView("profile"); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    currentView === "profile"
                      ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <span>پروفایل و آمار من</span>
                  </div>
                </button>
              </nav>

              {/* Actions & Utilities */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">خدمات جراحی</p>

                <button
                  onClick={() => { setShowChat(true); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all mb-1 ${
                    showChat
                      ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span>جراح مینو (مشاور علمی RAG)</span>
                  </div>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                </button>

                <button
                  onClick={() => { setShowPremium(true); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent transition-all"
                >
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400/10" />
                  <span>پلن طلایی VIP</span>
                </button>
              </div>
            </div>

            {/* Bottom Account Card */}
            <div className="p-4 border-t border-white/5 bg-slate-950/40">
              {userState.email ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 p-2 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
                      {userState.fullName ? userState.fullName.substring(0, 1) : "د"}
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="text-[11px] font-black text-slate-100 truncate">دکتر {userState.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-mono truncate" dir="ltr">{userState.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black text-rose-400 hover:text-white hover:bg-rose-500/10 border border-transparent transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowAuth(true); setIsSidebarOpen(false); }}
                  className="w-full py-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>ورود به حساب کاربری</span>
                </button>
              )}
            </div>
          </aside>
        </>
      )}

      {/* 2. MAIN LAYOUT AND HEADER CONTENT CONTAINER */}
      <div className="flex-1 min-h-screen flex flex-col relative z-10 w-full min-w-0">
        
        {/* Top Sticky Header (Cruip + Bento Theme) */}
        {currentView !== "lesson" && currentView !== "result" && (
          <header className="sticky top-0 bg-slate-950/40 backdrop-blur-lg border-b border-white/5 z-30 px-4 md:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Sidebar trigger on mobile */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Navigation title */}
              <div className="text-right">
                <span className="text-[10px] font-extrabold text-indigo-400 tracking-wide block">سامانه پایش پزشکان</span>
                <h2 className="text-xs font-black text-white">
                  {currentView === "dashboard" ? "داشبورد مطالعاتی" : "کارنامه و آمار من"}
                </h2>
              </div>
            </div>

            {/* Glowing Stats Indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Daily Streak Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-400 font-mono bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span>{userState.dailyStreak} روز</span>
              </div>

              {/* XP score Indicator */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 font-mono bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                <span>{userState.xp} XP</span>
              </div>

              {/* Clinical Health (Hearts) */}
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 font-mono bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>{userState.isPremium ? "∞" : userState.hearts}</span>
              </div>
            </div>
          </header>
        )}

        {/* View Port Content Area */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait">
            
            {/* Dashboard View */}
            {currentView === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard
                  userState={userState}
                  currentUser={currentUser}
                  onStartLesson={handleStartLesson}
                  onNavigateTo={(view) => setCurrentView(view as any)}
                  onTriggerPremium={() => setShowPremium(true)}
                  onUpdateState={handleUpdateState}
                  gravityValue={gravityValue}
                  setGravityValue={setGravityValue}
                  speedFactor={speedFactor}
                  setSpeedFactor={setSpeedFactor}
                  magneticMode={magneticMode}
                  setMagneticMode={setMagneticMode}
                  themeColor={themeColor}
                  setThemeColor={setThemeColor}
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
                transition={{ duration: 0.25 }}
                className="w-full h-full"
              >
                {isReviewSession ? (
                  <Lesson
                    chapterId={activeChapterId}
                    isReview={isReviewSession}
                    userState={userState}
                    onLessonComplete={handleLessonComplete}
                    onLessonExit={() => setCurrentView("dashboard")}
                  />
                ) : (
                  <IslandGlobeWorkspace
                    chapterId={activeChapterId}
                    userState={userState}
                    onUpdateState={handleUpdateState}
                    onExit={() => setCurrentView("dashboard")}
                    themeColor={themeColor}
                  />
                )}
              </motion.div>
            )}

            {/* Results Summary View */}
            {currentView === "result" && lastSessionResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
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
                transition={{ duration: 0.2 }}
              >
                <Profile
                  userState={userState}
                  onNavigateHome={() => setCurrentView("dashboard")}
                  onTriggerReview={() => handleStartLesson("review", true)}
                  onTriggerPremium={() => setShowPremium(true)}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Global Footer (Frosted Glassmorphic layout) */}
        {currentView !== "lesson" && currentView !== "result" && (
          <footer className="border-t border-white/5 py-6 px-4 md:px-8 text-center text-[11px] text-slate-500 font-medium">
            <p className="font-sans">سگ نزن (Sag Nazan) © {new Date().getFullYear()} - پلتفرم هوشمند جراحی بالینی به سبک گیمیفاید</p>
            <p className="text-[10px] text-slate-600 mt-1">تلفیق تجارب آموزشی و هوش محاسباتی برای ارتقای سلامت جامعه</p>
          </footer>
        )}
      </div>

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


      </AnimatePresence>

      {/* 🌌 Permanent Floating Medical AI Bubble */}
      {currentView !== "lesson" && currentView !== "result" && !showChat && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] cursor-pointer group border border-white/10"
        >
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping group-hover:animate-none opacity-75"></div>
          <Bot className="w-6 h-6 relative z-10" />
          <div className="absolute -top-1 -right-1 bg-rose-500 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-full shadow-lg border border-slate-900 leading-none">RAG</div>
        </motion.button>
      )}

      {/* RAG Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <MinooChat
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            idToken={idToken}
            userState={userState}
            onTriggerAuth={() => setShowAuth(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
