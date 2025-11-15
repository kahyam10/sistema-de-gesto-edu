# Sistema de Gestão Educacional de Ibirapitanga

Sistema completo de gestão educacional para o município de Ibirapitanga, integrando matrículas, gestão pedagógica, recursos humanos, programas especiais e muito mais.

## Status do Projeto

**Fase Atual**: Desenvolvimento Ativo - Fase 1 (Fundação)
**Módulos em Desenvolvimento**: Gestão de Matrículas e Alunos

**Experience Qualities**:
1. **Professional** - Creates confidence and credibility for presenting to municipal stakeholders and education officials
2. **Clear** - Complex information organized intuitively, making the ambitious project scope understandable at a glance
3. **Interactive** - Engaging exploration of modules, timelines, and features that brings the vision to life

**Complexity Level**: Complex Application (advanced functionality, accounts)
  - Sistema multi-módulo com autenticação, gestão de usuários, múltiplos perfis de acesso (Professor, Aluno, Diretor, SEMEC), persistência de dados, e integração com sistemas federais

## Essential Features

### Feature 1: Sistema de Matrículas (EM DESENVOLVIMENTO)
- **Functionality**: Formulário completo de matrícula online com validação de dados, controle de vagas, regras especiais para PCD
- **Purpose**: Digitalizar e agilizar o processo de matrícula eliminando filas e papel
- **Trigger**: Usuário acessa aba Desenvolvimento → Clica em módulo de Matrículas → Clica em "Nova Matrícula"
- **Progression**: Preenche dados do aluno → Dados do responsável → Endereço → Informações escolares → Marca necessidades especiais (se houver) → Submete formulário → Recebe confirmação → Matrícula aparece na lista
- **Success criteria**: Formulário valida todos os campos obrigatórios, dados persistem no sistema, lista de matrículas atualiza em tempo real, interface responsiva

### Feature 2: Dashboard de Progresso
- **Functionality**: Visão geral do desenvolvimento do sistema com módulos, cronograma e KPIs
- **Purpose**: Acompanhar evolução do projeto e comunicar progresso aos stakeholders
- **Trigger**: Usuário acessa aplicação ou clica em abas Overview/Módulos/Timeline/KPIs
- **Progression**: View overall stats → Drill into module progress → See completed features → Update progress → Export report
- **Success criteria**: Métricas precisas, atualizações persistem, feedback visual imediato

### Feature 3: Module Explorer
- **Functionality**: Interactive cards displaying all 9 system modules with detailed sub-modules and features
- **Purpose**: Help stakeholders understand the full scope and structure of the proposed system
- **Trigger**: User lands on dashboard or clicks "Modules" tab
- **Progression**: View module grid → Click module card → See expanded details with sub-modules → Mark features as completed → Return to grid
- **Success criteria**: All modules clearly presented, expandable details work smoothly, visual hierarchy makes scanning easy

### Feature 2: Implementation Timeline
- **Functionality**: Visual timeline showing 4 implementation phases across 12 months with module assignments
- **Purpose**: Communicate realistic project roadmap and help with planning and resource allocation
- **Trigger**: User clicks "Timeline" tab
- **Progression**: View phase cards → See month ranges → Review assigned modules → Understand dependencies → Update phase status
- **Success criteria**: Timeline is visually clear, phases are distinct, progress is trackable

### Feature 3: Progress Tracker
- **Functionality**: Real-time dashboard showing overall completion, module-by-module progress, and recent updates
- **Purpose**: Track development progress and maintain project momentum visibility
- **Trigger**: User clicks "Progress" tab or views dashboard home
- **Progression**: View overall stats → Drill into module progress → See completed features → Add completion updates → Export progress report
- **Success criteria**: Progress metrics are accurate, updates persist, visual feedback is immediate

### Feature 4: Technical Specifications Viewer
- **Functionality**: Organized display of technology stack, security requirements, and architecture decisions
- **Purpose**: Document technical decisions and communicate requirements to development team
- **Trigger**: User clicks "Tech Stack" tab
- **Progression**: View technology categories → See selected tools → Read justifications → Access external documentation links
- **Success criteria**: Tech stack is comprehensive, well-organized, and includes rationale

### Feature 5: KPI Dashboard
- **Functionality**: Display key performance indicators and success metrics for the system
- **Purpose**: Define and track measures of success for the educational management system
- **Trigger**: User clicks "KPIs" tab
- **Progression**: View KPI categories → See target vs. current metrics → Understand measurement methods → Update values
- **Success criteria**: KPIs are relevant to educational outcomes, visually distinct, easy to update

## Edge Case Handling
- **Empty Progress State**: Show motivational getting-started message with sample data option
- **Module Completion**: Celebratory animation when module reaches 100% with confetti effect
- **Data Export**: Allow exporting progress reports as shareable format when requested
- **Mobile Navigation**: Responsive tabs collapse to dropdown menu on small screens
- **Long Content**: Scrollable areas for module details that exceed viewport height

