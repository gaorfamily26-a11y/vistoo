import fs from 'fs';

let content = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

// Replace window.open with setShowForm(true)
content = content.replace(/window\.open\('https:\/\/wa\.me\/yournumber', '_blank'\)/g, 'setShowForm(true)');

fs.writeFileSync('src/components/RegistrationForm.tsx', content);
console.log('Modified successfully');
