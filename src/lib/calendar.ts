import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';

export interface CalendarDate {
  date: Date;
  title: string;
  type: 'commemorative' | 'commercial' | 'important';
  nicheId?: string;
}

// 2026 Common Dates (Brazil context usually, but making it general commercial)
export const COMMON_DATES_2026: CalendarDate[] = [
  { date: new Date(2026, 0, 1), title: "Ano Novo", type: "commemorative" },
  { date: new Date(2026, 1, 14), title: "Valentine's Day", type: "commercial" },
  { date: new Date(2026, 1, 17), title: "Carnaval", type: "commemorative" },
  { date: new Date(2026, 2, 8), title: "Dia da Mulher", type: "commemorative" },
  { date: new Date(2026, 2, 15), title: "Dia do Consumidor", type: "commercial" },
  { date: new Date(2026, 3, 3), title: "Sexta-feira Santa", type: "commemorative" },
  { date: new Date(2026, 3, 5), title: "Páscoa", type: "commemorative" },
  { date: new Date(2026, 3, 21), title: "Tiradentes", type: "commemorative" },
  { date: new Date(2026, 4, 1), title: "Dia do Trabalho", type: "commemorative" },
  { date: new Date(2026, 4, 10), title: "Dia das Mães", type: "commercial" },
  { date: new Date(2026, 5, 4), title: "Corpus Christi", type: "commemorative" },
  { date: new Date(2026, 5, 12), title: "Dia dos Namorados", type: "commercial" },
  { date: new Date(2026, 7, 9), title: "Dia dos Pais", type: "commercial" },
  { date: new Date(2026, 8, 7), title: "Independência do Brasil", type: "commemorative" },
  { date: new Date(2026, 9, 12), title: "Dia das Crianças", type: "commercial" },
  { date: new Date(2026, 9, 15), title: "Dia dos Professores", type: "commemorative" },
  { date: new Date(2026, 10, 2), title: "Finados", type: "commemorative" },
  { date: new Date(2026, 10, 15), title: "Proclamação da República", type: "commemorative" },
  { date: new Date(2026, 10, 20), title: "Consciência Negra", type: "commemorative" },
  { date: new Date(2026, 10, 27), title: "Black Friday", type: "commercial" },
  { date: new Date(2026, 11, 25), title: "Natal", type: "commemorative" },
  { date: new Date(2026, 11, 31), title: "Véspera de Ano Novo", type: "commemorative" },
];

export const NICHE_DATES_SAMPLES: Record<string, Omit<CalendarDate, 'nicheId'>[]> = {
  "Moda": [
    { date: new Date(2026, 2, 20), title: "Início Outono/Inverno", type: "important" },
    { date: new Date(2026, 8, 22), title: "Início Primavera/Verão", type: "important" },
    { date: new Date(2026, 3, 20), title: "Fashion Week Trends", type: "important" },
  ],
  "Gastronomia": [
    { date: new Date(2026, 6, 10), title: "Dia da Pizza", type: "commercial" },
    { date: new Date(2026, 8, 13), title: "Dia da Cachaça", type: "commercial" },
    { date: new Date(2026, 9, 16), title: "Dia Mundial da Alimentação", type: "important" },
  ],
  "Tecnologia": [
    { date: new Date(2026, 4, 17), title: "Dia da Internet", type: "important" },
    { date: new Date(2026, 8, 13), title: "Dia do Programador", type: "important" },
  ],
};
