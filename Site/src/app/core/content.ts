/**
 * Single source of truth for everything the site says.
 * Edit this file to update copy, roles, links or portfolio projects.
 * Dates use 'YYYY-MM'; `end: null` means "present".
 */

export type Category = 'software' | 'operations' | 'academia';

export interface Role {
  id: string;
  company: string;
  /** Short name used in the career map. */
  short: string;
  title: string;
  start: string;
  end: string | null;
  location?: string;
  category: Category;
  note?: string;
  tags?: string[];
}

export interface Education {
  id: string;
  school: string;
  short: string;
  degree: string;
  start: string;
  end: string;
  /** Human label when exact months are unknown. */
  period: string;
}

export interface Chapter {
  index: string;
  title: string;
  period: string;
  summary: string;
  category: Category;
}

export type ProjectStatus = 'live' | 'in-progress' | 'planned';

export interface Project {
  id: string;
  index: string;
  title: string;
  category: string;
  summary: string;
  status: ProjectStatus;
  tags: string[];
  /** Optional cover image, e.g. 'work/my-project.jpg' placed in /public/work. */
  image?: string;
  year?: string;
  links: { live?: string; repo?: string; caseStudy?: string };
}

export const PROFILE = {
  first: 'Iraklis',
  last: 'Tsikas',
  role: 'Software Engineer',
  company: 'Natech Banking Solutions',
  location: 'Athens, Greece',
  coords: '37.98°N · 23.73°E',
  timezone: 'Europe/Athens',
  email: 'tsikasiraklis@gmail.com',
  softwareSince: '2021-10',
  /** Served from /public. Replace the file to update the downloadable CV. */
  cv: 'iraklis-tsikas-cv.pdf',
  links: {
    linkedin: 'https://www.linkedin.com/in/iraklis-tsikas-084327164',
    github: 'https://github.com/Averelakos',
  },
  languages: [
    { name: 'Greek', level: 'Native' },
    { name: 'English', level: 'Full professional' },
  ],
  coreStack: ['C#', 'TypeScript', 'Git'],
  extendedStack: ['Python', 'SQL & databases', 'Web data & APIs'],
} as const;

export const ROLES: Role[] = [
  {
    id: 'natech',
    company: 'Natech Banking Solutions',
    short: 'Natech',
    title: 'Software Engineer',
    start: '2026-03',
    end: null,
    location: 'Athens, Greece',
    category: 'software',
    note: 'Building software for the banking sector — where correctness, auditability and uptime are not optional.',
    tags: ['Banking', 'Fintech', 'Enterprise'],
  },
  {
    id: 'iteam',
    company: 'iteam Technology Solutions S.A.',
    short: 'iteam',
    title: 'Software Engineer',
    start: '2021-10',
    end: '2026-02',
    location: 'Pallini, Athens',
    category: 'software',
    note: 'My first role as a professional software engineer — started while completing my MSc in Informatics, and grew with it for four and a half years.',
    tags: ['Enterprise software'],
  },
  {
    id: 'avibright',
    company: 'avibright',
    short: 'avibright',
    title: 'Software Engineer',
    start: '2021-10',
    end: '2026-02',
    location: 'Greece',
    category: 'software',
    note: 'Engineering work held in parallel with iteam over the same period.',
    tags: ['Software engineering'],
  },
  {
    id: 'lidl',
    company: 'Lidl Hellas',
    short: 'Lidl Hellas',
    title: 'Sales Representative',
    start: '2020-02',
    end: '2021-10',
    location: 'Gerakas, Athens',
    category: 'operations',
    note: 'Customer-facing sales at scale — carried alongside the first year of my MSc in Informatics.',
    tags: ['Retail', 'Sales'],
  },
  {
    id: 'sarantis',
    company: 'Sarantis Estate — Organic Farming Products',
    short: 'Sarantis Estate',
    title: 'Warehouse & Logistics',
    start: '2019-05',
    end: '2019-10',
    location: 'Kato Souli, Attica',
    category: 'operations',
    note: 'Logistics for an organic farming estate — where my agricultural background met supply chain operations.',
    tags: ['Logistics', 'Agri-food'],
  },
  {
    id: 'leroy',
    company: 'Leroy Merlin',
    short: 'Leroy Merlin',
    title: 'Sales Assistant',
    start: '2019-04',
    end: '2019-05',
    location: 'Spata, Athens',
    category: 'operations',
    tags: ['Retail'],
  },
  {
    id: 'mart',
    company: 'Mart Cash & Carry S.A.',
    short: 'Mart',
    title: 'Warehouse Clerk',
    start: '2018-09',
    end: '2019-05',
    location: 'Athens, Greece',
    category: 'operations',
    note: 'Stock, accuracy and throughput in wholesale distribution.',
    tags: ['Wholesale', 'Logistics'],
  },
  {
    id: 'navy',
    company: 'Hellenic Navy',
    short: 'Hellenic Navy',
    title: 'National Service — Tank Landing Ship',
    start: '2017-09',
    end: '2018-06',
    category: 'operations',
    note: 'National service aboard a tank landing ship. Discipline, procedure, and a crew that only works if everyone does.',
    tags: ['Service'],
  },
  {
    id: 'metro',
    company: 'METRO AEBE',
    short: 'METRO',
    title: 'Warehouse Clerk',
    start: '2017-06',
    end: '2017-08',
    category: 'operations',
    tags: ['Wholesale'],
  },
  {
    id: 'cosmote',
    company: 'Cosmote e-Value',
    short: 'Cosmote',
    title: 'Sales Representative',
    start: '2016-11',
    end: '2016-11',
    location: 'Greece',
    category: 'operations',
    tags: ['Telecom', 'Sales'],
  },
  {
    id: 'aua-2016',
    company: 'Agricultural University of Athens',
    short: 'AUA · Lab',
    title: 'Intern — Laboratory of Farm Machinery',
    start: '2016-07',
    end: '2016-10',
    location: 'Athens, Greece',
    category: 'academia',
    tags: ['Research', 'Engineering'],
  },
  {
    id: 'aua-2014',
    company: 'Agricultural University of Athens',
    short: 'AUA · Lab',
    title: 'Intern — Laboratory of Farm Machinery',
    start: '2014-07',
    end: '2014-08',
    location: 'Athens, Greece',
    category: 'academia',
    note: 'Prepared a hydroponic plant and built automatic hydroponics control systems — installation, testing and general support. My first real systems work.',
    tags: ['Automation', 'Control systems', 'Hydroponics'],
  },
];

