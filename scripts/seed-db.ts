import { getDatabase } from '../lib/database'
import { createTask, createList, createLabel } from '../lib/db-operations'

console.log('Seeding database with sample data...')

const db = getDatabase()

try {
  // Create sample lists
  const workList = createList({
    name: 'Work',
    icon: '💼',
    color: 'blue',
  })
  console.log(`Created list: ${workList.name}`)

  const personalList = createList({
    name: 'Personal',
    icon: '🏠',
    color: 'green',
  })
  console.log(`Created list: ${personalList.name}`)

  // Create sample labels
  const urgentLabel = createLabel({
    name: 'Urgent',
    icon: '⚡',
    color: 'red',
  })
  console.log(`Created label: ${urgentLabel.name}`)

  const importantLabel = createLabel({
    name: 'Important',
    icon: '⭐',
    color: 'yellow',
  })
  console.log(`Created label: ${importantLabel.name}`)

  // Create sample tasks
  const sampleTasks = [
    {
      name: 'Review project proposal',
      description: 'Review the Q4 project proposal and provide feedback by end of week',
      list_id: workList.id,
      date: new Date().toISOString().split('T')[0],
      priority: 'high' as const,
      labels: [urgentLabel.id],
    },
    {
      name: 'Schedule dentist appointment',
      description: 'Call Dr. Smith\'s office to schedule routine cleaning',
      list_id: personalList.id,
      priority: 'medium' as const,
      labels: [importantLabel.id],
    },
    {
      name: 'Team meeting preparation',
      description: 'Prepare slides for Monday\'s team meeting',
      list_id: workList.id,
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium' as const,
    },
    {
      name: 'Buy groceries',
      description: 'Milk, eggs, bread, vegetables, and coffee',
      list_id: personalList.id,
      date: new Date().toISOString().split('T')[0],
      priority: 'low' as const,
    },
  ]

  // Create tasks
  for (const taskData of sampleTasks) {
    const task = createTask({
      name: taskData.name,
      description: taskData.description,
      list_id: taskData.list_id,
      date: taskData.date,
      priority: taskData.priority,
      labels: taskData.labels,
    })
    console.log(`Created task: ${task.name}`)
  }

  console.log('Database seeding completed successfully!')
} catch (error) {
  console.error('Error seeding database:', error)
  process.exit(1)
}
