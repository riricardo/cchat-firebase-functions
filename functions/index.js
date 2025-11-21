import "dotenv/config";
import { initializeApp } from "firebase-admin/app";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { createElasticClient } from "./lib/elastic.js";

initializeApp();
const es = createElasticClient();

export const indexUserOnCreate = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData) {
      console.log("No user data found — skipping indexing");
      return;
    }

    const doc = {
      id: userId,
      name: userData.name,
      profileImageUrl: userData.profileImageUrl,
    };

    console.log("Indexing in Elasticsearch:", doc);

    await es.index({
      index: "cchat-users",
      id: userId,
      document: doc,
    });
  }
);

export const searchUsers = onRequest(async (req, res) => {
  const q = req.query.q || "";

  try {
    const result = await es.search({
      index: "cchat-users",
      query: {
        match: {
          name: {
            query: q,
            fuzziness: "AUTO",
          },
        },
      },
    });

    const users = result.hits.hits.map((doc) => ({
      id: doc._id,
      ...doc._source,
    }));

    res.json(users);
  } catch (error) {
    if (error.meta?.body?.error?.type === "index_not_found_exception") {
      return res.json([]);
    }

    res.status(500).json({ message: error.message });
  }
});
