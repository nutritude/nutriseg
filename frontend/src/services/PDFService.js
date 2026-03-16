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
}

export default new PDFService();
