import functions from "firebase-functions";
import admin from "firebase-admin";
import fetch from "node-fetch";
import OpenAI from "openai";

admin.initializeApp();
const db = admin.firestore();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 Create embedding for a given text
async function createEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// 🔹 Calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

// 🔹 Cloud Function: Chat endpoint with RAG
export const chatWithRAG = functions.https.onRequest(async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    // 1️⃣ Create embedding for user query
    const queryEmbedding = await createEmbedding(query);

    // 2️⃣ Get knowledge docs from Firestore
    const snapshot = await db.collection("ncc_knowledge").get();
    const docs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // 3️⃣ Find most similar document by cosine similarity
    const scoredDocs = docs.map((doc) => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    }));
    const bestDocs = scoredDocs
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    const contextText = bestDocs.map((d) => d.text).join("\n");

    // 4️⃣ Ask OpenAI using retrieved context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an assistant that answers based on NCC knowledge.",
        },
        {
          role: "user",
          content: `Context:\n${contextText}\n\nQuestion: ${query}`,
        },
      ],
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Cloud Function: Migration from Supabase to Firebase Storage
export const migrateSupabaseToFirebase = functions.https.onRequest(async (req, res) => {
  try {
    const bucket = admin.storage().bucket();
    const COLLECTIONS = [
      { name: 'cadets', fields: ['photoURL', 'pdfURL'] },
      { name: 'magicMembers', fields: ['photoURL'] },
      { name: 'anos', fields: ['photoUrl', 'pdfUrl'] },
      { name: 'alumni', fields: ['photoUrl'] },
      { name: 'galleryImages', fields: ['imageUrl'] },
      { name: 'slideshowImages', fields: ['imageUrl'] },
      { name: 'armySlideshowImages', fields: ['imageUrl'] },
      { name: 'navySlideshowImages', fields: ['imageUrl'] },
      { name: 'airSlideshowImages', fields: ['imageUrl'] }
    ];

    let migratedCount = 0;

    for (const col of COLLECTIONS) {
      const snapshot = await db.collection(col.name).get();
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const updates = {};
        let changed = false;

        for (const field of col.fields) {
          const url = data[field];
          if (url && url.includes('supabase.co')) {
            // Migration logic
            const response = await fetch(url);
            if (!response.ok) continue;

            const buffer = Buffer.from(await response.arrayBuffer());
            const fileName = `migration/${col.name}/${doc.id}_${Date.now()}_${field}.jpg`;
            const file = bucket.file(fileName);

            await file.save(buffer, {
              metadata: { contentType: response.headers.get('content-type') || 'image/jpeg' },
            });

            await file.makePublic();
            updates[field] = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            changed = true;
          }
        }

        if (changed) {
          await doc.ref.update(updates);
          migratedCount++;
        }
      }
    }
    res.json({ success: true, migratedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Cloud Function: Reset Alumni Passwords
export const resetAlumniPasswords = functions.https.onRequest(async (req, res) => {
  try {
    const adminEmails = ['alumini@sairamtao.edu.in', 'alumini@sairamtap.edu.in'];
    const newPassword = 'Sairam@123';
    let updated = [];

    for (const email of adminEmails) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, { password: newPassword });
        updated.push(email);
      } catch (e) {
        console.warn(`User ${email} not found`);
      }
    }
    res.json({ success: true, updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

