import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
        const isAtlas = process.env.MONGODB_URI?.includes('mongodb+srv');
        console.log(`Database Connected (${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'})`);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
            console.error("→ Fix: Go to MongoDB Atlas → Network Access → Add IP 0.0.0.0/0");
        }
        process.exit(1);
    }
};

export default connectDB;