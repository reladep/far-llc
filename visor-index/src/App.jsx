import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import FirmProfile from './pages/FirmProfile'
import ComparePage from './pages/ComparePage'
import NegotiatePage from './pages/NegotiatePage'
import DirectoryPage from './pages/DirectoryPage'
import PricingPage from './pages/PricingPage'
import DashboardPage from './pages/DashboardPage'
import BlogPage from './pages/BlogPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/firm/:id" element={<FirmProfile />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/negotiate" element={<NegotiatePage />} />
      <Route path="/directory" element={<DirectoryPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/blog" element={<BlogPage />} />
    </Routes>
  )
}
