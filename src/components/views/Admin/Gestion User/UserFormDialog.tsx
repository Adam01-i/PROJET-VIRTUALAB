import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "../../../ui/Dialog";
import { Button } from "../../../ui/button2";
import { toast } from "sonner";
import { supabase } from "../../../../lib/supabaseClient";

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
  const [error, setError] = React.useState("");

  const handleCreate = async () => {
    setError("");
    const { name, surname, email } = form;

    if (!name || !surname || !email) {
      setError("Tous les champs sont requis.");
      return;
    }

    // Vérifier si l'email existe déjà
    const { data: existing, error: emailCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase());

    if (emailCheckError) {
      toast.error("Erreur lors de la vérification de l'email");
      return;
    }

    if (existing && existing.length > 0) {
      setError("Cet email est déjà utilisé.");
      return;
    }

    const avatar_url =
      role === "eleve"
        ? "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1747586536054.jpg"
        : "https://dviccoqpvhriwxruxjby.supabase.co/storage/v1/object/public/avatars/1747523215141.png";

    const { error: insertError } = await supabase.from("profiles").insert([
      {
        name,
        surname,
        email: email.trim().toLowerCase(),
        role,
        avatar_url,
      },
    ]);

    if (insertError) {
      toast.error("Erreur lors de l'ajout de l'utilisateur", {
        description: insertError.message,
      });
    } else {
      toast.success(`${role === "eleve" ? "Élève" : "Professeur"} ajouté avec succès !`);
      setForm({ name: "", surname: "", email: "" });
      setOpen(false);
      refresh();
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
            value={role}
            disabled
            className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-600 cursor-not-allowed"
          />

          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
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
