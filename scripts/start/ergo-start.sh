#!/bin/bash
# Configuration
ERGO_DIR="/home/plato/ErgoNode"
ERGO_CONF="ergo.conf"
JAVA_OPTS="-Xmx2G"  # Adjust memory as needed
JAVA_VERSION="openjdk-11-jdk"  # Specify the Java version you want to install

echo "=== Ergo Node Startup Script ==="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "----------------------------------------"

# Function to check if node is running
check_node_running() {
    echo "Checking for running Ergo processes..."
    running_processes=$(ps aux | grep -i "ergo.*\.jar" | grep -v grep)
    if [ -n "$running_processes" ]; then
        echo "Found running Ergo process(es):"
        echo "$running_processes"
        return 0  # Node is running
    else
        echo "No running Ergo process found."
        return 1  # Node is not running
    fi
}

# Function to find the latest ergo jar
find_latest_ergo_jar() {
    local latest_jar=$(find "$ERGO_DIR" -name "ergo*.jar" -type f | sort -V | tail -n 1)
    if [ -n "$latest_jar" ]; then
        echo "Found Ergo JAR: $(basename "$latest_jar")"
        ERGO_JAR="$latest_jar"
        return 0
    else
        echo "ERROR: No Ergo JAR file found in $ERGO_DIR"
        return 1
    fi
}

# Function to ask for user confirmation
ask_confirmation() {
    local prompt="$1"
    local response
    read -p "$prompt (yes/no): " response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

echo "Step 1: Checking Java installation..."
if ! command -v java &> /dev/null; then
    echo "Java is not installed."
    if ask_confirmation "Do you want to install Java ($JAVA_VERSION)?"; then
        echo "Installing Java..."
        sudo apt update
        sudo apt install -y "$JAVA_VERSION"
        if [ $? -ne 0 ]; then
            echo "ERROR: Failed to install Java!"
            exit 1
        fi
    else
        echo "Aborting due to missing Java installation."
        exit 1
    fi
else
    echo "Java is installed:"
    java -version
fi

echo -e "\nStep 2: Checking if node is already running..."
if check_node_running; then
    echo "ERROR: Ergo node is already running. Please shut it down first."
    exit 1
fi

echo -e "\nStep 3: Checking directory and files..."
if [ ! -d "$ERGO_DIR" ]; then
    echo "ERROR: Directory $ERGO_DIR does not exist!"
    echo "Please refer to the latest Ergo node installation instructions here https://github.com/ergoplatform/ergo/releases to set up your node."
    exit 1
else
    echo "✓ Directory $ERGO_DIR exists"
fi

echo "Looking for Ergo JAR file..."
if ! find_latest_ergo_jar; then
    echo "Directory contents:"
    ls -l "$ERGO_DIR"
    echo "Please download the Ergo node JAR file and place it in the $ERGO_DIR directory."
    exit 1
fi

if [ ! -f "$ERGO_DIR/$ERGO_CONF" ]; then
    echo "ERROR: $ERGO_CONF not found in $ERGO_DIR!"
    ls -l "$ERGO_DIR"
    echo "Please create or place the $ERGO_CONF file in the $ERGO_DIR directory."
    exit 1
else
    echo "✓ Found $ERGO_CONF"
fi

echo -e "\nStep 4: Changing to Ergo directory..."
cd "$ERGO_DIR" || {
    echo "ERROR: Failed to change to directory $ERGO_DIR!"
    exit 1
}
echo "✓ Changed to $(pwd)"

echo -e "\nStep 5: Starting Ergo node in background..."
echo "Using Java options: $JAVA_OPTS"
echo "Full command: java $JAVA_OPTS -jar $ERGO_JAR --mainnet -c $ERGO_CONF"
echo "----------------------------------------"

# Start the node in background with error checking
nohup java $JAVA_OPTS -jar "$ERGO_JAR" --mainnet -c "$ERGO_CONF" > ergo.log 2>&1 &
NODE_PID=$!

echo "Node process started with PID: $NODE_PID"
echo -e "\nStep 6: Verifying node startup..."

# Give the node more time to start and stabilize
sleep 10

# More thorough process check
if ps -p $NODE_PID > /dev/null; then
    echo -e "\n========================================="
    echo "✓ Ergo Node is starting up in the background!"
    echo -e "\nTo monitor your node:"
    echo "• Copy this URL into your browser: http://127.0.0.1:9053/panel"
    echo "• View logs with: tail -f $ERGO_DIR/ergo.log"
    echo -e "=========================================\n"
    # Keep terminal open for user to see the message
    read -p "Press Enter to close this window..."
else
    echo "WARNING: Node process failed to start or terminated unexpectedly."
    echo "Checking logs for errors:"
    tail -n 20 ergo.log
    exit 1
fi