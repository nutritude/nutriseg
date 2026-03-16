import React, { createContext, useContext, useState, useEffect } from 'react';

const UnitContext = createContext();

export const UnitProvider = ({ children }) => {
    const [selectedUnit, setSelectedUnit] = useState(() => {
        const saved = localStorage.getItem('activeUnit');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        let isMounted = true;
        const validateUnit = async () => {
            if (!selectedUnit) return;

            try {
                const UnitService = (await import('../services/UnitService')).default;
                const data = await UnitService.getUnits();
                if (!isMounted) return;

                const exists = data.units.some(u => u._id === selectedUnit._id);

                if (!exists) {
                    console.warn('⚠️ Unidade stale detectada. Limpando contexto...');
                    setSelectedUnit(null);
                    localStorage.removeItem('activeUnit');
                }
            } catch (error) {
                console.error('Erro ao validar unidade ativa:', error);
            }
        };

        validateUnit();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (selectedUnit) {
            localStorage.setItem('activeUnit', JSON.stringify(selectedUnit));
        } else {
            localStorage.removeItem('activeUnit');
        }
    }, [selectedUnit]);

    const selectUnit = (unit) => {
        setSelectedUnit(unit);
    };

    const clearUnit = () => {
        setSelectedUnit(null);
    };

    return (
        <UnitContext.Provider value={{ selectedUnit, selectUnit, clearUnit }}>
            {children}
        </UnitContext.Provider>
    );
};

export const useUnit = () => {
    const context = useContext(UnitContext);
    if (!context) {
        throw new Error('useUnit deve ser usado dentro de um UnitProvider');
    }
    return context;
};
