import { matchRoute, useRoute } from './hooks/useRoute.js'
import { TripsProvider } from './hooks/useTrips.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { useTheme } from './hooks/useTheme.js'
import Home from './pages/Home.jsx'
import CreateTrip from './pages/CreateTrip.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ExpenseForm from './pages/ExpenseForm.jsx'
import ExpenseDetail from './pages/ExpenseDetail.jsx'
import Settlement from './pages/Settlement.jsx'
import Settings from './pages/Settings.jsx'

function Router() {
  const path = useRoute()
  let p
  if (path === '/') return <Home />
  if (path === '/new') return <CreateTrip />
  if (path === '/settings') return <Settings />
  if ((p = matchRoute('/trip/:id', path))) return <Dashboard key={p.id} tripId={p.id} />
  if ((p = matchRoute('/trip/:id/add', path))) return <ExpenseForm key={`add-${p.id}`} tripId={p.id} />
  if ((p = matchRoute('/trip/:id/settlement', path))) return <Settlement tripId={p.id} />
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
