import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";

initializeApp();

export const helloWorld = onRequest({ region: "europe-west2" }, (req, res) => {
  res.send("Hello from functions");
});
