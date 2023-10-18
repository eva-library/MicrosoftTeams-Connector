// Required bot services and configurations.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    createBotFrameworkAuthenticationFromConfiguration
} = require('botbuilder');
// Import the main bot logic from messageBroker.js.
const { EchoBot } = require('./messageBroker');
// Create authentication using bot's credentials from environment variables.
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});
const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

// Initialize CloudAdapter with botFrameworkAuthentication.
// See https://aka.ms/about-bot-adapter to learn more about how bots work.
const adapter = new CloudAdapter(botFrameworkAuthentication);
// Error handling function for the bot.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights. See https://aka.ms/bottelemetry for telemetry
    //       configuration instructions.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send detailed error info for debugging.
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Notify the user about the error.
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};
// Assign error handler to the CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create an instance of EchoBot.
const myBot = new EchoBot();

// Exporting the main method that handles incoming requests and forwards them to the bot.
module.exports = {
   conversation: async (req, res) => {
       console.log("handle Incoming request from Azure Bot")
       await adapter.process(req, res, (context) => myBot.run(context));        
    }
};