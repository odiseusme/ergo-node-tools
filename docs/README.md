# ERGO Node Tools

A collection of utility scripts for managing your ERGO node efficiently and safely.

## Features

- Start your ERGO node with comprehensive pre-flight checks
- Safely shut down your node via API
- Manage node API keys
- Monitor node status

## Scripts

### 1. ergo-start.sh

A bash script that ensures safe and proper startup of your ERGO node.

#### Features

- **Java Installation Check**
  - Verifies Java installation
  - Displays current Java version
  - Validates Java compatibility

- **Node Process Management**
  - Prevents multiple node instances
  - Detects existing running processes
  - Shows detailed process information

- **Environment Verification**
  - Validates ERGO directory structure
  - Locates latest ERGO JAR file
  - Confirms configuration file presence
  - Verifies file permissions

- **Startup Procedure**
  - Configurable Java memory options
  - Proper directory navigation
  - Detailed startup logging
  - Status confirmation

#### Usage

```bash
./scripts/start/ergo-start.sh
```

### 2. ergo-shutdown.js

A Node.js script for safely shutting down your ERGO node using the official API.

#### Features

- **API Key Management**
  - Secure key storage
  - Key validation
  - Interactive key updates

- **Safe Shutdown Process**
  - Graceful node termination
  - Connection verification
  - Shutdown confirmation
  - Error handling

#### Usage

```bash
node scripts/stop/ergo-shutdown.js
```

## Requirements

- Node.js v18 or higher
- Java OpenJDK 22 or compatible
- Linux environment (tested on Raspberry Pi)

If you do not already have a running node (the start command will check that), you will need to set it up first. Here are the official resources:

- [Official Documentation](https://docs.ergoplatform.com/node/install/)
- [Official GitHub Repository with Instructions](https://github.com/ergoplatform/ergo)

The basic steps involve:

1. Ensure you have Java 11 or newer installed.
2. Download the latest Ergo release from [Ergo Releases](https://github.com/ergoplatform/ergo/releases).
3. Set up your configuration file.
4. Run the node.

Note that running a full node requires:

- At least 4GB RAM
- About 45GB disk space for full blockchain synchronization (true on 1/1/2025) 
- Stable internet connection

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tabirudotcom/ergo-node-tools.git
   cd ergo-node-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make scripts executable:
   ```bash
   chmod +x scripts/start/ergo-start.sh
   ```


## Support

If you find these tools useful, consider supporting development by sending ERG to:

```
9gf2Shf1DXz3JCECWaSajNJN1rUB9XoJaSwUc5MZTdJwFqzZnSg
```

## License

[MIT License](LICENSE)
