import './App.css'
import AdminDashboard from './AdminDashboard'
import RasHeader from './RasHeader'
//We grab useState from react to access state, allowing tracking of values.
import { useState } from 'react'
//We clump the set of five boolean safety values into a list.
//The list can be modified in future.
const checklistItems = [
  { key: 'ppeWorn', label: 'PPE worn' },
  { key: 'fallProtection', label: 'Fall protection in place' },
  { key: 'laddersScaffolding', label: 'Ladders/scaffolding inspected' },
  { key: 'toolsAndCords', label: 'Tools and cords in good condition' },
  { key: 'hazardsIdentified', label: 'Hazards identified' },
] as const //we assert const to keep types clean and orderly, and prevent type assertion from throwing errors.

//we get the current date from the user. We know that Javascript zero indexes months, so we add 1 to the month value.
function getLocalDate() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}


function App() {
  const [site, setSite] = useState('')
  //We add a toggle to show passwords because not doing so was wearisome.
  //I don't have the grooves of muscle memory for AdminDemo2026!
  //I also want to note, and this is extremely important, that I would handle passwords and secrets with far more responsibility in production.
  //I would not store them in plaintext, and I would not hardcode them into the source code.
  //Clearly.
  const [showPassword, setShowPassword] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [checklist, setChecklist] = useState({
  ppeWorn: false,
  fallProtection: false,
  laddersScaffolding: false,
  toolsAndCords: false,
  hazardsIdentified: false,
})
const [date, setDate] = useState(getLocalDate())
const [notes, setNotes] = useState('')
const [photos, setPhotos] = useState<File[]>([])
const [email, setEmail] = useState('framer@example.com')
const [password, setPassword] = useState('')
const [token, setToken] = useState<string | null>(null)
const [role, setRole] = useState('')
const [loginError, setLoginError] = useState('')

async function handleLogin(
  event: React.SubmitEvent<HTMLFormElement>
) { 
  event.preventDefault()
  setSubmitMessage('')
  setLoginError('')

  try {
    const response = await fetch('http://localhost:5118/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Invalid email or password')
    }

    const data = await response.json()

    setToken(data.token)
    setRole(data.role)
  } catch (error) {
    setLoginError(
      error instanceof Error ? error.message : 'Login failed'
    )
  }
}
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()

  const submission = {
    site,
    date,
    checklist,
    notes,
    photos,
  }
try{
  const response = await fetch('http://localhost:5118/api/submissions', {
  method: 'POST',
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
},
  body: JSON.stringify({
    site: submission.site,
    date: submission.date,
    checklist: submission.checklist,
    notes: submission.notes,
  }),
})

const data = await response.json()
if (!response.ok) {
  throw new Error('Failed to create submission');
}

for (const photo of photos) {
  const formData = new FormData();
  formData.append('file', photo);

const photoResponse = await fetch(
  `http://localhost:5118/api/submissions/${data.id}/photos`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  }
);

  if (!photoResponse.ok) {
    throw new Error(`Failed to upload ${photo.name}`);
  }
}

console.log('Server response:', data)
  setSubmitMessage('Safety report submitted successfully.')
} catch (error) {
  setSubmitMessage(
    error instanceof Error ? error.message : 'Submission failed.'
  )
}
}
if (!token) {
  return (
    <>
      <RasHeader />
      <main>
        <h1>RAS Safety Reports</h1>
      <h2>Sign in</h2>

      <form onSubmit={handleLogin}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
  type={showPassword ? 'text' : 'password'}
  value={password}
  onChange={(event) => setPassword(event.target.value)}
  required
/>
        </label>
<label>
  <input
    type="checkbox"
    checked={showPassword}
    onChange={(event) => setShowPassword(event.target.checked)}
  />
  Show password
</label>
        {loginError && <p role="alert">{loginError}</p>}

        <button type="submit">Sign in</button>
      </form>
    </main>
   </> 
  )
  
}
if (role === 'Admin') {
  return <AdminDashboard token={token} />
}
  return (
    <>
    <RasHeader />
    
    <main>
  <h1>RAS Safety</h1>
  <p>Daily Safety Submission</p>

  <form onSubmit={handleSubmit}>
    <label htmlFor="site">Site</label>

    <select
      id="site"
      value={site}
      onChange={(event) => setSite(event.target.value)}
      required
    >
      <option value="">Select a site</option>
      <option value="site-a">Site A</option>
      <option value="site-b">Site B</option>
      <option value="site-c">Site C</option>
      
    </select>
    <label htmlFor="date">Date</label>

<input
  id="date"
  type="date"
  value={date}
  onChange={(event) => setDate(event.target.value)}
/>
{checklistItems.map((item) => (
  <label key={item.key}>
    <input
      type="checkbox"
      checked={checklist[item.key]}
      onChange={(event) =>
        setChecklist({
          ...checklist,
          [item.key]: event.target.checked,
        })
      }
    />
    {item.label}
  </label>
  
))}
<label htmlFor="notes">Notes</label>

<textarea
  id="notes"
  value={notes}
  onChange={(event) => setNotes(event.target.value)}
  placeholder="Additional safety notes"
/>
<label htmlFor="photos">Photos</label>

<input
  id="photos"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  multiple
  required
  onChange={(event) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    setPhotos(selectedFiles)
  }}
/>
<p>{photos.length} photo(s) selected</p>
<ul>
  {photos.map((photo) => (
    <li key={photo.name}>
      {photo.name}
    </li>
  ))}
</ul>
<button type="submit">Submit Safety Form</button>
  </form>
{submitMessage && (
  <p role="status">{submitMessage}</p>
)}

    </main>
    </>
  )
}
//These are diagnostics to track form state. They'll be commented out in production.
export default App