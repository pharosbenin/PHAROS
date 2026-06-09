import { Component } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './router/AppRouter'
import './App.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }
  static getDerivedStateFromError(error) {
    return { crashed: true, erreurMsg: error?.message || String(error) }
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Une erreur est survenue</h2>
            <p className="text-sm text-gray-500 mb-3">La page a rencontré un problème inattendu.</p>
            {this.state.erreurMsg && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-4 text-left font-mono break-all">{this.state.erreurMsg}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  )
}