export const EDUCATION: Education[] = [
  {
    id: 'unipi',
    school: 'University of Piraeus',
    short: 'UniPi · MSc',
    degree: "Master's degree, Informatics",
    start: '2020-11',
    end: '2022-06',
    period: 'Nov 2020 — 2022',
  },
  {
    id: 'aua',
    school: 'Agricultural University of Athens',
    short: 'AUA · Degree',
    degree: 'MSc, Natural Resources Management & Agricultural Engineering',
    start: '2008-09',
    end: '2017-06',
    period: '2008 — 2017',
  },
];

export const CERTIFICATIONS = {
  title: 'Python for Everybody Specialization',
  courses: [
    'Python Data Structures',
    'Using Python to Access Web Data',
    'Using Databases with Python',
    'Capstone: Retrieving, Processing & Visualizing Data with Python',
  ],
};

export const CHAPTERS: Chapter[] = [
  {
    index: '03',
    title: 'Software Engineering',
    period: '2021 — Now',
    category: 'software',
    summary:
      'Where everything converged. Since 2021 I have been shipping production software for a living — first at iteam and avibright, and now on banking systems at Natech.',
  },
  {
    index: '02',
    title: 'Operations, Sales & Service',
    period: '2016 — 2021',
    category: 'operations',
    summary:
      'Warehouses, retail floors and a Navy landing ship. Five years of seeing how real operations behave under load — the same constraints production software lives with.',
  },
  {
    index: '01',
    title: 'Engineering Roots',
    period: '2008 — 2017',
    category: 'academia',
    summary:
      'A degree in natural resources and agricultural engineering, and my first hands-on systems work: automated control for hydroponics in the Laboratory of Farm Machinery.',
  },
];

/**
 * Portfolio. Entries that aren't `live` render as "redacted" placeholders.
 * To publish one: set status to 'live', give it a real title/summary and at least one link.
 */
export const PROJECTS: Project[] = [
  {
    id: 'p01',
    index: '01',
    title: 'Full-stack platform',
    category: 'Full-stack · Web',
    summary: 'A production-grade web platform, end to end — case study in preparation.',
    status: 'in-progress',
    tags: ['TypeScript', 'C#'],
    links: {},
  },
  {
    id: 'p02',
    index: '02',
    title: 'Data pipeline',
    category: 'Data · Python',
    summary: 'Retrieving, processing and visualising data — write-up on the way.',
    status: 'planned',
    tags: ['Python', 'SQL'],
    links: {},
  },
  {
    id: 'p03',
    index: '03',
    title: 'Developer tooling',
    category: 'Open source · Tooling',
    summary: 'Small, sharp tools that make engineering teams faster.',
    status: 'planned',
    tags: ['Git', 'Automation'],
    links: {},
  },
];

export const NAV = [
  { id: 'about', label: 'About', index: '01' },
  { id: 'journey', label: 'Journey', index: '02' },
  { id: 'toolbox', label: 'Toolbox', index: '03' },
  { id: 'work', label: 'Work', index: '04' },
  { id: 'contact', label: 'Contact', index: '05' },
] as const;

/**
 * The AI "Digital Twin" chat. `story` and `facts` are sent to the model (server-side) along with
 * everything above, so the twin can only talk about what's written in this file.
 * Add facts here to teach it more — keep them true, it will repeat them to visitors.
 */
export const TWIN = {
  greeting:
    "I'm an AI trained on Iraklis's career — roles, education, stack and the story in between. Ask me anything you'd ask him over coffee.",
  suggestions: [
    'How did you move from agriculture into software?',
    'What do you work on at Natech?',
    "What's your tech stack?",
    'Tell me about your education',
  ],
  story: [
    'I trained in natural resources management and agricultural engineering at the Agricultural University of Athens (2008–2017). During two internships at its Laboratory of Farm Machinery I prepared a hydroponic plant and built automatic hydroponics control systems — my first real systems work.',
    'I did my national service in the Hellenic Navy aboard a tank landing ship (Sep 2017 – Jun 2018).',
    'Between 2016 and 2021 I worked in operations and sales — METRO, Mart Cash & Carry, Leroy Merlin, an organic farming estate and Lidl Hellas — learning first-hand how real operations behave under pressure.',
    'In November 2020 I started an MSc in Informatics at the University of Piraeus, and in October 2021 I became a professional software engineer at iteam Technology Solutions and avibright, where I stayed for four and a half years.',
    'Since March 2026 I have been a Software Engineer at Natech Banking Solutions, building software for the banking sector.',
  ],
  facts: [
    'I work mostly in C# and TypeScript, with Git for version control; I also use Python and hold five Python certifications (the Python for Everybody Specialization and its courses).',
    'I care about what makes enterprise software trustworthy: correctness, clarity, and code the next engineer can pick up without a map.',
    'I see a common thread between hydroponic control loops and banking systems: inputs, state, and the ways they fail.',
    'Portfolio case studies are being written up; meanwhile my public code is on GitHub.',
  ],
};
