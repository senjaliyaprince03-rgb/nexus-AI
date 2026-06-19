import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcCKKMmIiA2_gdRvdHtEKpjOxGUBkPFys",
  authDomain: "nexusai-5015c.firebaseapp.com",
  projectId: "nexusai-5015c",
  storageBucket: "nexusai-5015c.firebasestorage.app",
  messagingSenderId: "156968871583",
  appId: "1:156968871583:web:178f2d69bfe971593764aa",
  measurementId: "G-PG9SMWEGF5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signInWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with GitHub", error);
    throw error;
  }
};
