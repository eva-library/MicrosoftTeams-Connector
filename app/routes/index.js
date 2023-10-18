// This file defines the routes for the application and links them to their respective controllers.
module.exports = (app, router) => {
    // Import the controllers.
    const controllers = require('../controllers');
    // Define the POST route for conversations and link it to the conversation controller.
    router.post('/conversation', controllers.conversation);
    // Register the routes with the application.
    app.use('/', router);
}
