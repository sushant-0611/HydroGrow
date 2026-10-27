const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    if (!env.mongodbUri) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    const connection = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `✅ MongoDB Atlas Connected: ${connection.connection.host}`
    );

    console.log(
      `📦 Database: ${connection.connection.name}`
    );

    return connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed.");
    console.error(error.message);

    throw error;
  }
};

module.exports = connectDB;