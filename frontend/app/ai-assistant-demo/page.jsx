'use client'

import React from 'react';
import AILawyerAssistant from '@/components/AILawyerAssistant';
import { useUser } from '@/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AIAssistantDemo = () => {
  const { user, isAuth } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect if user is not Provider or Admin
    if (isAuth && user && user.Role !== 'PROVIDER' && user.Role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, isAuth, router]);

  // Show loading or redirect if user doesn't have access
  if (!isAuth || !user || (user.Role !== 'PROVIDER' && user.Role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the AI Legal Assistant.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Legal Assistant Demo
          </h1>
          <p className="text-xl text-gray-600">
            Test the AI-powered case creation assistant
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">🎤 Voice Input</h3>
              <p className="text-gray-600">
                Click the microphone button and speak naturally. The AI will transcribe your speech and understand your intent.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">🤖 AI Processing</h3>
              <p className="text-gray-600">
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">📝 Auto-Form Filling</h3>
              <p className="text-gray-600">
                Once all information is gathered, the AI automatically opens the case creation form with all details pre-filled.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">✅ Review & Submit</h3>
              <p className="text-gray-600">
                Review the pre-filled form, make any adjustments, and submit to create your case.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Try These Commands
          </h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Voice Command
              </span>
              <span className="text-gray-700">"Create a case"</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Voice Command
              </span>
              <span className="text-gray-700">"I need to create a new case"</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Voice Command
              </span>
              <span className="text-gray-700">"Start a new legal case"</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Features
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Natural language understanding</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Voice-to-text and text-to-speech</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Intelligent question flow</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Automatic form pre-filling</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>Integration with existing case creation system</span>
            </li>
          </ul>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500">
            Look for the green document icon in the bottom-left corner to access the AI Legal Assistant
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantDemo;

