'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import {
  Users,
  Atom,
  FlaskConical,
  Trash2,
  FileText,
  UploadCloud,
} from 'lucide-react';

import CardStat from '../../../ui/CardStat';
import TopEleves from './TopEleves';
import EleveDetail from './EleveDetail';

type Classe = { id: string; code_classe: string; niveau: string };
type Eleve = { id: string; name: string; surname: string; email: string };
type EleveActivite = {
  id: string;
  name: string;
  classe: string;
  quiz: number;
  simulation: number;
  total_score: number;
};

export default function ProfClasseView() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<string | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [quizCount, setQuizCount] = useState(0);
  const [lab3DCount, setLab3DCount] = useState(0);
  const [experienceCount, setExperienceCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [parEleve, setParEleve] = useState<EleveActivite[]>([]);
  const [selectedEleve, setSelectedEleve] = useState<EleveActivite | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const selectedClasse = classes.find(c => c.id === selectedClasseId);
  const selectedClasseCode = selectedClasse?.code_classe;
  const selectedClasseNiveau = selectedClasse?.niveau;

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('mes_classes').select('*');
      if (error || !Array.isArray(data)) {
        toast.error("❌ Impossible de charger les classes", {
          description: error?.message || "Erreur inconnue",
        });
        return;
      }

      setClasses(data);
      if (data.length) setSelectedClasseId(data[0].id);
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClasseId) return;

    const fetchDetails = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: elevesData } = await supabase
        .from('eleves_classes')
        .select('eleve_id, profiles(id, name, surname, email)')
        .eq('classe_id', selectedClasseId);

      const mappedEleves = elevesData?.map((e: any) => ({
        id: e.profiles.id,
        name: e.profiles.name,
        surname: e.profiles.surname,
        email: e.profiles.email,
      })) || [];

      setEleves(mappedEleves);

      const classe = classes.find((c) => c.id === selectedClasseId);

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('user_id, type')
        .in('user_id', mappedEleves.map((e) => e.id))
        .gte('created_at', since.toISOString());

      const eleveMap: Record<string, EleveActivite> = {};
      for (let el of mappedEleves) {
        eleveMap[el.id] = {
          id: el.id,
          name: `${el.name} ${el.surname}`,
          classe: classe?.code_classe || 'Inconnue',
          quiz: 0,
          simulation: 0,
          total_score: 0,
        };
      }

      logs?.forEach((log) => {
        const el = eleveMap[log.user_id];
        if (el) {
          if (log.type === 'quiz') el.quiz++;
          if (log.type === 'simulation') el.simulation++;
          el.total_score++;
        }
      });

      setParEleve(Object.values(eleveMap));
    };

    fetchDetails();
  }, [selectedClasseId]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedClasseCode || !selectedClasseNiveau) return;

      // ✅ Vue avec code_classe[] pour quiz
      const { count: quizCount, error: quizErr } = await supabase
        .from('vue_quiz_details')
        .select('*', { count: 'exact', head: true })
        .contains('code_classe', [selectedClasseCode]);

      if (quizErr) console.error('Erreur quiz:', quizErr);
      setQuizCount(quizCount || 0);

      // ✅ Vue avec code_classe[] pour simulations
      const { count: expCount, error: expErr } = await supabase
        .from('vue_experience_details')
        .select('*', { count: 'exact', head: true })
        .contains('code_classe', [selectedClasseCode]);

      if (expErr) console.error('Erreur expériences:', expErr);
      setExperienceCount(expCount || 0);

      // ✅ Vue avec code_classe[] pour lab items
      const { count: labCount, error: labErr } = await supabase
        .from('vue_lab_items_details')
        .select('*', { count: 'exact', head: true })
        .contains('code_classe', [selectedClasseCode]);

      if (labErr) console.error('Erreur lab3D:', labErr);
      setLab3DCount(labCount || 0);
    };

    fetchStats();
  }, [selectedClasseCode, selectedClasseNiveau]);

  const handleRemoveEleve = async (eleveId: string) => {
    const { error } = await supabase
      .from('eleves_classes')
      .delete()
      .eq('eleve_id', eleveId)
      .eq('classe_id', selectedClasseId);

    if (error) toast.error("Erreur suppression");
    else {
      toast.success("Élève retiré");
      setEleves((prev) => prev.filter((e) => e.id !== eleveId));
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data as string, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setParsedData(json as any[]);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!parsedData.length || !selectedClasseId) return;
    setLoading(true);
    let success = 0;

    for (const row of parsedData) {
      const { email } = row;

      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (user) {
        const { error } = await supabase.from('eleves_classes').insert({
          eleve_id: user.id,
          classe_id: selectedClasseId,
        });

        if (!error) success++;
      }
    }

    setParsedData([]);
    setLoading(false);
    toast.success(`${success} élève(s) importé(s)`);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-indigo-800">Mes Classes</h1>

      <div>
        <label className="text-x font-semibold text-gray-600">Classe : </label>
        <select
          onChange={(e) => setSelectedClasseId(e.target.value)}
          value={selectedClasseId ?? ''}
          className="mt-1 px-3 py-1 border rounded text-x font-semibold bg-white text-indigo-600"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code_classe}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardStat label="Élèves" count={eleves.length} icon={<Users className="h-6 w-6" />} />
        <CardStat label="Expériences" count={experienceCount} icon={<FlaskConical className="h-6 w-6" />} />
        <CardStat label="Quiz" count={quizCount} icon={<FileText className="h-6 w-6" />} />
        <CardStat label="Objets 3D" count={lab3DCount} icon={<Atom className="h-6 w-6" />} />
      </div>

      <div className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">👥 Élèves</h2>
        <div className='flex flex-wrap gap-4'>
          <input type="file" accept=".xlsx" onChange={handleImportFile} className="text-sm" />
          <button
            onClick={handleImport}
            disabled={parsedData.length === 0 || loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded text-sm"
          >
            <UploadCloud size={16} />
            Importer élèves
          </button>
        </div>

        <ul className="divide-y text-sm">
          {eleves.map((el) => (
            <li key={el.id} className="py-2 flex justify-between items-center">
              <div>
                {el.name} {el.surname} <span className="text-gray-400 italic">({el.email})</span>
              </div>
              <button onClick={() => handleRemoveEleve(el.id)} className="text-red-600 hover:text-red-800">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <TopEleves data={parEleve} onSelectEleve={setSelectedEleve} />
      {selectedEleve && <EleveDetail eleve={selectedEleve} onClose={() => setSelectedEleve(null)} />}
    </div>
  );
}
