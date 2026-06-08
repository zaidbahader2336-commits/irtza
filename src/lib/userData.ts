import { User, MCQ, ShortQuestion, LongQuestion, ExamPaper, Story, Letter, TopicExplanation } from '../types';

// Real academic questions on Concentric Zone Model by Ahmed Raza (A-Level / University)
const DEFAULT_MCQS: MCQ[] = [
  {
    question: "Which urban zone in Ernest Burgess's Concentric Zone Model is characterized as an area of active residential deterioration and invading light manufacture?",
    options: [
      "Zone 1: Central Business District",
      "Zone 2: Transition Zone",
      "Zone 3: Working-Class Residential Zone",
      "Zone 4: High-Class Residential Belt"
    ],
    correctIndex: 1,
    explanation: "Zone 2 (the Transition Zone) is situated between the CBD and working-class housing. It experiences constant encroachment of light industries and business, leading to physical deterioration and high rental turn-overs."
  },
  {
    question: "Which transportation-based geographic dynamic acts as a critical modern limitation to Ernest Burgess's concentric circle geometry?",
    options: [
      "Unidirectional high-speed arterial transit corridors",
      "Homogeneous isotopic land-plain topography",
      "Universal pedestrian movement assumptions",
      "Localized high-rise zoning restrictions"
    ],
    correctIndex: 0,
    explanation: "Burgess assumed uniform land plain and isotropic transport. Real-world high-speed rail lines and major highways distort circles into sector-like radial configurations along transport corridors."
  },
  {
    question: "Under the bid-rent geographic framework, why do commercial banking services aggressively outbid other land uses in the innermost Core Ring?",
    options: [
      "They require minimal real-estate infrastructure footprint",
      "They exhibit steep transport-utility gradients per unit of space",
      "Local municipal zoning codes mandate central banking slots",
      "Peripheral residents prefer remote offline digital banking"
    ],
    correctIndex: 1,
    explanation: "Commercial enterprises derive highly intense utility from maximum accessibility inside the core CBD, leading to an extremely steep bid-rent curve compared to residential or agricultural models."
  }
];

const DEFAULT_SHORTS: ShortQuestion[] = [
  {
    question: "Outline the operational role of localized land-form friction when defining Burgess's asymmetrical concentric boundaries.",
    modelAnswer: "Localized landscape friction (such as rivers, mountain ranges, or artificial barriers like railway lines) physical blocks outward residential expansion. It increases commuting times and structural costs, warping Burgess's idealized concentric circles into highly asymmetrical, distorted urban boundaries."
  },
  {
    question: "Define Burgess's 'Zone of Transition' and identify two socio-economic symptoms commonly associated with it.",
    modelAnswer: "The Transition Zone (Zone 2) is a ring surrounding the CBD. It is characterized by housing deterioration and invading commercial activities. Two social symptoms associated with it are high residential mobility (transient populations) and high ratios of poverty with low spatial social stability."
  },
  {
    question: "In urban geography, how does the Concentric Zone Model differ fundamentally from Hoyt's Sector Model regarding transit lines?",
    modelAnswer: "Burgess's model assumes isotropic transportation (uniform accessibility in all directions), creating concentric rings. Hoyt's Sector Model recognizes transport corridors (major arterial roads and rail lines) that carry growth outward, stretching circle rings into pie-shaped sectors."
  }
];

