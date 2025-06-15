#!/usr/bin/env node

/**
 * Career-Compounder Streak Tracker
 * A simple system to track daily Career-Compounder completions
 * and provide encouraging feedback on consistency.
 */

const fs = require('fs');
const path = require('path');

// File to store streak data
const STREAK_FILE = path.join(__dirname, 'streak-data.json');

// Initial streak data structure
const DEFAULT_STREAK_DATA = {
  days: [],           // Array of dates when routine was completed
  currentStreak: 0,   // Current consecutive days streak
  longestStreak: 0,   // Longest consecutive streak achieved
  totalDays: 0,       // Total days completed (not necessarily consecutive)
  lastCompleted: null // Last date the routine was completed
};

// Messages to display based on streak
const STREAK_MESSAGES = [
  { min: 1, message: "You've started your journey! 🌱" },
  { min: 3, message: "Three days in a row - you're building momentum! 🚀" },
  { min: 5, message: "Five-day streak! You're developing a solid habit! 💪" },
  { min: 7, message: "A whole week! Your career growth is compounding! 📈" },
  { min: 14, message: "Two weeks strong! You're in the top 1% of consistent learners! 🏆" },
  { min: 21, message: "Three weeks! You've formed a genuine habit now! 🧠" },
  { min: 30, message: "A FULL MONTH! Your dedication is extraordinary! 🌟" },
  { min: 60, message: "TWO MONTHS! You're unstoppable! 🔥" },
  { min: 90, message: "THREE MONTHS! You're a Career-Compounder master! 👑" }
];

// Load streak data from file
function loadStreakData() {
  try {
    if (fs.existsSync(STREAK_FILE)) {
      const data = fs.readFileSync(STREAK_FILE, 'utf8');
      return JSON.parse(data);
    }
    return { ...DEFAULT_STREAK_DATA };
  } catch (error) {
    console.error('Error loading streak data:', error.message);
    return { ...DEFAULT_STREAK_DATA };
  }
}

// Save streak data to file
function saveStreakData(data) {
  try {
    fs.writeFileSync(STREAK_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving streak data:', error.message);
  }
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Check if two dates are consecutive
function areConsecutiveDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Get encouraging message based on streak
function getStreakMessage(streak) {
  // Reverse sort to check highest thresholds first
  const sorted = [...STREAK_MESSAGES].sort((a, b) => b.min - a.min);
  for (const { min, message } of sorted) {
    if (streak >= min) return message;
  }
  return "Every day of consistency builds your career! 🌟";
}

// Record today's completion
function recordCompletion() {
  const data = loadStreakData();
  const today = formatDate(new Date());

  // Don't double-count same day
  if (data.lastCompleted === today) {
    console.log('\n🔄 Already recorded today\'s Career-Compounder session!\n');
    displayStats(data);
    return;
  }

  // Add today to the list of completed days
  data.days.push(today);
  data.totalDays++;
  
  // Check if continuing a streak
  if (data.lastCompleted) {
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    
    if (data.lastCompleted === yesterday) {
      // Continuing streak
      data.currentStreak++;
    } else {
      // Missed a day, but that's okay! Start new streak
      const daysSince = (new Date(today) - new Date(data.lastCompleted)) / (1000 * 60 * 60 * 24);
      console.log(`\n⏳ ${Math.round(daysSince)} days since your last session - welcome back!\n`);
      data.currentStreak = 1;
    }
  } else {
    // First time using the system
    data.currentStreak = 1;
  }

  // Update longest streak if needed
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  // Update last completed date
  data.lastCompleted = today;
  
  // Save updated data
  saveStreakData(data);
  
  // Display stats
  displayStats(data);
}

// Check status without recording completion
function checkStatus() {
  const data = loadStreakData();
  displayStats(data);
}

// Display streak stats with fun messaging
function displayStats(data) {
  console.log('\n🎯 CAREER-COMPOUNDER STREAK TRACKER\n');
  
  if (data.totalDays === 0) {
    console.log('👋 Welcome to Career-Compounder! Ready to start your streak?');
    console.log('   Run this after completing your daily routine to begin tracking.\n');
    return;
  }
  
  // Current streak
  console.log(`🔥 Current streak: ${data.currentStreak} day${data.currentStreak !== 1 ? 's' : ''}`);
  console.log(`🏆 Longest streak: ${data.longestStreak} day${data.longestStreak !== 1 ? 's' : ''}`);
  console.log(`📊 Total sessions: ${data.totalDays} day${data.totalDays !== 1 ? 's' : ''}`);
  
  // Last completed
  if (data.lastCompleted) {
    const today = formatDate(new Date());
    if (data.lastCompleted === today) {
      console.log('✅ Completed today - great job!');
    } else {
      const lastDate = new Date(data.lastCompleted);
      console.log(`📅 Last completed: ${lastDate.toDateString()}`);
      
      // Check if missed yesterday but in a positive way
      const yesterday = formatDate(new Date(Date.now() - 86400000));
      if (data.lastCompleted !== yesterday) {
        console.log('\n💡 TIP: Complete today\'s routine to start a new streak!');
      }
    }
  }
  
  // Encouraging message based on streak
  console.log(`\n${getStreakMessage(data.currentStreak)}\n`);
  
  // Visualization of recent activity with calendar
  if (data.days.length > 0) {
    displayCalendarView(data);
  }
}

// Display a visual calendar view of the current month with completion markers
function displayCalendarView(data) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get first day of month and total days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  console.log(`\n📅 ${monthNames[currentMonth]} ${currentYear} Calendar:\n`);
  
  // Print days of week header
  console.log('  Sun   Mon   Tue   Wed   Thu   Fri   Sat  ');
  console.log(' ----- ----- ----- ----- ----- ----- ----- ');
  
  // Create set of completed days for this month for faster lookup
  const completedDaysSet = new Set();
  data.days.forEach(dayStr => {
    const day = new Date(dayStr);
    if (day.getMonth() === currentMonth && day.getFullYear() === currentYear) {
      completedDaysSet.add(day.getDate());
    }
  });
  
  // Emoji indicators
  const COMPLETED_DAY = '✅';
  const CURRENT_DAY = '🟢';
  const MISSED_DAY = '⬜';
  const FUTURE_DAY = '   ';
  
  let calendarRow = '';
  
  // Add padding for first day of month
  for (let i = 0; i < startingDay; i++) {
    calendarRow += '      ';
  }
  
  // Fill calendar with days
  for (let day = 1; day <= totalDays; day++) {
    // Determine status of this day
    let marker;
    const dayDate = new Date(currentYear, currentMonth, day);
    const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isCompleted = completedDaysSet.has(day);
    
    if (isToday) {
      marker = isCompleted ? COMPLETED_DAY : CURRENT_DAY;
    } else if (isPast) {
      marker = isCompleted ? COMPLETED_DAY : MISSED_DAY;
    } else {
      marker = FUTURE_DAY;
    }
    
    // Format day number with padding
    const dayStr = day.toString().padStart(2);
    calendarRow += ` ${marker}${dayStr} `;
    
    // End of row (Saturday) or end of month
    if ((startingDay + day) % 7 === 0 || day === totalDays) {
      console.log(calendarRow);
      calendarRow = '';
    }
  }
  
  console.log('\n Legend: ✅ Completed  🟢 Today  ⬜ Missed\n');
}

// Process command line arguments
function processCommand() {
  const command = process.argv[2];
  
  switch (command) {
    case 'record':
      recordCompletion();
      break;
    case 'status':
    default:
      checkStatus();
      break;
  }
}

// Run the command
processCommand();
