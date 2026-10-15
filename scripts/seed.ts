import { faker } from '@faker-js/faker';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  language: string;
  level: string;
  createdAt: string;
}

interface SeedData {
  users: UserProfile[];
  courses: Array<{
    id: string;
    title: string;
    language: string;
    level: string;
    description: string;
  }>;
  progress: Array<{
    userId: string;
    courseId: string;
    completedLessons: number;
    totalLessons: number;
    lastAccessed: string;
  }>;
}

function generateSyntheticData(): SeedData {
  const languages = ['es', 'en', 'pt-BR', 'fr', 'de', 'it', 'zh', 'ja', 'ar', 'hi'];
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  const users: UserProfile[] = Array.from({ length: 50 }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    language: faker.helpers.arrayElement(languages),
    level: faker.helpers.arrayElement(levels),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
  }));

  const courses = languages.flatMap(lang => 
    levels.map(level => ({
      id: faker.string.uuid(),
      title: `${lang.toUpperCase()} ${level} Course`,
      language: lang,
      level: level,
      description: faker.lorem.paragraph(),
    }))
  );

  const progress = users.flatMap(user => 
    faker.helpers.arrayElements(courses, { min: 1, max: 3 }).map(course => ({
      userId: user.id,
      courseId: course.id,
      completedLessons: faker.number.int({ min: 0, max: 20 }),
      totalLessons: 20,
      lastAccessed: faker.date.recent({ days: 30 }).toISOString(),
    }))
  );

  return { users, courses, progress };
}

function main() {
  const data = generateSyntheticData();
  
  const outputDir = join(process.cwd(), 'data', 'seed');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  writeFileSync(join(outputDir, 'synthetic-data.json'), JSON.stringify(data, null, 2));
  console.log('✅ Synthetic seed data generated at data/seed/synthetic-data.json');
  console.log(`   Users: ${data.users.length}`);
  console.log(`   Courses: ${data.courses.length}`);
  console.log(`   Progress records: ${data.progress.length}`);
}

main();