const DEFAULT_LONGS: LongQuestion[] = [
  {
    question: "Critique the structural evolution of polycentric regional clusters under the influence of modern rapid transit systems. How does this challenge land-use assumptions in Burgess's Concentric Zone Model?",
    modelAnswer: "A critique of classical urban models reveals that Burgess's Concentric Zone Model relies on a monocentric assumption where all employment and civic activities are clustered exclusively in a singular Central Business District (CBD). Modern regional clusters depart from this geometry by forming polycentric nodes connected by rapid transit lines. These high-speed rail systems and highway corridors compress travel time across space, allowing secondary business hubs (edge cities) to develop far outside the core transition frame. This decentralizes bid-rent pressures, replaces contiguous circular rings with distributed specialized nodes, and creates multi-nucleated patterns that cannot be encompassed by an isotropic concentric model.",
    keyPoints: [
      "Deconstructs the monocentric CBD assumption",
      "Analyzes the impact of high-speed commuting infrastructure",
      "Applies modern polycentric bid-rent curves",
      "Contrasts Burgess monocentricity with multinucleated networks"
    ]
  },
  {
    question: "Examine the dynamic of ecological invasion and succession as applied by Ernest Burgess to explain urban residential sorting.",
    modelAnswer: "Ernest Burgess adapted plant ecology concepts of 'invasion' and 'succession' to human society. As the central business core (Zone A) grows, its commercial and light-industrial activities physically expand into the adjacent Transition Zone (Zone B). Simultaneously, incoming immigrant clusters colonize Zone B, while current inhabitants of Zone B migrate outward to Zone C (Working-Class Zone) to escape deterioration. This outward wave-like succession causes consecutive concentric rings to shift boundaries over time.",
    keyPoints: [
      "Defines ecological invasion & succession",
      "Traces outward movement of socio-economic classes",
      "Explains spatial shifts in physical boundaries over decades"
    ]
  },
  {
    question: "Evaluate the generalizability of the bid-rent theory across contemporary Global South mega-cities under high-density spatial constraints.",
    modelAnswer: "Bid-rent theory assumes a monocentric city with commercial functions dominating the center. In many Global South mega-cities, rapid population growth, high spatial densities, and informal settlements disrupt these bid-rent dynamics. Center-periphery gradients are inverted or fractured by high-density informal slum clusters occupying high-value central land or peripheral luxury enclaves. Thus, simplistic bid-rent curves fail to model these dualistic, highly fragmented urban fabrics.",
    keyPoints: [
      "Inverted center-periphery gradients",
      "Impact of informal settlements on classic bid-rent",
      "Socio-spatial dualism and extreme density boundaries"
    ]
  }
];

const DEFAULT_EXPLANATION: TopicExplanation = {
  title: "The Concentric Zone Model & Urban Ecology",
  summary: "Ernest Burgess's 1925 Concentric Zone Model was the first structural framework to describe the distribution of social groups within urban environments. Drawing on ecological metaphors, Burgess conceptualized the city as a dynamic organism growing outwardly from a central core in a series of five concentric rings.",
  keyConcepts: [
    "Monocentric central business district focus",
    "Transition zone of decay and rapid demographic succession",
    "Isotropic transport assuming equal access in all directions",
    "Bid-rent curve modeling land-value decay with distance"
  ],
  analogy: "Think of the Concentric Zone Model like ripples in a pond after a stone is dropped. The stone represents the high-intensity CBD, and each outward ripple represents a ring of decreasing density and land-use intensity.",
  misconceptions: [
    "Cities grow in perfect circles (in reality, physical barriers and transport corridors distort circles into sectors or complex networks)",
    "The model describes all global cities (it has narrow applicability outside mid-20th-century North American industrial cities)"
  ],
  detailedExplanation: "Burgess divided the urban space into 5 zones: \n1. CBD (Central Business District): Center of commercial, cultural, and civic activity.\n2. Zone of Transition: An area of residential deterioration invaded by business and light industry; characterized by high-density tenements and transient immigrant workers.\n3. Zone of Independent Working-Men's Homes: Stable residential neighborhoods populated by blue-collar workers.\n4. Zone of Better Residences: Spacious middle-class single-family houses and local commercial centers.\n5. Commuters' Zone: Suburban, outward-lying commuter settlements with low density.",
  diagramDescription: "A central circle (1) nested inside four outer rings (2, 3, 4, 5) with expanding radial arrows."
};

