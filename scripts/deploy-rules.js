const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

// Parse .env.local
const envContent = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val.replace(/\\n/g, '\n');
  }
});

const clientEmail = env['FIREBASE_CLIENT_EMAIL'];
const privateKey = env['FIREBASE_PRIVATE_KEY'];
const projectId = env['FIREBASE_PROJECT_ID'] || 'campus-marketplace-46e4d';

const rulesPath = path.resolve(__dirname, '..', 'firestore.rules');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

async function deployRules() {
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/firebase',
        'https://www.googleapis.com/auth/cloud-platform',
      ],
    });

    const client = await auth.getClient();
    console.log('[Deploy] Authenticated as:', clientEmail);

    // 1. Create Ruleset
    console.log('[Deploy] Creating new ruleset from firestore.rules...');
    const createRulesetRes = await client.request({
      url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
      method: 'POST',
      data: {
        source: {
          files: [
            {
              name: 'firestore.rules',
              content: rulesContent,
            },
          ],
        },
      },
    });

    const newRulesetName = createRulesetRes.data.name;
    console.log('[Deploy] Ruleset created successfully:', newRulesetName);

    // 2. Update release cloud.firestore
    console.log('[Deploy] Releasing ruleset to projects/' + projectId + '/releases/cloud.firestore ...');
    const updateReleaseRes = await client.request({
      url: `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
      method: 'PATCH',
      data: {
        release: {
          name: `projects/${projectId}/releases/cloud.firestore`,
          rulesetName: newRulesetName,
        },
      },
    });

    console.log('[Deploy] Release updated successfully!', updateReleaseRes.data);
    console.log('[Deploy] FIRESTORE RULES ARE NOW LIVE IN GOOGLE CLOUD!');
  } catch (err) {
    console.error('[Deploy] Error deploying rules:', err.message);
    if (err.response?.data) {
      console.error('[Deploy] Response details:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

deployRules();

