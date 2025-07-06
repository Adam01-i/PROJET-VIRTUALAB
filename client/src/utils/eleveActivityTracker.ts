import { supabase } from "../lib/supabaseClient"

export interface ActivityData {
  activity_type: "connexion" | "simulation" | "quiz" | "objet3d"
  action: "start" | "complete" | "view" | "login"
  duration_seconds?: number
  score?: number
  total_score?: number
  metadata?: any
}

export const trackActivity = async (activityData: ActivityData): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn("Utilisateur non connecté - activité non trackée")
      return
    }

    // Utiliser exactement les colonnes de la table
    const logData = {
      user_id: user.id,
      activity_type: activityData.activity_type,
      action: activityData.action,
      metadata: activityData.metadata || {},
      duration_seconds: activityData.duration_seconds || null,
      score: activityData.score || null,
      total_score: activityData.total_score || null,
      created_at: new Date().toISOString(),
    }

    console.log("Tentative d'insertion élève:", logData)

    const { error } = await supabase.from("activity_logs").insert([logData])

    if (error) {
      console.error("Erreur lors du tracking:", error)
    } else {
      console.log("✅ Activité trackée:", activityData)
    }
  } catch (error) {
    console.error("Erreur tracking:", error)
  }
}

// Fonctions spécifiques pour chaque type d'activité
export const trackLogin = () =>
  trackActivity({
    activity_type: "connexion",
    action: "login",
  })

export const trackSimulationStart = (experienceId: string, titre: string) =>
  trackActivity({
    activity_type: "simulation",
    action: "start",
    metadata: { experience_id: experienceId, titre },
  })

export const trackSimulationComplete = (experienceId: string, titre: string, durationSeconds: number) =>
  trackActivity({
    activity_type: "simulation",
    action: "complete",
    duration_seconds: durationSeconds,
    metadata: { experience_id: experienceId, titre },
  })

export const trackQuizStart = (quizId: string, titre: string) =>
  trackActivity({
    activity_type: "quiz",
    action: "start",
    metadata: { quiz_id: quizId, titre },
  })

export const trackQuizComplete = (
  quizId: string,
  titre: string,
  score: number,
  totalScore: number,
  durationSeconds: number,
) =>
  trackActivity({
    activity_type: "quiz",
    action: "complete",
    duration_seconds: durationSeconds,
    score,
    total_score: totalScore,
    metadata: { quiz_id: quizId, titre },
  })

export const trackObject3DView = (labItemId: string, nom: string, category: string) =>
  trackActivity({
    activity_type: "objet3d",
    action: "view",
    metadata: { lab_item_id: labItemId, nom, category },
  })
