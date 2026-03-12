import fs from 'fs';

let content = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

// Remove leftover code from old success screen
const regex = /<\/div>\s*<div className="success-step"><div className="num">2<\/div><div>Creamos tu perfil en Google Business Profile<\/div><\/div>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

content = content.replace(regex, '</div>');

fs.writeFileSync('src/components/RegistrationForm.tsx', content);
console.log('Modified successfully');
