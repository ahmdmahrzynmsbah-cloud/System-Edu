import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const tenantsRef = collection(db, 'system_tenants');
    const snapshot = await getDocs(tenantsRef);
    console.log("Tenants found:", snapshot.docs.length);
    
    await setDoc(doc(db, 'system_tenants', 'test-tenant'), { name: "Test" });
    console.log("Write success");
    process.exit(0);
  } catch (e) {
    console.error("Firebase error:", e.message);
    process.exit(1);
  }
}
test();
