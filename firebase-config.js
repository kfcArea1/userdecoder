// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzwcUBKdxCaGshMmoXO1Cqven5e-LQnYU",
    authDomain: "feedencoder.firebaseapp.com",
    projectId: "feedencoder",
    storageBucket: "feedencoder.firebasestorage.app",
    messagingSenderId: "904577806120",
    appId: "1:904577806120:web:c663f621d01ceeba12aa1d",
    measurementId: "G-386008MT7T"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  const auth = firebase.auth();
  const db = firebase.firestore();
  db.settings({ timestampsInSnapshots: true });
  
  // Enable Firestore offline persistence
  db.enablePersistence()
    .catch((err) => {
      console.log("Firestore offline persistence not enabled:", err);
    });

l 
// Set auth persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });