// Required libraries and modules
const axios = require('axios');
const qs = require('qs');
const { MongoClient } = require("mongodb");
const { ActivityHandler, MessageFactory } = require('botbuilder');

// Environment variables for configuration
const {
    MongoUri, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_URL, envURL, orguuid,
    envuuid, botid, CHANNEL, realms, APIKEY, MongoDb, MongoCollection
} = process.env;

// Base and EVA URL
const BASE_URL = `https://api-${envURL}.eva.bot`;
const EVAURL = `${BASE_URL}/eva-broker/org/${orguuid}/env/${envuuid}/bot/${botid}/conversations/`;

// MongoDB client initialization
const client = new MongoClient(MongoUri);
const FULLAUTH_URL = AUTH_URL + realms + "/protocol/openid-connect/token";

// Function to clean environment variables from unwanted characters
const cleanEnvVariable = (variable) => variable.replace(/^"|"$/g, '').replace(/;$/, '');

// Function to get authentication token
async function getTokenFromAuth() {
    const authConfig = {
        method: 'post',
        url: FULLAUTH_URL,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: qs.stringify({
            'grant_type': 'client_credentials',
            'client_id': cleanEnvVariable(AUTH_CLIENT_ID),
            'client_secret': cleanEnvVariable(AUTH_CLIENT_SECRET)
        })
    };
    return await makeAxiosCall(authConfig);
}

// Generic function to make Axios requests
async function makeAxiosCall(config) {
    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error("Axios Call Error:", error);
        return null;
    }
}

