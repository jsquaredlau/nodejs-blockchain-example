# Ethereum Backend for a Digital Loyalty System | NodeJS, Express, Solidity, TypeScript

This code powered the backend for a blockchain based digital loyalty system built as proof-of-concept to support my thesis topic.

The server exposes endpoints for mobile applications and makes calls smart contracts deployed on a private ethereum to execute business logic.

Technology:
- Server : NodeJS and TypeScript
- Routing : Express
- Smart Contracts : Solidity
- Task runner : Grunt.

# Ethereum LaaS Server

## Setup
1. Install Grunt CLI globally through NPM using the command **npm install -g grunt-cli**
2. Install the project's local dependencies with the command **npm install**

## Deployment
To run a backend server that communicates with locally hosted Ethereum nodes, run one of the following 3 commands:
* grunt serve-dev
* grunt serve-dev-2
* grunt server-dev-3

To run a server that communicates with a remotely hosted Ethereum node (i.e. on another server), run one of the following three commands:
* grunt serve-prod
* grunt serve-prod-2
* grunt serve-prod-3

The difference is between the servers (i.e. between serve-prod and serve-prod-2, and between serve-dev and serve-dev-2) are the Ethereum node endpoints used for transactions and the Firebase config details, as each server represents an independent system. Each system has its own database and own Ethereum node.

## Configs
To change the endpoints and configs for the servers to point to your own servers, refer to the config files in /config. The mappings are:
* default.json -> grunt serve-dev
* default-2.json -> grunt serve-dev-2
* default-3.json -> grunt serve-dev-3
* production.json -> grunt serve-prod
* production-2.json -> grunt serve-prod-2
* production-3.json -> grunt serve-prod-3

## Note
This project was developed in the Atom text editor with the atom-typescript package. Discrepancies arising from tsconfig.json may be because of the Atom specific configurations in tsconfig.json.
