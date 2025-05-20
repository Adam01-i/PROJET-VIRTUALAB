interface Props {
  data: EleveActivite[];
  onSelectEleve: (eleve: EleveActivite) => void;
}
import { EleveActivite } from '../../../../types/EleveActivite'; // Adjust the path as needed

export default function TopEleves({ data, onSelectEleve }: Props) {
  const top5 = data
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">🏅 Top 5 Élèves</h2>
      <ul className="space-y-2">
        {top5.map((el, i) => (
          <li
            key={el.id}
            onClick={() => onSelectEleve(el)}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 flex justify-between text-gray-700"
          >
            <span>{i + 1}. {el.name}</span>
            <span>{el.total} activités</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
