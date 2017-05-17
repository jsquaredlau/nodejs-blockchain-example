// Copyright BASYX.lab
/* app/server.ts */

// Import everything from express and assign it to the express variable
import * as express from 'express';

// Import WelcomeController from controllers entry point
import { BusinessController, MerchantController, MobileController } from './controllers';

const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('config');
const portConfig = config.get('Port');

// Create a new express application instance
const app: express.Application = express();
// The port the express app will listen on
// const port: number = process.env.PORT || 8080;
const port: number = portConfig || 8080;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/v1/business', BusinessController);

app.use('/api/v1/merchant', MerchantController);

app.use('/api/v1/mobile', MobileController);

// Serve the application at the given port
app.listen(port, () => {
    // Success callback
    console.log(`Listening at http://localhost:${port}/`);
});
