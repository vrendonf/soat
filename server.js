const http = require('node:http')
const fs = require('node:fs/promises')
const path = require('node:path')

const port = Number(process.env.PORT || 3000)
const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/^\[([^\]]+)\]\([^)]*\)$/, '$1').replace(/\/$/, '')
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY

const missingEnv = ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY'].filter(name => !process.env[name])

const json = (res, status, data) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' })
  res.end(JSON.stringify(data))
}

async function body(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

async function supabaseFetch(endpoint, options = {}, useSecret = false) {
  const key = useSecret ? secretKey : publishableKey
  const headers = { apikey: key, 'content-type': 'application/json', ...(options.headers || {}) }
  return fetch(`${supabaseUrl}${endpoint}`, { ...options, headers })
}

async function responseData(response) {
  const text = await response.text()
  if (!text) return { message: 'Supabase no devolvió contenido.' }
  try { return JSON.parse(text) } catch { return { message: text } }
}

async function currentUser(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const response = await supabaseFetch('/auth/v1/user', { headers: { authorization: `Bearer ${token}` } })
  if (!response.ok) return null
  return { user: await response.json(), token }
}

async function profileFor(userId) {
  const response = await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,is_admin`, { headers: { authorization: `Bearer ${secretKey}` } }, true)
  const rows = response.ok ? await response.json() : []
  return rows[0] || null
}

async function handle(req, res) {
  if (missingEnv.length) return json(res, 500, { message: `Faltan variables de entorno en Vercel: ${missingEnv.join(', ')}` })
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' })
    return res.end()
  }
  const url = new URL(req.url, `http://${req.headers.host}`)
  try {
    if (url.pathname === '/api/auth/signup' && req.method === 'POST') {
      const data = await body(req)
      if (!data.email || !data.password || !data.full_name || !data.birth_date || !data.phone) {
        return json(res, 400, { message: 'Faltan datos de registro.' })
      }
      const response = await supabaseFetch('/auth/v1/admin/users', { method: 'POST', headers: { authorization: `Bearer ${secretKey}` }, body: JSON.stringify({ email: data.email, password: data.password, email_confirm: true, user_metadata: { full_name: data.full_name, birth_date: data.birth_date, phone: data.phone } }) }, true)
      return json(res, response.status, await responseData(response))
    }
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const data = await body(req)
      let email = String(data.identity || '').trim()
      if (!email.includes('@')) {
        const phone = email.replace(/[^0-9+]/g, '')
        const lookup = await supabaseFetch(`/rest/v1/profiles?phone=eq.${encodeURIComponent(phone)}&select=email`, { headers: { authorization: `Bearer ${secretKey}` } }, true)
        const profiles = lookup.ok ? await lookup.json() : []
        email = profiles[0]?.email
      }
      if (!email) return json(res, 401, { message: 'Correo o celular no encontrado.' })
      const response = await supabaseFetch('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password: data.password }) })
      return json(res, response.status, await response.json())
    }
    if (url.pathname === '/api/me' && req.method === 'GET') {
      const session = await currentUser(req)
      if (!session) return json(res, 401, { message: 'Sesión inválida.' })
      return json(res, 200, { user: session.user, profile: await profileFor(session.user.id) })
    }
    if (url.pathname === '/api/simulations' && req.method === 'POST') {
      const session = await currentUser(req)
      if (!session) return json(res, 401, { message: 'Sesión inválida.' })
      const data = await body(req)
      const response = await supabaseFetch('/rest/v1/simulations', { method: 'POST', headers: { authorization: `Bearer ${session.token}`, prefer: 'return=representation' }, body: JSON.stringify({ user_id: session.user.id, accident_type: data.accident_type, input_data: data.input_data, results: data.results }) })
      return json(res, response.status, await response.json())
    }
    if (url.pathname === '/api/admin/simulations' && req.method === 'GET') {
      const session = await currentUser(req)
      if (!session || !(await profileFor(session.user.id))?.is_admin) return json(res, 403, { message: 'Acceso de administrador requerido.' })
      const response = await supabaseFetch('/rest/v1/simulations?select=*&order=created_at.desc', { headers: { authorization: `Bearer ${secretKey}` } }, true)
      return json(res, response.status, await response.json())
    }
    if (url.pathname === '/api/admin/profiles' && req.method === 'GET') {
      const session = await currentUser(req)
      if (!session || !(await profileFor(session.user.id))?.is_admin) return json(res, 403, { message: 'Acceso de administrador requerido.' })
      const response = await supabaseFetch('/rest/v1/profiles?select=id,email,full_name,birth_date,phone,is_admin,created_at&order=created_at.desc', { headers: { authorization: `Bearer ${secretKey}` } }, true)
      return json(res, response.status, await response.json())
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await fs.readFile(path.join(__dirname, 'index.html'))
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      return res.end(html)
    }
    res.writeHead(404)
    res.end('Not found')
  } catch (error) {
    console.error(error)
    json(res, 500, { message: 'Error interno del servidor.', detail: error instanceof Error ? error.message : String(error) })
  }
}

if (require.main === module) {
  http.createServer(handle).listen(port, () => console.log(`MotoProtegida escuchando en http://localhost:${port}`))
}

module.exports = handle