## Design Direction
The design should feel professional, trustworthy, and government-appropriate while remaining modern and accessible - striking a balance between the seriousness of public education administration and the innovation of digital transformation. The interface should communicate competence and attention to detail, using a clean, organized layout that reflects the systematic nature of the project itself.

## Color Selection
Custom palette - Educational and governmental with warmth and optimism

- **Primary Color**: Deep Blue (oklch(0.45 0.12 250)) - Communicates trust, stability, and professionalism expected in educational/government systems
- **Secondary Colors**: 
  - Soft Teal (oklch(0.65 0.10 200)) - Supporting color for secondary actions, represents growth and learning
  - Warm Gray (oklch(0.55 0.01 60)) - Neutral foundation for less prominent UI elements
- **Accent Color**: Vibrant Orange (oklch(0.70 0.18 50)) - Draws attention to CTAs and progress indicators, adds warmth and energy
- **Foreground/Background Pairings**:
  - Background (White oklch(0.98 0 0)): Deep Blue text (oklch(0.25 0.08 250)) - Ratio 10.5:1 ✓
  - Card (Light Blue oklch(0.96 0.02 240)): Deep Blue text (oklch(0.25 0.08 250)) - Ratio 9.8:1 ✓
  - Primary (Deep Blue oklch(0.45 0.12 250)): White text (oklch(0.98 0 0)) - Ratio 7.2:1 ✓
  - Secondary (Soft Teal oklch(0.65 0.10 200)): Deep Blue text (oklch(0.25 0.08 250)) - Ratio 5.5:1 ✓
  - Accent (Vibrant Orange oklch(0.70 0.18 50)): Deep Blue text (oklch(0.25 0.08 250)) - Ratio 6.1:1 ✓
  - Muted (Light Gray oklch(0.92 0.01 60)): Warm Gray text (oklch(0.45 0.01 60)) - Ratio 5.8:1 ✓

## Font Selection
Typography should convey clarity and organization - modern sans-serif for readability on screens while maintaining a professional tone appropriate for educational administration documentation.

- **Typographic Hierarchy**:
  - H1 (Page Title): Inter Bold/32px/tight tracking/-0.02em
  - H2 (Section Headers): Inter SemiBold/24px/normal tracking
  - H3 (Module Names): Inter SemiBold/18px/normal tracking
  - Body (Descriptions): Inter Regular/16px/1.6 line-height
  - Small (Metadata): Inter Medium/14px/normal tracking
  - Labels (UI Elements): Inter Medium/13px/wide tracking/uppercase

## Animations
Animations should feel systematic and purposeful, reflecting the organized nature of project management - smooth state transitions and satisfying completion interactions that reinforce progress without being distracting during serious work.

- **Purposeful Meaning**: Subtle slide-ins for module cards suggest systematic organization; progress bars fill smoothly to communicate completion; completion checkmarks have a satisfying bounce
- **Hierarchy of Movement**: Primary focus on progress indicators and module state changes; secondary on tab transitions; minimal decoration elsewhere

## Component Selection
- **Components**: 
  - Tabs (navigation between main views)
  - Card (module containers, phase cards, KPI cards)
  - Progress (completion bars, overall progress indicators)
  - Badge (status indicators, technology tags)
  - Accordion (expandable module details)
  - Dialog (detailed module information overlays)
  - Separator (visual section breaks)
  - ScrollArea (long content in constrained spaces)
- **Customizations**: 
  - Custom progress visualization with percentage labels
  - Module cards with hover effects showing quick actions
  - Timeline cards with connecting lines between phases
  - Status badges with icons (planning/in-progress/completed/blocked)
- **States**: 
  - Module cards: default, hover (lift + shadow), selected, completed (checkmark badge)
  - Progress bars: empty (gray), filling (animated gradient), complete (solid accent)
  - Tab buttons: inactive (muted), hover (accent tint), active (accent underline)
- **Icon Selection**: 
  - GraduationCap (system logo/education)
  - ListChecks (modules)
  - Calendar (timeline)
  - ChartBar (progress/KPIs)
  - Code (tech stack)
  - CheckCircle (completed items)
  - Circle (incomplete items)
  - ArrowRight (navigation/next steps)
  - Users (stakeholders)
  - Settings (configuration)
- **Spacing**: 
  - Container padding: p-6 (desktop), p-4 (mobile)
  - Card gaps: gap-6 (module grid), gap-4 (within cards)
  - Section spacing: space-y-8 (major sections), space-y-4 (related content)
  - Tight grouping: gap-2 (badges, small UI elements)
- **Mobile**: 
  - Tabs convert to vertical scrolling sections on mobile
  - Module grid: 1 column on mobile, 2 on tablet, 3 on desktop
  - Timeline: vertical stack on mobile with simplified connecting lines
  - Progress cards stack vertically, charts remain readable
