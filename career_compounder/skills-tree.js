// skills-tree.js
// A gamification system for the Career-Compounder routine
const fs = require('fs');
const path = require('path');

// File to store the skill tree data
const SKILLS_FILE = path.join(__dirname, 'skills-data.json');

// Default skill tree structure
const defaultSkillTree = {
  availablePoints: 0,
  technical: {
    name: 'Technical',
    skills: {
      coding: { level: 1, points: 0, pointsToNextLevel: 10, description: 'Programming and development skills' },
      security: { level: 1, points: 0, pointsToNextLevel: 10, description: 'Cybersecurity knowledge and practices' },
      architecture: { level: 1, points: 0, pointsToNextLevel: 10, description: 'System and software architecture' },
    }
  },
  communication: {
    name: 'Communication',
    skills: {
      writing: { level: 1, points: 0, pointsToNextLevel: 10, description: 'Written communication and documentation' },
      speaking: { level: 1, points: 0, pointsToNextLevel: 10, description: 'Verbal communication and presentation' },
      networking: { level: 1, points: 0, pointsToNextLevel: 10, description: 'Building professional relationships' },
    }
  },
  leadership: {
    name: 'Leadership',
    skills: {
      teamwork: { level: 1, points: 0, pointsToNextLevel: 10, description: 'Effective collaboration' },
      mentoring: { level: 1, points: 0, pointsToNextLevel: 10, description: 'Helping others grow' },
      strategy: { level: 1, points: 0, pointsToNextLevel: 10, description: 'Strategic thinking and planning' },
    }
  }
};

// Load skill tree data from file or create default
function loadSkillTree() {
  try {
    if (fs.existsSync(SKILLS_FILE)) {
      const data = fs.readFileSync(SKILLS_FILE, 'utf8');
      return JSON.parse(data);
    }
    // Create default skills file if it doesn't exist
    saveSkillTree(defaultSkillTree);
    return defaultSkillTree;
  } catch (error) {
    console.error('Error loading skill tree:', error);
    return defaultSkillTree;
  }
}

// Save skill tree data to file
function saveSkillTree(skillTree) {
  try {
    fs.writeFileSync(SKILLS_FILE, JSON.stringify(skillTree, null, 2));
  } catch (error) {
    console.error('Error saving skill tree:', error);
  }
}

// Award points for daily completion
function awardDailyPoints(streak) {
  const skillTree = loadSkillTree();
  
  // Base points for completion
  let points = 5;
  
  // Streak bonuses
  if (streak >= 30) points += 5;
  else if (streak >= 7) points += 2;
  else if (streak >= 3) points += 1;
  
  skillTree.availablePoints += points;
  saveSkillTree(skillTree);
  
  console.log(`\n🏆 You earned ${points} skill points! You now have ${skillTree.availablePoints} points to allocate.\n`);
  console.log(`Use 'node skills-tree.js allocate <category> <skill> <points>' to level up your skills.`);
}

// Allocate points to a specific skill
function allocatePoints(categoryName, skillName, pointsToAllocate) {
  const skillTree = loadSkillTree();
  
  // Convert to number and validate
  pointsToAllocate = parseInt(pointsToAllocate, 10);
  if (isNaN(pointsToAllocate) || pointsToAllocate <= 0) {
    console.log('❌ Points must be a positive number');
    return;
  }
  
  // Check if we have enough points to allocate
  if (pointsToAllocate > skillTree.availablePoints) {
    console.log(`❌ Not enough points available. You have ${skillTree.availablePoints} points.`);
    return;
  }
  
  // Check if the category exists
  if (!skillTree[categoryName]) {
    console.log(`❌ Category "${categoryName}" not found. Available categories: ${Object.keys(skillTree).filter(k => k !== 'availablePoints').join(', ')}`);
    return;
  }
  
  // Check if the skill exists in the category
  if (!skillTree[categoryName].skills[skillName]) {
    console.log(`❌ Skill "${skillName}" not found in ${categoryName}. Available skills: ${Object.keys(skillTree[categoryName].skills).join(', ')}`);
    return;
  }
  
  // Get the skill
  const skill = skillTree[categoryName].skills[skillName];
  
  // Apply points
  skill.points += pointsToAllocate;
  skillTree.availablePoints -= pointsToAllocate;
  
  // Check for level ups
  while (skill.points >= skill.pointsToNextLevel) {
    skill.points -= skill.pointsToNextLevel;
    skill.level += 1;
    // Increase points needed for next level
    skill.pointsToNextLevel = Math.floor(skill.pointsToNextLevel * 1.5);
    console.log(`🌟 LEVEL UP! ${skillName} is now level ${skill.level}!`);
  }
  
  saveSkillTree(skillTree);
  console.log(`✅ Allocated ${pointsToAllocate} points to ${skillName}. Points remaining: ${skillTree.availablePoints}`);
}

// Display the skill tree in ASCII art
function displaySkillTree() {
  const skillTree = loadSkillTree();
  
  console.log("\n🌳 YOUR CAREER SKILLS TREE 🌳\n");
  console.log(`Available points to allocate: ${skillTree.availablePoints}\n`);
  
  Object.keys(skillTree).forEach(category => {
    if (category === 'availablePoints') return;
    
    console.log(`\n${skillTree[category].name} Branch:`);
    console.log('─'.repeat(40));
    
    Object.keys(skillTree[category].skills).forEach(skill => {
      const skillData = skillTree[category].skills[skill];
      const levelBar = '█'.repeat(skillData.level) + '░'.repeat(5 - skillData.level);
      console.log(`  ${skill.padEnd(12)} |${levelBar}| Lvl ${skillData.level} (${skillData.points}/${skillData.pointsToNextLevel})`);
      console.log(`  ${' '.repeat(12)} ${skillData.description}`);
      console.log('  ' + '─'.repeat(38));
    });
  });
}

