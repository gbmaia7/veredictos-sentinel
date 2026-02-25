import React, { useState, useEffect } from 'react';
import { Activity, CloudOff, CheckCircle2, Clock, AlertTriangle, Info, X, ChevronRight, ActivitySquare, Lock, Ban, Hourglass, MapPin, Phone, Smartphone } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, ReferenceLine
} from 'recharts';

const TOTAL_WINDOW_SECONDS = 6 * 3600; // 6 hours

type CardData = {
  id: string;
  type: 'CRÍTICO' | 'URGENTE' | 'NORMAL';
  hospital: string;
  patient: string;
  obito: string;
  deteccao: string;
  elegibilidade: string;
  elegibilidadeColor: string;
  cids: string;
  initialRemainingSeconds: number;
  color: string;
  pulse: boolean;
};

const initialCards: CardData[] = [
  {
    id: 'VDS-2025-001247',
    type: 'CRÍTICO',
    hospital: 'HUGO — UTI Adulto',
    patient: 'Masculino · 58 anos',
    obito: '02:47h',
    deteccao: '+58s',
    elegibilidade: 'ELEGÍVEL',
    elegibilidadeColor: 'text-teal',
    cids: 'Infarto Agudo do Miocárdio (I21.0) · Parada Cardiorrespiratória (I46.9)',
    initialRemainingSeconds: 48 * 60,
    color: 'critical',
    pulse: true,
  },
  {
    id: 'VDS-2025-001246',
    type: 'URGENTE',
    hospital: 'HGG — Emergência',
    patient: 'Masculino · 72 anos',
    obito: '01:15h',
    deteccao: '+42s',
    elegibilidade: 'ELEGÍVEL',
    elegibilidadeColor: 'text-teal',
    cids: 'Insuficiência Respiratória (J96.0) · Insuficiência Cardíaca (I50.0)',
    initialRemainingSeconds: 2 * 3600 + 10 * 60,
    color: 'urgent',
    pulse: false,
  },
  {
    id: 'VDS-2025-001245',
    type: 'NORMAL',
    hospital: 'HMI — Clínica Médica',
    patient: 'Feminino · 64 anos',
    obito: '00:30h',
    deteccao: '+31s',
    elegibilidade: 'REVISÃO NECESSÁRIA',
    elegibilidadeColor: 'text-urgent',
    cids: 'Insuficiência Renal Aguda (N17.0) · Pneumonia (J18.1)',
    initialRemainingSeconds: 3 * 3600 + 47 * 60,
    color: 'teal',
    pulse: false,
  }
];

const formatTime = (seconds: number) => {
  if (seconds <= 0) return '0min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m}min`;
  return `${m}min`;
};

type AtendimentoCard = {
  id: string;
  hospital: string;
  obito: string;
  ackEm: string;
  equipe: string;
  status: string;
  initialRemainingSeconds: number;
  remainingSeconds: number;
};

const initialAtendimentoCards: AtendimentoCard[] = [
  {
    id: 'VDS-2025-001246',
    hospital: 'HGG — Emergência',
    obito: '01:15h',
    ackEm: '3min42s',
    equipe: 'Equipe A — Carlos e Marina',
    status: 'Equipe Acionada',
    initialRemainingSeconds: 2 * 3600 + 10 * 60,
    remainingSeconds: 2 * 3600 + 10 * 60,
  },
  {
    id: 'VDS-2025-001244',
    hospital: 'HDT — UTI',
    obito: '23:50h',
    ackEm: '1min58s',
    equipe: 'Equipe B — Paulo e Fernanda',
    status: 'No Local',
    initialRemainingSeconds: 1 * 3600 + 20 * 60,
    remainingSeconds: 1 * 3600 + 20 * 60,
  }
];

type FinalizadoCard = {
  id: string;
  hospital: string;
  patient: string;
  obito: string;
  deteccao: string;
  desfecho: 'CAPTADO' | 'RECUSADO' | 'INVIÁVEL' | 'EXPIRADO';
  responsavel: string;
  motivo?: string;
};

const initialFinalizadosCards: FinalizadoCard[] = [
  {
    id: 'VDS-2025-001243',
    hospital: 'HUGO — UTI Adulto',
    patient: 'Masculino · 63 anos',
    obito: '25/02 · 22:15h',
    deteccao: '+47s',
    desfecho: 'CAPTADO',
    responsavel: 'Dr. Rodrigues',
  },
  {
    id: 'VDS-2025-001242',
    hospital: 'HGG — Emergência',
    patient: 'Feminino · 71 anos',
    obito: '25/02 · 19:30h',
    deteccao: '+52s',
    desfecho: 'RECUSADO',
    responsavel: 'Dr. Rodrigues',
    motivo: 'Família não autorizou',
  },
  {
    id: 'VDS-2025-001240',
    hospital: 'HMI — Clínica Médica',
    patient: 'Feminino · 45 anos',
    obito: '25/02 · 14:10h',
    deteccao: '+38s',
    desfecho: 'INVIÁVEL',
    responsavel: 'Dra. Silva',
    motivo: 'Contraindicação identificada presencialmente',
  }
];

const barData = [
  { name: 'HUGO', detectados: 12, captados: 8 },
  { name: 'HGG', detectados: 9, captados: 5 },
  { name: 'HMI', detectados: 7, captados: 4 },
  { name: 'HDT', detectados: 6, captados: 3 },
  { name: 'HEANA', detectados: 3, captados: 2 },
];

const pieData = [
  { name: 'Captado', value: 61, color: '#00E5C8' },
  { name: 'Recusado', value: 21, color: '#FF9F43' },
  { name: 'Inviável', value: 7, color: '#5A6A8A' },
  { name: 'Expirado', value: 11, color: '#8B0000' },
];

const lineData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
    p95: Math.floor(Math.random() * 40) + 40
  };
});

