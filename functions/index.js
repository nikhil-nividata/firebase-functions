const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.hello = functions.https.onRequest((request, response) => {
  response.send("Hello from the firebase");
});

exports.someCallback = functions.https.onCall((data, context) => {
  console.log("Hello Firebase");
});

exports.addPost = functions.https.onCall((data, context) => {
  const xObj = data;
  xObj.user = context.auth.uid;
  xObj.upvotes = 0;
  return db.collection("posts").add(xObj);
});

exports.newUserSignup = functions.auth.user().onCreate((user) => {
  const userObj = {};
  userObj.uid = user.uid;
  userObj.upvotes = [];
  return db.collection("postUsers").doc(user.uid).set(userObj);
});

exports.upvotePost = functions.https.onCall((data, context) => {
  const { postId } = data;
  const { uid } = context.auth;
  const user = db.collection("postUsers").doc(uid);
  const post = db.collection("posts").doc(postId);

  return user.get().then(async (doc) => {
    if (doc.data().upvotes.includes(postId)) {
      const newArr = [];
      doc.data().upvotes.forEach((str) => {
        if (str !== postId) newArr.push(str);
      });
      await user.update({
        upvotes: newArr,
      });
      return post.update({
        upvotes: admin.firestore.FieldValue.increment(-1),
      });
    } else {
      await user.update({
        upvotes: [...doc.data().upvotes, postId],
      });
      return post.update({
        upvotes: admin.firestore.FieldValue.increment(1),
      });
    }
  });
});
