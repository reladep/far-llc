/**
 * Command Center - Task Priority Processor
 * 
 * Logic:
 * - 2 days before deadline → Critical
 * - 7 days before deadline → High
 * - Default: original priority
 */

const fs = require('fs');
const path = require('path');

function loadTasks() {
  const data = fs.readFileSync(path.join(__dirname, 'research/command-center.json'), 'utf8');
  return JSON.parse(data);
}

function calculateDaysUntilDeadline(deadline) {
  const today = new Date('2026-02-16'); // Use actual date in production
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getEffectivePriority(task) {
  if (!task.deadline) return task.priority;
  
  const daysUntil = calculateDaysUntilDeadline(task.deadline);
  
  if (daysUntil <= 2) return 'Critical';
  if (daysUntil <= 7) return 'High';
  return task.priority;
}

function getUrgentTasks() {
  const data = loadTasks();
  
  const tasksWithEffectivePriority = data.tasks.map(task => ({
    ...task,
    effective_priority: getEffectivePriority(task),
    days_until_deadline: task.deadline ? calculateDaysUntilDeadline(task.deadline) : null
  }));
  
  // Filter to High or Critical
  const urgent = tasksWithEffectivePriority.filter(t => 
    t.effective_priority === 'High' || t.effective_priority === 'Critical'
  );
  
  // Sort by effective priority (Critical first), then by deadline
  urgent.sort((a, b) => {
    const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
    if (priorityOrder[a.effective_priority] !== priorityOrder[b.effective_priority]) {
      return priorityOrder[a.effective_priority] - priorityOrder[b.effective_priority];
    }
    return (a.days_until_deadline || 999) - (b.days_until_deadline || 999);
  });
  
  return urgent;
}

// CLI output
const urgent = getUrgentTasks();
console.log('\n=== COMMAND CENTER - URGENT TASKS ===\n');
console.log(`Total urgent tasks: ${urgent.length}\n`);

if (urgent.length === 0) {
  console.log('No urgent tasks!');
} else {
  urgent.forEach((task, i) => {
    console.log(`${i + 1}. [${task.effective_priority}] ${task.title}`);
    console.log(`   Category: ${task.category}`);
    if (task.days_until_deadline !== null) {
      console.log(`   Deadline: ${task.deadline} (${task.days_until_deadline} days)`);
    }
    if (task.notes) console.log(`   Notes: ${task.notes}`);
    console.log('');
  });
}