// Recommend skills to focus on for balanced development
function recommendSkills() {
  try {
    const skillTree = loadSkillTree();
    
    // Use simple string concatenation for output to avoid buffering issues
    let output = '\n🧠 SKILLS DEVELOPMENT RECOMMENDATIONS 🧠\n\n';
    
    // Calculate average level for each category
    const categoryAverages = {};
    const overallSkills = [];
    let lowestOverallLevel = Infinity;
    
    Object.keys(skillTree).forEach(category => {
      if (category === 'availablePoints') return;
      
      let categorySum = 0;
      let skillCount = 0;
      
      Object.keys(skillTree[category].skills).forEach(skill => {
        const skillData = skillTree[category].skills[skill];
        categorySum += skillData.level;
        skillCount++;
        
        // Track overall lowest level skills
        if (skillData.level < lowestOverallLevel) {
          lowestOverallLevel = skillData.level;
        }
        
        // Add to overall skills list for later processing
        overallSkills.push({
          category, 
          skill, 
          level: skillData.level, 
          progress: skillData.points / skillData.pointsToNextLevel
        });
      });
      
      categoryAverages[category] = categorySum / skillCount;
    });
    
    // Find the category with lowest average level
    const categories = Object.keys(categoryAverages);
    const lowestCategory = categories.reduce((a, b) => 
      categoryAverages[a] <= categoryAverages[b] ? a : b
    );
    
    // Sort skills by level and then by progress to next level (higher progress first)
    const sortedSkills = overallSkills.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return b.progress - a.progress; // If same level, prioritize skills closer to leveling up
    });
    
    output += `🎯 Most Needed Focus: ${skillTree[lowestCategory].name} skills (Avg level: ${categoryAverages[lowestCategory].toFixed(1)})\n\n`;
    
    // Show skills that need the most attention (lowest level)
    output += '📊 Skills needing attention:\n';
    const needAttention = sortedSkills.slice(0, 3);
    needAttention.forEach(skill => {
      const skillData = skillTree[skill.category].skills[skill.skill];
      const progress = (skill.progress * 100).toFixed(0);
      output += `  • ${skill.skill} (${skillTree[skill.category].name}): Level ${skill.level}, ${progress}% to next level\n`;
      output += `    ${skillData.description}\n`;
    });
    
    // Skills closest to leveling up
    const almostLeveling = [...overallSkills].sort((a, b) => b.progress - a.progress).slice(0, 2);
    output += '\n🚀 Quick wins (closest to leveling up):\n';
    almostLeveling.forEach(skill => {
      const skillData = skillTree[skill.category].skills[skill.skill];
      const progress = (skill.progress * 100).toFixed(0);
      const pointsNeeded = skillData.pointsToNextLevel - skillData.points;
      output += `  • ${skill.skill} (${skillTree[skill.category].name}): ${progress}% complete, needs ${pointsNeeded} more points\n`;
    });
    
    // Check if we have available points to allocate
    if (skillTree.availablePoints > 0) {
      output += `\n💰 You have ${skillTree.availablePoints} unallocated points available!\n`;
      output += `   Consider allocating them with: node skills-tree.js allocate <category> <skill> <points>\n`;
    }
    
    // Suggest a skill to focus on tomorrow
    output += '\n✨ Recommendation for tomorrow:\n';
    // Priority: lowest level skill that's closest to leveling up
    const recommendation = sortedSkills[0];
    output += `  Focus on improving your "${recommendation.skill}" skill (${skillTree[recommendation.category].name} branch).\n`;
    output += `  Choose a task tomorrow that will help develop this skill.\n`;
    
    // Print the entire output at once to avoid buffering issues
    process.stdout.write(output);
    
    return recommendation;
  } catch (error) {
    console.error('Error in recommendSkills:', error);
    return null;
  }
}

// Command line interface
function main() {
  const command = process.argv[2];
  
  if (!command) {
    displaySkillTree();
    return;
  }
  
  switch (command.toLowerCase()) {
    case 'display':
      displaySkillTree();
      break;
    
    case 'recommend':
      recommendSkills();
      break;
    
    case 'award':
      // Example: node skills-tree.js award 7
      const streak = parseInt(process.argv[3], 10) || 1;
      awardDailyPoints(streak);
      break;
    
    case 'allocate':
      // Example: node skills-tree.js allocate technical coding 5
      const category = process.argv[3];
      const skill = process.argv[4];
      const points = process.argv[5];
      
      if (!category || !skill || !points) {
        console.log('❌ Usage: node skills-tree.js allocate <category> <skill> <points>');
        return;
      }
      
      allocatePoints(category, skill, points);
      break;
    
    case 'help':
      console.log(`
Skills Tree - Career-Compounder Gamification System

Commands:
  node skills-tree.js                     Display your skill tree
  node skills-tree.js display             Display your skill tree
  node skills-tree.js recommend           Get recommendations for skills to develop
  node skills-tree.js award <streak>      Award points based on your streak
  node skills-tree.js allocate <category> <skill> <points>  
                                         Allocate points to level up a skill
  node skills-tree.js help                Show this help message

Categories: technical, communication, leadership
      `);
      break;
    
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('Run "node skills-tree.js help" for usage information');
  }
}

// Run the main function and ensure console output is properly flushed
try {
  main();
  // Ensure output is flushed before exiting
  process.stdout.write('', () => {
    process.exit(0);
  });
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