// Function to get headers for EVA requests
function getHeaders(token = null) {
    const headers = {
        "Content-Type": "application/json",
        "API-KEY": cleanEnvVariable(APIKEY),
        "CHANNEL": CHANNEL,
        "OS": "Windows",
        "USER-REF": "teamUser",
        "LOCALE": "en-US",
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
}

// Function to check if a token is expired
function isTokenExpired(timestamp, expiresIn) {
    const expiryTime = new Date(timestamp).getTime() + expiresIn * 1000;
    return new Date().getTime() >= expiryTime;
}

// MongoDB operations: update, search, and insert
async function mongoUpdate(query, updateDoc) {
    try {
        await client.connect();
        const database = client.db(MongoDb);
        const collection = database.collection(MongoCollection);
        await collection.updateOne(query, { $set: updateDoc });
    } catch (error) {
        console.log("mongoUpdate error: " + error);
    } finally {
        await client.close();
    }
}

async function mongoSearch(query) {
    let rsp = "";
    try {
        await client.connect();
        const database = client.db(MongoDb);
        const collection = database.collection(MongoCollection);
        rsp = await collection.findOne(query) || "";
    } catch (error) {
        console.log("mongoerror" + error);
    } finally {
        await client.close();
    }
    return rsp;
}

async function mongoInsert(doc) {
    let rsp = "";
    try {
        await client.connect();
        const database = client.db(MongoDb);
        const collection = database.collection(MongoCollection);
        const result = await collection.insertOne(doc);
        rsp = `A document was inserted with the _id: ${result.insertedId}`;
    } catch (error) {
        console.log("mongoinsert" + error);
    } finally {
        await client.close();
    }
    return rsp;
}

// EchoBot class to handle incoming messages and routing to EVA
class EchoBot extends ActivityHandler {
    constructor() {
        super();
        this.onMessage(this.handleIncomingMessage.bind(this));
        this.onMembersAdded(this.welcomeNewMembers.bind(this));
    }

    // Method to handle incoming messages
    async handleIncomingMessage(context, next) {
        const attachments = context._activity.attachments;
        const file_ = attachments.length > 1 ? JSON.stringify(context._activity.attachments[0].content.downloadUrl) : "file not found";
        const fileType_ = attachments.length > 1 ? JSON.stringify(context._activity.attachments[0].content.fileType) : "filetype not found";
        const teamsId = context._activity.from.aadObjectId;

        const query = {
            "teamsId": teamsId
        };
        const search = await mongoSearch(query);
        let url;
        let conversationExists = false;
        if (!search || Object.keys(search).length === 0) {
            url = EVAURL;
        } else {
            conversationExists = true;
            url = EVAURL + search.evaSessionId;
        }
        const tokenResponse = await this.handleToken(search);
        if (!tokenResponse) {
            throw new Error("Failed to retrieve a valid token.");
        }
        const dataObj = {
            "text": context._activity.text,
            "context": {
                "teamsId": teamsId,
                "file": file_,
                "filetype": fileType_
            }
        };
        const evaConfig = {
            method: 'post',
            url: url,
            headers: getHeaders(tokenResponse.access_token),
            data: JSON.stringify(dataObj)
        };
        const evaResponse = await makeAxiosCall(evaConfig);
        console.log('Response eva: ', evaResponse);
        let sessionCode = evaResponse.sessionCode;
        let timeStamp = new Date();
        if (!conversationExists) {
            const doc = {
                teamsId: teamsId,
                evaSessionId: sessionCode,
                evaToken: tokenResponse.access_token,
                timestamp: timeStamp,
                expires_in: tokenResponse.expires_in,
                refresh_expires_in: tokenResponse.refresh_expires_in,
                refresh_token: tokenResponse.refresh_token
            };
            const result = await mongoInsert(doc);
            console.log(`Inserted: ${result}`);
        }
        // Construct the response message
        let data = "";
        let n = 1;
        evaResponse.answers.forEach(evaR => {
            if (n != 1) {
                data += "<hr>";
            }
            data += evaR.content;

            if (evaR.buttons && evaR.buttons.length >= 1) {
                data += "<br><br><ul>";
                evaR.buttons.forEach(evaB => {
                    data += '<li>' + evaB.value + '</li>';
                });
                data += "</ul>";
            }
            n++;
        });
        // Send the response back via the bot
        await context.sendActivity(MessageFactory.text(data, data));
        await next();
    }

    // Method to welcome new members
    async welcomeNewMembers(context, next) {
        const membersAdded = context.activity.membersAdded;
        const welcomeText = 'Welcome!';
        for (const member of membersAdded) {
            if (member.id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            }
        }
        await next();
    }

    // Method to handle and refresh tokens
    // If the access token is still valid, use it.
    // If the access token has expired but the refresh token is still valid, use the refresh token to get a new access token.
    // If both have expired, then re-authenticate.
    async handleToken(search) {
        if (!search || Object.keys(search).length === 0) {
            return await getTokenFromAuth();
        }
        if (isTokenExpired(search.timestamp, search.expires_in)) {
            if (isTokenExpired(search.timestamp, search.refresh_expires_in)) {
                return await getTokenFromAuth();
            } else {
                const refreshConfig = {
                    method: 'post',
                    url: FULLAUTH_URL,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: qs.stringify({
                        'grant_type': 'refresh_token',
                        'client_id': cleanEnvVariable(AUTH_CLIENT_ID),
                        'client_secret': cleanEnvVariable(AUTH_CLIENT_SECRET),
                        'refresh_token': search.refresh_token
                    })
                };
                const refreshedTokenResponse = await makeAxiosCall(refreshConfig);
                const query = { "teamsId": search.teamsId }; // Using Teams ID as the unique identifier
                const updateDoc = {
                    evaToken: refreshedTokenResponse.access_token,
                    timestamp: new Date(), // Update the timestamp to current date-time
                    expires_in: refreshedTokenResponse.expires_in,
                    refresh_expires_in: refreshedTokenResponse.refresh_expires_in,
                    refresh_token: refreshedTokenResponse.refresh_token
                };
                await mongoUpdate(query, updateDoc);
                return refreshedTokenResponse;
            }
        } else {
            return {
                access_token: search.evaToken,
                expires_in: search.expires_in - ((new Date().getTime() - new Date(search.timestamp).getTime()) / 1000),
                refresh_token: search.refresh_token,
                refresh_expires_in: search.refresh_expires_in
            };
        }
    }
}
module.exports.EchoBot = EchoBot;