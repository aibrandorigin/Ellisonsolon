import firebaseConfig from '../firebase-applet-config.json';

async function inspectCloudDocs() {
  const { projectId, firestoreDatabaseId, apiKey } = firebaseConfig;
  const sections = ['floor_plans', 'amenities', 'gallery', 'neighborhood', 'specials', 'categories', 'property_info'];

  console.log('Inspecting Firestore documents...');
  for (const section of sections) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/property_content/${section}_meta?key=${apiKey}`;
      const res = await fetch(url);
      console.log(`[${section}_meta]: HTTP ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`  Data:`, JSON.stringify(data.fields || {}));
      }

      const singleDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/property_content/${section}?key=${apiKey}`;
      const singleRes = await fetch(singleDocUrl);
      console.log(`[${section}]: HTTP ${singleRes.status}`);
    } catch (err: any) {
      console.error(`Error reading ${section}:`, err.message);
    }
  }
}

inspectCloudDocs();
