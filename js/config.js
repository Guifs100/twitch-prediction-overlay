export const VERCEL_API_URL = 'https://twitch-prediction-overlay-steel.vercel.app/api/subscribe';

export const PREDICTION_EVENTS = [
  'channel.prediction.begin',
  'channel.prediction.progress',
  'channel.prediction.lock',
  'channel.prediction.end'
];

export const OPTION_COLORS = [
  { name: 'Azul Twitch', hex: '#3894FE', bg: 'bg-[#3894FE]', text: 'text-[#3894FE]', border: 'border-[#3894FE]' },
  { name: 'Rosa/Magenta', hex: '#F14A97', bg: 'bg-[#F14A97]', text: 'text-[#F14A97]', border: 'border-[#F14A97]' },
  { name: 'Ciano', hex: '#00F5D4', bg: 'bg-[#00F5D4]', text: 'text-[#00F5D4]', border: 'border-[#00F5D4]' },
  { name: 'Amarelo', hex: '#FEE440', bg: 'bg-[#FEE440]', text: 'text-[#FEE440]', border: 'border-[#FEE440]' },
  { name: 'Roxo', hex: '#9146FF', bg: 'bg-[#9146FF]', text: 'text-[#9146FF]', border: 'border-[#9146FF]' },
  { name: 'Laranja', hex: '#FF9F1C', bg: 'bg-[#FF9F1C]', text: 'text-[#FF9F1C]', border: 'border-[#FF9F1C]' },
  { name: 'Verde', hex: '#10B981', bg: 'bg-[#10B981]', text: 'text-[#10B981]', border: 'border-[#10B981]' },
  { name: 'Vermelho', hex: '#EF4444', bg: 'bg-[#EF4444]', text: 'text-[#EF4444]', border: 'border-[#EF4444]' },
  { name: 'Violeta', hex: '#8B5CF6', bg: 'bg-[#8B5CF6]', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]' },
  { name: 'Índigo', hex: '#6366F1', bg: 'bg-[#6366F1]', text: 'text-[#6366F1]', border: 'border-[#6366F1]' }
];

export const OPTION_PRESETS = {
  2: ['Sim', 'Não'],
  4: ['Fácil (Vitória)', 'Médio (Suado)', 'Difícil (Overtime)', 'Derrota'],
  6: ['Opção A', 'Opção B', 'Opção C', 'Opção D', 'Opção E', 'Opção F'],
  10: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4', 'Opção 5', 'Opção 6', 'Opção 7', 'Opção 8', 'Opção 9', 'Opção 10']
};
