const fs = require('fs');
const csv = require('csv-parser');

fs.createReadStream('members.csv')
  .pipe(csv())
  .on('data', (row) => {
    console.log(`Name: ${row.name}, Email: ${row.email}, Username: ${row.username}`);
  })
  .on('end', () => {
    console.log('CSV file successfully read and previewed.');
  })
  .on('error', (err) => {
    console.error('Error reading CSV:', err);
  });
