const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
    try {
        console.log('Starting...');
        const mongod = await MongoMemoryServer.create({
            binary: { version: '6.0.14' }
        });
        console.log('Started on:', mongod.getUri());
        await mongod.stop();
    } catch (err) {
        console.error('Error:', err);
    }
})();
