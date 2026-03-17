const ReportController = require('./src/interfaces/controllers/ReportController');
const connectDB = require('./src/infrastructure/database/connection');

async function test() {
    await connectDB();
    
    // Mock requests and responses
    const reqWaste = { query: { period: 'monthly' } };
    const resWaste = { json: (data) => console.log('Waste Data count:', data.length), status: (code) => ({ json: (err) => console.log('Error:', err) }) };
    
    await ReportController.getWasteReport(reqWaste, resWaste);
    
    const reqPerf = { query: { period: 'monthly' } };
    const resPerf = { json: (data) => console.log('Performance count:', data.length), status: (code) => ({ json: (err) => console.log('Performance Error:', err) }) };
    
    await ReportController.getPerformanceReport(reqPerf, resPerf);
    
    process.exit(0);
}

test();
