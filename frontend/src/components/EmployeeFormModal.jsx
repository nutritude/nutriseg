import React, { useState, useEffect } from 'react';
import { X, Save, User, Briefcase, Calendar, AlertCircle, MapPin, Phone, Mail, Fingerprint, Info, PowerOff, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import EmployeeService from '../services/EmployeeService';

const EmployeeFormModal = ({ isOpen, onClose, onSave, employee, units = [], unitId, fixedUnit = false, onDelete }) => {

    const [activeTab, setActiveTab] = useState('personal');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmMode, setConfirmMode] = useState(null); // null | 'deactivate' | 'delete'
    const [deactivateReason, setDeactivateReason] = useState(null); // null | 'Afastado' | 'Férias' | 'Outros'
    const [actionError, setActionError] = useState('');
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

    const [formData, setFormData] = useState({
        // Dados Pessoais
        name: '',
        cpf: '',
        rg: '',
        birthDate: '',
        gender: '',

        // Contato
        phone: '',
        email: '',

        // Endereço
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
        },

        // Profissional
        role: '',
        unitId: unitId || '',
        employmentType: 'Próprio',
        hasFoodContact: true,
        admissionDate: '',

        // Saúde
        health: {
            lastASO: '',
            coprocultureDate: '',
            coproparasitologyDate: '',
            hygieneTrainingDate: ''
        },

        // Ações Corretivas
        correctiveActions: {
            training: false,
            medicalExams: false,
            others: ''
        }
    });

    const safeToISODate = (dateVal) => {
        if (!dateVal) return '';
        try {
            const date = new Date(dateVal);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name || '',
                cpf: employee.cpf || '',
                rg: employee.rg || '',
                birthDate: safeToISODate(employee.birthDate),
                gender: employee.gender || '',
                phone: employee.phone || '',
                email: employee.email || '',
                address: employee.address || {
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    zipCode: ''
                },
                role: employee.role || '',
                unitId: (employee.unitId?._id || employee.unitId) || unitId || '',
                employmentType: employee.employmentType || 'Próprio',
                hasFoodContact: employee.hasFoodContact !== undefined ? employee.hasFoodContact : true,
                admissionDate: safeToISODate(employee.admissionDate),
                health: {
                    lastASO: safeToISODate(employee.health?.lastASO),
                    coprocultureDate: safeToISODate(employee.health?.coprocultureDate),
                    coproparasitologyDate: safeToISODate(employee.health?.coproparasitologyDate),
                    hygieneTrainingDate: safeToISODate(employee.health?.hygieneTrainingDate)
                },
                correctiveActions: employee.correctiveActions || {
                    training: false,
                    medicalExams: false,
                    others: ''
                }
            });
        } else if (unitId) {
            setFormData(prev => ({ ...prev, unitId }));
        }
    }, [employee, unitId]);

    // IMPORTANTE: return null deve vir DEPOIS de todos os hooks
    if (!isOpen) return null;

    const formatCPF = (value) => {
        const numbers = value.replace(/\D/g, '').slice(0, 11);
        return numbers
            .replace(/^(\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const formatCEP = (value) => {
        const numbers = value.replace(/\D/g, '').slice(0, 8);
        return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
    };

    const formatPhone = (value) => {
        const numbers = value.replace(/\D/g, '').slice(0, 11);
        if (numbers.length <= 10) {
            return numbers
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            return numbers
                .replace(/^(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        }
    };

    const handleChange = (e) => {
        let { name, value, type, checked } = e.target;

        if (name === 'cpf') value = formatCPF(value);
        if (name === 'phone') value = formatPhone(value);
        if (name === 'address.zipCode') value = formatCEP(value);

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving || isDeleting) return;

        try {
            setIsSaving(true);
            setSaveStatus({ type: 'loading', message: 'Salvando...' });

            // Sanitização de dados antes de enviar para o servidor
            const sanitizedData = {
                ...formData,
                gender: formData.gender === '' ? null : formData.gender,
                // Garantir que campos de saúde vazios não causem problemas
                health: {
                    lastASO: formData.health.lastASO || null,
                    coprocultureDate: formData.health.coprocultureDate || null,
                    hygieneTrainingDate: formData.health.hygieneTrainingDate || null,
                    coproparasitologyDate: formData.health.coproparasitologyDate || null
                }
            };

            await onSave(sanitizedData);
            setSaveStatus({ type: 'success', message: 'Salvo com sucesso!' });
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            console.error('[EmployeeFormModal] Erro ao salvar:', msg, error);
            setSaveStatus({ type: 'error', message: 'Erro: ' + msg });
        } finally {
            setIsSaving(false);
        }
    };

    const getHealthStatusPreview = () => {
        const { lastASO, coprocultureDate, coproparasitologyDate, hygieneTrainingDate } = formData.health;
        if (!lastASO || !coprocultureDate || !coproparasitologyDate || !hygieneTrainingDate) {
            return { status: 'Pendente', color: 'text-gray-500', message: 'Preencha datas de exames/treinamentos' };
        }
        const now = new Date();
        const asoDate = new Date(lastASO);
        const coproDate = new Date(coprocultureDate);
        const coproparaDate = new Date(coproparasitologyDate);
        const trainDate = new Date(hygieneTrainingDate);
        const oneYear = 1000 * 60 * 60 * 24 * 365;
        if ((now - asoDate) > oneYear || (now - coproDate) > oneYear || (now - coproparaDate) > oneYear || (now - trainDate) > oneYear) {
            return { status: 'Inapto', color: 'text-red-600', message: 'Exames/Treinamentos vencidos' };
        }
        const expiringSoon = 1000 * 60 * 60 * 24 * 335;
        if ((now - asoDate) > expiringSoon || (now - coproDate) > expiringSoon || (now - coproparaDate) > expiringSoon || (now - trainDate) > expiringSoon) {
            return { status: 'Apto (Vencendo)', color: 'text-yellow-600', message: 'Vence em < 30 dias' };
        }
        return { status: 'Apto', color: 'text-green-600', message: 'Todos em dia' };
    };

    const healthStatus = getHealthStatusPreview();

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="bg-blue-600 text-white p-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl">
                                {employee ? 'Editar Colaborador' : 'Novo Colaborador'}
                            </h3>
                            <p className="text-blue-100 text-xs">Cadastro completo de conformidade sanitária</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSaving || isDeleting} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors disabled:opacity-50">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-slate-50 shrink-0 overflow-x-auto scrollbar-hide">
                    <button
                        type="button"
                        onClick={() => setActiveTab('personal')}
                        disabled={isSaving || isDeleting}
                        className={`px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all disabled:opacity-50 ${activeTab === 'personal' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Dados Pessoais
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('address')}
                        disabled={isSaving || isDeleting}
                        className={`px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all disabled:opacity-50 ${activeTab === 'address' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Endereço
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('professional')}
                        disabled={isSaving || isDeleting}
                        className={`px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all disabled:opacity-50 ${activeTab === 'professional' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Profissional & Saúde
                    </button>
                </div>

                {/* Form Body */}
                <form id="employee-form" onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
                    {activeTab === 'personal' && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo *</label>
                                <input
                                    type="text" name="name" value={formData.name} onChange={handleChange} required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CPF *</label>
                                    <input
                                        type="text" name="cpf" value={formData.cpf} onChange={handleChange} required placeholder="000.000.000-00"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">RG</label>
                                    <input
                                        type="text" name="rg" value={formData.rg} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data de Nascimento</label>
                                    <input
                                        type="date" name="birthDate" value={formData.birthDate} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gênero</label>
                                    <select
                                        name="gender" value={formData.gender} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Phone size={12} /> Telefone
                                    </label>
                                    <input
                                        type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Mail size={12} /> Email
                                    </label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'address' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CEP</label>
                                    <input
                                        type="text" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} placeholder="00000-000"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rua</label>
                                    <input
                                        type="text" name="address.street" value={formData.address.street} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Número</label>
                                    <input
                                        type="text" name="address.number" value={formData.address.number} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Complemento</label>
                                    <input
                                        type="text" name="address.complement" value={formData.address.complement} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bairro</label>
                                    <input
                                        type="text" name="address.neighborhood" value={formData.address.neighborhood} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cidade</label>
                                    <input
                                        type="text" name="address.city" value={formData.address.city} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estado</label>
                                    <input
                                        type="text" name="address.state" value={formData.address.state} onChange={handleChange} maxLength="2" placeholder="UF"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'professional' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Função *</label>
                                    <input
                                        type="text" name="role" value={formData.role} onChange={handleChange} required placeholder="Ex: Cozinheiro"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vínculo</label>
                                    <select
                                        name="employmentType" value={formData.employmentType} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="Próprio">Próprio</option>
                                        <option value="Cliente">Cliente</option>
                                        <option value="Freelancer">Freelancer</option>
                                    </select>
                                </div>
                            </div>

                            {!fixedUnit && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade *</label>
                                    <select
                                        name="unitId" value={formData.unitId} onChange={handleChange} required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Selecione uma unidade...</option>
                                        {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data de Admissão</label>
                                    <input
                                        type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-full hover:bg-slate-100 transition-all">
                                        <input
                                            type="checkbox" name="hasFoodContact" checked={formData.hasFoodContact} onChange={handleChange}
                                            className="w-5 h-5 text-blue-600 rounded"
                                        />
                                        <span className="text-sm font-bold text-slate-700">Manipulador de Alimentos</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Info size={16} className="text-blue-600" /> Saúde Ocupacional (CVS 5 / RDC 216)
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ASO (Último)</label>
                                        <input type="date" name="health.lastASO" value={formData.health.lastASO} onChange={handleChange} className="w-full p-2 text-xs border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coprocultura</label>
                                        <input type="date" name="health.coprocultureDate" value={formData.health.coprocultureDate} onChange={handleChange} className="w-full p-2 text-xs border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coprossist.</label>
                                        <input type="date" name="health.coproparasitologyDate" value={formData.health.coproparasitologyDate} onChange={handleChange} className="w-full p-2 text-xs border rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Treinamento</label>
                                        <input type="date" name="health.hygieneTrainingDate" value={formData.health.hygieneTrainingDate} onChange={handleChange} className="w-full p-2 text-xs border rounded-lg" />
                                    </div>
                                </div>

                                <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${healthStatus.status === 'Apto' ? 'bg-green-50 border-green-200' :
                                    healthStatus.status === 'Inapto' ? 'bg-red-50 border-red-200' :
                                        healthStatus.status === 'Apto (Vencendo)' ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status de Saúde</p>
                                        <p className={`text-lg font-black ${healthStatus.color}`}>{healthStatus.status}</p>
                                    </div>
                                    <p className="text-xs font-bold text-slate-600 bg-white/50 px-3 py-1 rounded-full">{healthStatus.message}</p>
                                </div>

                                {/* Seção de Ações Corretivas - Condicional */}
                                {(healthStatus.status === 'Inapto' || healthStatus.status === 'Apto (Vencendo)') && (
                                    <div className="mt-6 p-5 bg-orange-50/50 border border-orange-100 rounded-2xl animate-fade-in">
                                        <h6 className="text-xs font-black text-orange-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <AlertTriangle size={14} /> Monitoramento de Ações Corretivas
                                        </h6>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-orange-100 cursor-pointer hover:bg-orange-50 transition-all">
                                                <input
                                                    type="checkbox"
                                                    name="correctiveActions.training"
                                                    checked={formData.correctiveActions.training}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-orange-600 rounded"
                                                />
                                                <span className="text-xs font-bold text-orange-900">Treinamento Requerido</span>
                                            </label>
                                            <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-orange-100 cursor-pointer hover:bg-orange-50 transition-all">
                                                <input
                                                    type="checkbox"
                                                    name="correctiveActions.medicalExams"
                                                    checked={formData.correctiveActions.medicalExams}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-orange-600 rounded"
                                                />
                                                <span className="text-xs font-bold text-orange-900">Solicitar Exame Médico</span>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-orange-400 uppercase mb-1">Outras Solicitações / Observações</label>
                                            <textarea
                                                name="correctiveActions.others"
                                                value={formData.correctiveActions.others}
                                                onChange={handleChange}
                                                placeholder="Descreva aqui outras ações necessárias para regularizar a situação..."
                                                className="w-full px-4 py-3 bg-white border border-orange-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="border-t p-4 bg-slate-50 shrink-0">
                    {/* Painel de Confirmação Inline */}
                    {confirmMode === 'deactivate' && (
                        <div className="mb-3 p-3 rounded-xl border bg-amber-50 border-amber-300 flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <PowerOff size={15} className="text-amber-600" />
                                <span className="text-sm font-bold text-amber-800">
                                    Qual o motivo do afastamento de <span className="italic">{employee?.name}</span>?
                                </span>
                            </div>

                            {/* Seleção de motivo */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'Afastado', icon: '🏥', desc: 'Licença médica ou afastamento' },
                                    { value: 'Férias', icon: '🏖️', desc: 'Período de férias' },
                                    { value: 'Outros', icon: '📌', desc: 'Outro motivo' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setDeactivateReason(opt.value)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs font-bold transition-all ${deactivateReason === opt.value
                                            ? 'border-amber-500 bg-amber-100 text-amber-800'
                                            : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300'
                                            }`}
                                    >
                                        <span className="text-lg">{opt.icon}</span>
                                        <span>{opt.value}</span>
                                        <span className="text-[10px] font-normal text-center leading-tight opacity-80">{opt.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {actionError && (
                                <p className="text-xs text-red-700 font-bold bg-red-100 px-2 py-1 rounded">{actionError}</p>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={isDeleting || !deactivateReason}
                                    onClick={async () => {
                                        if (!employee?._id || isDeleting || !deactivateReason) return;
                                        setActionError('');
                                        try {
                                            setIsDeleting(true);
                                            await EmployeeService.deactivateEmployee(employee._id, deactivateReason);
                                            if (onDelete) onDelete(employee._id);
                                            onClose();
                                        } catch (err) {
                                            const msg = err.response?.data?.error || err.message || 'Erro desconhecido';
                                            console.error('[EmployeeFormModal] Falha ao desativar:', msg, err);
                                            setActionError('Erro: ' + msg);
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="flex-1 py-2 rounded-lg text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 text-white bg-amber-500 hover:bg-amber-600 transition-all"
                                >
                                    {isDeleting ? (
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                    ) : (
                                        <PowerOff size={14} />
                                    )}
                                    {isDeleting ? 'Desativando...' : deactivateReason ? `Confirmar — ${deactivateReason}` : 'Selecione o motivo'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => { setConfirmMode(null); setDeactivateReason(null); setActionError(''); }}
                                    className="flex-1 py-2 rounded-lg text-sm font-bold border border-slate-300 text-slate-600 hover:bg-slate-100"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {confirmMode === 'delete' && (
                        <div className="mb-3 p-3 rounded-xl border bg-red-50 border-red-300 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={15} className="text-red-600" />
                                <span className="text-sm font-bold text-red-800">
                                    Excluir permanentemente <span className="italic">{employee?.name}</span>?
                                </span>
                            </div>
                            <p className="text-xs text-red-600">O registro será removido do banco de dados e não poderá ser recuperado.</p>
                            {actionError && (
                                <p className="text-xs text-red-700 font-bold bg-red-100 px-2 py-1 rounded">{actionError}</p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        if (!employee?._id || isDeleting) return;
                                        setActionError('');
                                        try {
                                            setIsDeleting(true);
                                            await EmployeeService.deleteEmployee(employee._id);
                                            if (onDelete) onDelete(employee._id);
                                            onClose();
                                        } catch (err) {
                                            const msg = err.response?.data?.error || err.message || 'Erro desconhecido';
                                            console.error('[EmployeeFormModal] Falha ao excluir:', msg, err);
                                            setActionError('Erro: ' + msg);
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="flex-1 py-2 rounded-lg text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 text-white bg-red-600 hover:bg-red-700"
                                >
                                    {isDeleting ? <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" /> : <Trash2 size={14} />}
                                    {isDeleting ? 'Excluindo...' : 'Sim, Excluir Permanentemente'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => { setConfirmMode(null); setActionError(''); }}
                                    className="flex-1 py-2 rounded-lg text-sm font-bold border border-slate-300 text-slate-600 hover:bg-slate-100"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status Message Area */}
                    <div className="w-full mb-3">
                        {saveStatus.message && !confirmMode && (
                            <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg animate-fade-in ${saveStatus.type === 'loading' ? 'bg-blue-50 text-blue-700' :
                                saveStatus.type === 'success' ? 'bg-green-50 text-green-700' :
                                    'bg-red-50 text-red-700'
                                }`}>
                                {saveStatus.type === 'loading' && <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />}
                                {saveStatus.type === 'success' && <CheckCircle size={16} />}
                                {saveStatus.type === 'error' && <AlertTriangle size={16} />}
                                {saveStatus.message}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center gap-3">
                        {/* Botões de ação destrutiva */}
                        <div className="flex gap-2">
                            {employee && !confirmMode && (
                                <>
                                    <button
                                        type="button"
                                        disabled={isDeleting || isSaving}
                                        onClick={() => { setConfirmMode('deactivate'); setActionError(''); }}
                                        className="px-3 py-2 border border-amber-300 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-50 flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        <PowerOff size={13} />
                                        Desativar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isDeleting || isSaving}
                                        onClick={() => { setConfirmMode('delete'); setActionError(''); }}
                                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        <Trash2 size={13} />
                                        Excluir
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Botões principais */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setConfirmMode(null); onClose(); }}
                                disabled={isSaving || isDeleting}
                                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="employee-form"
                                disabled={isSaving || isDeleting}
                                className="px-7 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:bg-slate-400"
                            >
                                {isSaving ? (
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                ) : (
                                    <Save size={18} />
                                )}
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeFormModal;
