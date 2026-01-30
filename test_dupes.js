
import { generateWorkout } from './src/utils/workoutRecommendations.js';

// Polyfill crypto if needed (for older Node versions)
if (!global.crypto) {
    global.crypto = {
        randomUUID: () => 'uuid-' + Math.random()
    };
} else if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = () => 'uuid-' + Math.random();
}


const mockStudent = {
    age: 25,
    objective: 'Hipertrofia',
    level: 'avançado',
    sex: 'male',
    trainingFrequency: '5x', // Triggers ABCDE
    limitations: '',
    diseases: ''
};

console.log("Running deduplication test...");

let duplicateCount = 0;
const iterations = 50; // Run enough times to catch random duplicates

for (let i = 0; i < iterations; i++) {
    const result = generateWorkout(mockStudent);
    const workouts = result.workouts;

    Object.keys(workouts).forEach(key => {
        const exercises = workouts[key].exercises;
        const names = exercises.map(e => e.name.trim().toLowerCase());
        const uniqueNames = new Set(names);

        if (names.length !== uniqueNames.size) {
            console.error(`Duplicate found in iteration ${i}, Division ${key}!`);
            console.error('Exercises:', names);
            duplicateCount++;
        }
    });
}

if (duplicateCount === 0) {
    console.log("✅ SUCCESS: No duplicates found in " + iterations + " iterations.");
} else {
    console.error("❌ FAILURE: Found " + duplicateCount + " workouts with duplicates.");
}
