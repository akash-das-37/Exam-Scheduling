import axios from 'axios';
import { User } from '../types';
import api from './api';

// Firebase Project & Configuration
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_ExamScheduleCreator_DemoKey",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ExamScheduleCreator",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ExamScheduleCreator.firebaseapp.com",
};

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'faculty' | 'admin';
  phone?: string;
  departmentId?: number;
  rollNumber?: string;
  designation?: string;
}

// Built-in institutional accounts guaranteed to work offline & online everywhere
export const INSTITUTION_ACCOUNTS: Record<string, { pass: string; user: User }> = {
  "admin@jisce.ac.in": {
    pass: "admin123",
    user: {
      id: 1,
      email: "admin@jisce.ac.in",
      full_name: "Dr. Arthur Vance (Dean of Exams, JISCE)",
      role: "admin",
      phone: "+91 33 2582 1309",
      is_active: true,
      created_at: new Date().toISOString()
    }
  },
  "admin@apex.edu": {
    pass: "admin123",
    user: {
      id: 1,
      email: "admin@jisce.ac.in",
      full_name: "Dr. Arthur Vance (Dean of Exams, JISCE)",
      role: "admin",
      phone: "+91 33 2582 1309",
      is_active: true,
      created_at: new Date().toISOString()
    }
  },
  "faculty.cse1@jisce.ac.in": {
    pass: "faculty123",
    user: {
      id: 2,
      email: "faculty.cse1@jisce.ac.in",
      full_name: "Dr. Robert Chen",
      role: "faculty",
      phone: "+91 33 2582 1310",
      faculty_id: 1,
      is_active: true,
      created_at: new Date().toISOString()
    }
  },
  "faculty.cse1@apex.edu": {
    pass: "faculty123",
    user: {
      id: 2,
      email: "faculty.cse1@jisce.ac.in",
      full_name: "Dr. Robert Chen",
      role: "faculty",
      phone: "+91 33 2582 1310",
      faculty_id: 1,
      is_active: true,
      created_at: new Date().toISOString()
    }
  },
  "student.cse1@jisce.ac.in": {
    pass: "student123",
    user: {
      id: 12,
      email: "student.cse1@jisce.ac.in",
      full_name: "Aarav Sharma",
      role: "student",
      phone: "+91 98300 12345",
      student_id: 1,
      is_active: true,
      created_at: new Date().toISOString()
    }
  },
  "student.cse1@apex.edu": {
    pass: "student123",
    user: {
      id: 12,
      email: "student.cse1@jisce.ac.in",
      full_name: "Aarav Sharma",
      role: "student",
      phone: "+91 98300 12345",
      student_id: 1,
      is_active: true,
      created_at: new Date().toISOString()
    }
  }
};

/**
 * Sign In with Firebase or Backend, with instant reliable fallback for demo credentials
 */
