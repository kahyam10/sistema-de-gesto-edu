/**
 * Conjunto central de ícones (lucide-react) com stroke e tamanho padronizados.
 * Nunca importar do lucide direto nas telas — sempre via <Icon name="..." />.
 * Defaults do design: size 18, strokeWidth 1.6 (item ativo da nav usa 2).
 */
import {
  LayoutDashboard, Users, User, FileText, Calendar, BarChart3, Bell, ShieldCheck,
  Settings, Search, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, Plus, Minus,
  X, Check, Filter, Download, Upload, Pencil, Trash2, MapPin, Phone, Mail, Activity,
  ArrowUp, ArrowDown, ArrowRight, ArrowLeft, TrendingUp, TrendingDown, MoreHorizontal,
  MoreVertical, Bookmark, Package, AlertTriangle, Info, LayoutGrid, List, RefreshCcw,
  Star, Eye, Clock, Megaphone, Layers, Tag, Home, KeyRound, Archive, CreditCard,
  GraduationCap, BookOpen, School, ClipboardList, NotebookPen, Backpack, Building2,
  DoorOpen, CalendarDays, Network, Code2, Cpu, LogOut, UserPlus, Printer,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export const iconMap = {
  home: Home,
  dashboard: LayoutDashboard,
  users: Users,
  user: User,
  userPlus: UserPlus,
  file: FileText,
  calendar: Calendar,
  calendarDays: CalendarDays,
  chart: BarChart3,
  bell: Bell,
  shield: ShieldCheck,
  settings: Settings,
  search: Search,
  chevron: ChevronRight,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  filter: Filter,
  download: Download,
  upload: Upload,
  edit: Pencil,
  trash: Trash2,
  location: MapPin,
  phone: Phone,
  mail: Mail,
  activity: Activity,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  trendUp: TrendingUp,
  trendDown: TrendingDown,
  dots: MoreHorizontal,
  dotsV: MoreVertical,
  bookmark: Bookmark,
  package: Package,
  warning: AlertTriangle,
  info: Info,
  grid: LayoutGrid,
  list: List,
  refresh: RefreshCcw,
  star: Star,
  eye: Eye,
  clock: Clock,
  speaker: Megaphone,
  layers: Layers,
  tag: Tag,
  key: KeyRound,
  archive: Archive,
  creditCard: CreditCard,
  logout: LogOut,
  printer: Printer,
  // Domínio educação
  graduation: GraduationCap,
  book: BookOpen,
  school: School,
  clipboard: ClipboardList,
  notebook: NotebookPen,
  backpack: Backpack,
  building: Building2,
  door: DoorOpen,
  hierarchy: Network,
  code: Code2,
  cpu: Cpu,
} as const;

export type IconName = keyof typeof iconMap;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 18, strokeWidth = 1.6, ...rest }: IconProps) {
  const Cmp: LucideIcon = iconMap[name] ?? MoreHorizontal;
  return <Cmp size={size} strokeWidth={strokeWidth} {...rest} />;
}
