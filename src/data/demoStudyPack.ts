import { StudyPack } from '../types/study';

export const DEMO_STUDY_PACK: StudyPack = {
  id: 'demo-ansoff-matrix',
  title: 'Ansoff Matrix (Strategic Growth Grid)',
  subject: 'Strategic Management & Marketing',
  createdAt: new Date().toISOString(),
  isDemo: true,
  isFavorite: true,
  sourceType: 'topic',
  sourceName: 'Core MBA Strategy Curriculum',
  
  summary: {
    quickRevision: [
      'Developed by H. Igor Ansoff in 1957; published in Harvard Business Review.',
      'A 2x2 strategic planning tool categorizing growth strategies by Products vs. Markets (Existing vs. New).',
      'Quadrant 1: Market Penetration (Existing Products in Existing Markets) - Lowest Risk.',
      'Quadrant 2: Product Development (New Products in Existing Markets) - Moderate Risk.',
      'Quadrant 3: Market Development (Existing Products in New Markets) - Moderate Risk.',
      'Quadrant 4: Diversification (New Products in New Markets) - Highest Risk.',
      'Diversification can be Related (concentric) or Unrelated (conglomerate).',
      'Risk increases progressively as firms move away from existing competencies.',
      'Used alongside SWOT, Porter\'s Five Forces, and BCG Matrix for corporate strategy.',
      'Key limitation: ignores competitor retaliation, financial constraints, and cost of capital.'
    ],
    examNotes: `The Ansoff Matrix is a fundamental 2x2 framework created by Igor Ansoff to evaluate corporate growth options based on whether an organization is dealing with existing or new products in existing or new markets.

1. Market Penetration: Focuses on increasing market share within current markets using current products. Achieved via aggressive pricing, loyalty schemes, enhanced sales promotion, and acquiring competitors. Lowest risk strategy because customer needs and competitive dynamics are well known.

2. Market Development: Entails exporting or pitching existing products to new customer segments or geographic territories. Requires new distribution channels, regional compliance, and market research.

3. Product Development: Creating new or modified offerings for existing loyal customers. Requires substantial R&D investment, brand equity leverage, and agile time-to-market.

4. Diversification: Entering entirely new product categories within unserved markets. Related diversification leverages core competencies (e.g., Apple moving from computers to smartphones); unrelated diversification enters separate industries (e.g., Virgin Atlantic, Virgin Records). Carries the highest risk of capital destruction.`,
    deepLearning: `In contemporary corporate strategy, the Ansoff Matrix serves as a portfolio decision-making model for allocating capital expenditure across organic and inorganic growth vectors.

Strategic Context:
Firms that focus strictly on Market Penetration eventually encounter saturation points defined by S-curves. For instance, Coca-Cola's classic cola market growth plateaued, forcing it to pursue Product Development (Diet Coke, Coke Zero) and Market Development (expanding to rural African & Asian markets), alongside Diversification (acquiring Costa Coffee).

Risk-Return Dynamics:
Empirical strategy studies indicate that Unrelated Diversification historically incurs a "conglomerate discount" on stock exchanges due to organizational friction and lack of managerial synergy, unless the corporate parent acts purely as a private equity allocator with superior governance.`,
    easyLanguageVersion: `Imagine you run a bakery:
1. Market Penetration: Selling more of your classic chocolate cookies to the same neighborhood by offering a "buy 2 get 1 free" deal. (Super safe!)
2. Market Development: Taking those same chocolate cookies and opening a new stall in the neighboring university campus. (Medium risk).
3. Product Development: Inventing a new gluten-free vegan cheesecake to sell to your existing neighborhood regulars. (Medium risk, need good recipes).
4. Diversification: Deciding to open a car repair shop across town with zero bakery connection. (Very high risk! You have to learn everything from scratch).`
  },

  keyPoints: [
    '2x2 Matrix: 2 axes (Markets and Products), each split into Existing and New.',
    'Market Penetration has the highest success probability (approx. 50-75% in practice).',
    'Product Development depends on customer trust and strong brand loyalty.',
    'Market Development requires deep cultural, demographic, and geographic customization.',
    'Diversification has historically the highest failure rate (~70-80%).',
    'Related diversification enjoys economies of scope; unrelated does not.',
    'Useful for bridging the gap between strategic vision and tactical marketing plans.',
    'Common exam trap: Confusing Product Development with simple packaging updates.'
  ],

  definitions: [
    {
      id: 'def-1',
      term: 'Market Penetration',
      definition: 'A growth strategy wherein a business focuses on selling its existing products into existing customer markets to increase overall market share.',
      example: 'Example: Netflix running festive discount promotions and improving user recommendation algorithms to retain and grow existing subscriber hours.',
      category: 'Ansoff Quadrant 1'
    },
    {
      id: 'def-2',
      term: 'Market Development',
      definition: 'A growth strategy that involves introducing existing products or services into new geographic markets, demographics, or customer segments.',
      example: 'Example: IKEA expanding into India and adjusting product sizing and materials to fit high-humidity local urban apartments.',
      category: 'Ansoff Quadrant 2'
    },
    {
      id: 'def-3',
      term: 'Product Development',
      definition: 'A growth strategy where a company develops and introduces new products or upgraded versions aimed at its existing customer base.',
      example: 'Example: Apple releasing the Apple Watch and AirPods to iPhone users who already trust the ecosystem.',
      category: 'Ansoff Quadrant 3'
    },
    {
      id: 'def-4',
      term: 'Diversification',
      definition: 'The riskiest growth strategy involving simultaneous expansion into both new products and unfamiliar markets.',
      example: 'Example: Alphabet (Google) creating Waymo to venture into autonomous self-driving vehicles.',
      category: 'Ansoff Quadrant 4'
    },
    {
      id: 'def-5',
      term: 'Synergy (2 + 2 = 5 Effect)',
      definition: 'The economic principle where the combined performance of two business units or strategies exceeds the sum of their individual components.',
      example: 'Example: Disney acquiring Pixar, allowing Pixar characters to fill Disney theme parks, consumer merchandise, and Disney+ streaming.',
      category: 'Corporate Strategy'
    }
  ],

  concepts: [
    {
      id: 'con-1',
      concept: 'The Risk Frontier in Ansoff',
      simpleExplanation: 'As you move diagonally from Market Penetration (bottom-left) to Diversification (top-right), both technical risk and commercial risk multiply exponentially.',
      example: 'A software company making a small feature update faces near-zero risk. The same company buying a shoe factory faces catastrophic operational risk.',
      whyItMatters: 'Executive boards use this to ensure they do not take on multiple high-risk diversification bets at the same time.',
      relatedConcepts: ['Risk Matrix', 'Portfolio Management', 'BCG Growth-Share Matrix']
    },
    {
      id: 'con-2',
      concept: 'Related vs. Unrelated Diversification',
      simpleExplanation: 'Related diversification stays within a known supply chain or customer overlap. Unrelated diversification enters completely alien industries.',
      example: 'Shoe manufacturer Nike making sports apparel (Related). Berkshire Hathaway owning railroads, insurance, candy, and furniture (Unrelated).',
      whyItMatters: 'Investors often discount conglomerates unless synergies are clearly unlocked through shared infrastructure.',
      relatedConcepts: ['Economies of Scope', 'Core Competencies', 'Horizontal Integration']
    },
    {
      id: 'con-3',
      concept: 'Cannibalization Risk in Product Development',
      simpleExplanation: 'When your newly introduced product steals sales directly from your own existing profitable products instead of competitors.',
      example: 'When Apple introduced the iPad Mini, it cannibalized sales of both the standard iPad and larger iPhones.',
      whyItMatters: 'New product launches must generate net-positive incremental margins, not just shuffle existing revenue.',
      relatedConcepts: ['Margin Erosion', 'Product Lifecycle', 'Customer Segmentation']
    }
  ],

  handwrittenNotes: [
    {
      id: 'note-1',
      heading: 'I. The Ansoff 2x2 Strategic Grid',
      subheading: 'H. Igor Ansoff (1957) - Father of Strategic Management',
      content: `• Matrix Axes:
  -> X-Axis: PRODUCTS [Existing | New]
  -> Y-Axis: MARKETS [Existing | New]

• The 4 Quadrants:
  [Q1] Existing Market + Existing Product = MARKET PENETRATION 🟢 (Safest)
  [Q2] Existing Market + New Product = PRODUCT DEVELOPMENT 🟡 (R&D heavy)
  [Q3] New Market + Existing Product = MARKET DEVELOPMENT 🟡 (Sales/channel heavy)
  [Q4] New Market + New Product = DIVERSIFICATION 🔴 (Danger zone!)`,
      examTip: '⚠️ In 10-mark exam questions, ALWAYS sketch the 2x2 box neatly with axes labeled before starting your essay response!',
      diagramDescription: '2x2 Table: Columns = Existing Product, New Product. Rows = Existing Market, New Market.'
    },
    {
      id: 'note-2',
      heading: 'II. Deep Dive: Penetration & Development',
      subheading: 'How companies actually execute without going bankrupt',
      content: `• Market Penetration Tactics:
  - Loyalty programs (e.g. Starbucks Stars ⭐)
  - Aggressive promotional pricing (discounts, bundles)
  - Increasing usage frequency ("Brush teeth TWICE a day")

• Market Development Tactics:
  - Geographic expansion (Domestic -> International)
  - New demographic segment (Baby shampoo marketed to gentle-hair adults)
  - New distribution channels (Offline retail -> D2C Online)`,
      keyFormulasOrRules: [
        'Risk Rule: Risk(Diversification) >> Risk(Prod Dev) ≈ Risk(Market Dev) > Risk(Penetration)',
        'Market Share Formula: Firm Sales / Total Industry Sales * 100'
      ],
      examTip: 'Highlight the difference between changing the product vs changing the channel. If the product is unchanged, it is Market Development!'
    },
    {
      id: 'note-3',
      heading: 'III. Critical Evaluation & Limitations for Exams',
      subheading: 'Top scorers always critique the model in Section B',
      content: `• What Ansoff misses:
  1. Competitor Reaction: Assumes rivals sit idle while you penetrate their share.
  2. Cost of Entry: Doesn't factor in debt interest, hurdle rates, or ROI.
  3. External Environment: PESTLE factors (government bans, inflation) are omitted.
  4. Binary Trap: In reality, products and markets exist on a continuous spectrum, not strict black-and-white boxes.`,
      examTip: 'Examiners reward referencing Philip Kotler\'s 9-box expansion of Ansoff which adds "Modified" products and markets in the middle!'
    }
  ],

  mindMap: {
    id: 'root-ansoff',
    label: 'Ansoff Matrix',
    description: 'Corporate Strategic Growth Framework',
    children: [
      {
        id: 'node-penetration',
        label: 'Market Penetration (Q1)',
        description: 'Existing Products x Existing Markets (Lowest Risk)',
        children: [
          { id: 'pen-1', label: 'Loyalty Rewards & Retention' },
          { id: 'pen-2', label: 'Price Competition & Bundles' },
          { id: 'pen-3', label: 'Usage Frequency Tactics' },
          { id: 'pen-4', label: 'Competitor Acquisition' }
        ]
      },
      {
        id: 'node-market-dev',
        label: 'Market Development (Q2)',
        description: 'Existing Products x New Markets (Moderate Risk)',
        children: [
          { id: 'mkt-1', label: 'Geographic Expansion (Global / Regional)' },
          { id: 'mkt-2', label: 'New Customer Demographics' },
          { id: 'mkt-3', label: 'E-commerce & Digital Channels' },
          { id: 'mkt-4', label: 'B2B to B2C Pivots' }
        ]
      },
      {
        id: 'node-prod-dev',
        label: 'Product Development (Q3)',
        description: 'New Products x Existing Markets (Moderate Risk)',
        children: [
          { id: 'prd-1', label: 'R&D Innovation & Variants' },
          { id: 'prd-2', label: 'Complementary Accessories' },
          { id: 'prd-3', label: 'Brand Extension' },
          { id: 'prd-4', label: 'Cannibalization Management' }
        ]
      },
      {
        id: 'node-diversify',
        label: 'Diversification (Q4)',
        description: 'New Products x New Markets (Highest Risk)',
        children: [
          {
            id: 'div-related',
            label: 'Related (Concentric)',
            description: 'Leverages existing tech or supply chains'
          },
          {
            id: 'div-unrelated',
            label: 'Unrelated (Conglomerate)',
            description: 'Pure capital allocation in alien sectors'
          }
        ]
      }
    ]
  },

  quiz: [
    {
      id: 'q-1',
      type: 'mcq',
      difficulty: 'easy',
      question: 'Which quadrant of the Ansoff Matrix carries the highest operational and financial risk?',
      options: [
        'Market Penetration',
        'Product Development',
        'Market Development',
        'Diversification'
      ],
      correctAnswer: 'Diversification',
      explanation: 'Diversification involves both new products and unfamiliar markets, meaning the firm lacks existing operational experience and customer relationships.',
      topicTag: 'Risk Profile'
    },
    {
      id: 'q-2',
      type: 'mcq',
      difficulty: 'medium',
      question: 'When Starbucks launched packaged Starbucks coffee beans in grocery supermarkets for home brewing, which strategy did it primarily employ?',
      options: [
        'Market Penetration',
        'Market Development',
        'Product Development',
        'Unrelated Diversification'
      ],
      correctAnswer: 'Market Development',
      explanation: 'Starbucks brought its existing core product (roasted coffee beans) into a new distribution channel and market segment (grocery supermarket shoppers) beyond its company-owned cafes.',
      topicTag: 'Application'
    },
    {
      id: 'q-3',
      type: 'true_false',
      difficulty: 'easy',
      question: 'Market Penetration requires developing brand new product prototypes from scratch.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'Market penetration focuses strictly on existing products in existing markets, using promotions, price cuts, or loyalty schemes to gain share.',
      topicTag: 'Definitions'
    },
    {
      id: 'q-4',
      type: 'case_based',
      difficulty: 'hard',
      question: 'A high-end electric car manufacturer announces it will begin manufacturing solar-powered smartphones for rural emerging economies. According to Ansoff, what classification and risk factor best describes this move?',
      options: [
        'Product Development with low risk',
        'Market Development with medium risk',
        'Unrelated Diversification with very high risk',
        'Market Penetration with minimal risk'
      ],
      correctAnswer: 'Unrelated Diversification with very high risk',
      explanation: 'Smartphones represent a completely new product domain, and rural emerging market consumers represent a completely new demographic/geographic target for a luxury auto brand.',
      topicTag: 'Case Analysis',
      caseScenario: 'Apex Motors is known for luxury electric sedans in North America and Western Europe.'
    },
    {
      id: 'q-5',
      type: 'short_answer',
      difficulty: 'medium',
      question: 'State the two dimensions (axes) upon which the Ansoff Matrix is constructed.',
      correctAnswer: 'Products (Existing vs New) and Markets (Existing vs New)',
      explanation: 'The matrix evaluates strategic growth along two axes: Product dimension (existing vs new) and Market dimension (existing vs new).',
      topicTag: 'Framework Structure'
    }
  ],

  shortQuestions: [
    {
      question: 'Differentiate between Related and Unrelated Diversification with one example each.',
      answer: 'Related (concentric) diversification leverages synergies in technology, marketing, or distribution (e.g., Apple moving from Mac computers to the iPhone). Unrelated (conglomerate) diversification involves entirely unrelated industries with zero operational overlap (e.g., General Electric manufacturing jet engines, lightbulbs, and financial services).',
      marks: 5
    },
    {
      question: 'Why is Market Penetration typically considered the lowest-risk growth option?',
      answer: 'Because the organization operates within familiar territory: customer behavior is well-documented, competitor playbooks are known, existing supply chains are already running, and no costly new R&D or foreign market setup is required.',
      marks: 3
    },
    {
      question: 'List three practical marketing tactics used to achieve Market Penetration.',
      answer: '1) Loyalty reward systems to boost purchase frequency; 2) Bundle pricing and seasonal discounts; 3) Heavy advertising and shelf-space expansion to squeeze out secondary competitors.',
      marks: 4
    }
  ],

  caseQuestions: [
    {
      caseText: 'Sony entered the video game console market with PlayStation in 1994, transitioning from its heritage in consumer electronics (Walkman, TVs) to interactive entertainment hardware and software.',
      question: 'Evaluate whether Sony\'s move was Related Diversification or Product Development, and justify your answer based on synergies.',
      modelAnswer: 'Sony\'s move is best classified as Related Diversification. While Sony possessed deep hardware manufacturing and optical disc (CD-ROM) competencies, video games required building a completely new ecosystem of game developers, publishing licenses, and engaging with teen gamers—a new market segment distinct from audio-visual consumers.'
    },
    {
      caseText: 'Gymshark, a UK fitness apparel brand that sold exclusively online via direct-to-consumer (D2C) e-commerce, opened its first flagship brick-and-mortar retail store on Regent Street in London.',
      question: 'Using the Ansoff framework, identify this strategic move and discuss potential channel conflict or operational challenges.',
      modelAnswer: 'This is Market Development via channel expansion. The physical store exposes existing apparel to foot-traffic shoppers, tourists, and consumers who prefer trying clothes in fitting rooms before buying. Key challenges include high fixed rental costs, inventory shrinkage, and maintaining retail staffing standards.'
    }
  ],

  vivaQuestions: [
    {
      id: 'viva-1',
      question: 'Explain the core rationale behind Igor Ansoff\'s Strategic Growth Grid.',
      topic: 'Strategic Framework Rationale',
      sampleAnswer: 'The core rationale is to help executive leaders evaluate and prioritize growth vectors by balancing market opportunities against product capabilities while making calculated risk trade-offs.',
      keyPointsExpected: [
        'Formulated by Igor Ansoff in 1957',
        '2x2 grid based on Products and Markets',
        'Helps assess risk versus growth trade-offs',
        'Guides capital allocation decisions'
      ]
    },
    {
      id: 'viva-2',
      question: 'If a company has high brand equity but declining core industry sales, which Ansoff quadrant should it prioritize first?',
      topic: 'Strategic Decision Making',
      sampleAnswer: 'It should prioritize Product Development to leverage its trusted brand name with existing loyal customers, or Market Development if the product can be exported to growing emerging regions.',
      keyPointsExpected: [
        'Leveraging existing brand loyalty',
        'Product development for customer lifetime value',
        'Market development to bypass domestic market saturation',
        'Avoiding premature risky unrelated diversification'
      ]
    },
    {
      id: 'viva-3',
      question: 'What are the main criticisms of using the Ansoff Matrix in today\'s digital economy?',
      topic: 'Critical Academic Evaluation',
      sampleAnswer: 'The matrix assumes clear boundaries between products and markets. In platform economies (like Uber or Amazon), digital services blur products and markets continuously. It also neglects competitive retaliation and cost of capital.',
      keyPointsExpected: [
        'Binary nature oversimplifies modern platforms',
        'Ignores competitor retaliation',
        'Omits cost of financing and ROI metrics',
        'Platform ecosystems bridge multiple quadrants simultaneously'
      ]
    }
  ],

  examImportantTopics: [
    {
      topic: 'Comparison between Ansoff Matrix and BCG Growth-Share Matrix',
      importance: 'Critical',
      expectedQuestionTypes: ['10-mark Comparative Essay', 'Case Study Synthesis'],
      keyFocusAreas: 'Show how Ansoff identifies growth directions while BCG analyzes cash-flow generation across current business units.',
      previousExamFrequency: 'Appeared in 8 of the last 10 university exam papers'
    },
    {
      topic: 'Related vs Unrelated Diversification & The Conglomerate Discount',
      importance: 'High',
      expectedQuestionTypes: ['Short Answer', 'Viva Voce'],
      keyFocusAreas: 'Focus on strategic synergies (economies of scope) vs managerial overhead in conglomerates.',
      previousExamFrequency: 'Very frequent in MBA Strategic Finance & Strategy modules'
    },
    {
      topic: 'Tactical Execution of Market Penetration vs Market Development',
      importance: 'High',
      expectedQuestionTypes: ['Applied Case Study'],
      keyFocusAreas: 'Clear differentiation of tactics: promotional pricing vs entering new geographic/demographic tiers.',
      previousExamFrequency: 'Standard Section B case study question'
    }
  ],

  youtubeResources: [
    {
      id: 'yt-1',
      title: 'Ansoff Matrix Explained with Real Business Examples (Apple, Nike, Starbucks)',
      channel: 'Strategy Academy & Harvard Business Publishing Insights',
      duration: '14 mins',
      topicRelevance: 'Comprehensive breakdown of all four quadrants with visual diagrams and corporate case studies.',
      searchQuery: 'Ansoff Matrix strategic management real life examples explained'
    },
    {
      id: 'yt-2',
      title: 'Ansoff Matrix vs BCG Matrix: How to Choose in MBA Exams',
      channel: 'Business School Masterclass',
      duration: '18 mins',
      topicRelevance: 'Direct exam prep guide for answering 10-mark strategy questions with high-scoring structures.',
      searchQuery: 'Ansoff Matrix vs BCG Matrix differences MBA exam preparation'
    },
    {
      id: 'yt-3',
      title: 'Growth Strategies in Practice: Related vs Unrelated Diversification',
      channel: 'Corporate Strategy Hub',
      duration: '11 mins',
      topicRelevance: 'Examines why conglomerate diversification often fails and how related diversification creates sustainable moats.',
      searchQuery: 'Related vs Unrelated Diversification corporate strategy examples'
    }
  ],

  studyPlan: [
    {
      dayNumber: 1,
      dateStr: 'Day 1: Foundations & The 2x2 Grid',
      topic: 'Historical Context, 4 Quadrants & Visual Sketches',
      studyTimeMinutes: 45,
      revisionTasks: [
        'Memorize the 2x2 grid layout and labeling of axes',
        'Learn the core definitions of all 4 quadrants',
        'Practice drawing the diagram with neat annotations'
      ],
      quizAction: 'Take 5-question Basic Concept Quiz',
      completed: true
    },
    {
      dayNumber: 2,
      dateStr: 'Day 2: Penetration & Market Development',
      topic: 'Tactics, Real-world Corporate Examples & Low-Risk Vectors',
      studyTimeMinutes: 60,
      revisionTasks: [
        'Review Starbucks, Coca-Cola and IKEA case studies',
        'Compare pricing vs distribution channel adjustments',
        'Draft 3 points on overcoming domestic saturation'
      ],
      quizAction: 'Practice Short Answer Questions (3-5 marks)',
      completed: false
    },
    {
      dayNumber: 3,
      dateStr: 'Day 3: Product Dev & Diversification',
      topic: 'R&D Risks, Cannibalization & Conglomerate Discount',
      studyTimeMinutes: 60,
      revisionTasks: [
        'Analyze Related vs Unrelated diversification differences',
        'Review synergy formula (2+2=5)',
        'Understand risk curve progression'
      ],
      quizAction: 'Complete Case-Based Question Challenge',
      completed: false
    },
    {
      dayNumber: 4,
      dateStr: 'Day 4: Critical Evaluation & Exam Synthesis',
      topic: 'Limitations, Modern Platform Critiques & BCG Matrix Overlap',
      studyTimeMinutes: 45,
      revisionTasks: [
        'Memorize the 4 key limitations of Ansoff',
        'Prepare the comparison table between Ansoff and BCG Matrix',
        'Review exam tips and high-scoring essay structures'
      ],
      quizAction: 'Simulated AI Viva Voice/Text Session',
      completed: false
    },
    {
      dayNumber: 5,
      dateStr: 'Day 5: Final Rapid Revision',
      topic: 'Quick Revision Mode (10 points) & Formula Flashcards',
      studyTimeMinutes: 30,
      revisionTasks: [
        'Read through Handwritten Notes summary',
        'Test recall using interactive Mind Map expand/collapse',
        'Final full-length mock quiz'
      ],
      quizAction: 'Take 15-question Comprehensive Mock Exam',
      completed: false
    }
  ]
};
