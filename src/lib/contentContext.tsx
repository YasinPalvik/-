import React, { createContext, useContext, useState, useEffect } from "react";
import { Chapter, ConceptNode, Exercise } from "../types";
import { chapters as fallbackChapters, concepts as fallbackConcepts, exercises as fallbackExercises } from "./state";
import { syllabi as fallbackSyllabi, ChapterSyllabus } from "../data/syllabus";
import { extendedSyllabi } from "../data/content_extended";
import { islandQuestionsData as fallbackIslandQuestions, IslandQuestion } from "../data/islandQuestions";

// Combine initial syllabi
const initialFallbackSyllabi: Record<string, ChapterSyllabus> = {
  ...fallbackSyllabi,
  ...extendedSyllabi
};

interface ContentContextType {
  chapters: Chapter[];
  concepts: ConceptNode[];
  exercises: Exercise[];
  syllabi: Record<string, ChapterSyllabus>;
  islandQuestions: Record<string, IslandQuestion[]>;
  isLoading: boolean;
  refreshContent: () => Promise<void>;
  
  // Dynamic Content Editors (API proxies)
  addChapter: (id: string, data: Chapter, idToken: string) => Promise<boolean>;
  addConcept: (id: string, data: ConceptNode, idToken: string) => Promise<boolean>;
  addExercise: (id: string, data: Exercise, idToken: string) => Promise<boolean>;
  addSyllabusChapter: (chapterId: string, data: ChapterSyllabus, idToken: string) => Promise<boolean>;
  addIslandQuestion: (id: string, data: IslandQuestion, idToken: string) => Promise<boolean>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    return Array.from(new Map(fallbackChapters.map(ch => [ch.id, ch])).values());
  });
  const [concepts, setConcepts] = useState<ConceptNode[]>(() => {
    return Array.from(new Map(fallbackConcepts.map(c => [c.id, c])).values());
  });
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    return Array.from(new Map(fallbackExercises.map(e => [e.id, e])).values());
  });
  const [syllabi, setSyllabi] = useState<Record<string, ChapterSyllabus>>(initialFallbackSyllabi);
  const [islandQuestions, setIslandQuestions] = useState<Record<string, IslandQuestion[]>>(fallbackIslandQuestions);
  const [isLoading, setIsLoading] = useState(true);

  const loadCachedContent = () => {
    try {
      const cached = localStorage.getItem("medophil_dynamic_content");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.chapters) {
          const uniqueChapters = Array.from(new Map(parsed.chapters.map((ch: any) => [ch.id, ch])).values());
          setChapters(uniqueChapters);
        }
        if (parsed.concepts) {
          const uniqueConcepts = Array.from(new Map(parsed.concepts.map((c: any) => [c.id, c])).values());
          setConcepts(uniqueConcepts);
        }
        if (parsed.exercises) {
          const uniqueExercises = Array.from(new Map(parsed.exercises.map((e: any) => [e.id, e])).values());
          setExercises(uniqueExercises);
        }
        if (parsed.syllabi) setSyllabi(parsed.syllabi);
        if (parsed.islandQuestions) setIslandQuestions(parsed.islandQuestions);
      }
    } catch (e) {
      console.error("Failed to load cached content:", e);
    }
  };

  const fetchLatestContent = async () => {
    try {
      const response = await fetch("/api/content");
      if (response.ok) {
        const data = await response.json();
        
        // Update states
        if (data.chapters) {
          const uniqueChapters = Array.from(new Map(data.chapters.map((ch: any) => [ch.id, ch])).values());
          setChapters(uniqueChapters);
        }
        if (data.concepts) {
          const uniqueConcepts = Array.from(new Map(data.concepts.map((c: any) => [c.id, c])).values());
          setConcepts(uniqueConcepts);
        }
        if (data.exercises) {
          const uniqueExercises = Array.from(new Map(data.exercises.map((e: any) => [e.id, e])).values());
          setExercises(uniqueExercises);
        }
        if (data.syllabi) setSyllabi(data.syllabi);
        if (data.islandQuestions) setIslandQuestions(data.islandQuestions);

        // Cache in localStorage for offline / fast restart
        localStorage.setItem("medophil_dynamic_content", JSON.stringify(data));
      }
    } catch (e) {
      console.error("Failed to fetch latest content from Express server, using cache or static fallbacks:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Instantly load cache if available (for responsive UI and zero perceived delay)
    loadCachedContent();
    // 2. Fetch the absolute fresh copy from our database-backed Express server in the background
    fetchLatestContent();
  }, []);

  const refreshContent = async () => {
    setIsLoading(true);
    await fetchLatestContent();
  };

  const addChapter = async (id: string, data: Chapter, idToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/content/chapter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ id, data })
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to save chapter on backend:", e);
      return false;
    }
  };

  const addConcept = async (id: string, data: ConceptNode, idToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/content/concept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ id, data })
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to save concept on backend:", e);
      return false;
    }
  };

  const addExercise = async (id: string, data: Exercise, idToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/content/exercise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ id, data })
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to save exercise on backend:", e);
      return false;
    }
  };

  const addSyllabusChapter = async (chapterId: string, data: ChapterSyllabus, idToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/content/syllabus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ chapterId, data })
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to save syllabus on backend:", e);
      return false;
    }
  };

  const addIslandQuestion = async (id: string, data: IslandQuestion, idToken: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/content/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ id, data })
      });
      if (res.ok) {
        await refreshContent();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to save question on backend:", e);
      return false;
    }
  };

  return (
    <ContentContext.Provider
      value={{
        chapters,
        concepts,
        exercises,
        syllabi,
        islandQuestions,
        isLoading,
        refreshContent,
        addChapter,
        addConcept,
        addExercise,
        addSyllabusChapter,
        addIslandQuestion
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
}
