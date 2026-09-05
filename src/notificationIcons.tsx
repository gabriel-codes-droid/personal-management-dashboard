import {
  Mail,
  AlertTriangle,
  CreditCard,
  BarChart3,
  AlertOctagon,
  Hamburger,
  CheckCircle2,
  Utensils,
  Clock,
  Bell,
  Activity,
  Trophy,
  Thermometer,
  ClipboardList,
} from 'lucide-react';

// Shared across Notifications.tsx and Home.tsx so a notification's
// icon key always renders the same lucide icon everywhere it appears.
export const iconFromKey = (key: string) => {
  switch (key) {
    case 'mail': return <Mail size={14} />;
    case 'warning': return <AlertTriangle size={14} />;
    case 'creditcard': return <CreditCard size={14} />;
    case 'barChart': return <BarChart3 size={14} />;
    case 'alertOctagon': return <AlertOctagon size={14} />;
    case 'hamburger': return <Hamburger size={14} />;
    case 'checkCircle': return <CheckCircle2 size={14} />;
    case 'utensils': return <Utensils size={14} />;
    case 'clock': return <Clock size={14} />;
    case 'bell': return <Bell size={14} />;
    case 'activity': return <Activity size={14} />;
    case 'trophy': return <Trophy size={14} />;
    case 'sweat': return <Thermometer size={14} />;
    case 'clipboardList': return <ClipboardList size={14} />;
    default: return <Bell size={14} />;
  }
};
