// Copyright BASYX.lab
/* app/server.ts */

// Import everything from express and assign it to the express variable
import * as express from 'express';

// Import WelcomeController from controllers entry point
import { UserController, BusinessController } from './controllers';

const bodyParser = require('body-parser');

// Create a new express application instance
const app: express.Application = express();
// The port the express app will listen on
const port: number = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use('/', WelcomeController);

app.use('/api/v1/user', UserController);

app.use('/api/v1/business', BusinessController);

// app.user('/api/v1/laas', LaasController);

// Serve the application at the given port
app.listen(port, () => {
    // Success callback
    console.log(`Listening at http://localhost:${port}/`);
});
