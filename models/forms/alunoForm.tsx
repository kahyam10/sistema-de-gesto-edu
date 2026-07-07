import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, Download, User, BookOpen, Bus } from 'lucide-react';

const CensoAlunoForm = () => {
  const [formData, setFormData] = useState({
    identificacaoUnica: '',
    codigoEscola: '',
    cpf: '',
    nomeCompleto: '',
    dataNascimento: '',
    filiacao1: '',
    filiacao2: '',
    sexo: '',
    corRaca: '',
    povoIndigena: '',
    nacionalidade: '',
    paisNacionalidade: '',
    ufNascimento: '',
    municipioNascimento: '',
    possuiDeficiencia: '',
    tiposDeficiencia: [],
    possuiTranstorno: '',
    tiposTranstorno: [],
    necessitaRecursos: '',
    recursos: [],
    numeroMatriculaCertidao: '',
    paisResidencia: '',
    cepResidencia: '',
    ufResidencia: '',
    municipioResidencia: '',
    localizacaoResidencia: '',
    localizacaoDiferenciadaResidencia: '',
    nomeTurma: '',
    etapaAlunoTurma: '',
    tiposAEE: [],
    recebeEscolarizacaoOutro: '',
    utilizaTransporte: '',
    poderPublicoTransporte: '',
    tiposVeiculoTransporte: []
  });

  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    deficiencias: false,
    documento: false,
    residencia: false,
    vinculo: false
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

  const exportJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `censo-aluno-${formData.cpf || 'dados'}.json`;
    link.click();
  };

  const SectionHeader = ({ title, section, icon: Icon }) => (
    <div 
      className="bg-blue-600 text-white p-4 cursor-pointer flex justify-between items-center"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <Icon size={24} />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {expandedSections[section] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white shadow-lg">
        <div className="bg-blue-800 text-white p-6 text-center">
          <h1 className="text-3xl font-bold">CENSO ESCOLAR 2025</h1>
          <p className="text-xl mt-2">QUESTIONÁRIO DE ALUNO(A)</p>
        </div>

        <div className="border-b">
          <SectionHeader title="IDENTIFICAÇÃO" section="identificacao" icon={User} />
          {expandedSections.identificacao && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">1 – Identificação única (código Inep)</label>
                <input
                  type="text"
                  value={formData.identificacaoUnica}
                  onChange={(e) => handleInputChange('identificacaoUnica', e.target.value)}
                  className="w-full p-2 border rounded bg-gray-50"
                  readOnly
                  placeholder="Gerado automaticamente"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Código da escola</label>
                <input
                  type="text"
                  value={formData.codigoEscola}
                  onChange={(e) => handleInputChange('codigoEscola', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">2 – CPF</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="000.000.000-00"
                />
                <p className="text-xs text-gray-500 mt-1">Dados carregados da Receita Federal</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">3 – Nome completo</label>
                <input
                  type="text"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">4 – Data de nascimento</label>
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold">5 – Filiação</label>
                <input
                  type="text"
                  placeholder="Filiação 1"
                  value={formData.filiacao1}
                  onChange={(e) => handleInputChange('filiacao1', e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Filiação 2"
                  value={formData.filiacao2}
                  onChange={(e) => handleInputChange('filiacao2', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">6 – Sexo</label>
                <div className="space-y-2">
                  {['Masculino', 'Feminino'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="sexo"
                        value={option}
                        checked={formData.sexo === option}
                        onChange={(e) => handleInputChange('sexo', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">7 – Cor/raça</label>
                <div className="space-y-2">
                  {['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não declarada'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="corRaca"
                        value={option}
                        checked={formData.corRaca === option}
                        onChange={(e) => handleInputChange('corRaca', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {formData.corRaca === 'Indígena' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">7a – Povo Indígena</label>
                  <input
                    type="text"
                    value={formData.povoIndigena}
                    onChange={(e) => handleInputChange('povoIndigena', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Código do Povo Indígena"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">8 – Nacionalidade</label>
                <div className="space-y-2">
                  {[
                    'Brasileira',
                    'Brasileira – nascido no exterior ou naturalizado',
                    'Estrangeira'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="nacionalidade"
                        value={option}
                        checked={formData.nacionalidade === option}
                        onChange={(e) => handleInputChange('nacionalidade', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {formData.nacionalidade === 'Estrangeira' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">9 – País de nacionalidade</label>
                  <input
                    type="text"
                    value={formData.paisNacionalidade}
                    onChange={(e) => handleInputChange('paisNacionalidade', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">10 – UF de nascimento</label>
                  <input
                    type="text"
                    value={formData.ufNascimento}
                    onChange={(e) => handleInputChange('ufNascimento', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">11 – Município de nascimento</label>
                  <input
                    type="text"
                    value={formData.municipioNascimento}
                    onChange={(e) => handleInputChange('municipioNascimento', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-b">
          <SectionHeader title="DEFICIÊNCIAS E TRANSTORNOS" section="deficiencias" icon={User} />
          {expandedSections.deficiencias && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">12 – Deficiência, TEA ou altas habilidades</label>
                <div className="space-y-2 mb-3">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="possuiDeficiencia"
                        value={option}
                        checked={formData.possuiDeficiencia === option}
                        onChange={(e) => handleInputChange('possuiDeficiencia', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>

                {formData.possuiDeficiencia === 'Sim' && (
                  <div className="border rounded p-4 bg-gray-50">
                    <p className="text-sm font-semibold mb-3">12a – Tipos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Cegueira',
                        'Baixa visão',
                        'Visão monocular',
                        'Surdez',
                        'Deficiência auditiva',
                        'Surdocegueira',
                        'Deficiência física',
                        'Deficiência intelectual',
                        'Deficiência múltipla',
                        'Transtorno do espectro autista',
                        'Altas habilidades ou superdotação'
                      ].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.tiposDeficiencia.includes(option)}
                            onChange={() => handleCheckboxChange('tiposDeficiencia', option)}
                            className="mr-2"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">13 – Transtornos de aprendizagem</label>
                <div className="space-y-2 mb-3">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="possuiTranstorno"
                        value={option}
                        checked={formData.possuiTranstorno === option}
                        onChange={(e) => handleInputChange('possuiTranstorno', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>

                {formData.possuiTranstorno === 'Sim' && (
                  <div className="border rounded p-4 bg-gray-50">
                    <p className="text-sm font-semibold mb-3">13a – Tipos</p>
                    <div className="space-y-2">
                      {[
                        'Dislexia',
                        'Discalculia ou outro transtorno da matemática',
                        'Disgrafia, Disortografia ou outro transtorno da escrita',
                        'Dislalia ou outro transtorno da linguagem',
                        'Transtorno do Déficit de Atenção com Hiperatividade (TDAH)',
                        'Transtorno do Processamento Auditivo Central (TPAC)'
                      ].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.tiposTranstorno.includes(option)}
                            onChange={() => handleCheckboxChange('tiposTranstorno', option)}
                            className="mr-2"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">14 – Necessita recursos para sala de aula e avaliações (Saeb)</label>
                <div className="space-y-2 mb-3">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="necessitaRecursos"
                        value={option}
                        checked={formData.necessitaRecursos === option}
                        onChange={(e) => handleInputChange('necessitaRecursos', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>

                {formData.necessitaRecursos === 'Sim' && (
                  <div className="border rounded p-4 bg-gray-50">
                    <p className="text-sm font-semibold mb-3">Recursos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Auxílio ledor',
                        'Auxílio transcrição',
                        'Guia-intérprete',
                        'Tradutor-intérprete de Libras',
                        'Leitura labial',
                        'Prova em Braille',
                        'Prova superampliada (Fonte 24)',
                        'Prova ampliada (Fonte 18)',
                        'Prova em Vídeo Libras',
                        'CD com áudio para deficiente visual',
                        'Material didático em Braille',
                        'Prova de Língua Portuguesa como Segunda Língua'
                      ].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.recursos.includes(option)}
                            onChange={() => handleCheckboxChange('recursos', option)}
                            className="mr-2"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-b">
          <SectionHeader title="DOCUMENTO" section="documento" icon={User} />
          {expandedSections.documento && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">15 – Número da matrícula da certidão de nascimento</label>
                <input
                  type="text"
                  value={formData.numeroMatriculaCertidao}
                  onChange={(e) => handleInputChange('numeroMatriculaCertidao', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Certidão nova"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-b">
          <SectionHeader title="ÁREA RESIDENCIAL" section="residencia" icon={User} />
          {expandedSections.residencia && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">16 – País de residência</label>
                <input
                  type="text"
                  value={formData.paisResidencia}
                  onChange={(e) => handleInputChange('paisResidencia', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Brasil"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">17 – CEP</label>
                <input
                  type="text"
                  value={formData.cepResidencia}
                  onChange={(e) => handleInputChange('cepResidencia', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">18 – UF</label>
                  <input
                    type="text"
                    value={formData.ufResidencia}
                    onChange={(e) => handleInputChange('ufResidencia', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">19 – Município</label>
                  <input
                    type="text"
                    value={formData.municipioResidencia}
                    onChange={(e) => handleInputChange('municipioResidencia', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">20 – Localização/zona</label>
                <div className="space-y-2">
                  {['Urbana', 'Rural'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="localizacaoResidencia"
                        value={option}
                        checked={formData.localizacaoResidencia === option}
                        onChange={(e) => handleInputChange('localizacaoResidencia', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">21 – Localização diferenciada</label>
                <div className="space-y-2">
                  {[
                    'Não está em área de localização diferenciada',
                    'Área de assentamento',
                    'Terra indígena',
                    'Comunidade quilombola',
                    'Área onde se localizam povos e comunidades tradicionais'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="localizacaoDiferenciadaResidencia"
                        value={option}
                        checked={formData.localizacaoDiferenciadaResidencia === option}
                        onChange={(e) => handleInputChange('localizacaoDiferenciadaResidencia', e.target.value)}
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

        <div className="border-b">
          <SectionHeader title="DADOS DE VÍNCULO" section="vinculo" icon={BookOpen} />
          {expandedSections.vinculo && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">1 – Nome da turma</label>
                <input
                  type="text"
                  value={formData.nomeTurma}
                  onChange={(e) => handleInputChange('nomeTurma', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">2 – Etapa do aluno na turma</label>
                <select
                  value={formData.etapaAlunoTurma}
                  onChange={(e) => handleInputChange('etapaAlunoTurma', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Selecione...</option>
                  <option value="Creche">Creche</option>
                  <option value="Pré-escola">Pré-escola</option>
                  <option value="Ensino fundamental">Ensino fundamental</option>
                  <option value="EJA - Anos iniciais">EJA - Anos iniciais</option>
                  <option value="EJA - Anos finais">EJA - Anos finais</option>
                  <option value="Curso técnico - Concomitante">Curso técnico - Concomitante</option>
                  <option value="Curso técnico - Subsequente">Curso técnico - Subsequente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">3 – Tipo de AEE</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Ensino do Sistema Braille',
                    'Ensino do Soroban',
                    'Ensino de orientação e mobilidade',
                    'Ensino de Libras',
                    'Ensino de Língua Portuguesa como Segunda Língua',
                    'Ensino de Comunicação Alternativa e Aumentativa',
                    'Ensino de informática acessível',
                    'Ensino de recursos ópticos e não ópticos',
                    'Desenvolvimento de funções cognitivas',
                    'Desenvolvimento de vida autônoma',
                    'Enriquecimento curricular'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.tiposAEE.includes(option)}
                        onChange={() => handleCheckboxChange('tiposAEE', option)}
                        className="mr-2"
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">4 – Recebe escolarização em outro espaço</label>
                <div className="space-y-2">
                  {[
                    'Não recebe escolarização fora da escola',
                    'Em domicílio',
                    'Em hospital'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="recebeEscolarizacaoOutro"
                        value={option}
                        checked={formData.recebeEscolarizacaoOutro === option}
                        onChange={(e) => handleInputChange('recebeEscolarizacaoOutro', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">5 – Transporte escolar público</label>
                <div className="space-y-2 mb-3">
                  {['Utiliza', 'Não utiliza'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="utilizaTransporte"
                        value={option}
                        checked={formData.utilizaTransporte === option}
                        onChange={(e) => handleInputChange('utilizaTransporte', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>

                {formData.utilizaTransporte === 'Utiliza' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">5a – Poder público responsável</label>
                      <div className="space-y-2">
                        {['Municipal', 'Estadual'].map(option => (
                          <label key={option} className="flex items-center">
                            <input
                              type="radio"
                              name="poderPublicoTransporte"
                              value={option}
                              checked={formData.poderPublicoTransporte === option}
                              onChange={(e) => handleInputChange('poderPublicoTransporte', e.target.value)}
                              className="mr-2"
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">5b – Tipo de veículo</label>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-blue-700">Rodoviário</p>
                        {[
                          'Bicicleta',
                          'Tração animal',
                          'Outro tipo de veículo rodoviário',
                          'Vans/Kombis',
                          'Micro-ônibus',
                          'Ônibus'
                        ].map(option => (
                          <label key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.tiposVeiculoTransporte.includes(option)}
                              onChange={() => handleCheckboxChange('tiposVeiculoTransporte', option)}
                              className="mr-2"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                        
                        <p className="text-xs font-semibold text-blue-700 mt-3">Aquaviário</p>
                        {[
                          'Embarcação - capacidade até 5 alunos',
                          'Embarcação - capacidade 5 a 15 alunos',
                          'Embarcação - capacidade 15 a 35 alunos',
                          'Embarcação - capacidade acima de 35 alunos'
                        ].map(option => (
                          <label key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.tiposVeiculoTransporte.includes(option)}
                              onChange={() => handleCheckboxChange('tiposVeiculoTransporte', option)}
                              className="mr-2"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

export default CensoAlunoForm;