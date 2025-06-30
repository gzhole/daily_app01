#!/bin/bash

# Reminder for Career-Compounder Session
# This script will create a calendar event for your next session

# Default time (3:30 PM)
REMINDER_TIME="15:30"
REMINDER_DATE="2025-06-30" # Tomorrow's date
REMINDER_TITLE="🔍 Career-Compounder Daily Session"
REMINDER_NOTES="Time for your daily 30-minute Career-Compounder routine!"

# Create calendar event using macOS calendar
osascript <<EOD
tell application "Calendar"
    tell calendar "Work"
        make new event with properties {summary:"$REMINDER_TITLE", start date:date "$REMINDER_DATE $REMINDER_TIME", allday event:false, description:"$REMINDER_NOTES"}
    end tell
end tell
EOD

echo "✅ Reminder set for $REMINDER_DATE at $REMINDER_TIME"
echo "   - $REMINDER_TITLE"
echo "   - $REMINDER_NOTES"
