import React, { useState, useEffect } from 'react';
import { X, Save, Building2, Target, FileText, AlertTriangle, MapPin, Users, Plus, Edit2, ChefHat, Trash2, Upload, CheckCircle, Info, PowerOff } from 'lucide-react';
import EmployeeService from '../services/EmployeeService';
import UnitService from '../services/UnitService';
import EmployeeFormModal from './EmployeeFormModal';

const UnitFormModal = ({ isOpen, onClose, onSave, unit, onDelete }) => {
    const [activeTab, setActiveTab] = useState('identification');
    const [employees, setEmployees] = useState([]);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
    const [newFixedDish, setNewFixedDish] = useState({ category: 'Principal', name: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmMode, setConfirmMode] = useState(null); // null | 'deactivate' | 'delete'
    const [actionError, setActionError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: ''
        },
        type: 'Local',
        rtNutritionist: '',
        mealTargets: {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            supper: 0
        },
        sanitaryDocs: [],
        menuComponents: {
            principal: 1,
            guarnicao: 1,
            salada: 1,
            sobremesa: 1,
            suco: 1
        },
        fixedDishes: []
    });

    const [newDoc, setNewDoc] = useState({
        type: 'Alvará',
        expirationDate: ''
    });

    // IMPORTANTE: return null deve vir DEPOIS de todos os hooks
    if (!isOpen) return null;

    useEffect(() => {
        if (unit) {
            setFormData({
                name: unit.name || '',
                cnpj: unit.cnpj || '',
                address: unit.address || {
                    street: '',
                    number: '',
                    complement: '',
                    neighborhood: '',
                    city: '',
                    state: '',
                    zipCode: ''
                },
                type: unit.type || 'Local',
                rtNutritionist: unit.rtNutritionist || '',
                mealTargets: unit.mealTargets || {
                    breakfast: 0,
                    lunch: 0,
                    dinner: 0,
                    supper: 0
                },
                sanitaryDocs: unit.sanitaryDocs || [],
                menuComponents: unit.menuComponents || {
                    principal: 1,
                    guarnicao: 1,
                    salada: 1,
                    sobremesa: 1,
                    suco: 1
                },
                fixedDishes: unit.fixedDishes || []
            });

            // Load employees for this unit
            loadEmployees();
        }
    }, [unit]);

    const loadEmployees = async () => {
        if (!unit?._id) return;
        try {
            const data = await EmployeeService.getEmployeesByUnit(unit._id);
            setEmployees(data.employees || []);
        } catch (error) {
            console.error('Error loading employees:', error);
        }
    };

    const handleAddEmployee = () => {
        setSelectedEmployee(null);
        setIsEmployeeModalOpen(true);
    };

    const handleEditEmployee = (employee) => {
        setSelectedEmployee(employee);
        setIsEmployeeModalOpen(true);
    };

    const handleSaveEmployee = async (employeeData) => {
        try {
            // Ensure unitId is set
            employeeData.unitId = unit._id;

            if (selectedEmployee) {
                await EmployeeService.updateEmployee(selectedEmployee._id, employeeData);
            } else {
                await EmployeeService.createEmployee(employeeData);
            }
            setIsEmployeeModalOpen(false);
            loadEmployees();
        } catch (error) {
            throw error;
        }
    };

    const formatCNPJ = (value) => {
        const numbers = value.replace(/\D/g, '').slice(0, 14);
        return numbers
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    };

    const formatCEP = (value) => {
        const numbers = value.replace(/\D/g, '').slice(0, 8);
        return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
    };

    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'cnpj') {
            value = formatCNPJ(value);
        } else if (name === 'address.zipCode') {
            value = formatCEP(value);
        }

        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [addressField]: value }
            }));
        } else if (name.startsWith('mealTargets.')) {
            const mealField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                mealTargets: { ...prev.mealTargets, [mealField]: parseInt(value) || 0 }
            }));
        } else if (name.startsWith('menuComponents.')) {
            const componentField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                menuComponents: { ...prev.menuComponents, [componentField]: parseInt(value) || 0 }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddDoc = () => {
        if (!newDoc.expirationDate) {
            alert('Por favor, informe a data de vencimento do documento.');
            return;
        }
        setFormData(prev => ({
            ...prev,
            sanitaryDocs: [...prev.sanitaryDocs, { ...newDoc, filePath: 'simulated_path.pdf' }]
        }));
        setNewDoc({ type: 'Alvará', expirationDate: '' });
    };

    const handleRemoveDoc = (index) => {
        setFormData(prev => ({
            ...prev,
            sanitaryDocs: prev.sanitaryDocs.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveStatus({ type: 'loading', message: 'Salvando alterações...' });
        try {
            await onSave(formData);
            setSaveStatus({ type: 'success', message: 'Unidade salva com sucesso!' });
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            setSaveStatus({ type: 'error', message: 'Erro ao salvar: ' + errorMsg });
            console.error('Submit Error:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Building2 size={20} />
                            {unit ? 'Editar Unidade' : 'Nova Unidade'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 rounded p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-slate-50 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('identification')}
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'identification'
                            ? 'bg-white text-blue-600 border-t-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        <Building2 size={16} /> Identificação
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('contract')}
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'contract'
                            ? 'bg-white text-blue-600 border-t-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        <Target size={16} /> Contrato/Metas
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('documents')}
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'documents'
                            ? 'bg-white text-blue-600 border-t-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        <FileText size={16} /> Documentos
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('team')}
                        className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'team'
                            ? 'bg-white text-blue-600 border-t-2 border-blue-600'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                        title={!unit ? "Salve a unidade para gerenciar a equipe" : ""}
                    >
                        <Users size={16} /> Equipe {employees.length > 0 && `(${employees.length})`}
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
                    {/* Tab 1: Identification */}
                    {activeTab === 'identification' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nome da Unidade *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        CNPJ *
                                    </label>
                                    <input
                                        type="text"
                                        name="cnpj"
                                        value={formData.cnpj}
                                        onChange={handleChange}
                                        required
                                        placeholder="00.000.000/0000-00"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tipo *
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Local">Local</option>
                                        <option value="Transportada">Transportada</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nutricionista RT *
                                    </label>
                                    <input
                                        type="text"
                                        name="rtNutritionist"
                                        value={formData.rtNutritionist}
                                        onChange={handleChange}
                                        required
                                        placeholder="Nome do Responsável Técnico"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-slate-700">Endereço</h4>
                                    {(formData.address.street && formData.address.city) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const address = `${formData.address.street}, ${formData.address.number || 's/n'}, ${formData.address.neighborhood || ''}, ${formData.address.city} - ${formData.address.state}`;
                                                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                                                window.open(mapsUrl, '_blank');
                                            }}
                                            className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1 border border-green-200"
                                        >
                                            <MapPin size={12} />
                                            Ver no Mapa
                                        </button>
                                    )}
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-100">
                                    <p className="text-xs text-blue-800">
                                        💡 <strong>Dica:</strong> Preencha o endereço completo para facilitar o planejamento de rotas de visitas no Google Maps.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                                        <input
                                            type="text"
                                            name="address.street"
                                            value={formData.address.street}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                                        <input
                                            type="text"
                                            name="address.number"
                                            value={formData.address.number}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                                        <input
                                            type="text"
                                            name="address.neighborhood"
                                            value={formData.address.neighborhood}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                                        <input
                                            type="text"
                                            name="address.city"
                                            value={formData.address.city}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                                        <input
                                            type="text"
                                            name="address.state"
                                            value={formData.address.state}
                                            onChange={handleChange}
                                            placeholder="SP"
                                            maxLength="2"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Contract/Goals */}
                    {activeTab === 'contract' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-blue-800">
                                    <AlertTriangle size={16} className="inline mr-2" />
                                    Defina as metas de refeições contratadas por turno. Esses valores serão usados como benchmark para análise de desvio.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Café da Manhã
                                    </label>
                                    <input
                                        type="number"
                                        name="mealTargets.breakfast"
                                        value={formData.mealTargets.breakfast}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Almoço
                                    </label>
                                    <input
                                        type="number"
                                        name="mealTargets.lunch"
                                        value={formData.mealTargets.lunch}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Jantar
                                    </label>
                                    <input
                                        type="number"
                                        name="mealTargets.dinner"
                                        value={formData.mealTargets.dinner}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Ceia
                                    </label>
                                    <input
                                        type="number"
                                        name="mealTargets.supper"
                                        value={formData.mealTargets.supper}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                                <h4 className="font-medium text-slate-700 mb-2">Total Diário</h4>
                                <p className="text-2xl font-bold text-blue-600">
                                    {(formData.mealTargets.breakfast || 0) +
                                        (formData.mealTargets.lunch || 0) +
                                        (formData.mealTargets.dinner || 0) +
                                        (formData.mealTargets.supper || 0)} refeições
                                </p>
                            </div>

                            <div className="border-t pt-4 mt-6">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <ChefHat size={18} className="text-blue-600" />
                                    Componentes do Cardápio (Mínimo por Refeição)
                                </h4>
                                <p className="text-xs text-slate-500 mb-4">
                                    Defina a quantidade mínima de itens que a IA e o lançamento manual devem exigir.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Principal</label>
                                        <input
                                            type="number"
                                            name="menuComponents.principal"
                                            value={formData.menuComponents.principal}
                                            onChange={handleChange}
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Guarnição</label>
                                        <input
                                            type="number"
                                            name="menuComponents.guarnicao"
                                            value={formData.menuComponents.guarnicao}
                                            onChange={handleChange}
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Salada</label>
                                        <input
                                            type="number"
                                            name="menuComponents.salada"
                                            value={formData.menuComponents.salada}
                                            onChange={handleChange}
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sobremesa</label>
                                        <input
                                            type="number"
                                            name="menuComponents.sobremesa"
                                            value={formData.menuComponents.sobremesa}
                                            onChange={handleChange}
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Suco</label>
                                        <input
                                            type="number"
                                            name="menuComponents.suco"
                                            value={formData.menuComponents.suco}
                                            onChange={handleChange}
                                            min="0"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* New Section: Unit DNA / Fixed Items */}
                            <div className="border-t pt-4 mt-6">
                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                    <ChefHat size={18} className="text-blue-600" />
                                    Itens Fixos do Cardápio (DNA da Unidade)
                                </h4>
                                <p className="text-xs text-slate-500 mb-4">
                                    Configure itens que se repetem diariamente (ex: Arroz, Feijão) para preenchimento automático.
                                </p>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-dashed border-slate-300">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Categoria</label>
                                            <select
                                                value={newFixedDish.category}
                                                onChange={(e) => setNewFixedDish(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                            >
                                                <option value="Principal">Principal</option>
                                                <option value="Guarnição">Guarnição</option>
                                                <option value="Salada">Salada</option>
                                                <option value="Sobremesa">Sobremesa</option>
                                                <option value="Suco">Suco</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome do Item</label>
                                            <input
                                                type="text"
                                                value={newFixedDish.name}
                                                onChange={(e) => setNewFixedDish(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Ex: Arroz Branco"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!newFixedDish.name.trim()) return;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    fixedDishes: [...(prev.fixedDishes || []), { category: newFixedDish.category, name: newFixedDish.name.trim() }]
                                                }));
                                                setNewFixedDish(prev => ({ ...prev, name: '' }));
                                            }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 h-[38px]"
                                        >
                                            Adicionar
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {(formData.fixedDishes || []).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded-lg group hover:border-blue-200 shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                                                        {item.category}
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        fixedDishes: prev.fixedDishes.filter((_, i) => i !== idx)
                                                    }))}
                                                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Documents */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-800 font-bold mb-1">Central de Conformidade Legal</p>
                                    <p className="text-xs text-blue-700">Gerencie Alvarás, PGR e Licenças Sanitárias. O sistema enviará alertas automáticos no Dashboard 30 dias antes do vencimento.</p>
                                </div>
                            </div>

                            {/* Add Document Section */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Novo Documento</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Documento</label>
                                        <select
                                            value={newDoc.type}
                                            onChange={(e) => setNewDoc(prev => ({ ...prev, type: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        >
                                            <option value="Alvará">Alvará Sanitário</option>
                                            <option value="PGR">PGR (Resíduos)</option>
                                            <option value="Contrato">Contrato de Serviço</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Data de Vencimento</label>
                                        <input
                                            type="date"
                                            value={newDoc.expirationDate}
                                            onChange={(e) => setNewDoc(prev => ({ ...prev, expirationDate: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddDoc}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <Upload size={16} /> Adicionar
                                    </button>
                                </div>
                            </div>

                            {/* Documents List */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Documentos Cadastrados</h4>
                                {formData.sanitaryDocs.length === 0 ? (
                                    <div className="text-center py-8 bg-white border border-dashed rounded-xl text-slate-400 text-sm">
                                        Nenhum documento anexado ainda.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {formData.sanitaryDocs.map((doc, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center group hover:border-blue-300 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-50 p-2 rounded text-blue-600">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{doc.type}</p>
                                                        <p className={`text-xs font-medium ${(doc.expirationDate && new Date(doc.expirationDate) < new Date()) ? 'text-red-600' : 'text-slate-500'}`}>
                                                            Vence em: {doc.expirationDate ? new Date(doc.expirationDate).toLocaleDateString('pt-BR') : 'Data inválida'}
                                                            {(doc.expirationDate && new Date(doc.expirationDate) < new Date()) && ' (VENCIDO)'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDoc(idx)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Equipe */}
                    {activeTab === 'team' && (
                        <div className="space-y-4 animate-fade-in flex flex-col h-full">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-800">Membros da Equipe</h4>
                                    <p className="text-xs text-slate-500">Gerencie os colaboradores vinculados a esta unidade.</p>
                                </div>
                                {unit && (
                                    <button
                                        type="button"
                                        onClick={handleAddEmployee}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-all"
                                    >
                                        <Plus size={14} /> Novo Colaborador
                                    </button>
                                )}
                            </div>

                            {!unit && (
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3 mb-4">
                                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-amber-800 font-bold mb-1">Unidade não salva</p>
                                        <p className="text-xs text-amber-700">Para cadastrar membros na equipe, você precisa primeiro preencher os dados de identificação e <strong>Salvar a Unidade</strong>. Isso é necessário para vincular legalmente os funcionários a esta unidade no sistema.</p>
                                    </div>
                                </div>
                            )}

                            {employees.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <div className="bg-slate-100 p-3 rounded-full text-slate-400 mb-3">
                                        <Users size={32} />
                                    </div>
                                    <p className="text-slate-500 font-medium">Nenhum colaborador nesta unidade</p>
                                    <button
                                        type="button"
                                        onClick={handleAddEmployee}
                                        className="mt-4 text-blue-600 text-sm font-bold hover:underline"
                                    >
                                        Cadastrar Primeiro Colaborador
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-3">Nome / Função</th>
                                                <th className="px-4 py-3">Vínculo</th>
                                                <th className="px-4 py-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {employees.map(emp => (
                                                <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-800">{emp.name}</div>
                                                        <div className="text-xs text-slate-500">{emp.role}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${emp.employmentType === 'Próprio' ? 'bg-blue-50 text-blue-700' :
                                                            emp.employmentType === 'Cliente' ? 'bg-slate-100 text-slate-600' :
                                                                'bg-orange-50 text-orange-700'
                                                            }`}>
                                                            {emp.employmentType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditEmployee(emp)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}


                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="border-t p-4 bg-slate-50 shrink-0">
                    {/* Painel de Confirmação Inline */}
                    {confirmMode && (
                        <div className={`mb-3 p-3 rounded-xl border flex flex-col gap-2 ${confirmMode === 'delete' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'
                            }`}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className={confirmMode === 'delete' ? 'text-red-600' : 'text-amber-600'} />
                                <span className={`text-sm font-bold ${confirmMode === 'delete' ? 'text-red-700' : 'text-amber-700'}`}>
                                    {confirmMode === 'delete'
                                        ? `Excluir permanentemente "${unit?.name}"?`
                                        : `Desativar "${unit?.name}"?`
                                    }
                                </span>
                            </div>
                            <p className={`text-xs ${confirmMode === 'delete' ? 'text-red-600' : 'text-amber-600'}`}>
                                {confirmMode === 'delete'
                                    ? 'A unidade e todos os dados vinculados serão removidos permanentemente.'
                                    : 'A unidade será arquivada. Os dados são mantidos e podem ser restaurados.'
                                }
                            </p>
                            {actionError && <p className="text-xs text-red-700 font-bold bg-red-100 px-2 py-1 rounded">{actionError}</p>}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        if (!unit?._id || isDeleting) return;
                                        setActionError('');
                                        try {
                                            setIsDeleting(true);
                                            setSaveStatus({ type: 'loading', message: confirmMode === 'delete' ? 'Excluindo...' : 'Desativando...' });
                                            if (confirmMode === 'deactivate') {
                                                await UnitService.deactivateUnit(unit._id);
                                            } else {
                                                await UnitService.deleteUnit(unit._id);
                                            }
                                            if (onDelete) onDelete(unit._id);
                                            onClose();
                                        } catch (err) {
                                            const msg = err.response?.data?.error || err.message || 'Erro desconhecido';
                                            console.error('[UnitFormModal] Falha:', msg, err);
                                            setActionError('Erro: ' + msg);
                                            setSaveStatus({ type: 'error', message: msg });
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 text-white ${confirmMode === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                                        }`}
                                >
                                    {isDeleting ? (
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                    ) : confirmMode === 'delete' ? (
                                        <Trash2 size={14} />
                                    ) : (
                                        <PowerOff size={14} />
                                    )}
                                    {isDeleting ? 'Processando...' : confirmMode === 'delete' ? 'Sim, Excluir' : 'Sim, Desativar'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={() => { setConfirmMode(null); setActionError(''); setSaveStatus({ type: '', message: '' }); }}
                                    className="flex-1 py-2 rounded-lg text-sm font-bold border border-slate-300 text-slate-600 hover:bg-slate-100"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                        {/* Status */}
                        {saveStatus.message && !confirmMode && (
                            <div className={`text-sm font-medium flex items-center gap-2 ${saveStatus.type === 'success' ? 'text-green-600' :
                                saveStatus.type === 'error' ? 'text-red-600' : 'text-slate-600'
                                }`}>
                                {saveStatus.type === 'success' && <CheckCircle size={16} />}
                                {saveStatus.type === 'error' && <AlertTriangle size={16} />}
                                {saveStatus.message}
                            </div>
                        )}
                        {!saveStatus.message && !confirmMode && <div />}

                        <div className="flex flex-wrap justify-end gap-2 w-full md:w-auto">
                            {/* Botões destrutivos */}
                            {unit && !confirmMode && (
                                <>
                                    <button
                                        type="button"
                                        disabled={isDeleting || saveStatus.type === 'loading'}
                                        onClick={() => { setConfirmMode('deactivate'); setActionError(''); }}
                                        className="px-3 py-2 border border-amber-300 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-50 flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <PowerOff size={13} /> Desativar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isDeleting || saveStatus.type === 'loading'}
                                        onClick={() => { setConfirmMode('delete'); setActionError(''); }}
                                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <Trash2 size={13} /> Excluir
                                    </button>
                                </>
                            )}

                            {/* Cancelar e Salvar */}
                            <button
                                type="button"
                                onClick={() => { setConfirmMode(null); onClose(); }}
                                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saveStatus.type === 'loading' || isDeleting}
                                className="px-7 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-bold flex items-center gap-2"
                            >
                                {saveStatus.type === 'loading' ? (
                                    <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {saveStatus.type === 'loading' ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isEmployeeModalOpen && (
                <EmployeeFormModal
                    isOpen={isEmployeeModalOpen}
                    onClose={() => setIsEmployeeModalOpen(false)}
                    onSave={handleSaveEmployee}
                    employee={selectedEmployee}
                    unitId={unit?._id}
                    fixedUnit={true}
                />
            )}
        </div>
    );
};

export default UnitFormModal;
