const { MongoClient } = require('mongodb');

class HealthDB {

    constructor(username = 'sa', password = 'sa', host = '10.31.31.33', port = '45354', database = 'healthchaindb') {
        this.username = username;
        this.password = password;
        this.host = host;
        this.port = port;
        this.database = database;
        this.uri = this.#constructURI();
        this.client = null;
    }

    #constructURI() {
        const encodedUsername = encodeURIComponent(this.username);
        const encodedPassword = encodeURIComponent(this.password);
        return `mongodb://${encodedUsername}:${encodedPassword}@${this.host}:${this.port}/${this.database}`;
    }

    async #Connect() {
        try {
            this.client = new MongoClient(this.uri, {readConcernLevel:'majority' });
            await this.client.connect();
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    }

    async #Disconnect() {
        try {
            if (this.client) {
                await this.client.close();
                console.log('Disconnected from MongoDB');
            }
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
        }
    }

    async QueryCommand(collectionName, pipeline) {
        try {
            await this.#Connect();
    
            const db = this.client.db(this.database);
            const collection = db.collection(collectionName);
            const options = { readPreference: "secondaryPreferred" };
            const commantext = eval(pipeline); //command text

            const result = await collection.aggregate(commantext, options).toArray();
    
            await this.#Disconnect();
            
            return result;
        } catch (error) {
            await this.#Disconnect();
            // console.error(`Error executing command on collection ${collectionName}:`, error);
            throw error;
        }
    }

    async UpdateCommand(collectionName, where,data) {
        try {
            await this.#Connect();
    
            const db = this.client.db(this.database);
            const collection = db.collection(collectionName);
          
            const result = await collection.updateOne(where, data);
            
            await this.#Disconnect();
            
            return result;
        } catch (error) {
            await this.#Disconnect();
            // console.error(`Error executing command on collection ${collectionName}:`, error);
            throw error;
        }
    }




}

module.exports = HealthDB;



// const HealthDB = require('./HealthDB');

// const username = 'healthchaindba';
// const password = '$$$HealthChain@KaSemRad2023!';
// const host = '10.31.31.33';
// const port = '45354';
// const database = 'healthchaindb';

// async function main() {
//     const healthDB = new HealthDB(username, password, host, port, database);
//     await healthDB.connect();

//     // Your database operations go here

//     await healthDB.disconnect();
// }