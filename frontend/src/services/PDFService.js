import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

class PDFService {
    generateServiceClosureReport(mealData, unitName = "Unidade Padrão") {
        const doc = new jsPDF();

        // --- Header ---
        doc.setFillColor(41, 128, 185); // Blue
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("Fechamento de Serviço Operacional", 15, 20);
        doc.setFontSize(12);
        doc.text(`Unidade: ${unitName} | Refeição: ${mealData.type}`, 15, 30);

        // --- Metadata ---
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 15, 50);
        if (mealData.statsHistory && mealData.statsHistory.length > 0) {
            doc.setTextColor(200, 50, 50);
            doc.text(`⚠️ Este documento contém ${mealData.statsHistory.length} edições registradas (Auditoria).`, 120, 50);
        }

        // --- 1. Resumo Financeiro & Operacional ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("1. Resumo Operacional", 15, 65);

        const contracted = mealData.stats?.contractedQty || 0;
        const served = mealData.stats?.servedQty || 0;
        const deviation = served - contracted;

        const summaryData = [
            ['Métrica', 'Valor'],
            ['Contratado', contracted],
            ['Realizado (Servido)', served],
            ['Desvio de Consumo', `${deviation} (${((deviation / contracted) * 100).toFixed(1)}%)`],
            ['Resto Ingesta Total (Lixo)', `${mealData.stats?.restIngestaKg || 0} kg`]
        ];

