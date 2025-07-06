import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { toast } from "sonner";
type Props = {
  role: "eleve" | "professeur";
  refresh: () => void;
};

const UserFormDialog: React.FC<Props> = ({ role, refresh }) => {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    surname: "",
    email: "",
  });

const handleCreate = async () => {
  const { name, surname, email } = form;
  const roleFinal = role;

  if (!name || !surname || !email) {
    toast.warning("Tous les champs sont requis.");
    return;
  }

  const emailClean = email.trim().toLowerCase();

  const avatar_url =
    roleFinal === "eleve"
      ? "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1747586536054.jpg"
      : "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1747523215141.png";

  try {
    // ✅ Appel à l'API backend avec tous les champs nécessaires
    const res = await fetch("http://localhost:3001/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailClean,
        password: "virtualab2025!",
        name,
        surname,
        role: roleFinal,
        avatar_url,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      if (result.user_id) {
        toast.error("Utilisateur corrompu. Supprimez-le manuellement dans Supabase.", {
          description: `ID utilisateur : ${result.user_id}`,
        });
      } else {
        toast.error("Erreur création utilisateur", {
          description: result.error,
        });
      }
      return;
    }

    toast.success(`${roleFinal === "eleve" ? "Élève" : "Professeur"} ajouté avec succès !`);
    setForm({ name: "", surname: "", email: "" });
    setOpen(false);
    refresh();
  } catch (error) {
    console.error("❌ Erreur lors de la création :", error);
    toast.error("Erreur inattendue lors de la création de l'utilisateur.");
  }
};



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700">
          + Ajouter un {role === "eleve" ? "élève" : "professeur"}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg space-y-4">
        <h3 className="text-xl font-bold">
          Ajouter un {role === "eleve" ? "élève" : "professeur"}
        </h3>

        <div className="space-y-2">
          <label className="text-sm font-medium block">Nom</label>
          <input
            type="text"
            placeholder="Nom"
            className="w-full border px-3 py-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className="text-sm font-medium block">Prénom</label>
          <input
            type="text"
            placeholder="Prénom"
            className="w-full border px-3 py-2 rounded"
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
          />

          <label className="text-sm font-medium block">Email</label>
          <input
            type="email"
            placeholder="Email"
            className="w-full border px-3 py-2 rounded"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label className="text-sm font-medium block">Rôle</label>
          <input
            type="text"
            value={role === "eleve" ? "Élève" : "Professeur"}
            readOnly
            disabled
            className="w-full bg-gray-100 border px-3 py-2 rounded cursor-not-allowed text-gray-700"
          />
        </div>

        <Button
          onClick={handleCreate}
          className="bg-indigo-600 text-white hover:bg-indigo-700 w-full"
        >
          Créer
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
