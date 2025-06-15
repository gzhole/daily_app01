// Simple test script to show skill recommendations
const fs = require('fs');
const path = require('path');

// File to store the skill tree data
const SKILLS_FILE = path.join(__dirname, 'skills-data.json');

// Load skill tree data
const skillTree = JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf8'));

console.log("\n🧠 SKILLS DEVELOPMENT RECOMMENDATIONS 🧠\n");

// Calculate average level for each category
const categoryAverages = {};
const overallSkills = [];

Object.keys(skillTree).forEach(category => {
  if (category === 'availablePoints') return;
  
  let categorySum = 0;
  let skillCount = 0;
  
  Object.keys(skillTree[category].skills).forEach(skill => {
    const skillData = skillTree[category].skills[skill];
    categorySum += skillData.level;
    skillCount++;
    
    // Add to overall skills list for processing
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

// Sort skills by level and then by progress to next level
const sortedSkills = overallSkills.sort((a, b) => {
  if (a.level !== b.level) return a.level - b.level;
  return b.progress - a.progress; // If same level, prioritize skills closer to leveling up
});

console.log(`🎯 Most Needed Focus: ${skillTree[lowestCategory].name} skills (Avg level: ${categoryAverages[lowestCategory].toFixed(1)})`);

// Show skills that need the most attention (lowest level)
console.log('\n📊 Skills needing attention:');
const needAttention = sortedSkills.slice(0, 3);
needAttention.forEach(skill => {
  const skillData = skillTree[skill.category].skills[skill.skill];
  const progress = (skill.progress * 100).toFixed(0);
  console.log(`  • ${skill.skill} (${skillTree[skill.category].name}): Level ${skill.level}, ${progress}% to next level`);
  console.log(`    ${skillData.description}`);
});

// Skills closest to leveling up
const almostLeveling = [...overallSkills].sort((a, b) => b.progress - a.progress).slice(0, 2);
console.log('\n🚀 Quick wins (closest to leveling up):');
almostLeveling.forEach(skill => {
  const skillData = skillTree[skill.category].skills[skill.skill];
  const progress = (skill.progress * 100).toFixed(0);
  const pointsNeeded = skillData.pointsToNextLevel - skillData.points;
  console.log(`  • ${skill.skill} (${skillTree[skill.category].name}): ${progress}% complete, needs ${pointsNeeded} more points`);
});

// Check if we have available points to allocate
if (skillTree.availablePoints > 0) {
  console.log(`\n💰 You have ${skillTree.availablePoints} unallocated points available!`);
  console.log(`   Consider allocating them to level up your skills.`);
}

// Suggest a skill to focus on tomorrow
console.log('\n✨ Recommendation for tomorrow:');
const recommendation = sortedSkills[0];
console.log(`  Focus on improving your "${recommendation.skill}" skill (${skillTree[recommendation.category].name} branch).`);
console.log(`  Choose a task tomorrow that will help develop this skill.`);
