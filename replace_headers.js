const fs = require('fs');

const files = [
    'index.html',
    'distance.html',
    'places.html',
    'turnaround-time-calculator.html',
    'about.html',
    'contact.html',
    'privacy.html',
    'terms.html',
    'blog/_includes/base.html'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<header>[\s\S]*?<\/header>/i, '<site-header></site-header>\n  <script src="/menu.js"></script>');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
}
