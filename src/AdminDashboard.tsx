import { useEffect, useState } from 'react'
import RasHeader from './RasHeader'

type Photo = {
  id: number
  url: string
}

type Submission = {
  id: number
  workerName: string
  site: string
  date: string
  ppeWorn: boolean
  fallProtection: boolean
  laddersScaffolding: boolean
  toolsAndCords: boolean
  hazardsIdentified: boolean
  notes: string | null
  photos: Photo[]
}

function AuthenticatedPhoto({
  photoId,
  token,
}: {
  photoId: number
  token: string
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    async function loadPhoto() {
      const response = await fetch(
        `http://localhost:5118/api/photos/${photoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) return

      const blob = await response.blob()

      if (!cancelled) {
        objectUrl = URL.createObjectURL(blob)
        setImageUrl(objectUrl)
      }
    }

    loadPhoto().catch(console.error)

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoId, token])

  if (!imageUrl) return <p>Loading photo...</p>

  return (
    <img
      src={imageUrl}
      alt={`Safety report attachment ${photoId}`}
      style={{ maxWidth: '250px', height: 'auto' }}
    />
  )
}

export default function AdminDashboard({ token }: { token: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [siteFilter, setSiteFilter] = useState('')
const [workerFilter, setWorkerFilter] = useState('')
const [startDate, setStartDate] = useState('')
const [endDate, setEndDate] = useState('')


  useEffect(() => {
    async function loadSubmissions() {
      try {
        const response = await fetch(
          'http://localhost:5118/api/submissions',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error('Could not load submissions')
        }

        const data: Submission[] = await response.json()
        setSubmissions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadSubmissions()
  }, [token])

  const filteredSubmissions = submissions.filter((submission) => {
  const matchesSite =
    !siteFilter || submission.site === siteFilter

  const matchesWorker =
    !workerFilter || submission.workerName === workerFilter

  const matchesStartDate =
    !startDate || submission.date >= startDate

  const matchesEndDate =
    !endDate || submission.date <= endDate

  return (
    matchesSite &&
    matchesWorker &&
    matchesStartDate &&
    matchesEndDate
  )
})
  if (loading) return <p>Loading submissions...</p>
  if (error) return <p role="alert">{error}</p>

 return (
  <>
    <RasHeader />
    <main>
      <h1>RAS Safety — Administrator</h1>
      <h2>Safety submissions</h2>
      <section aria-label="Submission filters">
  <label>
    Site
    <select
      value={siteFilter}
      onChange={(event) => setSiteFilter(event.target.value)}
    >
      <option value="">All sites</option>
      {[...new Set(submissions.map((s) => s.site))].map((site) => (
        <option key={site} value={site}>{site}</option>
      ))}
    </select>
  </label>

  <label>
    Worker
    <select
      value={workerFilter}
      onChange={(event) => setWorkerFilter(event.target.value)}
    >
      <option value="">All workers</option>
      {[...new Set(submissions.map((s) => s.workerName))].map((worker) => (
        <option key={worker} value={worker}>{worker}</option>
      ))}
    </select>
  </label>

  <label>
    From
    <input
      type="date"
      value={startDate}
      onChange={(event) => setStartDate(event.target.value)}
    />
  </label>

  <label>
    To
    <input
      type="date"
      value={endDate}
      onChange={(event) => setEndDate(event.target.value)}
    />
  </label>
</section>

      {filteredSubmissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Site</th>
              <th>Date</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((submission) => (
              <tr key={submission.id}>
                <td>{submission.workerName}</td>
                <td>{submission.site}</td>
                <td>{submission.date}</td>
                <td>
                  <details>
                    <summary>View report</summary>

                    <ul>
                      <li>PPE: {submission.ppeWorn ? 'Yes' : 'No'}</li>
                      <li>Fall protection: {submission.fallProtection ? 'Yes' : 'No'}</li>
                      <li>Ladders/scaffolding: {submission.laddersScaffolding ? 'Yes' : 'No'}</li>
                      <li>Tools/cords: {submission.toolsAndCords ? 'Yes' : 'No'}</li>
                      <li>Hazards identified: {submission.hazardsIdentified ? 'Yes' : 'No'}</li>
                    </ul>

                    <p>{submission.notes || 'No additional notes.'}</p>
                    <p>{submission.photos.length} photo(s) attached</p>
                    {submission.photos.map((photo) => (
  <AuthenticatedPhoto
    key={photo.id}
    photoId={photo.id}
    token={token}
  />
))}
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
    </>
  )
}