const DEFAULT_STORY: Story = {
  title: "Echoes of the Loop",
  content: "In the shadow of Chicago's elevated rail, the transition region of Zone 2 hummed with dynamic friction. Millworkers and newly arrived scholars walked past the same red-brick tenements that Ernest Burgess sketched in his notebook. For generations, the outward pressure—the endless succession of socio-economic waves—had pushed residents from these tight brick rooms into the tree-lined avenues of the commuter belt. Spatial geometry was more than maps; it was physical gravity sorting dreams into concentric spheres of accessibility."
};

const DEFAULT_LETTER: Letter = {
  subject: "Memorandum Directive: Metropolitan Spatial Re-evaluation",
  body: "To: Senior Regional Analytics Division\n\nFollowing Ahmed Raza's re-examination of concentric land structures within the A-Level Urban Geography curriculum, we are issuing this formal guideline to update our geographical assessment metrics. Under modern density conditions, landscape travel friction exerts non-linear forces. Future models must account for infrastructural radial corridors."
};

const EXAM_PAPER: ExamPaper = {
  mcqs: DEFAULT_MCQS,
  shortQuestions: DEFAULT_SHORTS,
  longQuestions: DEFAULT_LONGS
};

const INITIAL_USER: User = {
  name: 'Ahmed Raza',
  gmail: 'raza.ahmed@university.edu',
  code: 'ZWR1Z2Vu',
  createdAt: Date.now(),
  data: {
    mcqs: [
      {
        data: DEFAULT_MCQS,
        timestamp: Date.now(),
        topic: 'Urban Geography — Concentric Zone Model'
      }
    ],
    shortQs: [
      {
        data: DEFAULT_SHORTS,
        timestamp: Date.now(),
        topic: 'Urban Geography — Concentric Zone Model'
      }
    ],
    longQs: [
      {
        data: DEFAULT_LONGS,
        timestamp: Date.now(),
        topic: 'Urban Geography — Concentric Zone Model'
      }
    ],
    exams: [
      {
        data: EXAM_PAPER,
        timestamp: Date.now(),
        topic: 'Urban Geography — Concentric Zone Model'
      }
    ],
    stories: [
      {
        data: DEFAULT_STORY,
        timestamp: Date.now(),
        topic: 'Urban Geography — Concentric Zone Model'
      }
    ],
    letters: [
      {
        data: DEFAULT_LETTER,
        timestamp: Date.now(),
        topic: 'Urban Geography — Concentric Zone Model'
      }
    ],
    explanations: [
      {
        data: DEFAULT_EXPLANATION,
        timestamp: Date.now(),
        topic: 'Urban Geography — Concentric Zone Model'
      }
    ]
  }
};

export const getOrCreateDefaultUser = (): User => {
  const saved = localStorage.getItem('edugen_app_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure name is updated to Ahmed Raza!
      if (parsed.name === 'EduGen Student' || !parsed.name) {
        parsed.name = 'Ahmed Raza';
        parsed.gmail = 'raza.ahmed@university.edu';
        localStorage.setItem('edugen_app_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      // Use fallback
    }
  }
  localStorage.setItem('edugen_app_user', JSON.stringify(INITIAL_USER));
  return INITIAL_USER;
};

export const saveToUserHistory = (
  type: 'mcqs' | 'shortQs' | 'longQs' | 'exams' | 'stories' | 'letters' | 'explanations',
  topic: string,
  data: any
) => {
  const currentUser = getOrCreateDefaultUser();
  const newItem = {
    data,
    topic,
    timestamp: Date.now()
  };

  currentUser.data[type] = [newItem, ...(currentUser.data[type] || [])];
  localStorage.setItem('edugen_app_user', JSON.stringify(currentUser));
};

export const getUserHistory = (): User => {
  return getOrCreateDefaultUser();
};

export const deleteHistoryItem = (type: string, timestamp: number): User => {
  const currentUser = getOrCreateDefaultUser();
  
  // @ts-ignore
  if (currentUser.data[type]) {
    // @ts-ignore
    currentUser.data[type] = currentUser.data[type].filter((item: any) => item.timestamp !== timestamp);
  }
  localStorage.setItem('edugen_app_user', JSON.stringify(currentUser));
  return currentUser;
};
