#!/bin/bash

# Cron job script for processing scheduled articles
# This script should be run every few minutes to process scheduled articles

# Configuration
PROJECT_DIR="/home/mine/Documents/codingProjects/dhivehinoosV2/backend"
VENV_PATH="$PROJECT_DIR/venv"
LOG_FILE="$PROJECT_DIR/logs/scheduling.log"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Change to project directory
cd "$PROJECT_DIR"

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Log start
log "Starting scheduled article processing"

# Run the management command
python manage.py process_scheduled_articles >> "$LOG_FILE" 2>&1

# Log completion
log "Scheduled article processing completed"

# Deactivate virtual environment
deactivate
