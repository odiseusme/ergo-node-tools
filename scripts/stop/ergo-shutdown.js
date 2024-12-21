#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');

class ApiKeyManager {
    constructor() {
        this.envPath = path.join(process.cwd(), '.env');
    }

    async setApiKey(key) {
        try {
            await fs.writeFile(this.envPath, `ERGO_API_KEY=${key}\n`);
            console.log('API key has been saved successfully.');
            return true;
        } catch (error) {
            console.error('Error saving API key:', error.message);
            return false;
        }
    }

    async getApiKey() {
        try {
            const data = await fs.readFile(this.envPath, 'utf8');
            const match = data.match(/ERGO_API_KEY=(.+)/);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    }

    async viewApiKey() {
        const key = await this.getApiKey();
        if (key) {
            const maskedKey = '*'.repeat(key.length - 4) + key.slice(-4);
            console.log('Current API key:', maskedKey);
        } else {
            console.log('No API key found.');
        }
    }

    async removeApiKey() {
        try {
            await fs.writeFile(this.envPath, '');
            console.log('API key has been removed.');
            return true;
        } catch (error) {
            console.error('Error removing API key:', error.message);
            return false;
        }
    }
}

class ErgoNodeShutdown {
    constructor(host = '127.0.0.1', port = 9053, apiKey = null) {
        this.baseUrl = `http://${host}:${port}`;
        this.apiKey = apiKey;
        this.keyManager = new ApiKeyManager();
    }

    async getApiKey() {
        // Check command line argument first
        if (this.apiKey) {
            return this.apiKey;
        }

        // Check .env file
        const savedKey = await this.keyManager.getApiKey();
        if (savedKey) {
            return savedKey;
        }

        // If no API key, prompt for it
        console.log('No API key found. Use --set-key to save an API key.');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        try {
            const apiKey = await new Promise((resolve) => {
                rl.question('Please enter your Ergo node API key: ', (answer) => {
                    resolve(answer.trim());
                });
            });

            if (!apiKey) {
                throw new Error('API key must be provided');
            }

            // Ask if they want to save the key
            const saveKey = await new Promise((resolve) => {
                rl.question('Would you like to save this API key for future use? ([y/Y]es/[n/N]o): ', (answer) => {
                    resolve(answer.trim().toLowerCase());
                });
            });

            if (['y', 'yes'].includes(saveKey.toLowerCase())) {
                await this.keyManager.setApiKey(apiKey);
            }

            return apiKey;
        } finally {
            rl.close();
        }
    }

    async confirm() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        try {
            const answer = await new Promise((resolve) => {
                rl.question('Are you sure you want to shut down the Ergo node? ([y/Y]es/[n/N]o): ', (answer) => {
                    resolve(answer.trim().toLowerCase());
                });
            });

            return ['y', 'yes'].includes(answer.toLowerCase());
        } finally {
            rl.close();
        }
    }

    async shutdownNode() {
        try {
            while (true) { // Loop to handle retry with new API key
                // Get API key if not provided
                if (!this.apiKey) {
                    this.apiKey = await this.getApiKey();
                }

                // Ask for confirmation
                const confirmed = await this.confirm();
                if (!confirmed) {
                    console.log('Shutdown cancelled.');
                    return false;
                }

                // Make the shutdown request
                try {
                    const response = await axios.post(
                        `${this.baseUrl}/node/shutdown`,
                        '', // empty body
                        {
                            headers: {
                                'accept': 'application/json',
                                'api_key': this.apiKey
                            }
                        }
                    );

                    console.log('Success:', response.data);
                    console.log('Node is shutting down...');
                    return true;

                } catch (error) {
                    if (error.response && error.response.status === 403) {
                        console.error('Error: Authentication failed. Current API key is invalid.');
                        
                        // Clear current API key
                        this.apiKey = null;
                        
                        // Prompt for new key
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        });

                        try {
                            const newKey = await new Promise((resolve) => {
                                rl.question('Please enter a new API key: ', (answer) => {
                                    resolve(answer.trim());
                                });
                            });

                            if (!newKey) {
                                console.log('No API key provided. Exiting...');
                                return false;
                            }

                            // Ask if they want to save the new key
                            const saveKey = await new Promise((resolve) => {
                                rl.question('Would you like to save this API key for future use? ([y/Y]es/[n/N]o): ', (answer) => {
                                    resolve(answer.trim().toLowerCase());
                                });
                            });

                            if (['y', 'yes'].includes(saveKey.toLowerCase())) {
                                await this.keyManager.setApiKey(newKey);
                                console.log('New API key has been saved.');
                            }

                            this.apiKey = newKey;
                            continue; // Retry with new key

                        } finally {
                            rl.close();
                        }
                    } else {
                        // Handle other errors
                        if (error.code === 'ECONNREFUSED') {
                            console.error('Error: Could not connect to the Ergo node. Please check if it\'s running.');
                        } else {
                            console.error('Error:', error.message);
                        }
                        return false;
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error.message);
            return false;
        }
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        host: '127.0.0.1',
        port: 9053,
        apiKey: null,
        command: null
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--set-key':
                options.command = 'set-key';
                options.apiKey = args[++i];
                break;
            case '--view-key':
                options.command = 'view-key';
                break;
            case '--remove-key':
                options.command = 'remove-key';
                break;
            case '--host':
                options.host = args[++i];
                break;
            case '--port':
                options.port = parseInt(args[++i]);
                break;
            case '--api-key':
                options.apiKey = args[++i];
                break;
            case '--help':
                showHelp();
                process.exit(0);
        }
    }

    return options;
}

function showHelp() {
    console.log(`
Ergo Node Shutdown Tool

Usage:
  node ergo-shutdown.js [options]

Options:
  --host        Host address (default: 127.0.0.1)
  --port        Port number (default: 9053)
  --api-key     Use API key for this session only
  --set-key     Save new API key for future use
  --view-key    View current saved API key (masked)
  --remove-key  Remove saved API key
  --help        Show this help message

Examples:
  node ergo-shutdown.js --set-key YOUR_API_KEY    # Save API key
  node ergo-shutdown.js --view-key                # View saved key
  node ergo-shutdown.js --remove-key              # Remove saved key
  node ergo-shutdown.js                           # Run shutdown with saved key
  node ergo-shutdown.js --api-key KEY             # Run with temporary key
`);
}

// Main function
async function main() {
    try {
        const options = parseArgs();
        const keyManager = new ApiKeyManager();

        // Handle API key management commands
        switch (options.command) {
            case 'set-key':
                if (!options.apiKey) {
                    console.error('Error: No API key provided with --set-key');
                    process.exit(1);
                }
                await keyManager.setApiKey(options.apiKey);
                process.exit(0);
                break;

            case 'view-key':
                await keyManager.viewApiKey();
                process.exit(0);
                break;

            case 'remove-key':
                await keyManager.removeApiKey();
                process.exit(0);
                break;

            default:
                // Regular shutdown operation
                const shutdown = new ErgoNodeShutdown(options.host, options.port, options.apiKey);
                const success = await shutdown.shutdownNode();
                process.exit(success ? 0 : 1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();