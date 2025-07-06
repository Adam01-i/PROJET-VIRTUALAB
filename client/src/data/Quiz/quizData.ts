import type { Quiz } from '../../types/Quiz/quiz';

export const quizData: Quiz[] = [
  {
    id: '1', 
    classe_id: '',
    auteur_id: '',
    titre: 'Les réactions acido-basiques',
    description: 'Testez vos connaissances sur les réactions entre acides et bases, le pH et les indicateurs colorés.',
    duree: '30 min',
    image: '/public/assets/quiz/quiz-reaction-acido-basique.png', // ✅ Remplacée
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
      },
      {
        id: '4',
        question: "Quel est le rôle d'un indicateur de pH ?",
        options: [
          "Changer de couleur en fonction du pH",
          "Augmenter la concentration en acides",
          "Réduire le pH de la solution",
          "Augmenter la concentration en bases"
        ],
        correctAnswer: 0,
        explanation: "Les indicateurs de pH changent de couleur en fonction du pH de la solution, ce qui permet de déterminer si une solution est acide ou basique."
      },
      {
        id: '5',
        question: "Laquelle des propositions suivantes décrit un acide fort ?",
        options: [
          "Un acide qui se dissocie complètement dans l'eau",
          "Un acide qui se dissocie partiellement",
          "Un acide qui ne se dissocie pas dans l'eau",
          "Un acide qui est uniquement présent sous forme gazeuse"
        ],
        correctAnswer: 0,
        explanation: "Un acide fort est un acide qui se dissocie complètement dans l'eau, comme l'acide chlorhydrique (HCl)."
      }
    ]
  },
  {
    id: '2',
    classe_id: '',
    auteur_id: '',
    titre: 'Équilibres chimiques',
    description: 'Comprendre les équilibres chimiques et le principe de Le Chatelier.',
    duree: '45 min',
    image: '/public/assets/quiz/quiz-equilibre-chimique.png', // ✅ Remplacée
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
      },
      {
        id: '2',
        question: "Quel est le principe de Le Chatelier ?",
        options: [
          "Lorsqu'un système en équilibre subit une perturbation, il réagit pour contrer cette perturbation.",
          "Lorsqu'un système en équilibre subit une perturbation, il réagit en augmentant la température.",
          "Lorsqu'un système en équilibre subit une perturbation, il réagit en augmentant la pression.",
          "Lorsqu'un système en équilibre subit une perturbation, il réagit en augmentant la concentration des réactifs."
        ],
        correctAnswer: 0,
        explanation: "Le principe de Le Chatelier stipule qu'un système en équilibre chimique réagit à toute perturbation pour minimiser l'effet de cette perturbation."
      },
      {
        id: '3',
        question: "Quel effet l'augmentation de la pression a-t-elle sur un équilibre chimique ?",
        options: [
          "Elle favorise le sens de la réaction qui diminue le nombre de molécules",
          "Elle favorise le sens de la réaction qui augmente le nombre de molécules",
          "Elle n'a aucun effet",
          "Elle favorise les réactions exothermiques"
        ],
        correctAnswer: 0,
        explanation: "L'augmentation de la pression favorise la réaction qui diminue le nombre de molécules gazeuses, selon le principe de Le Chatelier."
      },
      {
        id: '4',
        question: "Que se passe-t-il lorsqu'on ajoute un catalyseur à une réaction chimique ?",
        options: [
          "La vitesse de réaction augmente",
          "La vitesse de réaction diminue",
          "Le catalyseur réagit avec les réactifs",
          "Le catalyseur modifie l'équilibre"
        ],
        correctAnswer: 0,
        explanation: "Un catalyseur augmente la vitesse d'une réaction chimique sans être consommé au cours de la réaction."
      },
      {
        id: '5',
        question: "Un équilibre chimique est dit dynamique lorsqu'il :",
        options: [
          "Les concentrations des réactifs et des produits sont constantes, mais les réactions continuent.",
          "Les réactions sont arrêtées.",
          "Il y a une phase de formation de nouveaux produits.",
          "Les réactifs sont complètement transformés en produits."
        ],
        correctAnswer: 0,
        explanation: "Dans un équilibre dynamique, les concentrations des réactifs et des produits restent constantes, mais les réactions directes et inverses se produisent à la même vitesse."
      }
    ]
  },
  {
    id: '3',
    classe_id: '',
    auteur_id: '',
    titre: 'La thermodynamique',
    description: 'Testez vos connaissances sur les principes de la thermodynamique et les changements d\'énergie.',
    duree: '40 min',
    image: '/public/assets/quiz/quiz-equilibre-chimique.png', // ✅ Remplacée
    questions: [
      {
        id: '1',
        question: "Quel est le principe de la première loi de la thermodynamique ?",
        options: [
          "L'énergie ne peut être ni créée ni détruite, seulement transformée.",
          "L'énergie peut être créée à partir de rien.",
          "L'énergie d'un système est toujours constante.",
          "L'énergie se conserve uniquement dans les systèmes ouverts."
        ],
        correctAnswer: 0,
        explanation: "La première loi de la thermodynamique stipule que l'énergie totale de l'univers est constante, elle ne peut être ni créée ni détruite, mais seulement transformée."
      },
      {
        id: '2',
        question: "Qu'est-ce que l'entropie ?",
        options: [
          "Une mesure du désordre dans un système.",
          "Une mesure de l'énergie utile dans un système.",
          "La quantité d'énergie produite lors d'une réaction chimique.",
          "La capacité d'un système à faire du travail."
        ],
        correctAnswer: 0,
        explanation: "L'entropie est une mesure du désordre ou du manque d'information dans un système."
      },
      {
        id: '3',
        question: "Lors d'une réaction exothermique, l'énergie :",
        options: [
          "Est libérée sous forme de chaleur.",
          "Est absorbée sous forme de chaleur.",
          "Reste inchangée.",
          "Augmente la température du réactif."
        ],
        correctAnswer: 0,
        explanation: "Une réaction exothermique libère de l'énergie sous forme de chaleur."
      },
      {
        id: '4',
        question: "Quel est le signe de la variation d'enthalpie (ΔH) pour une réaction endothermique ?",
        options: [
          "Positif",
          "Négatif",
          "Nul",
          "Indéterminé"
        ],
        correctAnswer: 0,
        explanation: "Lors d'une réaction endothermique, l'enthalpie (ΔH) est positive car la réaction absorbe de l'énergie."
      },
      {
        id: '5',
        question: "Que représente l'énergie libre de Gibbs (ΔG) ?",
        options: [
          "La capacité d'un système à réaliser un travail.",
          "La quantité d'énergie nécessaire pour démarrer une réaction.",
          "L'énergie dissipée lors d'une réaction.",
          "L'énergie absorbée pendant une réaction."
        ],
        correctAnswer: 0,
        explanation: "L'énergie libre de Gibbs permet de déterminer si une réaction est spontanée ou non en fonction de l'enthalpie et de l'entropie du système."
      }
    ]
  },
  {
    id: '4',
    classe_id: '',
    auteur_id: '',
    titre: 'Les solutions',
    description: 'Testez vos connaissances sur les solutions et leur préparation.',
    duree: '30 min',
    image: '/public/assets/quiz/quiz-solutions.png', // ✅ Remplacée
    questions: [
      {
        id: '1',
        question: "Que signifie la concentration molaire d'une solution ?",
        options: [
          "Le nombre de moles de soluté par litre de solution.",
          "La quantité de soluté dans une solution.",
          "Le volume de la solution.",
          "La température de la solution."
        ],
        correctAnswer: 0,
        explanation: "La concentration molaire (ou molarité) d'une solution est le nombre de moles de soluté dissoutes dans un litre de solution."
      },
      {
        id: '2',
        question: "Comment préparer une solution de concentration donnée ?",
        options: [
          "En dissolvant une quantité spécifique de soluté dans un volume d'eau.",
          "En chauffant la solution.",
          "En ajoutant de l'eau au soluté jusqu'à dissolution complète.",
          "En ajoutant plus de soluté sans modifier le volume."
        ],
        correctAnswer: 0,
        explanation: "Pour préparer une solution de concentration donnée, il faut dissoudre une quantité précise de soluté dans un volume d'eau déterminé."
      },
      {
        id: '3',
        question: "Un soluté est dit soluble lorsque :",
        options: [
          "Il se dissout facilement dans le solvant.",
          "Il forme un précipité.",
          "Il reste sous forme solide.",
          "Il ne se dissout jamais dans un solvant."
        ],
        correctAnswer: 0,
        explanation: "Un soluté est soluble s'il peut se dissoudre dans un solvant, formant une solution homogène."
      },
      {
        id: '4',
        question: "Lequel des suivants est un exemple de solution aqueuse ?",
        options: [
          "L'eau salée.",
          "Le gaz comprimé.",
          "L'alcool pur.",
          "L'huile d'olive."
        ],
        correctAnswer: 0,
        explanation: "Une solution aqueuse est une solution dans laquelle l'eau est le solvant, comme l'eau salée."
      },
      {
        id: '5',
        question: "Qu'est-ce qu'une solution saturée ?",
        options: [
          "Une solution qui ne peut plus dissoudre de soluté.",
          "Une solution qui est complètement diluée.",
          "Une solution qui contient moins de soluté qu'une solution saturée.",
          "Une solution qui a une température élevée."
        ],
        correctAnswer: 0,
        explanation: "Une solution saturée est une solution qui a dissous autant de soluté qu'il peut contenir à une température donnée."
      }
    ]
  },
  {
    id: '5',
    classe_id: '',
    auteur_id: '',
    titre: 'La chimie organique',
    description: 'Testez vos connaissances sur la chimie organique et ses différentes familles de composés.',
    duree: '50 min',
    image: '/public/assets/quiz/quiz-chimie-organique.png', // ✅ Remplacée
    questions: [
      {
        id: '1',
        question: "Quel groupe fonctionnel est présent dans les alcools ?",
        options: [
          "Hydroxyde (-OH)",
          "Aldéhyde (-CHO)",
          "Amine (-NH2)",
          "Carboxyle (-COOH)"
        ],
        correctAnswer: 0,
        explanation: "Les alcools contiennent un groupe fonctionnel hydroxyde (-OH) lié à un carbone saturé."
      },
      {
        id: '2',
        question: "Quel est l'alcène le plus simple ?",
        options: [
          "Éthylène",
          "Propyne",
          "Butane",
          "Méthane"
        ],
        correctAnswer: 0,
        explanation: "L'alcène le plus simple est l'éthylène (C2H4), qui contient une double liaison entre deux atomes de carbone."
      },
      {
        id: '3',
        question: "Les acides carboxyliques contiennent quel groupe fonctionnel ?",
        options: [
          "Carboxyle (-COOH)",
          "Hydroxyde (-OH)",
          "Aldéhyde (-CHO)",
          "Amine (-NH2)"
        ],
        correctAnswer: 0,
        explanation: "Les acides carboxyliques contiennent un groupe fonctionnel carboxyle (-COOH)."
      },
      {
        id: '4',
        question: "Quel est le nom de l'hydrocarbure contenant uniquement des liaisons simples entre atomes de carbone ?",
        options: [
          "Alcane",
          "Alcène",
          "Alcyne",
          "Alcool"
        ],
        correctAnswer: 0,
        explanation: "Les alcanes sont des hydrocarbures qui ne contiennent que des liaisons simples entre les atomes de carbone."
      },
      {
        id: '5',
        question: "Lequel des suivants est un exemple d'aldéhyde ?",
        options: [
          "Formaldéhyde",
          "Acétone",
          "Éthanol",
          "Butanol"
        ],
        correctAnswer: 0,
        explanation: "Le formaldéhyde est un exemple d'aldéhyde, caractérisé par un groupe fonctionnel -CHO."
      }
    ]
  }
];
