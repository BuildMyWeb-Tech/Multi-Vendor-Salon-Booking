import mongoose from "mongoose";

// Drop the legacy global email_1 unique index on the users collection.
// The schema now uses a compound { email, shopId } unique index instead,
// so the global one must be removed to allow the same email across tenants.
const migrateUserIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('users');
        const indexes = await collection.indexes();
        const legacyEmailIndex = indexes.find(
            (idx) => idx.name === 'email_1' && idx.unique === true
        );
        if (legacyEmailIndex) {
            await collection.dropIndex('email_1');
            console.log('[DB] Dropped legacy global email_1 unique index on users');
        }
        // Ensure Mongoose syncs new compound indexes
        const userModel = mongoose.models.user;
        if (userModel) await userModel.syncIndexes();
    } catch (err) {
        // Non-fatal: index may not exist or already been dropped
        if (!err.message?.includes('index not found')) {
            console.warn('[DB] migrateUserIndexes warning:', err.message);
        }
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
        const isAtlas = process.env.MONGODB_URI?.includes('mongodb+srv');
        console.log(`Database Connected (${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'})`);
        await migrateUserIndexes();
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
            console.error("→ Fix: Go to MongoDB Atlas → Network Access → Add IP 0.0.0.0/0");
        }
        process.exit(1);
    }
};

export default connectDB;