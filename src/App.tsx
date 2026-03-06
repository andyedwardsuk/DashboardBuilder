import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider } from '@/context/DataContext'
import SetupPage from '@/pages/SetupPage'
import DashboardPage from '@/pages/DashboardPage'

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/setup" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}

export default App
