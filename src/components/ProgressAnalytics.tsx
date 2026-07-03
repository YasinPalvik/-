import React from "react";
import { UserState } from "../types";
import { chapters } from "../lib/state";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, TrendingUp, Award, Activity } from "lucide-react";

interface ProgressAnalyticsProps {
  userState: UserState;
}

export default function ProgressAnalytics({ userState }: ProgressAnalyticsProps) {
  // Map chapter progress data for Recharts
  const chartData = chapters.map((chapter, idx) => {
    const progress = userState.chapterProgress[chapter.id] || 0;
    return {
      id: chapter.id,
      shortName: `${idx + 1}. ${chapter.title.substring(0, 15)}${chapter.title.length > 15 ? "..." : ""}`,
      fullName: `${idx + 1}. ${chapter.title}`,
      progress: progress,
    };
  });

  // Calculate analytical stats
  const activeProgresses = chapters.map(ch => userState.chapterProgress[ch.id] || 0);
  const totalChapters = chapters.length;
  const averageProgress = totalChapters > 0 
    ? Math.round(activeProgresses.reduce((sum, val) => sum + val, 0) / totalChapters) 
    : 0;

  // Find top subject
  let topSubject = "هنوز مشخص نشده";
  let topProgress = -1;
  chapters.forEach(ch => {
    const p = userState.chapterProgress[ch.id] || 0;
    if (p > topProgress) {
      topProgress = p;
      topSubject = ch.title;
    }
  });

  // Find weak subject (lowest progress among all chapters)
  let weakestSubject = "شروع نشده";
  let lowestProgress = 101;
  chapters.forEach(ch => {
    const p = userState.chapterProgress[ch.id] || 0;
    if (p < lowestProgress) {
      lowestProgress = p;
      weakestSubject = ch.title;
    }
  });

  if (topProgress === 0) topSubject = "بدون فعالیت";
  if (lowestProgress === 101 || lowestProgress === 0) weakestSubject = "مبحثی شروع نشده است";

  // Custom tool tip component for RTL Persian
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 p-3 rounded-xl shadow-xl text-right text-xs space-y-1.5" dir="rtl">
          <p className="font-extrabold text-slate-200">{payload[0].payload.fullName}</p>
          <div className="flex items-center gap-1 text-blue-400 font-bold font-mono">
            <span>میزان تسلط بالینی:</span>
            <span>{payload[0].value}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[32px] p-6 space-y-6 shadow-xs relative overflow-hidden" id="progress-analytics" dir="rtl">
      {/* Glow effects */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
      <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>

      {/* Header */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-800">تحلیل آماری و نمودار تسلط</h3>
          <p className="text-xs text-slate-500">پایش تصویری روند پیشروی در مباحث نه‌گانه جراحی براساس داده‌های ذخیره‌شده</p>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        
        {/* Card 1: Average */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100/40 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block">میانگین تسلط جراحی</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-blue-600 font-mono">{averageProgress}%</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        {/* Card 2: Top Subject */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100/40 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block">مبحث پیشتاز بالینی</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black text-emerald-700 truncate max-w-[180px]">{topSubject}</span>
            <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          </div>
        </div>

        {/* Card 3: Needing Focus */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-100/40 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block">تمرکز پیشنهادی بعدی</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black text-amber-700 truncate max-w-[180px]">{weakestSubject}</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </div>
        </div>

      </div>

      {/* Bar Chart Section */}
      <div className="relative z-10 h-[340px] w-full bg-white/40 border border-white/60 p-4 rounded-2xl shadow-2xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            
            {/* XAxis matches 0-100% */}
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              unit="%" 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
              stroke="#cbd5e1"
            />
            
            {/* YAxis shows chapter names */}
            <YAxis 
              dataKey="shortName" 
              type="category" 
              width={110} 
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }}
              textAnchor="end"
              dx={-5}
              stroke="#cbd5e1"
            />
            
            <Tooltip 
              cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }} 
              content={<CustomTooltip />} 
            />
            
            <Bar 
              dataKey="progress" 
              radius={[0, 8, 8, 0]}
              barSize={16}
            >
              {chartData.map((entry, index) => {
                // Return a nice gradient fill based on completion level
                let color = "#3b82f6"; // primary blue
                if (entry.progress === 100) {
                  color = "#10b981"; // emerald for completion
                } else if (entry.progress > 50) {
                  color = "#6366f1"; // indigo
                } else if (entry.progress > 0) {
                  color = "#8b5cf6"; // purple
                } else {
                  color = "#cbd5e1"; // gray for unstarted
                }
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
