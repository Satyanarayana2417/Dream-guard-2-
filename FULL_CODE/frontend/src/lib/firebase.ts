import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCZLrs5pxMY836TAGlT04kFKCwMadQpKdM",
  authDomain: "dream-guard-2.firebaseapp.com",
  projectId: "dream-guard-2",
  storageBucket: "dream-guard-2.firebasestorage.app",
  messagingSenderId: "23862923760",
  appId: "1:23862923760:web:7dc7817925ea71518c8d35",
  measurementId: "G-SJPF9MHPV3",
};

export const CLOUDINARY_CONFIG = {
  cloudName: "v5openeu",
  uploadPreset: "dream guard 2",
  apiUrl: "https://api.cloudinary.com/v1_1/v5openeu/image/upload",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export type FirebaseUserData = {
  uid: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
};

export type CloudinaryImageData = {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  imageUrl: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  format: string;
  width?: number | null;
  height?: number | null;
  createdAt: string;
};

/**
 * Register a new user with Firebase Authentication and record their profile
 * in the Firestore "users" collection with a unique User ID.
 */
export async function signupWithFirebase(
  username: string,
  email: string,
  pass: string,
  role: string = "admin"
): Promise<FirebaseUserData> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = cred.user;

  try {
    await updateProfile(fbUser, { displayName: username.trim() });
  } catch (err) {
    console.warn("Could not set displayName on Firebase user:", err);
  }

  const userData: FirebaseUserData = {
    uid: fbUser.uid,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    role: role || "admin",
    createdAt: new Date().toISOString(),
  };

  // Store user record in Firebase "users" collection keyed by the unique User ID (uid)
  await setDoc(doc(db, "users", fbUser.uid), userData);
  return userData;
}

/**
 * Authenticate existing user with Firebase Authentication and fetch their
 * stored profile from the Firestore "users" collection.
 */
export async function loginWithFirebase(
  email: string,
  pass: string
): Promise<FirebaseUserData> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const fbUser = cred.user;

  // Fetch user data belonging to this authenticated user from Firestore
  const userDocRef = doc(db, "users", fbUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as FirebaseUserData;
  }

  // Fallback: If registered via another Firebase provider or doc was missing, seed it
  const fallbackData: FirebaseUserData = {
    uid: fbUser.uid,
    username: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
    email: fbUser.email || email.trim(),
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  await setDoc(userDocRef, fallbackData);
  return fallbackData;
}

/**
 * Fetch profile data for a specific user from Firestore.
 */
export async function fetchUserData(uid: string): Promise<FirebaseUserData | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return snap.data() as FirebaseUserData;
    }
  } catch (e) {
    console.warn("Error fetching user data from Firebase:", e);
  }
  return null;
}

/**
 * Upload an image file directly to Cloudinary using unsigned preset 'dream guard 2',
 * then persist the resulting image URL and metadata into Firebase Firestore.
 */
export async function uploadImageToCloudinary(
  file: File,
  user: { uid: string; email?: string; username: string }
): Promise<CloudinaryImageData> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  const res = await fetch(CLOUDINARY_CONFIG.apiUrl, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const secureUrl = data.secure_url || data.url;

  const imageId = `${user.uid}_${Date.now()}`;
  const imageRecord: CloudinaryImageData = {
    id: imageId,
    uid: user.uid,
    userName: user.username,
    userEmail: user.email || "",
    imageUrl: secureUrl,
    publicId: data.public_id || imageId,
    fileName: file.name,
    fileSize: file.size,
    format: data.format || file.type.split("/")[1] || "png",
    width: data.width || null,
    height: data.height || null,
    createdAt: new Date().toISOString(),
  };

  // Store the Cloudinary image URL and metadata in Firebase under user_images
  await setDoc(doc(db, "user_images", imageId), imageRecord);
  return imageRecord;
}

/**
 * Fetch and display all image data belonging ONLY to the logged-in user from Firebase.
 */
export async function fetchUserImages(uid: string): Promise<CloudinaryImageData[]> {
  try {
    const q = query(collection(db, "user_images"), where("uid", "==", uid));
    const snap = await getDocs(q);
    const images: CloudinaryImageData[] = [];
    snap.forEach((d) => {
      images.push(d.data() as CloudinaryImageData);
    });
    // Sort newest first
    return images.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (e) {
    console.error("Error fetching user images from Firebase:", e);
    return [];
  }
}

/**
 * Remove an image record from Firebase.
 */
export async function deleteUserImage(imageId: string): Promise<void> {
  await deleteDoc(doc(db, "user_images", imageId));
}
