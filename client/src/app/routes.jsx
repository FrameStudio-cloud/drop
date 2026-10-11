import SendPage from '../features/send/index.jsx'
import ReceivePage from '../features/receive/index.jsx'
import HistoryPage from '../features/history/index.jsx'
import StoragePage from '../features/storage/index.jsx'

const routes = [
  { path: '/', element: <SendPage /> },
  { path: '/receive', element: <ReceivePage /> },
  { path: '/r/:code', element: <ReceivePage /> },
  { path: '/history', element: <HistoryPage /> },
  { path: '/storage', element: <StoragePage /> },
]

export default routes
