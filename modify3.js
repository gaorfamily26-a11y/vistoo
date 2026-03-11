import fs from 'fs';

let content = fs.readFileSync('src/components/RegistrationForm.tsx', 'utf8');

// Fix the closing tags at the end
const endRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/motion\.div>\s*\}\)\s*<\/AnimatePresence>/;
const newEnd = `        </div>
      </motion.div>
      )}
      </AnimatePresence>`;

content = content.replace(endRegex, newEnd);

fs.writeFileSync('src/components/RegistrationForm.tsx', content);
console.log('Modified successfully');
