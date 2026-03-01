'use client';

import { useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyDcb87FH4tX_2AHMo2aOQjp1jxSvexfsTo",
    authDomain: "ameanimale-4b20a.firebaseapp.com",
    projectId: "ameanimale-4b20a",
    storageBucket: "ameanimale-4b20a.firebasestorage.app",
    messagingSenderId: "375239851204",
    appId: "1:375239851204:web:bd0b6ac1f8d106d03e1d91",
    measurementId: "G-CSRCTBC4LB"
};

export default function FirebaseAnalytics() {
    useEffect(() => {
          const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
          isSupported().then((supported) => {
                  if (supported) {
                            getAnalytics(app);
                  }
          });
    }, []);

  return null;
}
