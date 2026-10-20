import { useEffect, useState } from 'react'
import { matchRoute, navigate, useRoute } from './hooks/useRoute.js'
import { TripsProvider, useTrips } from './hooks/useTrips.jsx'
import { loadOnboarded, saveOnboarded } from './lib/storage.js'
import { ToastProvider } from './components/Toast.jsx'
import { useTheme } from './hooks/useTheme.js'
import Home from './pages/Home.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Activity from './pages/Activity.jsx'
import Insights from './pages/Insights.jsx'
import Trips from './pages/Trips.jsx'
import CreateTrip from './pages/CreateTrip.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ExpenseForm from './pages/ExpenseForm.jsx'
import ExpenseDetail from './pages/ExpenseDetail.jsx'
import Members from './pages/Members.jsx'
import Settlement from './pages/Settlement.jsx'
import Settings from './pages/Settings.jsx'

function Router() {
  const path = useRoute()
  const { trips } = useTrips()
  const [introDone, setIntroDone] = useState(loadOnboarded)
  let p

  // People who already have trips are not first-time users: never show them the intro on its own.
  useEffect(() => {
    if (!introDone && trips.length > 0) {
      saveOnboarded()
      setIntroDone(true)
    }
  }, [introDone, trips.length])

  const finishIntro = () => {
    saveOnboarded()
    setIntroDone(true)
    navigate('/', { replace: true })
  }
  if (path === '/welcome' || (!introDone && trips.length === 0)) return <Onboarding onDone={finishIntro} />
  if (path === '/') return <Home />
  if (path === '/trips') return <Trips />
  if (path === '/activity') return <Activity />
  if (path === '/insights') return <Insights />
  if (path === '/new') return <CreateTrip />
  if (path === '/settings') return <Settings />
  if ((p = matchRoute('/trip/:id', path))) return <Dashboard key={p.id} tripId={p.id} />
  if ((p = matchRoute('/trip/:id/add', path))) return <ExpenseForm key={`add-${p.id}`} tripId={p.id} />
  if ((p = matchRoute('/trip/:id/settlement', path))) return <Settlement key={p.id} tripId={p.id} />
  if ((p = matchRoute('/trip/:id/status', path))) return <Settlement key={p.id} tripId={p.id} />
  if ((p = matchRoute('/trip/:id/members', path))) return <Members key={p.id} tripId={p.id} />
  if ((p = matchRoute('/trip/:id/expense/:eid', path))) return <ExpenseDetail tripId={p.id} expenseId={p.eid} />
  if ((p = matchRoute('/trip/:id/expense/:eid/edit', path)))
    return <ExpenseForm key={`edit-${p.eid}`} tripId={p.id} expenseId={p.eid} />
  return <Home />
}

export default function App() {
  useTheme() // applies the saved theme and keeps it in sync with the system
  return (
    <TripsProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </TripsProvider>
  )
}
