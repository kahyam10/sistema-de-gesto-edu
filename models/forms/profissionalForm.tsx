import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, Download, User, GraduationCap, Briefcase } from 'lucide-react';

const CensoProfissionalForm = () => {
  const [formData, setFormData] = useState({
    identificacaoUnica: '',
    codigoEscola: '',
    cpf: '',
    nomeCompleto: '',
    dataNascimento: '',
    sexo: '',
    corRaca: '',
    nacionalidade: '',
    maiorEscolaridade: '',
    cursosSuperiores: [{ area: '', curso: '' }],
    posGraduacoes: [{ nivel: '', area: '' }],
    turmas: ['', '', '', ''],
    funcaoTurma: '',
    situacaoFuncional: '',
    lecionaFGB: '',
    lecionaIFA: '',
    lecionaIFTP: ''
  });

  const [expandedSections, setExpandedSections] = useState({
    identificacao: true,
    residencia: false,
    escolaridade: false,
    vinculo: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTurmaChange = (index, value) => {
    setFormData(prev => {
      const newTurmas = [...prev.turmas];
      newTurmas[index] = value;
      return { ...prev, turmas: newTurmas };
    });
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `censo-profissional-${formData.cpf || 'dados'}.json`;
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
          <p className="text-xl mt-2">QUESTIONÁRIO DE PROFISSIONAL ESCOLAR</p>
        </div>

        <div className="border-b">
          <SectionHeader title="IDENTIFICAÇÃO" section="identificacao" icon={User} />
          {expandedSections.identificacao && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Identificação única</label>
                <input type="text" value={formData.identificacaoUnica} onChange={(e) => handleInputChange('identificacaoUnica', e.target.value)} className="w-full p-2 border rounded bg-gray-50" readOnly placeholder="Gerado pelo Inep" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Código da escola</label>
                <input type="text" value={formData.codigoEscola} onChange={(e) => handleInputChange('codigoEscola', e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">CPF</label>
                <input type="text" value={formData.cpf} onChange={(e) => handleInputChange('cpf', e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nome completo</label>
                <input type="text" value={formData.nomeCompleto} onChange={(e) => handleInputChange('nomeCompleto', e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Data de nascimento</label>
                <input type="date" value={formData.dataNascimento} onChange={(e) => handleInputChange('dataNascimento', e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sexo</label>
                <div className="space-y-2">
                  {['Masculino', 'Feminino'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="sexo" value={option} checked={formData.sexo === option} onChange={(e) => handleInputChange('sexo', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Cor/raça</label>
                <div className="space-y-2">
                  {['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não declarada'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="corRaca" value={option} checked={formData.corRaca === option} onChange={(e) => handleInputChange('corRaca', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nacionalidade</label>
                <div className="space-y-2">
                  {['Brasileira', 'Brasileira - exterior', 'Estrangeira'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="nacionalidade" value={option} checked={formData.nacionalidade === option} onChange={(e) => handleInputChange('nacionalidade', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-b">
          <SectionHeader title="ESCOLARIDADE" section="escolaridade" icon={GraduationCap} />
          {expandedSections.escolaridade && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Maior nível concluído</label>
                <div className="space-y-2">
                  {['Fundamental', 'Médio', 'Superior'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="maiorEscolaridade" value={option} checked={formData.maiorEscolaridade === option} onChange={(e) => handleInputChange('maiorEscolaridade', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              {formData.maiorEscolaridade === 'Superior' && (
                <div className="space-y-4">
                  <label className="text-sm font-semibold">Cursos Superiores</label>
                  {formData.cursosSuperiores.map((curso, i) => (
                    <div key={i} className="border rounded p-4 bg-gray-50 space-y-3">
                      <h4 className="font-semibold">Curso {i + 1}</h4>
                      <input type="text" placeholder="Área" value={curso.area} className="w-full p-2 border rounded" />
                      <input type="text" placeholder="Curso" value={curso.curso} className="w-full p-2 border rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-b">
          <SectionHeader title="VÍNCULO" section="vinculo" icon={Briefcase} />
          {expandedSections.vinculo && (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Turmas em que atua</label>
                {formData.turmas.map((turma, index) => (
                  <div key={index} className="mb-2">
                    <input type="text" placeholder={`Turma ${index + 1}`} value={turma} onChange={(e) => handleTurmaChange(index, e.target.value)} className="w-full p-2 border rounded" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Função na turma</label>
                <div className="space-y-2">
                  {['Docente', 'Auxiliar educacional', 'Tradutor Libras', 'Apoio escolar'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="funcaoTurma" value={option} checked={formData.funcaoTurma === option} onChange={(e) => handleInputChange('funcaoTurma', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Situação funcional</label>
                <div className="space-y-2">
                  {['Concursado', 'Temporário', 'Terceirizado', 'CLT'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="situacaoFuncional" value={option} checked={formData.situacaoFuncional === option} onChange={(e) => handleInputChange('situacaoFuncional', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Leciona FGB</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="lecionaFGB" value={option} checked={formData.lecionaFGB === option} onChange={(e) => handleInputChange('lecionaFGB', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Leciona IFA</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="lecionaIFA" value={option} checked={formData.lecionaIFA === option} onChange={(e) => handleInputChange('lecionaIFA', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Leciona IFTP</label>
                <div className="space-y-2">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center">
                      <input type="radio" name="lecionaIFTP" value={option} checked={formData.lecionaIFTP === option} onChange={(e) => handleInputChange('lecionaIFTP', e.target.value)} className="mr-2" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex gap-4 justify-end">
          <button onClick={exportJSON} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700">
            <Download size={20} />
            Exportar JSON
          </button>
          <button onClick={() => console.log(formData)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
            <Save size={20} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CensoProfissionalForm;