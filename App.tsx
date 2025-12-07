import React from 'react';
import ChessGame from './components/ChessGame';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-2xl">♟️</span>
                <span className="font-bold text-white tracking-wider">GEMINI CHESS</span>
            </div>
            <a 
              href="https://ai.google.dev/" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-slate-500 hover:text-blue-400 transition"
            >
              Powered by Google Gemini
            </a>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center py-8">
        <ChessGame />
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 p-6 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Chess Master. Built with React & Gemini API.</p>
      </footer>
    </div>
  );
}

export default App;
