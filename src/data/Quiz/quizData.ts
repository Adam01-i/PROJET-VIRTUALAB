import type { Quiz } from '../../types/Quiz/quiz';

export const quizData: Quiz[] = [
  {
    id: '1',
    titre: 'Les réactions acido-basiques',
    description: 'Testez vos connaissances sur les réactions entre acides et bases, le pH et les indicateurs colorés.',
    niveau: 'Intermédiaire',
    duree: '30 min',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    questions: [
      {
        id: '1',
        question: "Quelle est la définition d'un acide selon Brønsted-Lowry ?",
        options: [
          "Une espèce qui peut céder un proton H+",
          "Une espèce qui peut accepter un proton H+",
          "Une espèce qui peut céder un électron",
          "Une espèce qui peut accepter un électron"
        ],
        correctAnswer: 0,
        explanation: "Selon la théorie de Brønsted-Lowry, un acide est une espèce chimique capable de céder un proton H+ (donneur de proton)."
      },
      {
        id: '2',
        question: "Le pH d'une solution neutre à 25°C est :",
        options: [
          "0",
          "7",
          "14",
          "Dépend de la concentration"
        ],
        correctAnswer: 1,
        explanation: "À 25°C, une solution est neutre lorsque son pH est égal à 7, c'est-à-dire lorsque [H3O+] = [HO-] = 10^-7 mol/L."
      },
      {
        id: '3',
        question: "Quel est le pH d'une solution d'acide chlorhydrique à 0,01 mol/L ?",
        options: [
          "1",
          "2",
          "3",
          "4"
        ],
        correctAnswer: 1,
        explanation: "Pour un acide fort comme HCl, pH = -log[H3O+] = -log(0,01) = 2"
      }
    ]
  },
  {
    id: '2',
    titre: 'Équilibres chimiques',
    description: 'Comprendre les équilibres chimiques et le principe de Le Chatelier.',
    niveau: 'Avancé',
    duree: '45 min',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
    questions: [
      {
        id: '1',
        question: "Que se passe-t-il lorsqu'on augmente la température d'un équilibre exothermique ?",
        options: [
          "L'équilibre se déplace vers les produits",
          "L'équilibre se déplace vers les réactifs",
          "L'équilibre ne change pas",
          "La réaction s'arrête"
        ],
        correctAnswer: 1,
        explanation: "Selon le principe de Le Chatelier, l'augmentation de température favorise le sens endothermique de la réaction, donc déplace l'équilibre vers les réactifs pour une réaction exothermique."
      }
    ]
  }
];