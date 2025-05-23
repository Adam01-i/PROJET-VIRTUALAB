'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

import {
  PlusCircle,
  Users,
  Atom,
  FlaskConical,
  Trash2,
  Loader2,
  FileText,
  UploadCloud,
} from 'lucide-react';

import CardStat from '../../../ui/CardStat';
import TopEleves from '../Dashboard/TopEleves';
import InactiveEleves from '../Dashboard/InactiveEleves';
import EleveDetail from '../Dashboard/EleveDetail';

type Classe = { id: string; code_classe: string; niveau: string };
type Eleve = { id: string; name: string; surname: string; email: string };
type Experience = { id: string; titre: string; niveau: string };
type EleveActivite = {
  id: string;
  name: string;
  classe: string;
  quiz: number;
  simulation: number;
  total: number;
};

export default function ProfClasseView() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<string | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [quizCount, setQuizCount] = useState(0);
  const [lab3DCount, setLab3DCount] = useState(0);
  const [emailToAdd, setEmailToAdd] = useState('');
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
      if (error) return toast.error("Erreur récupération classes");
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

      const { data: expData } = await supabase
        .from('experiences')
        .select('id, titre, niveau')
        .eq('classe_id', selectedClasseId);

      const mappedEleves = elevesData?.map((e: any) => ({
        id: e.profiles.id,
        name: e.profiles.name,
        surname: e.profiles.surname,
        email: e.profiles.email,
      })) || [];

      setEleves(mappedEleves);
      setExperiences(expData || []);

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
          total: 0,
        };
      }

      logs?.forEach((log) => {
        const el = eleveMap[log.user_id];
        if (el) {
          if (log.type === 'quiz') el.quiz++;
          if (log.type === 'simulation') el.simulation++;
          el.total++;
        }
      });

      setParEleve(Object.values(eleveMap));
    };

    fetchDetails();
  }, [selectedClasseId]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedClasseCode || !selectedClasseNiveau) return;

      // ✅ Compte les quiz via code_classe
      const { count: quizCount, error: quizErr } = await supabase
        .from('vue_quiz_details')
        .select('*', { count: 'exact', head: true })
        .eq('code_classe', selectedClasseCode);

      if (quizErr) console.error('Erreur quiz:', quizErr);
      setQuizCount(quizCount || 0);

      // ✅ Compte les objets 3D par niveau
      const { count: labCount, error: labErr } = await supabase
        .from('lab_items')
        .select('*', { count: 'exact', head: true })
        .eq('classe_id', selectedClasseId); // ✅ champ réel

      if (labErr) console.error('Erreur lab3D:', labErr);
      setLab3DCount(labCount || 0);

    };

    fetchStats();
  }, [selectedClasseCode, selectedClasseNiveau]);

  const handleAddEleve = async () => {
    if (!emailToAdd.trim()) return;
    setLoading(true);

    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailToAdd.trim())
      .single();

    if (!user) {
      toast.error("Élève introuvable avec cet email.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('eleves_classes').insert({
      eleve_id: user.id,
      classe_id: selectedClasseId,
    });

    if (error) toast.error("Échec de l'ajout");
    else {
      toast.success("Élève ajouté !");
      setEmailToAdd('');
    }

    setLoading(false);
  };

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
    <div className="p-8 space-y-10">
      <h1 className="text-3xl font-bold text-indigo-800">🎓 Gestion de mes classes</h1>

      {/* Sélecteur */}
      <div>
        <label className="text-sm font-semibold text-gray-600">Sélectionner une classe :</label>
        <select
          onChange={(e) => setSelectedClasseId(e.target.value)}
          value={selectedClasseId ?? ''}
          className="mt-1 px-3 py-1 border rounded text-sm bg-indigo-600 text-white"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code_classe}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <CardStat label="Élèves" count={eleves.length} icon={<Users className="h-6 w-6" />} />
        <CardStat label="Expériences" count={experiences.length} icon={<FlaskConical className="h-6 w-6" />} />
        <CardStat label="Quiz" count={quizCount} icon={<FileText className="h-6 w-6" />} />
        <CardStat label="Objets 3D" count={lab3DCount} icon={<Atom className="h-6 w-6" />} />
      </div>

      {/* Élèves */}
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

        <div className="mt-6 flex items-center gap-3">
          <input
            type="email"
            placeholder="Ajouter l’élève par email"
            value={emailToAdd}
            onChange={(e) => setEmailToAdd(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm"
          />
          <button
            onClick={handleAddEleve}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
            Ajouter
          </button>
        </div>
      </div>

      {/* Activité élève */}
      <TopEleves data={parEleve} onSelectEleve={setSelectedEleve} />
      <InactiveEleves data={parEleve} onSelectEleve={setSelectedEleve} />
      {selectedEleve && <EleveDetail eleve={selectedEleve} onClose={() => setSelectedEleve(null)} />}
    </div>
  );
}
