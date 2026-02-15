
export type CHCDomain = 'Gf' | 'Gc' | 'Gwm' | 'Gs' | 'Gv' | 'Ga' | 'Glr' | 'EF';

export const chcDomains: { 
  key: CHCDomain; 
  name: string; 
  description: string; 
  gameTitle: string;
  tasks: string[];
  supportsMath: boolean;
  supportsMusic: boolean;
}[] = [
  { key: 'Gf', name: '(Gf) Fluid Reasoning', description: 'Solve new problems', gameTitle: 'Pattern Matrix', tasks: ['pattern_matrix'], supportsMath: true, supportsMusic: true },
  { key: 'Gc', name: '(Gc) Crystallized Intelligence', description: 'Use learned knowledge', gameTitle: 'Verbal Inference Builder', tasks: ['verbal_inference'], supportsMath: true, supportsMusic: true },
  { key: 'Gwm', name: '(Gwm) Working Memory', description: 'Use and hold information', gameTitle: 'Dynamic Sequence', tasks: ['sequence_transform'], supportsMath: true, supportsMusic: true },
  { key: 'Gs', name: '(Gs) Processing Speed', description: 'Work fast and accurately', gameTitle: 'Rapid Code Match', tasks: ['code_match'], supportsMath: true, supportsMusic: true },
  { key: 'Gv', name: '(Gv) Visual Processing', description: 'Visualize and rotate objects', gameTitle: 'Visual Processing Lab', tasks: ['mental_rotation', 'balance_puzzle'], supportsMath: true, supportsMusic: true },
  { key: 'Ga', name: '(Ga) Auditory Processing', description: 'Process and distinguish sounds', gameTitle: 'Auditory Processing Lab', tasks: ['tone_grid', 'spoken_arithmetic'], supportsMath: true, supportsMusic: true },
  { key: 'Glr', name: '(Glr) Long-Term Retrieval', description: 'Store and recall ideas', gameTitle: 'Semantic Fluency Storm', tasks: ['semantic_fluency'], supportsMath: true, supportsMusic: true },
  { key: 'EF', name: '(EF) Executive Function', description: 'Focus, switch, control tasks', gameTitle: 'Focus Switch Reactor', tasks: ['focus_switch'], supportsMath: true, supportsMusic: true },
];
