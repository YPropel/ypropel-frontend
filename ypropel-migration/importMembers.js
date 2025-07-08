import fs from 'fs';
import csv from 'csv-parser';
import fetch from 'node-fetch';

// Adjust this URL if your backend is on a different host or port
const backendSignupUrl = 'http://localhost:4000/auth/signup';

// Generate a random password for each user
function generateRandomPassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

async function signupUser(userData) {
  try {
    const response = await fetch(backendSignupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to create user ${userData.email}:`, errorData);
      return false;
    }

    const data = await response.json();
    console.log(`Created user: ${data.user.email}`);
    return true;
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error);
    return false;
  }
}

function startImport() {
  const results = [];

  fs.createReadStream('members.csv')  // <-- Make sure your CSV file is here
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`Read ${results.length} records from CSV.`);

      for (const row of results) {
        // Map CSV fields to backend expected fields
        const userData = {
          name: row.name || row.Name,  // adjust based on your CSV header names
          email: row.email || row.Email,
          password: generateRandomPassword(),
          title: row.tagline || null,
          university: row['fields.School_Name'] || null,
          major: row.fields?.Major || null,
          company: row.fields?.company || null,
          country: row.fields?.country || null,
          birthdate: row.fields?.birthday || null,
        };

        // Simple email validation
        if (!userData.email || !userData.name) {
          console.warn('Skipping record missing email or name:', userData);
          continue;
        }

        await signupUser(userData);
      }

      console.log('Import finished.');
    });
}

startImport();