const CountUp = ({ end, duration = 2000, suffix = '' }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'alertas' | 'atendimento' | 'finalizados' | 'estatisticas'>('alertas');
  const [atendimentoCards, setAtendimentoCards] = useState(initialAtendimentoCards);
  const [finalizadosCards, setFinalizadosCards] = useState(initialFinalizadosCards);
  const [desfechoModalOpen, setDesfechoModalOpen] = useState<string | null>(null);
  const [desfechoForm, setDesfechoForm] = useState({ outcome: '', reason: '', obs: '' });
  const [filtroPeriodo, setFiltroPeriodo] = useState('Hoje');
  const [filtroDesfecho, setFiltroDesfecho] = useState('Todos');
  const [filtroHospital, setFiltroHospital] = useState('Todos os Hospitais');

  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileStatus, setMobileStatus] = useState('Equipe Acionada');
  const [mobileNameRevealed, setMobileNameRevealed] = useState(false);
  const [mobileNameRevealTime, setMobileNameRevealTime] = useState<string | null>(null);
  const [mobileConfirmOpen, setMobileConfirmOpen] = useState(false);

  const [cards, setCards] = useState(initialCards.map(c => ({
    ...c,
    remainingSeconds: c.initialRemainingSeconds,
    acknowledged: false,
    ackTime: '',
    teamRequested: false,
  })));

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [idRevealed, setIdRevealed] = useState<Record<string, { revealed: boolean, timestamp: string }>>({});
  const [idConfirmModalOpen, setIdConfirmModalOpen] = useState(false);
  const [criteriaExpanded, setCriteriaExpanded] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState<string | null>(null);
  const [teamObs, setTeamObs] = useState('');
  const [recusaModalOpen, setRecusaModalOpen] = useState<string | null>(null);
  const [recusaForm, setRecusaForm] = useState({ reason: '', obs: '' });
  const [ackModalOpen, setAckModalOpen] = useState<string | null>(null);
  const [refuseConfirmModalOpen, setRefuseConfirmModalOpen] = useState<string | null>(null);

  const selectedCard = cards.find(c => c.id === selectedCardId);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => prev.map(card => ({
        ...card,
        remainingSeconds: Math.max(0, card.remainingSeconds - 1)
      })));
      setAtendimentoCards(prev => prev.map(card => {
        const newRemaining = Math.max(0, card.remainingSeconds - 1);
        return {
          ...card,
          remainingSeconds: newRemaining,
          status: newRemaining === 0 ? 'EXPIRADO' : card.status
        };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAck = (id: string) => {
    setAckModalOpen(id);
  };

  const confirmAck = () => {
    if (ackModalOpen) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setCards(prev => prev.map(c => c.id === ackModalOpen ? { ...c, acknowledged: true, ackTime: timeStr } : c));
      setAckModalOpen(null);
    }
  };

  const handleRequestTeam = (id: string) => {
    setTeamModalOpen(id);
  };

  const confirmTeamRequest = () => {
    if (teamModalOpen) {
      setCards(prev => prev.map(c => c.id === teamModalOpen ? { ...c, teamRequested: true } : c));
      setTeamModalOpen(null);
      setTeamObs('');
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setAtendimentoCards(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const openDesfechoModal = (id: string) => {
    setDesfechoModalOpen(id);
    setDesfechoForm({ outcome: '', reason: '', obs: '' });
  };

  const confirmDesfecho = () => {
    if (desfechoModalOpen) {
      const card = atendimentoCards.find(c => c.id === desfechoModalOpen);
      if (card) {
        setFinalizadosCards(prev => [{
          id: card.id,
          hospital: card.hospital,
          patient: 'Dados Ocultos', // Simplified for this example
          obito: `25/02 · ${card.obito}`,
          deteccao: '+45s', // Placeholder
          desfecho: desfechoForm.outcome.toUpperCase() as any,
          responsavel: 'Dr. Rodrigues',
          motivo: desfechoForm.reason || undefined,
        }, ...prev]);
      }
      setAtendimentoCards(prev => prev.filter(c => c.id !== desfechoModalOpen));
      setDesfechoModalOpen(null);
    }
  };

  const openRecusaModal = (id: string) => {
    setRefuseConfirmModalOpen(id);
  };

  const confirmRefuseConfirm = () => {
    if (refuseConfirmModalOpen) {
      setRecusaModalOpen(refuseConfirmModalOpen);
      setRecusaForm({ reason: '', obs: '' });
      setRefuseConfirmModalOpen(null);
    }
  };

  const confirmRecusa = () => {
    if (recusaModalOpen) {
      const card = cards.find(c => c.id === recusaModalOpen);
      if (card) {
        setFinalizadosCards(prev => [{
          id: card.id,
          hospital: card.hospital.split(' — ')[0],
          patient: card.patient,
          obito: `25/02 · ${card.obito}`,
          deteccao: card.deteccao,
          desfecho: 'RECUSADO',
          responsavel: 'Dr. Rodrigues',
          motivo: recusaForm.reason,
        }, ...prev]);
      }
      setCards(prev => prev.filter(c => c.id !== recusaModalOpen));
      setRecusaModalOpen(null);
      setSelectedCardId(null);
    }
  };

  const filteredFinalizados = finalizadosCards.filter(card => {
    if (filtroDesfecho !== 'Todos' && card.desfecho !== filtroDesfecho.toUpperCase()) return false;
    if (filtroHospital !== 'Todos os Hospitais' && !card.hospital.includes(filtroHospital)) return false;
    return true;
  });

  const revealMobileName = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}h`;
    setMobileNameRevealed(true);
    setMobileNameRevealTime(timeStr);
    setMobileConfirmOpen(false);
    
    setTimeout(() => {
      setMobileNameRevealed(false);
      setMobileNameRevealTime(null);
    }, 5 * 60 * 1000);
  };

  if (isMobileView) {
    const card = atendimentoCards.find(c => c.id === 'VDS-2025-001246') || initialAtendimentoCards[0];
    const remainingSeconds = card.remainingSeconds;
    const isExpired = remainingSeconds <= 0;
    const consumedPercent = ((TOTAL_WINDOW_SECONDS - remainingSeconds) / TOTAL_WINDOW_SECONDS) * 100;

    const handleMobileStatusChange = (newStatus: string) => {
      if (navigator.vibrate) navigator.vibrate(50);
      setMobileStatus(newStatus);
      handleStatusChange(card.id, newStatus);
    };

    return (
      <div className="min-h-screen bg-[#04070D] flex items-center justify-center font-syne">
        <div className="w-full max-w-[390px] h-[100dvh] sm:h-[844px] bg-navy relative overflow-hidden flex flex-col shadow-2xl sm:border sm:border-secondary/30 sm:rounded-[2.5rem]">
          {/* Topbar */}
          <header className="h-14 border-b border-secondary/30 flex items-center justify-between px-4 bg-navy/90 backdrop-blur-sm shrink-0">
            <div className="font-bold text-lg tracking-wide text-teal">SENTINEL</div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileView(false)} className="text-xs text-secondary hover:text-text-light">Sair</button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal animate-pulse-dot"></div>
                <span className="text-teal text-[10px] font-bold tracking-wider">AO VIVO</span>
              </div>
            </div>
          </header>
          <div className="bg-secondary/10 px-4 py-2 border-b border-secondary/20 text-xs font-semibold text-center text-text-light/80">
            Equipe A — Carlos e Marina
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 pb-48">
            <div className={`bg-[#0C1424] rounded-2xl border ${isExpired ? 'border-critical' : 'border-urgent'} p-5 relative ${isExpired ? '' : 'animate-pulse-border'}`}>
              <div className={`absolute -top-3 left-4 ${isExpired ? 'bg-critical' : 'bg-critical animate-pulse'} text-navy text-[10px] font-bold px-3 py-1 rounded-full tracking-wider flex items-center gap-1`}>
                <AlertTriangle size={12} /> {isExpired ? 'JANELA ENCERRADA' : 'VOCÊ FOI ACIONADO'}
              </div>
              
              <div className="mt-2 mb-5">
                <div className="text-xs text-secondary font-mono mb-1">{card.id}</div>
              </div>

              {/* Destino */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1 leading-tight">HGG — Hospital Geral de Goiânia</h3>
                <div className="text-sm font-medium text-text-light/80 mb-1">Emergência — Leito 7</div>
                <div className="text-xs text-secondary mb-4">Av. Anhanguera, 6479 — Goiânia</div>
                <button className="w-full border border-teal text-teal hover:bg-teal/10 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <MapPin size={16} /> Abrir no Maps
                </button>
              </div>

              {/* Paciente */}
              <div className="mb-6 bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                <div className="text-sm font-medium mb-3">Masculino · 72 anos · Leito 7</div>
                {!mobileNameRevealed ? (
                  <button 
                    onClick={() => setMobileConfirmOpen(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal/80 transition-colors"
                  >
                    <Lock size={16} /> Ver Nome do Paciente
                  </button>
                ) : (
                  <div className="pt-3 border-t border-secondary/20 animate-in fade-in">
                    <div className="text-base font-bold mb-1">José Pereira</div>
                    <div className="text-[10px] text-secondary flex items-center gap-1">
                      <Clock size={10} /> Acessado por Carlos às {mobileNameRevealTime} — registrado
                    </div>
                  </div>
                )}
              </div>

              {/* Janela */}
              <div className="mb-6 text-center">
                <div className={`text-4xl font-bold mb-1 ${isExpired ? 'text-critical' : 'text-urgent'}`}>
                  {isExpired ? 'JANELA ENCERRADA' : formatTime(remainingSeconds)}
                </div>
                <div className="text-xs text-secondary font-semibold mb-3">
                  {isExpired ? 'Tempo limite excedido' : 'até fim da janela de viabilidade'}
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isExpired ? 'bg-critical' : 'bg-urgent'} transition-all duration-1000 ease-linear`}
                    style={{ width: `${Math.min(100, Math.max(0, consumedPercent))}%` }}
                  ></div>
                </div>
              </div>

              {/* Elegibilidade */}
              <div className="bg-teal/10 border border-teal/30 rounded-xl p-4">
                <div className="font-bold text-teal flex items-center gap-2 mb-2">
                  <CheckCircle2 size={18} /> ELEGÍVEL PARA DOAÇÃO
                </div>
                <div className="text-xs text-text-light/90 leading-relaxed">
                  <span className="text-secondary block mb-1">CIDs:</span>
                  Insuficiência Respiratória (J96.0) · Insuficiência Cardíaca (I50.0)
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-navy/95 backdrop-blur-md border-t border-secondary/30 p-4 pb-6 sm:pb-4 flex flex-col gap-3">
            {mobileStatus === 'Equipe Acionada' && (
              <button 
                onClick={() => handleMobileStatusChange('Em Deslocamento')}
                className="w-full bg-teal hover:bg-teal/90 text-navy h-14 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,229,200,0.2)]"
              >
                ▶ INICIAR DESLOCAMENTO
              </button>
            )}
            {mobileStatus === 'Em Deslocamento' && (
              <button 
                onClick={() => handleMobileStatusChange('No Local')}
                className="w-full bg-teal hover:bg-teal/90 text-navy h-14 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,229,200,0.2)]"
              >
                ✓ CHEGUEI NO LOCAL
              </button>
            )}
            {mobileStatus === 'No Local' && (
              <button 
                onClick={() => handleMobileStatusChange('Avaliação em Andamento')}
                className="w-full bg-teal hover:bg-teal/90 text-navy h-14 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,229,200,0.2)]"
              >
                ✓ AVALIAÇÃO CONCLUÍDA
              </button>
            )}
            {mobileStatus === 'Avaliação em Andamento' && (
              <div className="w-full bg-secondary/20 border border-secondary/30 text-text-light h-14 rounded-xl font-bold text-sm flex items-center justify-center text-center px-4">
                Aguarde instrução da Central para desfecho final
              </div>
            )}

            <button className="w-full border border-text-light hover:bg-text-light/10 text-text-light h-12 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <Phone size={16} /> Ligar para a Central
            </button>
          </div>
          
          {/* Mobile Confirm Modal */}
          {mobileConfirmOpen && (
            <div className="absolute inset-0 bg-navy/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 w-full relative animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Lock size={20} className="text-urgent" />
                  Acesso Restrito
                </h3>
                <p className="text-sm text-secondary mb-6">Esse acesso será registrado. Confirmar?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setMobileConfirmOpen(false)}
                    className="flex-1 border border-secondary/50 hover:bg-secondary/10 text-text-light h-12 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={revealMobileName}
                    className="flex-1 bg-teal hover:bg-teal/90 text-navy h-12 rounded-xl font-bold text-sm transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-syne bg-navy text-text-light overflow-hidden">
      {/* TOPBAR */}
      <header className="h-16 border-b border-secondary/30 flex items-center justify-between px-6 bg-navy/90 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-2 font-bold text-xl tracking-wide">
          <span className="text-text-light">VEREDICTOS</span>
          <span className="text-teal">SENTINEL</span>
        </div>
        
        <nav className="flex items-center gap-8 text-sm font-semibold text-secondary">
          <button 
            onClick={() => setActiveTab('alertas')}
            className={`pb-1 transition-colors ${activeTab === 'alertas' ? 'text-teal border-b-2 border-teal' : 'hover:text-text-light'}`}
          >
            Alertas Ativos
          </button>
          <button 
            onClick={() => setActiveTab('atendimento')}
            className={`pb-1 transition-colors ${activeTab === 'atendimento' ? 'text-teal border-b-2 border-teal' : 'hover:text-text-light'}`}
          >
            Em Atendimento
          </button>
          <button 
            onClick={() => setActiveTab('finalizados')}
            className={`pb-1 transition-colors ${activeTab === 'finalizados' ? 'text-teal border-b-2 border-teal' : 'hover:text-text-light'}`}
          >
            Finalizados
          </button>
          <button 
            onClick={() => setActiveTab('estatisticas')}
            className={`pb-1 transition-colors ${activeTab === 'estatisticas' ? 'text-teal border-b-2 border-teal' : 'hover:text-text-light'}`}
          >
            Estatísticas
          </button>
        </nav>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsMobileView(true)}
            className="flex items-center gap-2 bg-secondary/20 hover:bg-secondary/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-secondary/30"
          >
            <Smartphone size={14} /> Visão Mobile (Equipe)
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal animate-pulse-dot"></div>
            <span className="text-teal text-xs font-bold tracking-wider">AO VIVO</span>
          </div>
          <div className="bg-secondary/20 px-4 py-1.5 rounded-full text-xs font-semibold border border-secondary/30">
            Central GO · Dr. Rodrigues
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-72 border-r border-secondary/30 bg-navy/50 p-6 flex flex-col gap-8 shrink-0 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-secondary tracking-widest uppercase mb-4">Hospitais Monitorados</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal"></div>
                <span>HUGO — Hospital de Urgências de Goiânia</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal"></div>
                <span>HGG — Hospital Geral de Goiânia</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal"></div>
                <span>HMI — Hospital Materno-Infantil</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal"></div>
                <span>HDT — Hospital de Doenças Tropicais</span>
              </li>
              <li className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-3 text-secondary">
                  <div className="w-2 h-2 rounded-full bg-urgent"></div>
                  <span>HEANA — Hospital Estadual de Anápolis</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-secondary ml-5">
                  <CloudOff size={12} />
                  <span>offline · fila local ativa</span>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-secondary tracking-widest uppercase mb-4">Resumo do Dia</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-secondary/10 px-4 py-2.5 rounded-lg border border-secondary/20">
                <span className="text-sm font-semibold">Alertas Ativos</span>
                <span className="text-lg font-bold text-teal">3</span>
              </div>
              <div className="flex justify-between items-center bg-secondary/10 px-4 py-2.5 rounded-lg border border-secondary/20">
                <span className="text-sm font-semibold">Em Atendimento</span>
                <span className="text-lg font-bold">2</span>
              </div>
              <div className="flex justify-between items-center bg-secondary/10 px-4 py-2.5 rounded-lg border border-secondary/20">
                <span className="text-sm font-semibold">Finalizados</span>
                <span className="text-lg font-bold">18</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN AREA */}
        {activeTab === 'alertas' && (
          <main className="flex-1 p-8 overflow-y-auto">
            {/* KPI CARDS */}
          <div className="grid grid-cols-4 gap-4 mb-10">
            <div className="bg-secondary/10 border border-critical/30 rounded-xl p-5 flex flex-col justify-center">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Crítico</span>
              <span className="text-3xl font-bold text-critical">1</span>
            </div>
            <div className="bg-secondary/10 border border-urgent/30 rounded-xl p-5 flex flex-col justify-center">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Urgente</span>
              <span className="text-3xl font-bold text-urgent">1</span>
            </div>
            <div className="bg-secondary/10 border border-teal/30 rounded-xl p-5 flex flex-col justify-center">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Normal</span>
              <span className="text-3xl font-bold text-teal">1</span>
            </div>
            <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-5 flex flex-col justify-center">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Tempo Médio Detecção</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-light">58s</span>
                <span className="text-xs text-secondary font-medium">janela total: 6 horas</span>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            Doadores Aguardando Ação 
            <span className="text-sm font-medium text-secondary">— ordenados por urgência</span>
          </h2>

          {/* DONOR CARDS */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {cards.map(card => {
              const consumedPercent = ((TOTAL_WINDOW_SECONDS - card.remainingSeconds) / TOTAL_WINDOW_SECONDS) * 100;
              
              let borderColor = 'border-teal';
              let badgeBg = 'bg-teal';
              let textColor = 'text-teal';
              let progressColor = 'bg-teal';
              
              if (card.color === 'critical') {
                borderColor = 'border-critical';
                badgeBg = 'bg-critical';
                textColor = 'text-critical';
                progressColor = 'bg-critical';
              } else if (card.color === 'urgent') {
                borderColor = 'border-urgent';
                badgeBg = 'bg-urgent';
                textColor = 'text-urgent';
                progressColor = 'bg-urgent';
              }

              return (
                <div key={card.id} className={`bg-[#0C1424] rounded-2xl border ${borderColor} p-6 flex flex-col relative ${card.pulse ? 'animate-pulse-border' : ''}`}>
                  {/* Badge */}
                  <div className={`absolute -top-3 left-6 ${badgeBg} text-navy text-xs font-bold px-3 py-1 rounded-full tracking-wider`}>
                    {card.type}
                  </div>

                  <div className="mt-2 mb-4">
                    <div className="text-sm text-secondary font-mono mb-1">{card.id}</div>
                    <h3 className="text-lg font-bold mb-1">{card.hospital}</h3>
                    <div className="text-sm font-medium text-text-light/80">{card.patient}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-4 mb-6 text-sm bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                    <div>
                      <span className="text-secondary text-xs block mb-0.5">Óbito</span>
                      <span className="font-semibold">{card.obito}</span>
                    </div>
                    <div>
                      <span className="text-secondary text-xs block mb-0.5">Detecção</span>
                      <span className="font-semibold">{card.deteccao}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-secondary text-xs block mb-0.5">Elegibilidade</span>
                      <span className={`font-bold ${card.elegibilidadeColor}`}>{card.elegibilidade}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-secondary text-xs block mb-0.5">CIDs</span>
                      <span className="font-medium text-text-light/90 leading-tight block">{card.cids}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-secondary">Progresso da Janela</span>
                      <span className={textColor}>{formatTime(card.remainingSeconds)} restantes</span>
                    </div>
                    <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${progressColor} transition-all duration-1000 ease-linear`} 
                        style={{ width: `${Math.min(100, Math.max(0, consumedPercent))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3">
                    {card.acknowledged ? (
                      card.teamRequested ? (
                        <div className="bg-secondary/20 border border-secondary/30 text-text-light py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                          <CheckCircle2 size={18} className="text-teal" />
                          Equipe Solicitada
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-2 text-teal text-sm font-bold mb-1">
                            <CheckCircle2 size={16} />
                            ACK CONFIRMADO às {card.ackTime}
                          </div>
                          <button 
                            onClick={() => handleRequestTeam(card.id)}
                            className="w-full bg-teal hover:bg-teal/90 text-navy py-3 rounded-xl font-bold text-sm transition-colors shadow-[0_4px_20px_rgba(0,229,200,0.15)]"
                          >
                            Solicitar Equipe de Captação
                          </button>
                        </>
                      )
                    ) : (
                      <>
                        <button 
                          onClick={() => handleAck(card.id)}
                          className="w-full bg-teal hover:bg-teal/90 text-navy py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,229,200,0.15)]"
                        >
                          ✓ CONFIRMAR RECEBIMENTO
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedCardId(card.id)}
                            className="flex-1 border border-secondary/50 hover:bg-secondary/10 text-text-light py-2.5 rounded-xl font-semibold text-sm transition-colors"
                          >
                            Ver Detalhes
                          </button>
                          <button 
                            onClick={() => openRecusaModal(card.id)}
                            className="flex-1 border border-critical text-critical hover:bg-critical/10 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                          >
                            ✗ Recusar Caso
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
        )}

        {activeTab === 'atendimento' && (
          <main className="flex-1 p-8 overflow-y-auto animate-in fade-in duration-300">
            {/* KPI CARDS */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-secondary/10 border border-urgent/30 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Em Atendimento</span>
                <span className="text-3xl font-bold text-urgent">{atendimentoCards.length}</span>
              </div>
              <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Tempo Médio Resposta</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-light">4min</span>
                  <span className="text-xs text-secondary font-medium">do alerta ao ACK</span>
                </div>
              </div>
              <div className="bg-secondary/10 border border-teal/30 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Captações Confirmadas</span>
                <span className="text-3xl font-bold text-teal">1</span>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              Casos em Andamento 
              <span className="text-sm font-medium text-secondary">— equipe acionada</span>
            </h2>

            <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/10 border-b border-secondary/30 text-secondary font-semibold">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Hospital</th>
                    <th className="p-4">Óbito</th>
                    <th className="p-4">ACK em</th>
                    <th className="p-4">Equipe</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Janela</th>
                    <th className="p-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/20">
                  {atendimentoCards.map(card => {
                    const isExpired = card.remainingSeconds <= 0;
                    const rowClass = isExpired ? 'bg-critical/5' : 'hover:bg-secondary/5';
                    
                    return (
                      <tr key={card.id} className={`${rowClass} transition-colors`}>
                        <td className="p-4 font-mono font-medium">{card.id}</td>
                        <td className="p-4 font-semibold">{card.hospital}</td>
                        <td className="p-4">{card.obito}</td>
                        <td className="p-4 text-secondary">{card.ackEm}</td>
                        <td className="p-4">{card.equipe}</td>
                        <td className="p-4">
                          <select 
                            value={isExpired ? 'EXPIRADO' : card.status}
                            onChange={(e) => handleStatusChange(card.id, e.target.value)}
                            disabled={isExpired}
                            className={`bg-navy border rounded-lg px-3 py-1.5 text-xs font-bold outline-none ${
                              isExpired ? 'border-critical text-critical' :
                              card.status === 'Equipe Acionada' ? 'border-urgent text-urgent' :
                              card.status === 'No Local' ? 'border-teal text-teal' :
                              'border-secondary text-text-light'
                            }`}
                          >
                            <option value="Equipe Acionada">Equipe Acionada</option>
                            <option value="Em Deslocamento">Em Deslocamento</option>
                            <option value="No Local">No Local</option>
                            <option value="Avaliação em Andamento">Avaliação em Andamento</option>
                            {isExpired && <option value="EXPIRADO">EXPIRADO</option>}
                          </select>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 w-32">
                            <div className={`text-xs font-bold ${isExpired ? 'text-critical' : card.status === 'Equipe Acionada' ? 'text-urgent' : 'text-teal'}`}>
                              {isExpired ? '0min restantes' : `${formatTime(card.remainingSeconds)} restantes`}
                            </div>
                            <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isExpired ? 'bg-critical' : card.status === 'Equipe Acionada' ? 'bg-urgent' : 'bg-teal'}`}
                                style={{ width: `${Math.min(100, Math.max(0, ((TOTAL_WINDOW_SECONDS - card.remainingSeconds) / TOTAL_WINDOW_SECONDS) * 100))}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 border border-secondary/50 hover:bg-secondary/10 rounded-lg text-xs font-semibold transition-colors">
                              Ver Detalhes
                            </button>
                            <button 
                              onClick={() => openDesfechoModal(card.id)}
                              className="px-3 py-1.5 bg-teal hover:bg-teal/90 text-navy rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              Registrar Desfecho
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {atendimentoCards.length === 0 && (
                <div className="p-8 text-center text-secondary">
                  Nenhum caso em andamento no momento.
                </div>
              )}
            </div>
          </main>
        )}

        {activeTab === 'finalizados' && (
          <main className="flex-1 p-8 overflow-y-auto animate-in fade-in duration-300">
            {/* KPI CARDS */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Total Finalizados</span>
                <span className="text-3xl font-bold text-text-light">{finalizadosCards.length}</span>
              </div>
              <div className="bg-secondary/10 border border-teal/30 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Captados</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-teal">{finalizadosCards.filter(c => c.desfecho === 'CAPTADO').length}</span>
                  <span className="text-xs text-secondary font-medium">61% de conversão</span>
                </div>
              </div>
              <div className="bg-secondary/10 border border-urgent/30 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Recusados/Inviáveis</span>
                <span className="text-3xl font-bold text-urgent">{finalizadosCards.filter(c => c.desfecho === 'RECUSADO' || c.desfecho === 'INVIÁVEL').length}</span>
              </div>
              <div className="bg-secondary/10 border border-critical/30 rounded-xl p-5 flex flex-col justify-center">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Expirados</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-critical">{finalizadosCards.filter(c => c.desfecho === 'EXPIRADO').length}</span>
                  <span className="text-xs text-secondary font-medium">antes do Sentinel: ~40%</span>
                </div>
              </div>
            </div>

            {/* FILTROS */}
            <div className="flex gap-4 mb-8">
              <select 
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="bg-navy border border-secondary/50 rounded-lg px-4 py-2 text-sm font-semibold text-text-light focus:outline-none focus:border-teal"
              >
                <option value="Hoje">Hoje</option>
                <option value="7 dias">7 dias</option>
                <option value="30 dias">30 dias</option>
                <option value="Personalizado">Personalizado</option>
              </select>
              <select 
                value={filtroDesfecho}
                onChange={(e) => setFiltroDesfecho(e.target.value)}
                className="bg-navy border border-secondary/50 rounded-lg px-4 py-2 text-sm font-semibold text-text-light focus:outline-none focus:border-teal"
              >
                <option value="Todos">Todos os Desfechos</option>
                <option value="Captado">Captado</option>
                <option value="Recusado">Recusado</option>
                <option value="Inviável">Inviável</option>
                <option value="Expirado">Expirado</option>
              </select>
              <select 
                value={filtroHospital}
                onChange={(e) => setFiltroHospital(e.target.value)}
                className="bg-navy border border-secondary/50 rounded-lg px-4 py-2 text-sm font-semibold text-text-light focus:outline-none focus:border-teal"
              >
                <option value="Todos os Hospitais">Todos os Hospitais</option>
                <option value="HUGO">HUGO</option>
                <option value="HGG">HGG</option>
                <option value="HMI">HMI</option>
                <option value="HDT">HDT</option>
                <option value="HEANA">HEANA</option>
              </select>
            </div>

            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              Histórico de Casos 
              <span className="text-sm font-medium text-secondary">— rastreabilidade completa</span>
            </h2>

            <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/10 border-b border-secondary/30 text-secondary font-semibold">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Hospital</th>
                    <th className="p-4">Paciente</th>
                    <th className="p-4">Óbito</th>
                    <th className="p-4">Detecção</th>
                    <th className="p-4">Desfecho</th>
                    <th className="p-4">Responsável</th>
                    <th className="p-4 text-center">Auditoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/20">
                  {filteredFinalizados.map(card => {
                    let badgeColor = 'bg-secondary/20 text-text-light';
                    if (card.desfecho === 'CAPTADO') badgeColor = 'bg-teal/20 text-teal border border-teal/30';
                    if (card.desfecho === 'RECUSADO') badgeColor = 'bg-critical/20 text-critical border border-critical/30';
                    if (card.desfecho === 'INVIÁVEL') badgeColor = 'bg-urgent/20 text-urgent border border-urgent/30';
                    if (card.desfecho === 'EXPIRADO') badgeColor = 'bg-critical/20 text-critical border border-critical/30';

                    return (
                      <tr key={card.id} className="hover:bg-secondary/5 transition-colors">
                        <td className="p-4 font-mono font-medium">{card.id}</td>
                        <td className="p-4 font-semibold">{card.hospital}</td>
                        <td className="p-4 text-secondary">{card.patient}</td>
                        <td className="p-4">{card.obito}</td>
                        <td className="p-4 text-secondary">{card.deteccao}</td>
                        <td className="p-4">
                          <div className="group relative inline-block">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
                              {card.desfecho}
                            </span>
                            {card.motivo && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-navy border border-secondary/50 rounded-lg text-xs text-text-light whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {card.motivo}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">{card.responsavel}</td>
                        <td className="p-4 text-center">
                          <button className="text-secondary hover:text-teal transition-colors" title="Ver log de auditoria">
                            <Lock size={16} className="mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredFinalizados.length === 0 && (
                <div className="p-8 text-center text-secondary">
                  Nenhum caso encontrado com os filtros atuais.
                </div>
              )}
            </div>
          </main>
        )}

        {activeTab === 'estatisticas' && (
          <main className="flex-1 p-8 overflow-y-auto animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-4">
                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-secondary hover:text-text-light hover:bg-secondary/10 transition-colors">Hoje</button>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-secondary hover:text-text-light hover:bg-secondary/10 transition-colors">7 dias</button>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary/20 text-text-light border border-secondary/30 transition-colors">30 dias</button>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-secondary hover:text-text-light hover:bg-secondary/10 transition-colors">Personalizado</button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-teal border border-teal hover:bg-teal/10 transition-colors">
                ↓ Exportar Relatório
              </button>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-teal border border-teal/30 rounded-xl p-6 flex flex-col justify-center text-navy shadow-[0_0_30px_rgba(0,229,200,0.15)]">
                <span className="text-5xl font-bold mb-2">58s</span>
                <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Tempo Médio de Detecção</span>
                <span className="text-xs font-medium opacity-75">do óbito ao primeiro alerta</span>
              </div>
              <div className="bg-text-light border border-secondary/30 rounded-xl p-6 flex flex-col justify-center text-navy">
                <span className="text-5xl font-bold mb-2">100%</span>
                <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Taxa de Detecção</span>
                <span className="text-xs font-medium opacity-75">nenhum óbito elegível perdido</span>
              </div>
              <div className="bg-secondary/10 border border-teal/30 rounded-xl p-6 flex flex-col justify-center">
                <span className="text-5xl font-bold text-teal mb-2">61%</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Taxa de Captação</span>
                <span className="text-xs text-secondary font-medium">notificação → córnea coletada</span>
              </div>
              <div className="bg-secondary/10 border border-urgent/30 rounded-xl p-6 flex flex-col justify-center">
                <span className="text-5xl font-bold text-urgent mb-2">4min</span>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Tempo Médio de ACK</span>
                <span className="text-xs text-secondary font-medium">do alerta à confirmação da Central</span>
              </div>
            </div>

            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-6">Óbitos Detectados por Hospital <span className="text-sm font-medium text-secondary font-normal">— últimos 30 dias</span></h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#5A6A8A" opacity={0.2} vertical={false} />
                      <XAxis dataKey="name" stroke="#5A6A8A" tick={{ fill: '#5A6A8A', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#5A6A8A" tick={{ fill: '#5A6A8A', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: '#5A6A8A', opacity: 0.1 }}
                        contentStyle={{ backgroundColor: '#080E1A', borderColor: '#5A6A8A', borderRadius: '8px', color: '#F0F4FF' }}
                        itemStyle={{ color: '#F0F4FF' }}
                      />
                      <Legend iconType="square" wrapperStyle={{ fontSize: '12px', color: '#5A6A8A', paddingTop: '10px' }} />
                      <Bar dataKey="detectados" name="Detectados" fill="#00E5C8" radius={[4, 4, 0, 0]} animationDuration={1500} />
                      <Bar dataKey="captados" name="Captados" fill="#1E2A45" radius={[4, 4, 0, 0]} animationDuration={1500} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 flex flex-col">
                <h3 className="text-lg font-bold mb-2">Desfechos <span className="text-sm font-medium text-secondary font-normal">— últimos 30 dias</span></h3>
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                          animationDuration={1500}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#080E1A', borderColor: '#5A6A8A', borderRadius: '8px', color: '#F0F4FF' }}
                          itemStyle={{ color: '#F0F4FF' }}
                          formatter={(value: any) => [`${value}%`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-bold">37</span>
                    <span className="text-xs text-secondary font-semibold">casos totais</span>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    {pieData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{entry.value}%</span>
                          <span className="text-xs text-secondary">{entry.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CHART ROW 2 */}
            <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-6">Latência de Detecção <span className="text-sm font-medium text-secondary font-normal">— P95 por dia (últimos 30 dias)</span></h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#5A6A8A" opacity={0.2} vertical={false} />
                    <XAxis dataKey="date" stroke="#5A6A8A" tick={{ fill: '#5A6A8A', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
                    <YAxis domain={[0, 180]} stroke="#5A6A8A" tick={{ fill: '#5A6A8A', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#080E1A', borderColor: '#5A6A8A', borderRadius: '8px', color: '#F0F4FF' }}
                      labelStyle={{ color: '#5A6A8A', marginBottom: '4px' }}
                      formatter={(value: any) => [`${value}s (P95)`, 'Latência']}
                    />
                    <ReferenceLine y={120} stroke="#FF4A4A" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'SLA máximo: 120s', fill: '#FF4A4A', fontSize: 12, dy: -10 }} />
                    <Line type="monotone" dataKey="p95" stroke="#00E5C8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#00E5C8', stroke: '#080E1A', strokeWidth: 2 }} animationDuration={2000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CARDS ROW 3 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-6">Performance por Hospital</h3>
                <table className="w-full text-left text-sm">
                  <thead className="text-secondary font-semibold border-b border-secondary/30">
                    <tr>
                      <th className="pb-3 w-8">#</th>
                      <th className="pb-3">Hospital</th>
                      <th className="pb-3 text-center">Detecções</th>
                      <th className="pb-3 text-center">Captações</th>
                      <th className="pb-3 text-right">Tempo médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary/20">
                    <tr className="hover:bg-secondary/5 transition-colors">
                      <td className="py-3 text-secondary font-bold">1</td>
                      <td className="py-3 font-semibold">HUGO</td>
                      <td className="py-3 text-center">12</td>
                      <td className="py-3 text-center font-bold text-teal">8 <span className="text-xs text-secondary font-normal">(67%)</span></td>
                      <td className="py-3 text-right">52s</td>
                    </tr>
                    <tr className="hover:bg-secondary/5 transition-colors">
                      <td className="py-3 text-secondary font-bold">2</td>
                      <td className="py-3 font-semibold">HGG</td>
                      <td className="py-3 text-center">9</td>
                      <td className="py-3 text-center font-bold text-teal">5 <span className="text-xs text-secondary font-normal">(56%)</span></td>
                      <td className="py-3 text-right">61s</td>
                    </tr>
                    <tr className="hover:bg-secondary/5 transition-colors">
                      <td className="py-3 text-secondary font-bold">3</td>
                      <td className="py-3 font-semibold">HMI</td>
                      <td className="py-3 text-center">7</td>
                      <td className="py-3 text-center font-bold text-teal">4 <span className="text-xs text-secondary font-normal">(57%)</span></td>
                      <td className="py-3 text-right">58s</td>
                    </tr>
                    <tr className="hover:bg-secondary/5 transition-colors">
                      <td className="py-3 text-secondary font-bold">4</td>
                      <td className="py-3 font-semibold">HDT</td>
                      <td className="py-3 text-center">6</td>
                      <td className="py-3 text-center font-bold text-teal">3 <span className="text-xs text-secondary font-normal">(50%)</span></td>
                      <td className="py-3 text-right">71s</td>
                    </tr>
                    <tr className="hover:bg-secondary/5 transition-colors">
                      <td className="py-3 text-secondary font-bold">5</td>
                      <td className="py-3 font-semibold">
                        HEANA
                        <div className="text-[10px] text-secondary mt-0.5 flex items-center gap-1"><CloudOff size={10} /> offline-first ativo</div>
                      </td>
                      <td className="py-3 text-center">3</td>
                      <td className="py-3 text-center font-bold text-teal">2 <span className="text-xs text-secondary font-normal">(67%)</span></td>
                      <td className="py-3 text-right">84s</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 flex flex-col">
                <h3 className="text-lg font-bold mb-6">Impacto desde a implantação</h3>
                <div className="flex flex-col gap-5 flex-1 justify-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl shrink-0">🔵</div>
                    <div className="text-lg"><span className="font-bold text-2xl mr-2"><CountUp end={37} /></span> óbitos elegíveis detectados automaticamente</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal/20 text-teal flex items-center justify-center text-xl shrink-0">🟢</div>
                    <div className="text-lg"><span className="font-bold text-2xl mr-2 text-teal"><CountUp end={23} /></span> córneas captadas</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xl shrink-0">⏱</div>
                    <div className="text-lg"><span className="font-bold text-2xl mr-2"><CountUp end={0} /></span> casos perdidos por falha de notificação</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">👁</div>
                    <div className="text-lg"><span className="font-bold text-2xl mr-2 text-amber-400"><CountUp end={23} /></span> pacientes que voltarão a enxergar</div>
                  </div>
                </div>
                <div className="bg-teal/10 border border-teal/30 rounded-xl p-5 text-center">
                  <div className="text-sm text-secondary font-semibold mb-1">Antes do Sentinel: ~40% de notificação</div>
                  <div className="text-xl font-bold text-teal">Depois do Sentinel: 100% de notificação</div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* MODALS */}
      {selectedCard && (
        <div 
          className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCardId(null);
          }}
        >
          <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl w-full max-w-4xl relative animate-in slide-in-from-bottom-8 fade-in duration-300 my-8 shadow-2xl shadow-black/50">
            {/* CABEÇALHO */}
            <div className="flex items-start justify-between p-6 border-b border-secondary/30">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold font-mono">{selectedCard.id}</span>
                  <div className={`text-navy text-xs font-bold px-3 py-1 rounded-full tracking-wider ${
                    selectedCard.color === 'critical' ? 'bg-critical' : 
                    selectedCard.color === 'urgent' ? 'bg-urgent' : 'bg-teal'
                  }`}>
                    {selectedCard.type}
                  </div>
                </div>
                <div className="text-secondary font-semibold">{selectedCard.hospital}</div>
              </div>
              <button 
                onClick={() => setSelectedCardId(null)}
                className="text-secondary hover:text-text-light transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* COLUNA ESQUERDA */}
              <div className="flex flex-col gap-8">
                
                {/* SEÇÃO 1 — IDENTIFICAÇÃO DO PACIENTE */}
                <section>
                  <h4 className="text-xs font-bold text-secondary tracking-widest uppercase mb-3">Identificação do Paciente</h4>
                  <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                    <div className="font-medium mb-3">{selectedCard.patient}</div>
                    
                    {!idRevealed[selectedCard.id]?.revealed ? (
                      <button 
                        onClick={() => setIdConfirmModalOpen(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal/80 transition-colors"
                      >
                        <Lock size={16} /> Ver Identificação Completa
                      </button>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-secondary/20 space-y-1">
                        <div className="text-sm"><span className="text-secondary">Nome:</span> João da Silva</div>
                        <div className="text-sm"><span className="text-secondary">Prontuário:</span> 98765 — {selectedCard.hospital.split(' ')[0]}</div>
                        <div className="text-xs text-secondary mt-2 flex items-center gap-1">
                          <Clock size={12} /> Acessado por Dr. Rodrigues às {idRevealed[selectedCard.id].timestamp} — registrado
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* SEÇÃO 2 — ELEGIBILIDADE */}
                <section>
                  <h4 className="text-xs font-bold text-secondary tracking-widest uppercase mb-3">12 Critérios Verificados</h4>
                  <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                    <ul className="space-y-2 text-sm mb-4">
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-teal" /> Parada Cardiorrespiratória</div>
                        <span className="text-secondary text-xs">(I46.9)</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-teal" /> Infarto Agudo do Miocárdio</div>
                        <span className="text-secondary text-xs">(I21.0)</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Ban size={16} className="text-secondary" /> HIV/AIDS</div>
                        <span className="text-secondary text-xs">não detectado</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Ban size={16} className="text-secondary" /> Hepatite Viral Ativa</div>
                        <span className="text-secondary text-xs">não detectado</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Ban size={16} className="text-secondary" /> Sepse / Septicemia</div>
                        <span className="text-secondary text-xs">não detectado</span>
                      </li>
                      
                      {criteriaExpanded && (
                        <>
                          <li className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Ban size={16} className="text-secondary" /> Leucemia / Linfoma</div>
                            <span className="text-secondary text-xs">não detectado</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Ban size={16} className="text-secondary" /> Doença de Creutzfeldt-Jakob</div>
                            <span className="text-secondary text-xs">não detectado</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Ban size={16} className="text-secondary" /> Raiva</div>
                            <span className="text-secondary text-xs">não detectado</span>
                          </li>
                        </>
                      )}
                    </ul>
                    <button 
                      onClick={() => setCriteriaExpanded(!criteriaExpanded)}
                      className="text-xs font-semibold text-secondary hover:text-text-light transition-colors mb-4"
                    >
                      {criteriaExpanded ? 'ocultar critérios' : 'ver todos os 12 critérios'}
                    </button>

                    <div className={`p-3 rounded-lg border ${selectedCard.elegibilidade === 'REVISÃO NECESSÁRIA' ? 'bg-urgent/10 border-urgent/30' : 'bg-teal/10 border-teal/30'}`}>
                      <div className={`font-bold flex items-center gap-2 ${selectedCard.elegibilidadeColor}`}>
                        <CheckCircle2 size={18} /> {selectedCard.elegibilidade === 'REVISÃO NECESSÁRIA' ? 'REVISÃO NECESSÁRIA' : 'ELEGÍVEL PARA DOAÇÃO'}
                      </div>
                      <div className="text-xs mt-1 text-text-light/80">
                        {selectedCard.elegibilidade === 'REVISÃO NECESSÁRIA' ? 'Possível contraindicação detectada. Requer análise.' : 'Nenhuma contraindicação detectada'}
                      </div>
                    </div>
                  </div>
                </section>

              </div>

              {/* COLUNA DIREITA */}
              <div className="flex flex-col gap-8">
                
                {/* SEÇÃO 3 — ANÁLISE NLP */}
                <section>
                  <h4 className="text-xs font-bold text-secondary tracking-widest uppercase mb-3">Evolução Médica — Análise IA</h4>
                  <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                    <p className="text-sm leading-relaxed mb-4 text-text-light/90">
                      "Paciente admitido em <span className="text-teal font-semibold">PCR</span> às 02:31h. 
                      Realizadas <span className="text-teal font-semibold">manobras de reanimação</span> por 40 minutos 
                      sem sucesso. <span className="text-teal font-semibold">ECG isoelétrico</span> confirmado. 
                      <span className="text-teal font-semibold">Óbito constatado</span> às {selectedCard.obito}."
                    </p>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-secondary">Confiança da detecção: 92%</span>
                      </div>
                      <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                        <div className="h-full bg-teal w-[92%]"></div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* SEÇÃO 4 — JANELA DE VIABILIDADE */}
                <section>
                  <h4 className="text-xs font-bold text-secondary tracking-widest uppercase mb-3">Janela de Viabilidade</h4>
                  <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="text-sm text-secondary mb-1">Óbito: <span className="text-text-light font-semibold">{selectedCard.obito}</span></div>
                        <div className="text-sm text-secondary">Deadline: <span className="text-text-light font-semibold">
                          {(() => {
                            const [h, m] = selectedCard.obito.replace('h', '').split(':').map(Number);
                            const deadlineH = (h + 6) % 24;
                            return `${deadlineH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}h`;
                          })()}
                        </span> (6 horas após óbito)</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-critical">{formatTime(selectedCard.remainingSeconds)}</div>
                        <div className="text-xs text-secondary font-semibold">restantes</div>
                      </div>
                    </div>
                    
                    <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-critical transition-all duration-1000 ease-linear" 
                        style={{ width: `${Math.min(100, Math.max(0, ((TOTAL_WINDOW_SECONDS - selectedCard.remainingSeconds) / TOTAL_WINDOW_SECONDS) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </section>

                {/* SEÇÃO 5 — ESCALONAMENTO */}
                <section>
                  <h4 className="text-xs font-bold text-secondary tracking-widest uppercase mb-3">Protocolo de Notificação</h4>
                  <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-teal mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-teal mr-2">02:48h</span>
                          <span className="text-text-light/90">Dashboard alertado</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-teal mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-teal mr-2">02:48h</span>
                          <span className="text-text-light/90">SMS enviado para Dr. Rodrigues</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 size={16} className="text-teal mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-teal mr-2">02:49h</span>
                          <span className="text-text-light/90">WhatsApp enviado para Grupo Captação GO</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 opacity-70">
                        <Hourglass size={16} className="text-secondary mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-secondary mr-2">02:53h</span>
                          <span className="text-text-light/90">Ligação VoIP (aguardando 5min sem ACK)</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </section>

              </div>
            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="p-6 border-t border-secondary/30 bg-secondary/5 rounded-b-2xl flex gap-4">
              {selectedCard.acknowledged ? (
                selectedCard.teamRequested ? (
                  <div className="flex-1 bg-secondary/20 border border-secondary/30 text-text-light py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} className="text-teal" />
                    Equipe Solicitada
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      handleRequestTeam(selectedCard.id);
                      setSelectedCardId(null);
                    }}
                    className="flex-1 bg-teal hover:bg-teal/90 text-navy py-3.5 rounded-xl font-bold text-sm transition-colors shadow-[0_4px_20px_rgba(0,229,200,0.15)]"
                  >
                    Solicitar Equipe de Captação
                  </button>
                )
              ) : (
                <>
                  <button 
                    onClick={() => {
                      handleAck(selectedCard.id);
                      setSelectedCardId(null);
                    }}
                    className="flex-1 bg-teal hover:bg-teal/90 text-navy py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,229,200,0.15)]"
                  >
                    ✓ CONFIRMAR RECEBIMENTO
                  </button>
                  {selectedCard.elegibilidade === 'REVISÃO NECESSÁRIA' && (
                    <button className="flex-1 border border-urgent text-urgent hover:bg-urgent/10 py-3.5 rounded-xl font-bold text-sm transition-colors">
                      Solicitar Revisão Médica
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      openRecusaModal(selectedCard.id);
                      setSelectedCardId(null);
                    }}
                    className="flex-1 border border-critical text-critical hover:bg-critical/10 py-3.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    ✗ RECUSAR CASO
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL CONFIRMAÇÃO IDENTIFICAÇÃO */}
      {idConfirmModalOpen && (
        <div className="fixed inset-0 bg-navy/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Lock size={20} className="text-urgent" />
              Acesso Restrito
            </h3>
            <p className="text-sm text-secondary mb-6">Esse acesso será registrado no log de auditoria do sistema. Confirmar visualização de dados sensíveis?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIdConfirmModalOpen(false)}
                className="flex-1 border border-secondary/50 hover:bg-secondary/10 text-text-light py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const now = new Date();
                  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}h`;
                  setIdRevealed(prev => ({
                    ...prev,
                    [selectedCardId!]: { revealed: true, timestamp: timeStr }
                  }));
                  setIdConfirmModalOpen(false);
                }}
                className="flex-1 bg-teal hover:bg-teal/90 text-navy py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL CONFIRMAÇÃO ACK */}
      {ackModalOpen && (
        <div className="fixed inset-0 bg-navy/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-teal" />
              Confirmar Recebimento
            </h3>
            <p className="text-sm text-secondary mb-6">Confirmar que você recebeu e está ciente deste alerta?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setAckModalOpen(null)}
                className="flex-1 border border-secondary/50 hover:bg-secondary/10 text-text-light py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmAck}
                className="flex-1 bg-teal hover:bg-teal/90 text-navy py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL CONFIRMAÇÃO RECUSA */}
      {refuseConfirmModalOpen && (
        <div className="fixed inset-0 bg-navy/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <AlertTriangle size={20} className="text-critical" />
              Recusar Caso
            </h3>
            <p className="text-sm text-secondary mb-6">Tem certeza que deseja recusar este caso?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setRefuseConfirmModalOpen(null)}
                className="flex-1 border border-secondary/50 hover:bg-secondary/10 text-text-light py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmRefuseConfirm}
                className="flex-1 bg-critical hover:bg-critical/90 text-navy py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Sim, recusar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL JUSTIFICATIVA DE RECUSA */}
      {recusaModalOpen && (
        <div className="fixed inset-0 bg-navy/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 max-w-lg w-full relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setRecusaModalOpen(null)}
              className="absolute top-4 right-4 text-secondary hover:text-text-light"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-6">Motivo da Recusa</h2>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="recusaReason" value="Família não autorizou" checked={recusaForm.reason === 'Família não autorizou'} onChange={e => setRecusaForm({...recusaForm, reason: e.target.value})} className="accent-critical w-4 h-4" />
                <span className="font-semibold text-sm">Família não autorizou</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="recusaReason" value="Contraindicação identificada presencialmente" checked={recusaForm.reason === 'Contraindicação identificada presencialmente'} onChange={e => setRecusaForm({...recusaForm, reason: e.target.value})} className="accent-critical w-4 h-4" />
                <span className="font-semibold text-sm">Contraindicação identificada presencialmente</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="recusaReason" value="Córnea inviável na avaliação local" checked={recusaForm.reason === 'Córnea inviável na avaliação local'} onChange={e => setRecusaForm({...recusaForm, reason: e.target.value})} className="accent-critical w-4 h-4" />
                <span className="font-semibold text-sm">Córnea inviável na avaliação local</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="recusaReason" value="Equipe indisponível" checked={recusaForm.reason === 'Equipe indisponível'} onChange={e => setRecusaForm({...recusaForm, reason: e.target.value})} className="accent-critical w-4 h-4" />
                <span className="font-semibold text-sm">Equipe indisponível</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="recusaReason" value="Outro" checked={recusaForm.reason === 'Outro'} onChange={e => setRecusaForm({...recusaForm, reason: e.target.value})} className="accent-critical w-4 h-4" />
                <span className="font-semibold text-sm">Outro</span>
              </label>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2 text-text-light">Observações adicionais</label>
              <textarea 
                value={recusaForm.obs}
                onChange={e => setRecusaForm({...recusaForm, obs: e.target.value})}
                className="w-full bg-navy border border-secondary/50 rounded-lg p-3 text-sm text-text-light focus:outline-none focus:border-critical h-24 resize-none"
                placeholder="Detalhes sobre a recusa..."
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setRecusaModalOpen(null)}
                className="flex-1 border border-secondary/50 hover:bg-secondary/10 text-text-light py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmRecusa}
                disabled={!recusaForm.reason}
                className="flex-1 bg-critical hover:bg-critical/90 disabled:bg-critical/30 disabled:text-navy/50 text-navy py-3 rounded-xl font-bold text-sm transition-colors"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}

      {teamModalOpen && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 max-w-md w-full relative">
            <button 
              onClick={() => setTeamModalOpen(null)}
              className="absolute top-4 right-4 text-secondary hover:text-text-light"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-2">Solicitar Equipe de Captação</h2>
            <p className="text-sm text-secondary mb-6">Confirme o acionamento da equipe para o doador {teamModalOpen}.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-text-light">Observações (opcional)</label>
              <textarea 
                value={teamObs}
                onChange={(e) => setTeamObs(e.target.value)}
                className="w-full bg-navy border border-secondary/50 rounded-lg p-3 text-sm text-text-light focus:outline-none focus:border-teal h-24 resize-none"
                placeholder="Ex: Contato com a família já realizado..."
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setTeamModalOpen(null)}
                className="flex-1 border border-secondary/50 hover:bg-secondary/10 text-text-light py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmTeamRequest}
                className="flex-1 bg-teal hover:bg-teal/90 text-navy py-2.5 rounded-xl font-bold text-sm transition-colors"
              >
                Confirmar Acionamento
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL REGISTRAR DESFECHO */}
      {desfechoModalOpen && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0C1424] border border-secondary/30 rounded-2xl p-6 max-w-lg w-full relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setDesfechoModalOpen(null)}
              className="absolute top-4 right-4 text-secondary hover:text-text-light"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold mb-6">Registrar Desfecho — {desfechoModalOpen}</h2>
            
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="outcome" value="Captado" checked={desfechoForm.outcome === 'Captado'} onChange={e => setDesfechoForm({...desfechoForm, outcome: e.target.value})} className="accent-teal w-4 h-4" />
                <span className="font-semibold flex items-center gap-2"><CheckCircle2 size={18} className="text-teal" /> Captado — córneas coletadas com sucesso</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="outcome" value="Recusado" checked={desfechoForm.outcome === 'Recusado'} onChange={e => setDesfechoForm({...desfechoForm, outcome: e.target.value})} className="accent-teal w-4 h-4" />
                <span className="font-semibold flex items-center gap-2"><X size={18} className="text-critical" /> Recusado — família não autorizou</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="outcome" value="Inviável" checked={desfechoForm.outcome === 'Inviável'} onChange={e => setDesfechoForm({...desfechoForm, outcome: e.target.value})} className="accent-teal w-4 h-4" />
                <span className="font-semibold flex items-center gap-2"><AlertTriangle size={18} className="text-urgent" /> Inviável — contraindicação na avaliação local</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <input type="radio" name="outcome" value="Expirado" checked={desfechoForm.outcome === 'Expirado'} onChange={e => setDesfechoForm({...desfechoForm, outcome: e.target.value})} className="accent-teal w-4 h-4" />
                <span className="font-semibold flex items-center gap-2"><Clock size={18} className="text-secondary" /> Expirado — janela de viabilidade esgotada</span>
              </label>
            </div>

            {(desfechoForm.outcome === 'Recusado' || desfechoForm.outcome === 'Inviável') && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-semibold mb-2 text-text-light">Motivo</label>
                <select 
                  value={desfechoForm.reason}
                  onChange={e => setDesfechoForm({...desfechoForm, reason: e.target.value})}
                  className="w-full bg-navy border border-secondary/50 rounded-lg p-3 text-sm text-text-light focus:outline-none focus:border-teal"
                >
                  <option value="">Selecione um motivo...</option>
                  <option value="Família não autorizou">Família não autorizou</option>
                  <option value="Contraindicação identificada presencialmente">Contraindicação identificada presencialmente</option>
                  <option value="Córnea inviável na avaliação local">Córnea inviável na avaliação local</option>
                  <option value="Equipe indisponível">Equipe indisponível</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-semibold mb-2 text-text-light">Observações adicionais</label>
              <textarea 
                value={desfechoForm.obs}
                onChange={e => setDesfechoForm({...desfechoForm, obs: e.target.value})}
                className="w-full bg-navy border border-secondary/50 rounded-lg p-3 text-sm text-text-light focus:outline-none focus:border-teal h-24 resize-none"
                placeholder="Detalhes sobre o desfecho..."
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setDesfechoModalOpen(null)}
                className="flex-1 border border-secondary/50 hover:bg-secondary/10 text-text-light py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDesfecho}
                disabled={!desfechoForm.outcome || ((desfechoForm.outcome === 'Recusado' || desfechoForm.outcome === 'Inviável') && !desfechoForm.reason)}
                className="flex-1 bg-teal hover:bg-teal/90 disabled:bg-teal/30 disabled:text-navy/50 text-navy py-3 rounded-xl font-bold text-sm transition-colors"
              >
                Confirmar Desfecho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
