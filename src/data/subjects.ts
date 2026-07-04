import { SubjectInfo } from "../types";

export const subjectsList: SubjectInfo[] = [
  {
    id: "surgery",
    title: "جراحی عمومی",
    englishTitle: "General Surgery",
    description: "شرح حال، معاینه فیزیکی، فیزیولوژی هموستاز، شوک، عفونت‌ها و مانیتورینگ جراحی بالینی",
    icon: "Stethoscope",
    colorTheme: "from-slate-950 via-slate-900 to-indigo-950",
    accentColor: "indigo"
  },
  {
    id: "cardiology",
    title: "بیماری‌های قلب و عروق",
    englishTitle: "Cardiology",
    description: "فیزیولوژی نوار قلب (ECG)، ایسکمی حاد میوکارد، آریتمی‌ها، نارسایی قلبی و دریچه‌ای",
    icon: "Heart",
    colorTheme: "from-slate-950 via-slate-900 to-rose-950",
    accentColor: "rose"
  },
  {
    id: "pediatrics",
    title: "بیماری‌های کودکان",
    englishTitle: "Pediatrics",
    description: "رشد و تکامل، واکسیناسیون کشوری، اورژانس‌های شایع اطفال و مایع‌درمانی در کودکان",
    icon: "Activity",
    colorTheme: "from-slate-950 via-slate-900 to-cyan-950",
    accentColor: "cyan"
  },
  {
    id: "gynecology",
    title: "زنان و زایمان",
    englishTitle: "Gynecology & Obstetrics",
    description: "بارداری طبیعی، عوارض مامایی، خونریزی‌های غیرطبیعی رحم و انکولوژی زنان",
    icon: "Sparkles",
    colorTheme: "from-slate-950 via-slate-900 to-purple-950",
    accentColor: "purple"
  },
  {
    id: "pharmacology",
    title: "داروشناسی بالینی",
    englishTitle: "Pharmacology",
    description: "فارماکوکینتیک، دسته‌های دارویی قلبی-عروقی، آنتی‌بیوتیک‌ها و مسمومیت‌ها",
    icon: "Award",
    colorTheme: "from-slate-950 via-slate-900 to-emerald-950",
    accentColor: "emerald"
  }
];
