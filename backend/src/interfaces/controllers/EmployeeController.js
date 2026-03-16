const Employee = require('../../infrastructure/database/models/Employee');
const Unit = require('../../infrastructure/database/models/Unit');

class EmployeeController {
    // Helper to populate employee data
    _populateEmployees = async (employees) => {
        if (Array.isArray(employees)) {
            for (let emp of employees) {
                await emp.populate('unitId', Unit);
            }
        } else if (employees) {
            await employees.populate('unitId', Unit);
        }
        return employees;
    }

    createEmployee = async (req, res) => {
        try {
            const employeeData = { ...req.body };
            if (employeeData.gender === '') employeeData.gender = null;
            if (employeeData.health) {
                Object.keys(employeeData.health).forEach(key => {
                    if (employeeData.health[key] === '') employeeData.health[key] = null;
                });
            }

            const employee = new Employee(employeeData);
            await employee.save();
            await this._populateEmployees(employee);

            res.status(201).json({
                message: 'Colaborador cadastrado com sucesso',
                employee
            });
        } catch (error) {
            console.error('[CREATE EMPLOYEE ERROR]', error);
            res.status(400).json({ error: error.message || 'Erro ao cadastrar colaborador' });
        }
    }

    getEmployeesByUnit = async (req, res) => {
        try {
            const { unitId } = req.params;
            const { active } = req.query;
            const filter = { unitId };
            if (active !== undefined) filter.active = active === 'true';

            const employees = await Employee.find(filter);
            await this._populateEmployees(employees);
            employees.sort((a, b) => a.data.name?.localeCompare(b.data.name));

            res.json({ count: employees.length, employees });
        } catch (error) {
            console.error('[GET EMPLOYEES BY UNIT ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar colaboradores' });
        }
    }

    getAllEmployees = async (req, res) => {
        try {
            const { active } = req.query;
            const filter = active !== undefined ? { active: active === 'true' } : {};

            const employees = await Employee.find(filter);
            await this._populateEmployees(employees);
            employees.sort((a, b) => a.data.name?.localeCompare(b.data.name));

            res.json({ count: employees.length, employees });
        } catch (error) {
            console.error('[GET ALL EMPLOYEES ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar colaboradores' });
        }
    }

    getEmployeeById = async (req, res) => {
        try {
            const { id } = req.params;
            const employee = await Employee.findById(id);
            if (!employee) return res.status(404).json({ error: 'Colaborador não encontrado' });

            await this._populateEmployees(employee);
            res.json(employee);
        } catch (error) {
            console.error('[GET EMPLOYEE BY ID ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar colaborador' });
        }
    }

    updateEmployee = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };
            if (updateData.gender === '') updateData.gender = null;
            if (updateData.health) {
                Object.keys(updateData.health).forEach(key => {
                    if (updateData.health[key] === '') updateData.health[key] = null;
                });
            }

            const employee = await Employee.findByIdAndUpdate(id, updateData);
            if (!employee) return res.status(404).json({ error: 'Colaborador não encontrado' });

            await this._populateEmployees(employee);
            res.json({ message: 'Colaborador atualizado com sucesso', employee });
        } catch (error) {
            console.error('[UPDATE EMPLOYEE ERROR]', error);
            res.status(400).json({ error: error.message || 'Erro ao atualizar colaborador' });
        }
    }

    deleteEmployee = async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body || {};
            const inactiveReason = ['Afastado', 'Férias', 'Outros'].includes(reason) ? reason : 'Outros';

            const employee = await Employee.findByIdAndUpdate(id, {
                active: false,
                inactiveReason,
                inactiveSince: new Date()
            });

            if (!employee) return res.status(404).json({ error: 'Colaborador não encontrado' });
            res.json({ message: 'Colaborador desativado com sucesso', employee });
        } catch (error) {
            console.error('[DELETE EMPLOYEE ERROR]', error);
            res.status(500).json({ error: 'Erro ao desativar colaborador' });
        }
    }

    reactivateEmployee = async (req, res) => {
        try {
            const { id } = req.params;
            const employee = await Employee.findByIdAndUpdate(id, {
                active: true,
                inactiveReason: null,
                inactiveSince: null
            });

            if (!employee) return res.status(404).json({ error: 'Colaborador não encontrado' });
            res.json({ message: 'Colaborador reativado com sucesso', employee });
        } catch (error) {
            console.error('[REACTIVATE EMPLOYEE ERROR]', error);
            res.status(500).json({ error: 'Erro ao reativar colaborador' });
        }
    }

    hardDeleteEmployee = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await Employee.findByIdAndDelete(id);
            if (!result) return res.status(404).json({ error: 'Colaborador não encontrado' });
            res.json({ message: 'Colaborador excluído permanentemente', deletedId: id });
        } catch (error) {
            console.error('[HARD DELETE EMPLOYEE ERROR]', error);
            res.status(500).json({ error: 'Erro ao excluir colaborador' });
        }
    }

    getEmployeesWithHealthIssues = async (req, res) => {
        try {
            const { unitId } = req.query;
            const filter = { active: true, hasFoodContact: true };
            if (unitId) filter.unitId = unitId;

            const employees = await Employee.find(filter);
            await this._populateEmployees(employees);

            const employeesWithIssues = employees.filter(emp =>
                emp.healthStatus === 'Inapto' || emp.examsExpiringWithin30Days.length > 0
            );

            res.json({ count: employeesWithIssues.length, employees: employeesWithIssues });
        } catch (error) {
            console.error('[GET HEALTH ISSUES ERROR]', error);
            res.status(500).json({ error: 'Erro ao buscar colaboradores com pendências de saúde' });
        }
    }
}

module.exports = new EmployeeController();
