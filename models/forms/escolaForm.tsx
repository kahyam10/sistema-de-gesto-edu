import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, Download } from 'lucide-react';

const CensoEscolarForm = () => {
  const [formData, setFormData] = useState({
    codigoEscola: '',
    dependenciaAdministrativa: '',
    localizacao: '',
    orgaoVinculacao: '',
    orgaoRegional: '',
    regulamentacao: '',
    esferaRegulamentacao: [],
    entidadeSuperior: [],
    parceriaConvenio: '',
    poderPublicoParceria: '',
    formaContratacaoEstadual: [],
    formaContratacaoMunicipal: [],
    situacaoFuncionamento: '',
    inicioAnoLetivo: '',
    terminoAnoLetivo: '',
    nomeEscola: '',
    cep: '',
    uf: '',
    municipio: '',
    regiaoAdministrativa: '',
    distrito: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    ddd: '',
    telefone: '',
    outroTelefone: '',
    email: '',
    localizacaoGeografica: '',
    localizacaoDiferenciada: '',
    unidadeVinculada: '',
    codigoEscolaSede: '',
    codigoIES: '',
    categoriaEscolaPrivada: '',
    mantenedoraPrivada: [],
    cnpjMantenedora: '',
    cnpjEscola: '',
    localFuncionamento: '',
    formaOcupacao: '',
    compartilhaPredio: '',
    codigoEscolaCompartilhada: '',
    aguaPotavel: '',
    abastecimentoAgua: [],
    fonteEnergia: [],
    esgotamento: [],
    destinacaoLixo: [],
    tratamentoLixo: [],
    dependenciasFisicas: [],
    recursosAcessibilidade: [],
    salasAulaDentro: '',
    salasAulaFora: '',
    salasClimatizadas: '',
    salasAcessibilidade: '',
    salasCantinoLeitura: '',
    equipamentosAdministrativos: [],
    equipamentosEnsinoAprendizagem: [],
    computadoresDesktop: '',
    computadoresPortateis: '',
    tablets: '',
    redeLocal: [],
    acessoInternet: [],
    dispositivosAcessoInternet: [],
    internetBandaLarga: '',
    profissionais: {},
    alimentacaoEscolar: '',
    escolaIndigena: '',
    linguaEnsino: [],
    codigoLinguaIndigena: ['', '', ''],
    instrumentosMateriais: [],
    educacaoAmbiental: '',
    formasEducacaoAmbiental: [],
    pppAtualizado: '',
    orgaosColegiados: [],
    compartilhaEspacos: '',
    usaEspacosEntorno: '',
    siteBlogRedes: '',
    exameSelecao: '',
    sistemaCotas: '',
    reservaVagas: []
  });

  const [expandedSections, setExpandedSections] = useState({
    vinculacao: true,
    funcionamento: false,
    estrutura: false,
    equipamentos: false,
    recursos: false,
    organizacao: false
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

  const handleProfissionalChange = (profissional, quantidade) => {
    setFormData(prev => ({
      ...prev,
      profissionais: {
        ...prev.profissionais,
        [profissional]: quantidade
      }
    }));
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `censo-escolar-${formData.codigoEscola || 'dados'}.json`;
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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto bg-white shadow-lg">
        {/* Header */}
        <div className="bg-blue-800 text-white p-6 text-center">
          <h1 className="text-3xl font-bold">CENSO ESCOLAR 2025</h1>
          <p className="text-xl mt-2">QUESTIONÁRIO DE ESCOLA</p>
        </div>

        {/* Código da Escola */}
        <div className="p-6 border-b">
          <label className="block text-sm font-semibold mb-2">Código da Escola</label>
          <input
            type="text"
            value={formData.codigoEscola}
            onChange={(e) => handleInputChange('codigoEscola', e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* VINCULAÇÃO INSTITUCIONAL E CONVÊNIO */}
        <div className="border-b">
          <SectionHeader title="VINCULAÇÃO INSTITUCIONAL E CONVÊNIO" section="vinculacao" />
          {expandedSections.vinculacao && (
            <div className="p-6 space-y-6">
              {/* Dependência Administrativa */}
              <div>
                <label className="block text-sm font-semibold mb-2">1 – Dependência administrativa</label>
                <div className="space-y-2">
                  {['Federal', 'Estadual', 'Municipal', 'Privada'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="dependenciaAdministrativa"
                        value={option}
                        checked={formData.dependenciaAdministrativa === option}
                        onChange={(e) => handleInputChange('dependenciaAdministrativa', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Órgão de Vinculação */}
              {formData.dependenciaAdministrativa && formData.dependenciaAdministrativa !== 'Privada' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">1a – Órgão a que a escola pública está vinculada</label>
                  <select
                    value={formData.orgaoVinculacao}
                    onChange={(e) => handleInputChange('orgaoVinculacao', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Selecione...</option>
                    <option value="saude">Secretaria da Saúde/Ministério da Saúde</option>
                    <option value="seguranca">Secretaria de Segurança Pública/Forças Armadas/Militar</option>
                    <option value="educacao">Secretaria de Educação/Ministério da Educação</option>
                    <option value="outro">Outro órgão da administração pública</option>
                  </select>
                </div>
              )}

              {/* Órgão Regional */}
              <div>
                <label className="block text-sm font-semibold mb-2">1b – Órgão regional de ensino</label>
                <input
                  type="text"
                  value={formData.orgaoRegional}
                  onChange={(e) => handleInputChange('orgaoRegional', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Informar código e/ou nome do órgão regional"
                />
              </div>

              {/* Regulamentação */}
              <div>
                <label className="block text-sm font-semibold mb-2">2 – Regulamentação/autorização no conselho ou órgão municipal, estadual ou federal de educação</label>
                <div className="space-y-2">
                  {['Sim', 'Em tramitação', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="regulamentacao"
                        value={option}
                        checked={formData.regulamentacao === option}
                        onChange={(e) => handleInputChange('regulamentacao', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Esfera Administrativa */}
              {formData.regulamentacao === 'Sim' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">2a – Esfera administrativa do conselho ou órgão responsável pela regulamentação/autorização</label>
                  <div className="space-y-2">
                    {['Federal', 'Estadual', 'Municipal'].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.esferaRegulamentacao.includes(option)}
                          onChange={() => handleCheckboxChange('esferaRegulamentacao', option)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Localização */}
              <div>
                <label className="block text-sm font-semibold mb-2">3 – Localização/Zona da escola</label>
                <div className="space-y-2">
                  {['Urbana', 'Rural'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="localizacao"
                        value={option}
                        checked={formData.localizacao === option}
                        onChange={(e) => handleInputChange('localizacao', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Entidade Superior */}
              <div>
                <label className="block text-sm font-semibold mb-2">4 – Entidade superior da escola</label>
                <div className="space-y-2">
                  {['Secretaria estadual', 'Secretaria Municipal'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.entidadeSuperior.includes(option)}
                        onChange={() => handleCheckboxChange('entidadeSuperior', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Parceria ou Convênio */}
              <div>
                <label className="block text-sm font-semibold mb-2">5 – A escola possui parceria ou convênio com a Administração Pública e/ou outras instituições</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="parceriaConvenio"
                        value={option}
                        checked={formData.parceriaConvenio === option}
                        onChange={(e) => handleInputChange('parceriaConvenio', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {formData.parceriaConvenio === 'Sim' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2">5a – Poder público responsável pela parceria ou convênio</label>
                    <select
                      value={formData.poderPublicoParceria}
                      onChange={(e) => handleInputChange('poderPublicoParceria', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Selecione...</option>
                      <option value="Estadual">Estadual</option>
                      <option value="Municipal">Municipal</option>
                      <option value="Privada">Privada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">5b – Forma(s) de contratação da parceria ou convênio (Estadual)</label>
                    <div className="space-y-2">
                      {[
                        'Termo de colaboração (Lei nº 13.019/2014)',
                        'Acordo de cooperação (Lei nº 13.019/2014)',
                        'Termo de fomento (Lei nº 13.019/2014)',
                        'Termo de cooperação técnica e financeira',
                        'Contrato de prestação de serviço',
                        'Contrato de consórcio público/Convênio de cooperação'
                      ].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.formaContratacaoEstadual.includes(option)}
                            onChange={() => handleCheckboxChange('formaContratacaoEstadual', option)}
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">5c – Forma(s) de contratação da parceria ou convênio (Municipal)</label>
                    <div className="space-y-2">
                      {[
                        'Termo de colaboração (Lei nº 13.019/2014)',
                        'Acordo de cooperação (Lei nº 13.019/2014)',
                        'Termo de fomento (Lei nº 13.019/2014)',
                        'Termo de cooperação técnica e financeira',
                        'Contrato de prestação de serviço',
                        'Contrato de consórcio público/Convênio de cooperação'
                      ].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.formaContratacaoMunicipal.includes(option)}
                            onChange={() => handleCheckboxChange('formaContratacaoMunicipal', option)}
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* FUNCIONAMENTO E IDENTIFICAÇÃO */}
        <div className="border-b">
          <SectionHeader title="FUNCIONAMENTO E IDENTIFICAÇÃO" section="funcionamento" />
          {expandedSections.funcionamento && (
            <div className="p-6 space-y-6">
              {/* Situação de Funcionamento */}
              <div>
                <label className="block text-sm font-semibold mb-2">6 – Situação de funcionamento</label>
                <div className="space-y-2">
                  {['Em atividade', 'Paralisada', 'Extinta'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="situacaoFuncionamento"
                        value={option}
                        checked={formData.situacaoFuncionamento === option}
                        onChange={(e) => handleInputChange('situacaoFuncionamento', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Ano Letivo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">7a – Ano letivo - Início</label>
                  <input
                    type="date"
                    value={formData.inicioAnoLetivo}
                    onChange={(e) => handleInputChange('inicioAnoLetivo', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">7b – Ano letivo - Término (previsão)</label>
                  <input
                    type="date"
                    value={formData.terminoAnoLetivo}
                    onChange={(e) => handleInputChange('terminoAnoLetivo', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Nome da Escola */}
              <div>
                <label className="block text-sm font-semibold mb-2">8 – Nome da escola</label>
                <input
                  type="text"
                  value={formData.nomeEscola}
                  onChange={(e) => handleInputChange('nomeEscola', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* CEP */}
              <div>
                <label className="block text-sm font-semibold mb-2">9 – CEP</label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="00000-000"
                />
              </div>

              {/* UF e Município */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">10 – UF</label>
                  <select
                    value={formData.uf}
                    onChange={(e) => handleInputChange('uf', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Selecione...</option>
                    <option value="BA">BA - Bahia</option>
                    {/* Adicionar outros estados */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">11 – Município</label>
                  <input
                    type="text"
                    value={formData.municipio}
                    onChange={(e) => handleInputChange('municipio', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Região Administrativa e Distrito */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">11a – Região Administrativa</label>
                  <input
                    type="text"
                    value={formData.regiaoAdministrativa}
                    onChange={(e) => handleInputChange('regiaoAdministrativa', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">11b – Distrito</label>
                  <input
                    type="text"
                    value={formData.distrito}
                    onChange={(e) => handleInputChange('distrito', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-2">12 – Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">13 – Número</label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Complemento e Bairro */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">14 – Complemento</label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => handleInputChange('complemento', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">15 – Bairro</label>
                  <input
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Telefones */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">16 – DDD</label>
                  <input
                    type="text"
                    value={formData.ddd}
                    onChange={(e) => handleInputChange('ddd', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">17 – Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">18 – Outro telefone</label>
                  <input
                    type="text"
                    value={formData.outroTelefone}
                    onChange={(e) => handleInputChange('outroTelefone', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2">19 – Endereço eletrônico (e-mail) da escola</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Localização Diferenciada */}
              <div>
                <label className="block text-sm font-semibold mb-2">20 – Localização diferenciada da escola</label>
                <div className="space-y-2">
                  {[
                    'Área de assentamento',
                    'Terra indígena',
                    'Comunidade quilombola',
                    'Área onde se localizam povos e comunidades tradicionais',
                    'Não está em área de localização diferenciada'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="localizacaoDiferenciada"
                        value={option}
                        checked={formData.localizacaoDiferenciada === option}
                        onChange={(e) => handleInputChange('localizacaoDiferenciada', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Categoria Escola Privada */}
              {formData.dependenciaAdministrativa === 'Privada' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2">23 – Categoria da escola privada</label>
                    <div className="space-y-2">
                      {['Particular', 'Comunitária', 'Confessional', 'Filantrópica'].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="radio"
                            name="categoriaEscolaPrivada"
                            value={option}
                            checked={formData.categoriaEscolaPrivada === option}
                            onChange={(e) => handleInputChange('categoriaEscolaPrivada', e.target.value)}
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">24 – Mantenedora da escola privada</label>
                    <div className="space-y-2">
                      {[
                        'Empresa ou grupo empresarial do setor privado ou pessoa física',
                        'Sindicatos de trabalhadores ou patronais, associações, cooperativas',
                        'Instituição sem fins lucrativos',
                        'Organização não governamental – nacional ou internacional (ONG)',
                        'Sistema S (Sesi, Senai, Sesc, outros)',
                        'Organização da sociedade civil de interesse público (Oscip)'
                      ].map(option => (
                        <label key={option} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.mantenedoraPrivada.includes(option)}
                            onChange={() => handleCheckboxChange('mantenedoraPrivada', option)}
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">25 – CNPJ da mantenedora principal da escola privada</label>
                    <input
                      type="text"
                      value={formData.cnpjMantenedora}
                      onChange={(e) => handleInputChange('cnpjMantenedora', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">26 – CNPJ da escola privada</label>
                    <input
                      type="text"
                      value={formData.cnpjEscola}
                      onChange={(e) => handleInputChange('cnpjEscola', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ESTRUTURA FÍSICA */}
        <div className="border-b">
          <SectionHeader title="ESTRUTURA FÍSICA" section="estrutura" />
          {expandedSections.estrutura && (
            <div className="p-6 space-y-6">
              {/* Local de Funcionamento */}
              <div>
                <label className="block text-sm font-semibold mb-2">27 – Local de funcionamento da escola</label>
                <div className="space-y-2">
                  {[
                    'Prédio escolar',
                    'Galpão/rancho/paiol/barracão',
                    'Sala(s) em outra escola',
                    'Unidade de atendimento socioeducativo',
                    'Unidade prisional',
                    'Outros'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="localFuncionamento"
                        value={option}
                        checked={formData.localFuncionamento === option}
                        onChange={(e) => handleInputChange('localFuncionamento', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Forma de Ocupação */}
              <div>
                <label className="block text-sm font-semibold mb-2">28 – Forma de ocupação do prédio escolar</label>
                <div className="space-y-2">
                  {['Próprio', 'Alugado', 'Cedido'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="formaOcupacao"
                        value={option}
                        checked={formData.formaOcupacao === option}
                        onChange={(e) => handleInputChange('formaOcupacao', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Compartilha Prédio */}
              <div>
                <label className="block text-sm font-semibold mb-2">29 – A escola compartilha o seu prédio com outra instituição de ensino</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="compartilhaPredio"
                        value={option}
                        checked={formData.compartilhaPredio === option}
                        onChange={(e) => handleInputChange('compartilhaPredio', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {formData.compartilhaPredio === 'Sim' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">29a – Código da escola com a qual compartilha</label>
                  <input
                    type="text"
                    value={formData.codigoEscolaCompartilhada}
                    onChange={(e) => handleInputChange('codigoEscolaCompartilhada', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}

              {/* Água Potável */}
              <div>
                <label className="block text-sm font-semibold mb-2">30 – Fornece água potável para o consumo humano</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="aguaPotavel"
                        value={option}
                        checked={formData.aguaPotavel === option}
                        onChange={(e) => handleInputChange('aguaPotavel', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Abastecimento de Água */}
              <div>
                <label className="block text-sm font-semibold mb-2">31 – Abastecimento de água</label>
                <div className="space-y-2">
                  {[
                    'Rede pública',
                    'Poço artesiano',
                    'Cacimba/cisterna/poço',
                    'Fonte/rio/igarapé/riacho/córrego',
                    'Carro-pipa',
                    'Não há abastecimento de água'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.abastecimentoAgua.includes(option)}
                        onChange={() => handleCheckboxChange('abastecimentoAgua', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Fonte de Energia */}
              <div>
                <label className="block text-sm font-semibold mb-2">32 – Fonte de energia elétrica</label>
                <div className="space-y-2">
                  {[
                    'Rede pública',
                    'Gerador movido a combustível fóssil',
                    'Fontes de energia renováveis ou alternativas',
                    'Não há energia elétrica'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.fonteEnergia.includes(option)}
                        onChange={() => handleCheckboxChange('fonteEnergia', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Esgotamento Sanitário */}
              <div>
                <label className="block text-sm font-semibold mb-2">33 – Esgotamento sanitário</label>
                <div className="space-y-2">
                  {[
                    'Rede pública',
                    'Fossa séptica',
                    'Fossa rudimentar/comum',
                    'Não há esgotamento sanitário'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.esgotamento.includes(option)}
                        onChange={() => handleCheckboxChange('esgotamento', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Destinação do Lixo */}
              <div>
                <label className="block text-sm font-semibold mb-2">34 – Destinação do lixo</label>
                <div className="space-y-2">
                  {[
                    'Serviço de coleta',
                    'Queima',
                    'Enterra',
                    'Descarta em outra área',
                    'Leva a uma destinação final licenciada pelo poder público'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.destinacaoLixo.includes(option)}
                        onChange={() => handleCheckboxChange('destinacaoLixo', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Tratamento do Lixo */}
              <div>
                <label className="block text-sm font-semibold mb-2">35 – Tratamento do lixo/resíduos pela escola</label>
                <div className="space-y-2">
                  {[
                    'Separação do lixo/resíduos',
                    'Reaproveitamento/reutilização',
                    'Reciclagem',
                    'Não faz tratamento'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.tratamentoLixo.includes(option)}
                        onChange={() => handleCheckboxChange('tratamentoLixo', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Salas de Aula */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">38 – Salas de aula dentro do prédio</label>
                  <input
                    type="number"
                    value={formData.salasAulaDentro}
                    onChange={(e) => handleInputChange('salasAulaDentro', e.target.value)}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Salas de aula fora do prédio</label>
                  <input
                    type="number"
                    value={formData.salasAulaFora}
                    onChange={(e) => handleInputChange('salasAulaFora', e.target.value)}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              </div>

              {/* Salas Climatizadas */}
              <div>
                <label className="block text-sm font-semibold mb-2">39 – Quantidade de salas climatizadas</label>
                <input
                  type="number"
                  value={formData.salasClimatizadas}
                  onChange={(e) => handleInputChange('salasClimatizadas', e.target.value)}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>

              {/* Salas com Acessibilidade */}
              <div>
                <label className="block text-sm font-semibold mb-2">Salas com recursos de acessibilidade</label>
                <input
                  type="number"
                  value={formData.salasAcessibilidade}
                  onChange={(e) => handleInputChange('salasAcessibilidade', e.target.value)}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>

              {/* Salas com Cantinho da Leitura */}
              <div>
                <label className="block text-sm font-semibold mb-2">40 – Salas com Cantinho da Leitura</label>
                <input
                  type="number"
                  value={formData.salasCantinoLeitura}
                  onChange={(e) => handleInputChange('salasCantinoLeitura', e.target.value)}
                  className="w-full p-2 border rounded"
                  min="0"
                />
              </div>

              {/* Recursos de Acessibilidade */}
              <div>
                <label className="block text-sm font-semibold mb-2">37 – Recursos de acessibilidade nas vias de circulação</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Rampas',
                    'Elevador',
                    'Pisos táteis',
                    'Portas com vão livre de no mínimo 80 cm',
                    'Corrimão e guarda-corpos',
                    'Sinalização/alarme luminoso',
                    'Sinalização sonora',
                    'Sinalização tátil',
                    'Sinalização visual (piso/paredes)',
                    'Nenhum dos recursos listados'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.recursosAcessibilidade.includes(option)}
                        onChange={() => handleCheckboxChange('recursosAcessibilidade', option)}
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

        {/* EQUIPAMENTOS E RECURSOS TECNOLÓGICOS */}
        <div className="border-b">
          <SectionHeader title="EQUIPAMENTOS E RECURSOS TECNOLÓGICOS" section="equipamentos" />
          {expandedSections.equipamentos && (
            <div className="p-6 space-y-6">
              {/* Equipamentos Administrativos */}
              <div>
                <label className="block text-sm font-semibold mb-2">41 – Equipamentos existentes para uso técnico e administrativo</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Computadores',
                    'Impressora',
                    'Scanner',
                    'Copiadora',
                    'Impressora multifuncional',
                    'Antena parabólica',
                    'Nenhum dos equipamentos listados'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.equipamentosAdministrativos.includes(option)}
                        onChange={() => handleCheckboxChange('equipamentosAdministrativos', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Equipamentos de Ensino */}
              <div>
                <label className="block text-sm font-semibold mb-2">42 – Equipamentos para ensino-aprendizagem</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Aparelho de televisão',
                    'Aparelho de som',
                    'Aparelho de DVD/Blu-ray',
                    'Projetor multimídia (Data show)',
                    'Lousa digital'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.equipamentosEnsinoAprendizagem.includes(option)}
                        onChange={() => handleCheckboxChange('equipamentosEnsinoAprendizagem', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Computadores */}
              <div>
                <label className="block text-sm font-semibold mb-2">43 – Quantidade de computadores em uso pelos alunos</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Computadores de mesa</label>
                    <input
                      type="number"
                      value={formData.computadoresDesktop}
                      onChange={(e) => handleInputChange('computadoresDesktop', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Computadores portáteis</label>
                    <input
                      type="number"
                      value={formData.computadoresPortateis}
                      onChange={(e) => handleInputChange('computadoresPortateis', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Tablets</label>
                    <input
                      type="number"
                      value={formData.tablets}
                      onChange={(e) => handleInputChange('tablets', e.target.value)}
                      className="w-full p-2 border rounded"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Rede Local */}
              <div>
                <label className="block text-sm font-semibold mb-2">44 – Rede local de interligação de computadores</label>
                <div className="space-y-2">
                  {[
                    'A cabo',
                    'Wireless',
                    'Não há rede local interligando computadores'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.redeLocal.includes(option)}
                        onChange={() => handleCheckboxChange('redeLocal', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Acesso à Internet */}
              <div>
                <label className="block text-sm font-semibold mb-2">45 – Acesso à internet</label>
                <div className="space-y-2">
                  {[
                    'Para uso dos alunos',
                    'Para uso administrativo',
                    'Para uso no processo de ensino-aprendizagem',
                    'Para uso da comunidade',
                    'Não possui acesso à internet'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.acessoInternet.includes(option)}
                        onChange={() => handleCheckboxChange('acessoInternet', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Internet Banda Larga */}
              <div>
                <label className="block text-sm font-semibold mb-2">47 – Internet banda larga</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="internetBandaLarga"
                        value={option}
                        checked={formData.internetBandaLarga === option}
                        onChange={(e) => handleInputChange('internetBandaLarga', e.target.value)}
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

        {/* RECURSOS HUMANOS */}
        <div className="border-b">
          <SectionHeader title="RECURSOS HUMANOS" section="recursos" />
          {expandedSections.recursos && (
            <div className="p-6 space-y-4">
              <p className="text-sm font-semibold mb-4">48 – Total de profissionais que atuam nas seguintes funções na escola</p>
              
              {[
                'Secretário(a) escolar',
                'Auxiliares de secretaria',
                'Auxiliar de serviços gerais',
                'Bibliotecário(a)',
                'Profissionais de apoio pedagógico',
                'Segurança',
                'Técnicos de laboratório',
                'Psicólogo(a) escolar',
                'Fonoaudiólogo(a)',
                'Profissionais de alimentação',
                'Coordenador(a) de turno',
                'Nutricionista',
                'Orientador(a) comunitário',
                'Vice-diretor(a)',
                'Tradutor(a) e Intérprete de Libras',
                'Agrônomos(as)',
                'Revisor(a) de texto Braille',
                'Bombeiro(a) brigadista'
              ].map(profissional => (
                <div key={profissional} className="grid grid-cols-2 gap-4 items-center">
                  <label className="text-sm">{profissional}</label>
                  <input
                    type="number"
                    value={formData.profissionais[profissional] || ''}
                    onChange={(e) => handleProfissionalChange(profissional, e.target.value)}
                    className="w-full p-2 border rounded"
                    min="0"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ORGANIZAÇÃO ESCOLAR */}
        <div className="border-b">
          <SectionHeader title="ORGANIZAÇÃO ESCOLAR" section="organizacao" />
          {expandedSections.organizacao && (
            <div className="p-6 space-y-6">
              {/* Alimentação Escolar */}
              <div>
                <label className="block text-sm font-semibold mb-2">49 – Alimentação escolar para os alunos</label>
                <div className="space-y-2">
                  {['Oferece', 'Não oferece'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="alimentacaoEscolar"
                        value={option}
                        checked={formData.alimentacaoEscolar === option}
                        onChange={(e) => handleInputChange('alimentacaoEscolar', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Escola Indígena */}
              <div>
                <label className="block text-sm font-semibold mb-2">50 – Escola indígena</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="escolaIndigena"
                        value={option}
                        checked={formData.escolaIndigena === option}
                        onChange={(e) => handleInputChange('escolaIndigena', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {formData.escolaIndigena === 'Sim' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">50a – Língua em que o ensino é ministrado</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.linguaEnsino.includes('Língua Portuguesa')}
                        onChange={() => handleCheckboxChange('linguaEnsino', 'Língua Portuguesa')}
                        className="mr-2"
                      />
                      Língua Portuguesa
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.linguaEnsino.includes('Língua Indígena')}
                        onChange={() => handleCheckboxChange('linguaEnsino', 'Língua Indígena')}
                        className="mr-2"
                      />
                      Língua Indígena
                    </label>
                  </div>
                  
                  {formData.linguaEnsino.includes('Língua Indígena') && (
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-semibold">Código de Língua Indígena (até 3)</label>
                      {[0, 1, 2].map(index => (
                        <input
                          key={index}
                          type="text"
                          value={formData.codigoLinguaIndigena[index]}
                          onChange={(e) => {
                            const newCodigos = [...formData.codigoLinguaIndigena];
                            newCodigos[index] = e.target.value;
                            handleInputChange('codigoLinguaIndigena', newCodigos);
                          }}
                          className="w-full p-2 border rounded"
                          placeholder={`Código ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Educação Ambiental */}
              <div>
                <label className="block text-sm font-semibold mb-2">52 – A escola desenvolve ações na área de educação ambiental</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="educacaoAmbiental"
                        value={option}
                        checked={formData.educacaoAmbiental === option}
                        onChange={(e) => handleInputChange('educacaoAmbiental', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {formData.educacaoAmbiental === 'Sim' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">52a – Forma(s) como a educação ambiental é desenvolvida</label>
                  <div className="space-y-2">
                    {[
                      'Como conteúdo dos componentes/campos de experiências',
                      'Como um componente curricular especial',
                      'Em eventos',
                      'Em projetos transversais ou interdisciplinares',
                      'Como um eixo estruturante do currículo'
                    ].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.formasEducacaoAmbiental.includes(option)}
                          onChange={() => handleCheckboxChange('formasEducacaoAmbiental', option)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* PPP Atualizado */}
              <div>
                <label className="block text-sm font-semibold mb-2">53 – O projeto político pedagógico foi atualizado nos últimos 12 meses</label>
                <div className="space-y-2">
                  {['Sim', 'Não', 'A escola não possui PPP'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="pppAtualizado"
                        value={option}
                        checked={formData.pppAtualizado === option}
                        onChange={(e) => handleInputChange('pppAtualizado', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Órgãos Colegiados */}
              <div>
                <label className="block text-sm font-semibold mb-2">54 – Órgãos colegiados em funcionamento na escola</label>
                <div className="space-y-2">
                  {[
                    'Grêmio estudantil',
                    'Conselho escolar',
                    'Associação de pais e mestres',
                    'Associação de pais',
                    'Outros',
                    'Não há órgãos colegiados'
                  ].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.orgaosColegiados.includes(option)}
                        onChange={() => handleCheckboxChange('orgaosColegiados', option)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Compartilha Espaços */}
              <div>
                <label className="block text-sm font-semibold mb-2">55 – A escola compartilha espaços para atividades escola-comunidade</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="compartilhaEspacos"
                        value={option}
                        checked={formData.compartilhaEspacos === option}
                        onChange={(e) => handleInputChange('compartilhaEspacos', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Usa Espaços do Entorno */}
              <div>
                <label className="block text-sm font-semibold mb-2">56 – A escola usa espaços do entorno para atividades regulares</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="usaEspacosEntorno"
                        value={option}
                        checked={formData.usaEspacosEntorno === option}
                        onChange={(e) => handleInputChange('usaEspacosEntorno', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Site/Blog/Redes */}
              <div>
                <label className="block text-sm font-semibold mb-2">57 – A escola possui site, blog ou página em redes sociais</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="siteBlogRedes"
                        value={option}
                        checked={formData.siteBlogRedes === option}
                        onChange={(e) => handleInputChange('siteBlogRedes', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Exame de Seleção */}
              <div>
                <label className="block text-sm font-semibold mb-2">58 – A escola faz exame de seleção para ingresso</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name="exameSelecao"
                        value={option}
                        checked={formData.exameSelecao === option}
                        onChange={(e) => handleInputChange('exameSelecao', e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {/* Reserva de Vagas */}
              {formData.exameSelecao === 'Sim' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">59 – Reserva de vagas por sistema de cotas</label>
                  <div className="space-y-2">
                    {[
                      'Sem reservas de vagas (ampla concorrência)',
                      'Autodeclarado preto, pardo ou indígena (PPI)',
                      'Oriundo de escola pública',
                      'Pessoa com deficiência (PCD)',
                      'Condição de renda',
                      'Outros grupos'
                    ].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.reservaVagas.includes(option)}
                          onChange={() => handleCheckboxChange('reservaVagas', option)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}
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

export default CensoEscolarForm;