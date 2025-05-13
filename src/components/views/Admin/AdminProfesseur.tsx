import * as React from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function AdminProfesseur() {
  const [loading, setLoading] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<any[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setParsedData(json as any[]);
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("Aucun professeur à importer.");
      return;
    }
  
    setLoading(true);
  
    for (const row of parsedData) {
      const { name, surname, email } = row;
  
      try {
        const response = await fetch('/api/import-professeurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, surname, email }),
        });
        
  
        const result = await response.json();
  
        if (!response.ok) {
          console.error('Erreur API:', result); // 👈 Ajout ici
          toast.error(`Erreur : ${email} (${result.error})`);
        } else {
          toast.success(`✅ ${email} ajouté`);
        }
      } catch (err) {
        console.error('Erreur réseau ou serveur :', err); // 👈 Important
        toast.error(`Erreur serveur pour ${email}`);
      }
    }
  
    setLoading(false);
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Importer les Professeurs</h1>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="mb-4"
      />

      <button
        onClick={handleImport}
        disabled={loading || parsedData.length === 0}
        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
      >
        {loading ? "Importation en cours..." : "Importer les comptes"}
      </button>

      {parsedData.length > 0 && (
        <div className="mt-6 text-sm text-gray-700">
          <p><strong>Prévisualisation :</strong></p>
          <ul className="list-disc pl-4">
            {parsedData.slice(0, 5).map((row, i) => (
              <li key={i}>{row.name} {row.surname} - {row.email}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
