import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export async function setupSuperUser() {
  const email = 'goes95@gmail.com';
  const password = '654321';

  try {
    // Try to create new user
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document
      await setDoc(doc(db, 'Users', userCredential.user.uid), {
        email,
        role: 'superuser',
        status: 'active',
        createdAt: new Date().toISOString()
      });

      console.log('Super user created successfully');
    } catch (error) {
      // If user exists, try to update password
      if (error.code === 'auth/email-already-exists' || error.code === 'auth/email-already-in-use') {
        // Sign in with existing credentials (need old password)
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          await updatePassword(userCredential.user, password);
          console.log('Super user password updated successfully');
        } catch (updateError) {
          console.error('Error updating super user password:', updateError);
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error setting up super user:', error);
  }
}

// Can be called from browser console: 
// import('./utils/setup-super-user.js').then(module => module.setupSuperUser())
