import { EleveActivite } from '../../../../types/Eleve/EleveActivite'; // Adjust the path as needed

interface Props {
  data: EleveActivite[];
  onSelectEleve: (eleve: EleveActivite) => void;
}

export default function InactiveEleves({ data, onSelectEleve }: Props) {
  const inactifs = data.filter((el) => el.total === 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">😴 Élèves Inactifs</h2>
      {inactifs.length === 0 ? (
        <p className="text-gray-500">Tous les élèves ont participé récemment.</p>
      ) : (
        <ul className="space-y-1">
          {inactifs.map((el) => (
            <li
              key={el.id}
              onClick={() => onSelectEleve(el)}
              className="cursor-pointer hover:bg-gray-100 px-2 py-1 text-gray-700"
            >
              {el.name} — {el.classe}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
