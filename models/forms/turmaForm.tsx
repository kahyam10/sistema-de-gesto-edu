import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, Download, Clock } from 'lucide-react';

const CensoTurmaForm = () => {
  const [formData, setFormData] = useState({
    codigoEscola: '',
    nomeEscola: '',
    nomeTurma: '',
    tipoMediacaoPedagogica: '',
    turmaEducacaoEspecial: '',
    turmaBilingueSurdos: '',
    turmaFormacaoAlternancia: '',
    localFuncionamentoDiferenciado: '',
    horarioUnificado: '',
    diasSemana: {
      domingo: { ativo: false, horaInicial: '', horaFinal: '' },
      segunda: { ativo: false, horaInicial: '', horaFinal: '' },
      terca: { ativo: false, horaInicial: '', horaFinal: '' },
      quarta: { ativo: false, horaInicial: '', horaFinal: '' },
      quinta: { ativo: false, horaInicial: '', horaFinal: '' },
      sexta: { ativo: false, horaInicial: '', horaFinal: '' },
      sabado: { ativo: false, horaInicial: '', horaFinal: '' }
    },
    tipoTurma: '',
    etapaEnsino: '',
    subEtapaEducacaoInfantil: '',
    anoSerieEnsFundamental: '',
    anoSerieEnsMedio: '',
    anoSerieNormalMagisterio: '',
    etapaEJA: '',
    organizacaoCurricular: [],
    formasOrganizacao: [],
    componentesCurriculares: [],
    areasItinerarioFormativo: [],
    tipoItinerarioTecnico: '',
    codigoCurso: '',
    nomeCurso: '',
    tipoAtividadeComplementar: ''
  });

  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    horarios: false,
    etapas: false,
    organizacao: false,
    componentes: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentValues = prev[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const handleDiaSemanaChange = (dia, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      diasSemana: {
        ...prev.diasSemana,
        [dia]: {
          ...prev.diasSemana[dia],
          [campo]: valor
        }
      }
    }));
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `censo-turma-${formData.nomeTurma || 'dados'}.json`;
    link.click();
  };

  const SectionHeader = ({ title, section }) => (
    <div 
      className="bg-blue-600 text-white p-4 cursor-pointer flex justify-between items-center"
      onClick={() => toggleSection(section)}
    >
      <h2 className="text-lg font-bold">{title}</h2>
      {expandedSections[section] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
    </div>
  );

  const componentesCurricularesOptions = [
    { categoria: 'Linguagens', opcoes: [
      { valor: '6', label: 'Língua/Literatura Portuguesa' },
      { valor: '7', label: 'Língua/Literatura Estrangeira – Inglês' },
      { valor: '8', label: 'Língua/Literatura Estrangeira – Espanhol' },
      { valor: '9', label: 'Língua/Literatura Estrangeira – Outra' },
      { valor: '30', label: 'Língua/Literatura Estrangeira – Francês' },
      { valor: '23', label: 'Libras' },
      { valor: '27', label: 'Língua Indígena' },
      { valor: '31', label: 'Língua Portuguesa como Segunda Língua' },
      { valor: '10', label: 'Arte (Educação Artística, Teatro, Dança, Música, Artes Plásticas e outras)' },
      { valor: '11', label: 'Educação Física' }
    ]},
    { categoria: 'Matemática', opcoes: [
      { valor: '3', label: 'Matemática' }
    ]},
    { categoria: 'Ciências da Natureza', opcoes: [
      { valor: '5', label: 'Ciências' },
      { valor: '1', label: 'Química' },
      { valor: '2', label: 'Física' },
      { valor: '4', label: 'Biologia' }
    ]},
    { categoria: 'Ciências Humanas e Sociais', opcoes: [
      { valor: '28', label: 'Estudos Sociais' },
      { valor: '12', label: 'História' },
      { valor: '13', label: 'Geografia' },
      { valor: '14', label: 'Filosofia' },
      { valor: '29', label: 'Sociologia' }
    ]},
    { categoria: 'Outras Áreas', opcoes: [
      { valor: '16', label: 'Informática/Computação' },
      { valor: '17', label: 'Áreas do conhecimento profissionalizantes' },
      { valor: '25', label: 'Áreas do conhecimento pedagógicas' },
      { valor: '26', label: 'Ensino religioso' },
      { valor: '32', label: 'Estágio curricular supervisionado' },
      { valor: '33', label: 'Projeto de vida' },
      { valor: '99', label: 'Outras áreas do conhecimento' }
    ]}
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white shadow-lg">
        {/* Header */}
        <div className="bg-blue-800 text-white p-6 text-center">
          <h1 className="text-3xl font-bold">CENSO ESCOLAR 2025</h1>
          <p className="text-xl mt-2">QUESTIONÁRIO DE TURMA</p>
        </div>

        {/* IDENTIFICAÇÃO */}
        <div className="border-b">
          <SectionHeader title="IDENTIFICAÇÃO DA TURMA" section="identificacao" />
          {expandedSections.identificacao && (
            <div className="p-6 space-y-6">
              {/* Código da Escola */}
              <div>
                <label className="block text-sm font-semibold mb-2">Código da escola</label>
                <input
                  type="text"
                  value={formData.codigoEscola}
                  onChange={(e) => handleInputChange('codigoEscola', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Nome da Escola */}
              <div>
                <label className="block text-sm font-semibold mb-2">Nome da escola</label>
                <input
                  type="text"
                  value={formData.nomeEscola}
                  onChange={(e) => handleInputChange('nomeEscola', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Nome da Turma */}
              <div>
                <label className="block text-sm font-semibold mb-2">Nome da turma</label>
                <input
                  type="text"
                  value={formData.nomeTurma}
                  onChange={(e) => handleInputChange('nomeTurma', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Tipo de Mediação Didático-Pedagógica */}
              <div>
                <label className="block text-sm font-semibold mb-2">Tipo de mediação didático-pedagógica</label>
                <div className="space-y-2">
                  {['Presencial', 'Semipresencial', 'Educação a distância – EAD'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="tipoMediacaoPedagogica"
                        value={option}
                        checked={formData.tipoMediacaoPedagogica === option}
                        onChange={(e) => handleInputChange('tipoMediacaoPedagogica', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Turma de Educação Especial */}
              <div>
                <label className="block text-sm font-semibold mb-2">Turma de Educação Especial (classe especial)</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="turmaEducacaoEspecial"
                        value={option}
                        checked={formData.turmaEducacaoEspecial === option}
                        onChange={(e) => handleInputChange('turmaEducacaoEspecial', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Turma de Educação Bilíngue de Surdos */}
              <div>
                <label className="block text-sm font-semibold mb-2">Turma de Educação Bilíngue de Surdos (classe bilíngue de surdos)</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="turmaBilingueSurdos"
                        value={option}
                        checked={formData.turmaBilingueSurdos === option}
                        onChange={(e) => handleInputChange('turmaBilingueSurdos', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Turma de Formação por Alternância */}
              <div>
                <label className="block text-sm font-semibold mb-2">Turma de Formação por Alternância (tempo-escola e tempo-comunidade)</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="turmaFormacaoAlternancia"
                        value={option}
                        checked={formData.turmaFormacaoAlternancia === option}
                        onChange={(e) => handleInputChange('turmaFormacaoAlternancia', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Local de Funcionamento Diferenciado */}
              <div>
                <label className="block text-sm font-semibold mb-2">Local de funcionamento diferenciado da turma</label>
                <div className="space-y-2">
                  {[
                    'A turma não está em local de funcionamento diferenciado',
                    'Unidade de atendimento socioeducativo',
                    'Unidade prisional',
                    'Sala anexa'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="localFuncionamentoDiferenciado"
                        value={option}
                        checked={formData.localFuncionamentoDiferenciado === option}
                        onChange={(e) => handleInputChange('localFuncionamentoDiferenciado', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HORÁRIOS */}
        <div className="border-b">
          <SectionHeader title="DIAS DA SEMANA E HORÁRIOS DE FUNCIONAMENTO" section="horarios" />
          {expandedSections.horarios && (
            <div className="p-6 space-y-6">
              {/* Horário Unificado */}
              <div>
                <label className="block text-sm font-semibold mb-2">Turma funciona no mesmo horário para todos os dias</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="horarioUnificado"
                        value={option}
                        checked={formData.horarioUnificado === option}
                        onChange={(e) => handleInputChange('horarioUnificado', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Dias da Semana com Horários */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock size={18} />
                  Horários por dia da semana
                </h3>
                
                {[
                  { key: 'domingo', label: 'Domingo' },
                  { key: 'segunda', label: 'Segunda-feira' },
                  { key: 'terca', label: 'Terça-feira' },
                  { key: 'quarta', label: 'Quarta-feira' },
                  { key: 'quinta', label: 'Quinta-feira' },
                  { key: 'sexta', label: 'Sexta-feira' },
                  { key: 'sabado', label: 'Sábado' }
                ].map(dia => (
                  <div key={dia.key} className="border rounded p-4 bg-gray-50">
                    <div className="flex items-center gap-4 mb-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.diasSemana[dia.key].ativo}
                          onChange={(e) => handleDiaSemanaChange(dia.key, 'ativo', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="font-semibold">{dia.label}</span>
                      </label>
                    </div>
                    
                    {formData.diasSemana[dia.key].ativo && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div>
                          <label className="block text-xs mb-1">Hora inicial</label>
                          <input
                            type="time"
                            value={formData.diasSemana[dia.key].horaInicial}
                            onChange={(e) => handleDiaSemanaChange(dia.key, 'horaInicial', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Hora final</label>
                          <input
                            type="time"
                            value={formData.diasSemana[dia.key].horaFinal}
                            onChange={(e) => handleDiaSemanaChange(dia.key, 'horaFinal', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* TIPO DE TURMA E ETAPAS */}
        <div className="border-b">
          <SectionHeader title="TIPO DE TURMA E ETAPAS DE ENSINO" section="etapas" />
          {expandedSections.etapas && (
            <div className="p-6 space-y-6">
              {/* Tipo de Turma */}
              <div>
                <label className="block text-sm font-semibold mb-2">Tipo de turma</label>
                <div className="space-y-2">
                  {[
                    'Curricular (etapa de ensino)',
                    'Atividade complementar',
                    'Atendimento educacional especializado (AEE)',
                    'Curricular (etapa de ensino) com Atividade complementar'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="tipoTurma"
                        value={option}
                        checked={formData.tipoTurma === option}
                        onChange={(e) => handleInputChange('tipoTurma', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Etapa de Ensino */}
              {(formData.tipoTurma === 'Curricular (etapa de ensino)' || 
                formData.tipoTurma === 'Curricular (etapa de ensino) com Atividade complementar') && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Etapa de ensino</label>
                  <select
                    value={formData.etapaEnsino}
                    onChange={(e) => handleInputChange('etapaEnsino', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Selecione...</option>
                    <option value="educacao-infantil">Educação infantil</option>
                    <option value="ensino-fundamental">Ensino fundamental</option>
                    <option value="multi-correcao">Multi e correção de fluxo</option>
                    <option value="ensino-medio">Ensino Médio</option>
                    <option value="ensino-medio-normal">Ensino Médio - Normal/Magistério</option>
                    <option value="eja">Educação de Jovens e Adultos (EJA)</option>
                    <option value="curso-tecnico">Curso Técnico e FIC - Concomitante ou Subsequente</option>
                  </select>
                </div>
              )}

              {/* Sub-etapas Educação Infantil */}
              {formData.etapaEnsino === 'educacao-infantil' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Educação infantil</label>
                  <div className="space-y-2">
                    {[
                      'Creche (0 a 3 anos)',
                      'Pré-escola (4 e 5 anos)',
                      'Unificada (0 a 5 anos)',
                      'Multietapa',
                      'Educação infantil e ensino fundamental (9 anos)'
                    ].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name="subEtapaEducacaoInfantil"
                          value={option}
                          checked={formData.subEtapaEducacaoInfantil === option}
                          onChange={(e) => handleInputChange('subEtapaEducacaoInfantil', e.target.value)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Ensino Fundamental */}
              {formData.etapaEnsino === 'ensino-fundamental' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Ensino fundamental (9 anos)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano', 'Multi', 'Correção de fluxo'].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name="anoSerieEnsFundamental"
                          value={option}
                          checked={formData.anoSerieEnsFundamental === option}
                          onChange={(e) => handleInputChange('anoSerieEnsFundamental', e.target.value)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Ensino Médio */}
              {formData.etapaEnsino === 'ensino-medio' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Ensino médio</label>
                  <div className="space-y-2">
                    {['1º ano/série', '2º ano/série', '3º ano/série', '4º ano/série', 'Não seriada'].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name="anoSerieEnsMedio"
                          value={option}
                          checked={formData.anoSerieEnsMedio === option}
                          onChange={(e) => handleInputChange('anoSerieEnsMedio', e.target.value)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Ensino Médio Normal/Magistério */}
              {formData.etapaEnsino === 'ensino-medio-normal' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Ensino médio – Normal/Magistério</label>
                  <div className="space-y-2">
                    {['1ª série', '2ª série', '3ª série', '4ª série'].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name="anoSerieNormalMagisterio"
                          value={option}
                          checked={formData.anoSerieNormalMagisterio === option}
                          onChange={(e) => handleInputChange('anoSerieNormalMagisterio', e.target.value)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* EJA */}
              {formData.etapaEnsino === 'eja' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Educação de jovens e adultos (EJA)</label>
                  <div className="space-y-2">
                    {[
                      'Ensino fundamental – anos iniciais',
                      'Ensino fundamental – anos finais',
                      'Ensino fundamental – anos iniciais e anos finais',
                      'Ensino médio',
                      'Curso FIC integrado na modalidade EJA – nível fundamental',
                      'Curso FIC integrado na modalidade EJA – nível médio'
                    ].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name="etapaEJA"
                          value={option}
                          checked={formData.etapaEJA === option}
                          onChange={(e) => handleInputChange('etapaEJA', e.target.value)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Curso Técnico */}
              {formData.etapaEnsino === 'curso-tecnico' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Curso Técnico e FIC</label>
                  <div className="space-y-2">
                    {[
                      'Curso técnico - concomitante',
                      'Curso técnico - subsequente',
                      'Curso técnico misto',
                      'Curso FIC concomitante',
                      'Curso técnico integrado na modalidade EJA'
                    ].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name="tipoItinerarioTecnico"
                          value={option}
                          checked={formData.tipoItinerarioTecnico === option}
                          onChange={(e) => handleInputChange('tipoItinerarioTecnico', e.target.value)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipo de Atividade Complementar */}
              {formData.tipoTurma === 'Atividade complementar' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Tipo de atividade complementar</label>
                  <input
                    type="text"
                    value={formData.tipoAtividadeComplementar}
                    onChange={(e) => handleInputChange('tipoAtividadeComplementar', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Código da atividade complementar"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ver código no Caderno de Conceitos e Orientações do Censo Escolar
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ORGANIZAÇÃO CURRICULAR */}
        <div className="border-b">
          <SectionHeader title="ORGANIZAÇÃO CURRICULAR" section="organizacao" />
          {expandedSections.organizacao && (
            <div className="p-6 space-y-6">
              {/* Organização Curricular - Ensino Médio */}
              {(formData.etapaEnsino === 'ensino-medio' || formData.etapaEnsino === 'ensino-medio-normal') && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Organização curricular da turma
                    <span className="text-xs text-gray-500 block mt-1">
                      (Obrigatório para turmas de Ensino Médio e Ensino Médio Normal/Magistério)
                    </span>
                  </label>
                  <div className="space-y-2">
                    {[
                      'Formação geral básica (FGB)',
                      'Itinerário formativo de aprofundamento (IFA)',
                      'Itinerário de formação técnica e profissional (IFTP)'
                    ].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.organizacaoCurricular.includes(option)}
                          onChange={() => handleCheckboxChange('organizacaoCurricular', option)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Áreas do Itinerário Formativo */}
              {formData.organizacaoCurricular.includes('Itinerário formativo de aprofundamento (IFA)') && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Área(s) do itinerário formativo de aprofundamento
                  </label>
                  <div className="space-y-2">
                    {[
                      'Linguagens e suas tecnologias',
                      'Matemática e suas tecnologias',
                      'Ciências da natureza e suas tecnologias',
                      'Ciências humanas e sociais aplicadas'
                    ].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.areasItinerarioFormativo.includes(option)}
                          onChange={() => handleCheckboxChange('areasItinerarioFormativo', option)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipo de Curso do IFTP */}
              {formData.organizacaoCurricular.includes('Itinerário de formação técnica e profissional (IFTP)') && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Tipo do curso do itinerário de formação técnica e profissional
                  </label>
                  <div className="space-y-2">
                    {[
                      'Curso técnico',
                      'Qualificação profissional técnica'
                    ].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name="tipoItinerarioTecnico"
                          value={option}
                          checked={formData.tipoItinerarioTecnico === option}
                          onChange={(e) => handleInputChange('tipoItinerarioTecnico', e.target.value)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Código e Nome do Curso */}
              {(formData.tipoItinerarioTecnico || 
                formData.etapaEnsino === 'curso-tecnico') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Código do curso</label>
                    <input
                      type="text"
                      value={formData.codigoCurso}
                      onChange={(e) => handleInputChange('codigoCurso', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Código"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nome do curso</label>
                    <input
                      type="text"
                      value={formData.nomeCurso}
                      onChange={(e) => handleInputChange('nomeCurso', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              )}

              {/* Formas de Organização */}
              <div>
                <label className="block text-sm font-semibold mb-2">Formas de organização da turma</label>
                <div className="space-y-2">
                  {[
                    'Série/ano (séries anuais)',
                    'Módulos',
                    'Ciclo(s)',
                    'Períodos semestrais',
                    'Grupos não seriados com base na idade ou competência'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.formasOrganizacao.includes(option)}
                        onChange={() => handleCheckboxChange('formasOrganizacao', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COMPONENTES CURRICULARES */}
        <div className="border-b">
          <SectionHeader title="COMPONENTES CURRICULARES" section="componentes" />
          {expandedSections.componentes && (
            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-600 mb-4">
                Áreas do conhecimento/componentes curriculares
                <span className="block text-xs mt-1">
                  (Obrigatório para turmas com Etapa de ensino, exceto educação infantil e turmas exclusivas de Itinerário formativo)
                </span>
              </p>

              {componentesCurricularesOptions.map(area => (
                <div key={area.categoria} className="border rounded p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3 text-blue-700">{area.categoria}</h3>
                  <div className="space-y-2">
                    {area.opcoes.map(opcao => (
                      <label key={opcao.valor} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.componentesCurriculares.includes(opcao.valor)}
                          onChange={() => handleCheckboxChange('componentesCurriculares', opcao.valor)}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          <span className="text-gray-500">{opcao.valor}.</span> {opcao.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="p-6 bg-gray-50 flex gap-4 justify-end">
          <button
            onClick={exportJSON}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
          >
            <Download size={20} />
            Exportar JSON
          </button>
          <button
            onClick={() => console.log(formData)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            <Save size={20} />
            Salvar Dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default CensoTurmaForm;