export async function authenticateSignIn(email: string, pass: string): Promise<{ token: string; user: User }> {
  const cleanEmail = email.trim().toLowerCase();

  // Compatibility alias for @jisce.ac.in and @apex.edu
  const altEmail = cleanEmail.endsWith('@jisce.ac.in')
    ? cleanEmail.replace('@jisce.ac.in', '@apex.edu')
    : cleanEmail.endsWith('@apex.edu')
    ? cleanEmail.replace('@apex.edu', '@jisce.ac.in')
    : cleanEmail;

  // 1. Check local pre-seeded institutional credentials first for instant, guaranteed login
  const foundAccount = INSTITUTION_ACCOUNTS[cleanEmail] || INSTITUTION_ACCOUNTS[altEmail];
  if (foundAccount && foundAccount.pass === pass) {
    const cred = foundAccount;
    const syntheticToken = `token_demo_${cred.user.role}_${Date.now()}`;
    return { token: syntheticToken, user: cred.user };
  }

  // 2. Check locally registered users (created via Sign Up in this browser session)
  const registeredUsersStr = localStorage.getItem('local_registered_users');
  if (registeredUsersStr) {
    try {
      const registeredMap = JSON.parse(registeredUsersStr);
      if (registeredMap[cleanEmail] && registeredMap[cleanEmail].pass === pass) {
        const u = registeredMap[cleanEmail].user;
        return { token: `token_registered_${u.role}_${Date.now()}`, user: u };
      }
    } catch {}
  }

  // 3. Try Firebase REST API if API Key is configured
  if (FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes('DemoKey')) {
    try {
      const fbUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`;
      const { data } = await axios.post(fbUrl, {
        email: cleanEmail,
        password: pass,
        returnSecureToken: true
      });
      const inferredRole = cleanEmail.includes('admin') ? 'admin' : cleanEmail.includes('faculty') ? 'faculty' : 'student';
      const user: User = {
        id: Math.floor(Math.random() * 8000) + 1000,
        email: data.email,
        full_name: data.displayName || cleanEmail.split('@')[0],
        role: inferredRole,
        is_active: true,
        created_at: new Date().toISOString()
      };
      return { token: data.idToken, user };
    } catch (fbErr: any) {
      const msg = fbErr.response?.data?.error?.message;
      if (msg === 'EMAIL_NOT_FOUND' || msg === 'INVALID_PASSWORD' || msg === 'INVALID_LOGIN_CREDENTIALS') {
        throw new Error('Invalid email or password. Please verify your credentials or Sign Up.');
      }
    }
  }

  // 4. Try Backend API
  try {
    const { data } = await api.post('/auth/login', { email: cleanEmail, password: pass });
    return { token: data.access_token, user: data.user };
  } catch (err: any) {
    const detail = err.response?.data?.detail;
    throw new Error(detail || 'Invalid email or password. If you are new, please Sign Up.');
  }
}

/**
 * Sign Up with Firebase and Backend
 */
export async function authenticateSignUp(data: SignUpData): Promise<{ token: string; user: User }> {
  const cleanEmail = data.email.trim().toLowerCase();

  // Try Firebase REST API if configured
  let firebaseToken: string | null = null;
  if (FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes('DemoKey')) {
    try {
      const fbUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_CONFIG.apiKey}`;
      const fbResp = await axios.post(fbUrl, {
        email: cleanEmail,
        password: data.password,
        returnSecureToken: true
      });
      firebaseToken = fbResp.data.idToken;
    } catch (fbErr: any) {
      const msg = fbErr.response?.data?.error?.message;
      if (msg === 'EMAIL_EXISTS') {
        throw new Error('An account with this email already exists. Please Sign In instead.');
      }
    }
  }

  // Create User Object
  const newUser: User = {
    id: Math.floor(Math.random() * 8000) + 1000,
    email: cleanEmail,
    full_name: data.fullName,
    role: data.role,
    phone: data.phone,
    is_active: true,
    created_at: new Date().toISOString()
  };

  // Cache in browser local storage for instant offline resilience
  try {
    const registeredUsersStr = localStorage.getItem('local_registered_users') || '{}';
    const registeredMap = JSON.parse(registeredUsersStr);
    registeredMap[cleanEmail] = { pass: data.password, user: newUser };
    localStorage.setItem('local_registered_users', JSON.stringify(registeredMap));
  } catch {}

  // Attempt backend register
  try {
    const backendResp = await api.post('/auth/register', {
      email: cleanEmail,
      password: data.password,
      full_name: data.fullName,
      role: data.role,
      phone: data.phone,
      department_id: data.departmentId || 1,
      roll_number: data.rollNumber,
      designation: data.designation
    });
    return { token: backendResp.data.access_token, user: backendResp.data.user };
  } catch (backendErr: any) {
    // If backend is sleeping or serverless cold-start, return the authenticated Firebase/client user
    const token = firebaseToken || `token_user_${newUser.id}_${Date.now()}`;
    return { token, user: newUser };
  }
}
