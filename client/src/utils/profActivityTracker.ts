import { supabase } from "../lib/supabaseClient"

export interface ProfessorActivityData {
  activity_type: "simulation" | "quiz" | "objet3d"
  action: "create" | "update" | "delete"
  metadata?: any
}

export const trackProfessorActivity = async (activityData: ProfessorActivityData): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn("Professeur non connecté - activité non trackée")
      return
    }

    // Utiliser exactement les colonnes de la table
    const logData = {
      user_id: user.id,
      activity_type: activityData.activity_type,
      action: activityData.action,
      metadata: activityData.metadata || {},
      created_at: new Date().toISOString(),
    }

    console.log("Tentative d'insertion:", logData)

    const { error } = await supabase.from("activity_logs").insert([logData])

    if (error) {
      console.error("Erreur lors du tracking professeur:", error)
    } else {
      console.log("✅ Activité professeur trackée:", activityData)
    }
  } catch (error) {
    console.error("Erreur tracking professeur:", error)
  }
}

// Fonctions spécifiques pour les expériences
export const trackExperienceCreate = (experienceId: string, titre: string) =>
  trackProfessorActivity({
    activity_type: "simulation",
    action: "create",
    metadata: { experience_id: experienceId, titre },
  })

export const trackExperienceUpdate = (experienceId: string, titre: string) =>
  trackProfessorActivity({
    activity_type: "simulation",
    action: "update",
    metadata: { experience_id: experienceId, titre },
  })

export const trackExperienceDelete = (experienceId: string, titre: string) =>
  trackProfessorActivity({
    activity_type: "simulation",
    action: "delete",
    metadata: { experience_id: experienceId, titre },
  })

// Fonctions spécifiques pour les quiz
export const trackQuizCreate = (quizId: string, titre: string) =>
  trackProfessorActivity({
    activity_type: "quiz",
    action: "create",
    metadata: { quiz_id: quizId, titre },
  })

export const trackQuizUpdate = (quizId: string, titre: string) =>
  trackProfessorActivity({
    activity_type: "quiz",
    action: "update",
    metadata: { quiz_id: quizId, titre },
  })

export const trackQuizDelete = (quizId: string, titre: string) =>
  trackProfessorActivity({
    activity_type: "quiz",
    action: "delete",
    metadata: { quiz_id: quizId, titre },
  })

// Fonctions spécifiques pour les objets 3D
export const trackObject3DCreate = (itemId: string, nom: string) =>
  trackProfessorActivity({
    activity_type: "objet3d",
    action: "create",
    metadata: { lab_item_id: itemId, nom },
  })

export const trackObject3DUpdate = (itemId: string, nom: string) =>
  trackProfessorActivity({
    activity_type: "objet3d",
    action: "update",
    metadata: { lab_item_id: itemId, nom },
  })

export const trackObject3DDelete = (itemId: string, nom: string) =>
  trackProfessorActivity({
    activity_type: "objet3d",
    action: "delete",
    metadata: { lab_item_id: itemId, nom },
  })