        autoTable(doc, {
            startY: 70,
            head: [['Indicador', 'Resultado']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
        });

        // --- 2. Análise Instantânea da IA ---
        let finalY = doc.lastAutoTable.finalY + 15;
        if (mealData.aiAnalysis?.content) {
            doc.text("2. Análise Nutricional Inteligente (IA)", 15, finalY);

            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            const splitText = doc.splitTextToSize(mealData.aiAnalysis.content.replace(/\*\*/g, ''), 180);

            doc.setFillColor(240, 248, 255);
            doc.roundedRect(14, finalY + 2, 185, splitText.length * 6 + 10, 3, 3, 'F');

            doc.text(splitText, 18, finalY + 10);
            finalY += splitText.length * 6 + 25;
        }

        // --- 3. Detalhamento por Item (Sobras) ---
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("3. Gestão de Sobras por Item", 15, finalY);

        const dishesBody = mealData.dishes.map(dish => [
            dish.name,
            dish.operational?.producedKg || '-',
            dish.operational?.cleanLeftoverKg || '-',
            dish.operational?.destination || '-',
            dish.operational?.reusageTemp ? `${dish.operational.reusageTemp}°C` : '-'
        ]);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Item', 'Produzido (kg)', 'Sobra Limpa (kg)', 'Destino', 'Temp. (°C)']],
            body: dishesBody,
            theme: 'striped',
            headStyles: { fillColor: [46, 204, 113] } // Green
        });

        // --- Footer ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Sistema de Gestão UAN - Documento válido para fiscalização interna.", 105, pageHeight - 10, { align: 'center' });

        doc.save(`fechamento_${mealData.type}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    generateReuseLabel(dish, unitName = "Unidade Padrão") {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [80, 50] // Common label size
        });

        // Border
        doc.setLineWidth(0.5);
        doc.rect(2, 2, 76, 46);

        // Header
        doc.setFillColor(44, 62, 80);
        doc.rect(2, 2, 76, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("IDENTIFICAÇÃO DE SOBRA - CVS 5", 40, 7.5, { align: 'center' });

        // Content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(`UNIDADE: ${unitName.toUpperCase()}`, 5, 15);

        doc.setFont("helvetica", "bold");
        doc.text(`PRODUTO: ${dish.name.toUpperCase()}`, 5, 20);

        doc.setFont("helvetica", "normal");
        doc.text(`DATA DE PRODUÇÃO: ${new Date().toLocaleDateString('pt-BR')}`, 5, 25);
        doc.text(`TEMP. EXPOSIÇÃO: ${dish.operational.reusageTemp}°C`, 5, 30);
        doc.text(`TEMP. RESFRIAMENTO: ${dish.operational.reusageCoolingTemp}°C`, 5, 35);

        doc.setFontSize(10);
        doc.setTextColor(200, 0, 0);
        doc.setFont("helvetica", "bold");
        const expiry = new Date(dish.operational.reusageExpiry + 'T12:00:00Z').toLocaleDateString('pt-BR');
        doc.text(`VALIDADE LIMITE: ${expiry}`, 40, 43, { align: 'center' });

        doc.save(`etiqueta_sobra_${dish.name.replace(/\s+/g, '_')}.pdf`);
    }

    generateSampleLabel(dish, unitName = "Unidade Padrão") {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [80, 50] // Size 80x50mm
        });

        this._drawSampleLabel(doc, dish, unitName);
        doc.save(`amostra_${dish.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    generateBatchSampleLabels(dishes, unitName = "Unidade Padrão") {
        if (!dishes || dishes.length === 0) return;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [80, 50]
        });

        dishes.forEach((dish, index) => {
            if (index > 0) doc.addPage([80, 50], 'landscape');
            this._drawSampleLabel(doc, dish, unitName);
        });

        doc.save(`lote_amostras_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    _drawSampleLabel(doc, dish, unitName) {
        // Border
        doc.setLineWidth(0.5);
        doc.rect(2, 2, 76, 46);

        // Header
        doc.setFillColor(52, 152, 219); // Blue for samples
        doc.rect(2, 2, 76, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("AMOSTRA DE ALIMENTO - RDC 216", 40, 7.5, { align: 'center' });

        // Content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(`UNIDADE: ${unitName.toUpperCase()}`, 5, 15);

        doc.setFont("helvetica", "bold");
        doc.text(`PRODUTO: ${dish.name.toUpperCase()}`, 5, 20);

        doc.setFont("helvetica", "normal");
        const collectionDate = dish.safety?.sampleCollectionTime
            ? new Date(dish.safety.sampleCollectionTime)
            : new Date();

        doc.text(`DATA DA COLETA: ${collectionDate.toLocaleDateString('pt-BR')}`, 5, 25);
        doc.text(`HORA DA COLETA: ${collectionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 5, 30);
        doc.text(`CUIDADOS: MANTER CONGELADO POR 72 HORAS.`, 5, 35);

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("________________________________", 5, 42);
        doc.text("RESPONSÁVEL PELA COLETA", 5, 46);
    }

    generateRequestOrderPDF(request, auditorName = "Auditor Responsável") {
        const doc = new jsPDF();
        const unitName = request.unit?.data?.name || request.unitName || "Unidade N/A";

        // --- Header ---
        doc.setFillColor(44, 62, 80); // Dark Slate
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("PEDIDO FORMAL DE PROVISÃO", 15, 20);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`TIPO: ${request.type} | UNIDADE: ${unitName}`, 15, 30);
        doc.text(`DATA: ${new Date(request.date).toLocaleString('pt-BR')}`, 15, 36);

        // --- Auditor Info ---
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`Solicitante: ${request.auditorName || auditorName}`, 150, 60, { align: 'right' });

        // --- Content Section ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Detalhes da Solicitação - ${request.type}`, 15, 75);

        let tableHeaders = [['Item/Categoria', 'Especificação', 'Qtd/Motivo']];
        let tableBody = [];

        if (request.type === 'RH') {
            tableHeaders = [['Campo', 'Informação']];
            tableBody = [
                ['Colaborador', request.employeeName],
                ['Função', request.role || '-'],
                ['Tipo de Solicitação', request.rhAction],
                ['Observação', request.observations || '-']
            ];
        } else {
            tableBody = (request.items || []).map(item => [
                item.name || 'Item N/D',
                item.description || '-',
                `${item.quantity || 0} ${item.unit || 'un'}`
            ]);
            if (request.observations) {
                tableBody.push([{ content: `Observações: ${request.observations}`, colSpan: 3, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } }]);
            }
        }

        autoTable(doc, {
            startY: 85,
            head: tableHeaders,
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [52, 152, 219] },
            styles: { fontSize: 10 }
        });

        // --- Footer & Signature ---
        const pageHeight = doc.internal.pageSize.height;
        
        // Campo de assinatura
        doc.setDrawColor(150, 150, 150);
        doc.line(60, pageHeight - 40, 150, pageHeight - 40);
        doc.setFontSize(8);
        doc.text("Assinatura do Auditor / Responsável", 105, pageHeight - 35, { align: 'center' });

        doc.setTextColor(150, 150, 150);
        doc.text("UAN Gestor - Sistema de Monitoramento Estratégico e Sanitário", 105, pageHeight - 15, { align: 'center' });

        const fileName = `pedido_${request.type.toLowerCase()}_${unitName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);
    }

    generatePackingListPDF(event, auditorName = "Responsável Logística") {
        const doc = new jsPDF();
        const unitName = event.unitName || "Unidade N/A";
        const eventDate = new Date(event.date).toLocaleDateString('pt-BR');

        // --- Header ---
        doc.setFillColor(142, 68, 173); // Amethyst Purple
        doc.rect(0, 0, 210, 45, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("RELATÓRIO DE CARGA (PACKING LIST)", 15, 20);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`EVENTO: ${event.title} | DATA: ${eventDate}`, 15, 30);
        doc.text(`DESTINO: ${unitName} | TIPO: ${event.type}`, 15, 36);

        // --- Metadata ---
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        doc.text(`Documento gerado para conferência de estoque em: ${new Date().toLocaleString()}`, 15, 55);

        // --- Table ---
        const tableBody = event.checklist_materials.map(item => [
            item.name,
            item.quantity,
            item.category || '-',
            '[ ] Separado  [ ] Conferido'
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['Material / Decoração', 'Qtd', 'Categoria', 'Status de Separação']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [155, 89, 182] },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 20 },
                2: { cellWidth: 35 },
                3: { cellWidth: 55, fontSize: 8 }
            }
        });

        // --- Footer ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setDrawColor(200, 200, 200);
        doc.line(15, pageHeight - 30, 100, pageHeight - 30);
        doc.line(110, pageHeight - 30, 195, pageHeight - 30);
        
        doc.setFontSize(8);
        doc.text("Assinatura Saída (Estoque)", 57, pageHeight - 25, { align: 'center' });
        doc.text("Responsável Recebimento (Auditor)", 152, pageHeight - 25, { align: 'center' });

        doc.setTextColor(150, 150, 150);
        doc.text("UAN Gestor - Inteligência Logística e Operacional", 105, pageHeight - 10, { align: 'center' });

        doc.save(`packing_list_${event.title.replace(/\s+/g, '_')}_${unitName.replace(/\s+/g, '_')}.pdf`);
    }

    generateGeneralReportPDF(data, activeTab, unitInfo = null) {
        const doc = new jsPDF();
        const tabLabels = {
            'non-conformities': 'Relatório de Inconformidades Sanitárias',
            'performance': 'Relatório de Desempenho BI (Desperdício)',
            'requests': 'Relatório de Solicitações (Compras/RH)',
            'employees': 'Relatório de Equipe e Saúde',
            'temperatures': 'Relatório Técnico de Termometria CVS 5',
            'visits': 'Relatório de Visitas e Reembolso de KM',
            'trainings': 'Relatório de Treinamentos e Capacitação'
        };

        const title = tabLabels[activeTab] || 'Relatório Analítico';
        
        // Header Background
        const headerColor = activeTab === 'temperatures' ? [192, 57, 43] : [44, 62, 80];
        doc.setFillColor(...headerColor);
        doc.rect(0, 0, 210, 50, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), 15, 20);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`UNIDADE: ${unitInfo?.name || 'Geral / Todas as Unidades'}`, 15, 30);
        doc.text(`RESPONSÁVEL TÉCNICO: ${unitInfo?.rtNutritionist || 'Não Atribuído'}`, 15, 36);
        doc.text(`DATA DE EXTRAÇÃO: ${new Date().toLocaleString('pt-BR')}`, 15, 42);

        // Body Content
        let tableHeaders = [];
        let tableBody = [];

        if (activeTab === 'performance') {
            tableHeaders = [['Data', 'Refeição', 'Cozinheiro(a)', 'Aceitabilidade', 'Resto-Ingesta', 'Pior Aceitação']];
            tableBody = data.map(item => [
                new Date(item.date).toLocaleDateString('pt-BR'),
                item.meal,
                item.cookOnDuty || '-',
                `${(item.acceptability || 0).toFixed(1)}%`,
                `${(item.restIngesta || 0).toFixed(1)} kg (${(item.percentRest || 0).toFixed(1)}%)`,
                item.worstFood ? `${item.worstFood.name} (${item.worstFood.kg}kg)` : '-'
            ]);
        } else if (activeTab === 'temperatures') {
            tableHeaders = [['Data/Hora', 'Item (Categoria)', 'Regime', 'Auditoria (°C)', 'Auditor', 'Ação Corretiva']];
            tableBody = data.map(item => [
                `${new Date(item.date).toLocaleDateString('pt-BR')} ${new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
                `${item.item} (${item.category})`,
                item.targetTemp,
                `${item.actualTemp}°C (${item.isCompliant ? 'C' : 'NC'})`,
                item.auditor,
                item.isCompliant ? 'Conforme' : (item.correctiveAction || 'PENDENTE DE AÇÃO')
            ]);
        } else if (activeTab === 'non-conformities') {
            tableHeaders = [['Data', 'Questão / Requisito Sanitário', 'Status', 'Observações']];
            tableBody = data.map(item => [
                new Date(item.date).toLocaleDateString('pt-BR'),
                item.question,
                'NÃO CONFORME',
                item.comment || '-'
            ]);
        } else if (activeTab === 'visits') {
            tableHeaders = [['Data', 'Unidade', 'Rota (Ida/Volta)', 'KM', 'Pedágio']];
            tableBody = data.map(item => [
                new Date(item.date).toLocaleDateString('pt-BR'),
                item.unitName,
                `IDA: ${item.routeIda}\nVOLTA: ${item.routeVolta}`,
                `${item.kmTotal} km`,
                `R$ ${item.tollCosts.toFixed(2)}`
            ]);
        } else if (activeTab === 'trainings') {
            tableHeaders = [['Data', 'Unidade', 'Tema / Duração', 'Status', 'Partic.']];
            tableBody = data.map(item => [
                new Date(item.date).toLocaleDateString('pt-BR'),
                item.unitName,
                `${item.theme} (${item.duration})`,
                item.status,
                item.participants
            ]);
        } else {
            // Default simple table
            tableHeaders = [Object.keys(data[0] || {}).slice(0, 5)];
            tableBody = data.map(item => Object.values(item).slice(0, 5));
        }

        autoTable(doc, {
            startY: 60,
            head: tableHeaders,
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: headerColor },
            styles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // Summary Statistics if performance/temperature
        const finalY = doc.lastAutoTable.finalY + 15;
        if (activeTab === 'temperatures') {
            const faults = data.filter(d => !d.isCompliant).length;
            const compliance = data.length > 0 ? ((data.filter(d => d.isCompliant).length / data.length) * 100).toFixed(1) : 100;
            
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...headerColor);
            doc.text("RESUMO DE SEGURANÇA ALIMENTAR", 15, finalY);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(`Total de Aferições: ${data.length}`, 15, finalY + 7);
            doc.text(`Índice de Conformidade Térmica: ${compliance}%`, 15, finalY + 12);
            doc.setTextColor(faults > 0 ? [192, 57, 43] : [0, 0, 0]);
            doc.text(`Total de Falhas (NC): ${faults}`, 15, finalY + 17);
        } else if (activeTab === 'trainings') {
            const totalTrainings = data.length;
            const completed = data.filter(d => d.status === 'Realizado').length;
            const totalParticipants = data.reduce((sum, d) => sum + (d.participants || 0), 0);
            const totalHours = data.reduce((sum, d) => {
                const mins = parseInt(d.duration) || 0;
                return sum + mins;
            }, 0);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(...headerColor);
            doc.text("RESUMO DE CAPACITAÇÃO", 15, finalY);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(`Total de Treinamentos: ${totalTrainings}`, 15, finalY + 7);
            doc.text(`Treinamentos Realizados: ${completed}`, 15, finalY + 12);
            doc.text(`Total de Participantes: ${totalParticipants}`, 15, finalY + 17);
            doc.text(`Carga Horária Total: ${Math.floor(totalHours / 60)}h ${totalHours % 60}min`, 15, finalY + 22);
        } else if (activeTab === 'visits') {
            const totalKm = data.reduce((sum, d) => sum + (d.kmTotal || 0), 0);
            const totalTolls = data.reduce((sum, d) => sum + (d.tollCosts || 0), 0);
            
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...headerColor);
            doc.text("RESUMO PARA REEMBOLSO", 15, finalY);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(`Total KM Percorrido: ${totalKm.toFixed(1)} km`, 15, finalY + 7);
            doc.text(`Total de Pedágios: R$ ${totalTolls.toFixed(2)}`, 15, finalY + 12);
            doc.text(`Total Geral: R$ ${(totalKm * 1.2 + totalTolls).toFixed(2)} (Ref: R$ 1,20/km)`, 15, finalY + 17);
        }

        // Signature area
        const pageHeight = doc.internal.pageSize.height;
        doc.line(60, pageHeight - 35, 150, pageHeight - 35);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("CARIMBO E ASSINATURA DO RESPONSÁVEL TÉCNICO", 105, pageHeight - 30, { align: 'center' });
        doc.text("Emitido pelo Sistema de Inteligência Alimentar UAN", 105, pageHeight - 10, { align: 'center' });

        doc.save(`relatorio_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
}

export default new PDFService();
