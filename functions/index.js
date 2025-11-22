import "dotenv/config";
import { initializeApp } from "firebase-admin/app";
import { createElasticClient } from "./lib/elastic.js";
import { onCall, HttpsError } from "firebase-functions/v2/https";

initializeApp();
const es = createElasticClient();

export const indexUser = onCall(
  {
    region: "europe-west2",
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "User must be logged in");
    }

    const { id, name, profileImageUrl } = request.data;

    if (!id || !name) {
      throw new HttpsError("invalid-argument", "Missing id or name");
    }

    const doc = {
      name,
      profileImageUrl: profileImageUrl || null,
    };

    console.log("Indexing user via callable:", doc);

    try {
      await es.index({
        index: "cchat-users",
        id,
        document: doc,
      });

      return { message: "User indexed successfully" };
    } catch (error) {
      console.error(error);
      throw new HttpsError("internal", error.message);
    }
  }
);

export const searchUsers = onCall(
  {
    region: "europe-west2",
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "User must be logged in");
    }

    const q = request.data.q || "";

    try {
      let query;

      if (!q || q.trim() === "") {
        query = { match_all: {} };
      } else {
        query = {
          wildcard: {
            name: {
              value: `*${q.toLowerCase()}*`,
            },
          },
        };
      }

      const result = await es.search({
        index: "cchat-users",
        query,
      });

      const users = result.hits.hits.map((doc) => ({
        id: doc._id,
        ...doc._source,
      }));

      return users;
    } catch (error) {
      if (error.meta?.body?.error?.type === "index_not_found_exception") {
        return [];
      }

      throw new HttpsError("internal", error.message);
    }
  }
);

// export const indexUserOnCreate = onDocumentCreated(
//   {
//     region: "europe-west2",
//   },
//   "users/{userId}",
//   async (event) => {
//     const userId = event.params.userId;
//     const userData = event.data?.data();

//     if (!userData) {
//       console.log("No user data found — skipping indexing");
//       return;
//     }

//     const doc = {
//       id: userId,
//       name: userData.name,
//       profileImageUrl: userData.profileImageUrl,
//     };

//     console.log("Indexing in Elasticsearch:", doc);

//     await es.index({
//       index: "cchat-users",
//       id: userId,
//       document: doc,
//     });
//   }
// );
