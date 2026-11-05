import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const SECTIONS = {
  exhibits: { label: 'Бүтээл', table: 'exhibits', owner: 'creator_id', filter: 'category', img: 'image_url', title: 'title', gallery: true, order: 'year_created', sub: r => [r.category, r.year_created].filter(Boolean).join(' · '),
    detail: r => (
      <>
        {r.description && <section className="sect"><h4>Тайлбар</h4><p className="full">{r.description}</p></section>}
        {r.technology_stack && <section className="sect"><h4>Технологи</h4><ul className="chips">{r.technology_stack.split(',').map(t => t.trim()).filter(Boolean).map(t => <li key={t}>{t}</li>)}</ul></section>}
        {(r.demo_url || r.github_url) && <section className="sect"><h4>Холбоос</h4><div className="linkbtns">{r.demo_url && <a className="linkbtn" href={r.demo_url} target="_blank" rel="noreferrer">Demo ↗</a>}{r.github_url && <a className="linkbtn" href={r.github_url} target="_blank" rel="noreferrer">GitHub ↗</a>}</div></section>}
      </>
    ),
    aside: r => (r.creator_name || r.student_code || r.student_course || r.creator_photo_url) ? (
      <div className="creator">
        {r.creator_photo_url ? <img src={r.creator_photo_url} alt={r.creator_name || ''} /> : <span className="avatar">{(r.creator_name || '?').trim()[0]}</span>}
        <div>
          <small>Бүтээгч оюутан</small>
          {r.creator_name && <strong>{r.creator_name}</strong>}
          {(r.student_code || r.student_course) && <span>{[r.student_code && `Оюутны код: ${r.student_code}`, r.student_course && `${r.student_course}-р курс`].filter(Boolean).join(' · ')}</span>}
        </div>
      </div>
    ) : null,
    fields: [['title', 'Нэр', 'text'], ['description', 'Тайлбар', 'area'], ['image_urls', 'Зураг (5 хүртэл, эхнийх нь нүүр зураг)', 'images'], ['category', 'Ангилал', 'text'], ['technology_stack', 'Технологи', 'text'], ['year_created', 'Он', 'number'], ['demo_url', 'Demo холбоос', 'text'], ['github_url', 'GitHub холбоос', 'text'], ['creator_name', 'Бүтээгч оюутны нэр', 'text'], ['student_code', 'Оюутны код', 'text'], ['student_course', 'Курс', 'number'], ['creator_photo_url', 'Бүтээгч оюутны зураг', 'image']] },
  teachers: { label: 'Багш нар', table: 'teachers', img: 'photo_url', title: 'name', portrait: true, asc: true, sub: () => '',
    extra: r => (<>
      {r.position && <p className="meta">{r.position}</p>}
      {r.email && <p className="meta mail">Имэйл: <a href={`mailto:${r.email}`}>{r.email}</a></p>}
      {r.room && <p className="meta">Өрөө: {r.room}</p>}
    </>),
    detail: r => (
      <dl className="kv-list">
        {r.position && <div className="kv"><dt>Албан тушаал</dt><dd>{r.position}</dd></div>}
        {r.degree && <div className="kv"><dt>Цол, зэрэг</dt><dd>{r.degree}</dd></div>}
        {r.email && <div className="kv"><dt>Имэйл</dt><dd><a href={`mailto:${r.email}`}>{r.email}</a></dd></div>}
        {r.room && <div className="kv"><dt>Өрөөний дугаар</dt><dd>{r.room}</dd></div>}
        {r.courses && <div className="kv"><dt>Заадаг хичээлүүд</dt><dd><ul className="chips">{r.courses.split('\n').map(c => c.trim()).filter(Boolean).map(c => <li key={c}>{c}</li>)}</ul></dd></div>}
      </dl>
    ),
    fields: [['name', 'Нэр', 'text'], ['position', 'Албан тушаал', 'text'], ['degree', 'Цол, зэрэг', 'text'], ['courses', 'Заадаг хичээлүүд (мөр бүрт нэг хичээл бич)', 'area'], ['email', 'Имэйл', 'email'], ['room', 'Өрөөний дугаар', 'text'], ['photo_url', 'Зураг', 'image']] },
  events: { label: 'Арга хэмжээ', table: 'events', img: 'cover_image_url', title: 'event_date', layout: 'list', gallery: true, sub: () => '', body: 'summary', order: 'event_date',
    titleFmt: r => (r.event_date ? r.event_date.replaceAll('-', '.') : ''),
    detail: r => <section className="sect"><p className="full">{r.description || r.summary}</p></section>,
    fields: [['event_date', 'Огноо', 'date'], ['summary', 'Товч агуулга (нүүр хэсэгт харагдана, 1-2 өгүүлбэр)', 'area'], ['description', 'Дэлгэрэнгүй тайлбар ("Дэлгэрэнгүй" дарахад харагдана)', 'area'], ['image_urls', 'Зураг (5 хүртэл, эхнийх нь нүүр зураг)', 'images']] },
  history: { label: 'Түүх', table: 'history', img: 'image_url', title: 'title', sub: r => r.year, body: 'description', order: 'year', asc: true,
    fields: [['year', 'Он', 'number'], ['title', 'Үйл явдал', 'text'], ['description', 'Тайлбар', 'area'], ['image_url', 'Зураг', 'image']] },
}

async function upload(file, uid) {
  const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`
  const { error } = await supabase.storage.from('images').upload(path, file)
  if (error) throw error
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl
}

function Gallery({ urls, alt }) {
  const [i, setI] = useState(0), [zoom, setZoom] = useState(false), n = urls.length
  useEffect(() => {
    const k = e => { if (n > 1 && e.key === 'ArrowLeft') setI(x => (x + n - 1) % n); if (n > 1 && e.key === 'ArrowRight') setI(x => (x + 1) % n) }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [n])
  return (
    <div className="gal">
      <div className="gal-main">
        <img src={urls[i]} alt={alt || ''} title="Томруулж харах" onClick={() => setZoom(true)} />
        {n > 1 && <>
          <button type="button" className="nav prev" aria-label="Өмнөх" onClick={() => setI((i + n - 1) % n)}>‹</button>
          <button type="button" className="nav next" aria-label="Дараах" onClick={() => setI((i + 1) % n)}>›</button>
          <span className="count">{i + 1} / {n}</span>
        </>}
      </div>
      {n > 1 && <div className="gal-thumbs">{urls.map((u, j) => <button type="button" key={u + j} className={'th' + (j === i ? ' on' : '')} onClick={() => setI(j)}><img src={u} alt="" /></button>)}</div>}
      {zoom && <div className="lightbox" onClick={() => setZoom(false)}><img src={urls[i]} alt={alt || ''} /></div>}
    </div>
  )
}

function Form({ cfg, row, user, onDone }) {
  const [v, setV] = useState(() => { const o = { ...(row || {}) }; for (const [k, , t] of cfg.fields) if (t === 'images') o[k] = row?.image_urls?.length ? row.image_urls : row?.[cfg.img] ? [row[cfg.img]] : []; return o }), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [opts, setOpts] = useState([])
  useEffect(() => { if (cfg.ref) supabase.from('events').select('id,event_date,summary').order('event_date', { ascending: false }).then(r => setOpts(r.data || [])) }, [])
  const save = async e => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const p = {}
      for (const [k, , t] of cfg.fields) {
        if (t === 'images') { const urls = []; for (const it of v[k] || []) urls.push(typeof it === 'string' ? it : await upload(it, user.id)); p[k] = urls; p[cfg.img] = urls[0] || null }
        else p[k] = t === 'image' && v[k] instanceof File ? await upload(v[k], user.id) : (v[k] === '' ? null : v[k])
      }
      const q = supabase.from(cfg.table)
      const { error } = row?.id ? await q.update(p).eq('id', row.id) : await q.insert(cfg.owner ? { ...p, [cfg.owner]: user.id } : p)
      if (error) throw error
      onDone()
    } catch (x) { setErr(x.message); setBusy(false) }
  }
  return (
    <form className="form" onSubmit={save}>
      <h3>{row ? 'Засах' : 'Шинээр нэмэх'}</h3>
      {cfg.fields.map(([k, l, t]) => t === 'images' ? (
        <div key={k} className="imgfield">
          <span>{l}</span>
          <div className="thumbs">{(v[k] || []).map((it, i) => (
            <div className="thumb" key={i}>
              <img src={typeof it === 'string' ? it : URL.createObjectURL(it)} alt="" />
              <button type="button" className="x" aria-label="Устгах" onClick={() => setV({ ...v, [k]: v[k].filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}</div>
          {(v[k] || []).length < 5 && <input type="file" accept="image/*" multiple onChange={e => { const add = [...e.target.files]; setV({ ...v, [k]: [...(v[k] || []), ...add].slice(0, 5) }); e.target.value = '' }} />}
          <small>{(v[k] || []).length}/5</small>
        </div>
      ) : (
        <label key={k}>{l}
          {t === 'area' ? <textarea rows="4" value={v[k] || ''} onChange={e => setV({ ...v, [k]: e.target.value })} />
            : t === 'image' ? <input type="file" accept="image/*" onChange={e => setV({ ...v, [k]: e.target.files[0] })} />
            : t === 'ref' ? <select required value={v[k] || ''} onChange={e => setV({ ...v, [k]: e.target.value })}><option value="">Сонгох</option>{opts.map(o => <option key={o.id} value={o.id}>{[o.event_date, (o.summary || '').slice(0, 40)].filter(Boolean).join(' · ')}</option>)}</select>
            : <input type={t} required={['title', 'name', 'year', 'event_date'].includes(k)} value={v[k] ?? ''} onChange={e => setV({ ...v, [k]: e.target.value })} />}
        </label>
      ))}
      {err && <p className="err">{err}</p>}
      <div className="row"><button disabled={busy}>{busy ? 'Хадгалж байна...' : 'Хадгалах'}</button><button type="button" className="ghost" onClick={() => onDone(true)}>Болих</button></div>
    </form>
  )
}

function DetailModal({ cfg, detail, onClose }) {
  const gal = d => (d.image_urls?.length ? d.image_urls : d[cfg.img] ? [d[cfg.img]] : []).slice(0, 5)
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  return (
    <div className="modal" onClick={onClose}>
      <div className={'modal-box' + (cfg.gallery ? ' gallery' + (gal(detail).length || (cfg.aside && cfg.aside(detail)) ? '' : ' noimg') : detail[cfg.img] ? '' : ' noimg')} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <button className="close" aria-label="Хаах" onClick={onClose}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19" /></svg></button>
        {cfg.gallery ? ((gal(detail).length > 0 || (cfg.aside && cfg.aside(detail))) && <div className="side">{cfg.aside && cfg.aside(detail)}{gal(detail).length > 0 && <Gallery key={detail.id} urls={gal(detail)} alt={detail[cfg.title]} />}</div>) : (detail[cfg.img] && <img src={detail[cfg.img]} alt={detail[cfg.title] || ''} />)}
        <div className="txt">
          <div className="txt-head">
            {cfg.gallery && <span className="kicker">{cfg.label}</span>}
            <h3 className={cfg.table === 'events' ? 'plain' : undefined}>{cfg.titleFmt ? cfg.titleFmt(detail) : detail[cfg.title]}</h3>
            {cfg.gallery && cfg.sub(detail) && <div className="chips-row">{cfg.sub(detail).split(' · ').filter(Boolean).map(x => <span key={x}>{x}</span>)}</div>}
          </div>
          <div className="txt-body">{cfg.detail(detail)}</div>
        </div>
      </div>
    </div>
  )
}

function Section({ cfg, user, admin }) {
  const [rows, setRows] = useState([]), [q, setQ] = useState(''), [cat, setCat] = useState(''), [edit, setEdit] = useState(null), [err, setErr] = useState(''), [detail, setDetail] = useState(null)
  const load = async () => {
    const { data, error } = await supabase.from(cfg.table).select('*').order(cfg.order || 'id', { ascending: !!cfg.asc, nullsFirst: false }).order('id', { ascending: !!cfg.asc })
    error ? setErr(error.message) : setRows(data)
  }
  useEffect(() => { setEdit(null); setDetail(null); setQ(''); setCat(''); load() }, [cfg.table])
  useEffect(() => { const k = e => e.key === 'Escape' && setDetail(null); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  const can = r => admin || (cfg.owner && user && r[cfg.owner] === user.id)
  const canAdd = cfg.owner ? !!user : admin
  const cats = cfg.filter ? [...new Set(rows.map(r => r[cfg.filter]).filter(Boolean))] : []
  const shown = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()) && (!cat || r[cfg.filter] === cat))
  const del = async r => { if (confirm('Устгах уу?')) { const { error } = await supabase.from(cfg.table).delete().eq('id', r.id); error ? setErr(error.message) : load() } }
  if (edit) return <Form cfg={cfg} row={edit === true ? null : edit} user={user} onDone={c => { setEdit(null); c || load() }} />
  return (
    <section>
      <div className="bar">
        <input placeholder="Хайх " value={q} onChange={e => setQ(e.target.value)} />
        {cats.length > 0 && <select value={cat} onChange={e => setCat(e.target.value)}><option value="">Бүх ангилал</option>{cats.map(c => <option key={c}>{c}</option>)}</select>}
        {canAdd && <button onClick={() => setEdit(true)}>+ Нэмэх</button>}
      </div>
      {err && <p className="err">{err}</p>}
      {!shown.length && <p className="empty">{rows.length ? 'Илэрц олдсонгүй. Өөр үгээр хайгаарай.' : canAdd ? 'Одоогоор мэдээлэл алга. "Нэмэх" товчоор эхний мэдээллээ оруулна уу.' : 'Одоогоор мэдээлэл оруулаагүй байна.'}</p>}
      <div className={cfg.table === 'history' ? 'timeline' : cfg.layout === 'list' ? 'list' : cfg.portrait ? 'grid portrait' : 'grid'}>
        {shown.map(r => (
          <article key={r.id} className={cfg.detail ? 'clickable' : undefined} tabIndex={cfg.detail ? 0 : undefined} onClick={e => cfg.detail && !e.target.closest('a,button') && setDetail(r)} onKeyDown={e => cfg.detail && e.key === 'Enter' && e.target === e.currentTarget && setDetail(r)}>
            {r[cfg.img] && <img src={r[cfg.img]} alt={r[cfg.title] || ''} loading="lazy" />}
            <div className="txt">
              {cfg.sub(r) && <small>{cfg.sub(r)}</small>}
              <h3>{cfg.titleFmt ? cfg.titleFmt(r) : r[cfg.title]}</h3>
              
              {cfg.body && <p>{r[cfg.body]}</p>}
              {cfg.extra && cfg.extra(r)}
              {can(r) && <div className="row"><button className="ghost" onClick={() => setEdit(r)}>Засах</button><button className="ghost danger" onClick={() => del(r)}>Устгах</button></div>}
            </div>
          </article>
        ))}
      </div>
      {detail && <DetailModal cfg={cfg} detail={detail} onClose={() => setDetail(null)} />}
    </section>
  )
}

function Auth() {
  const [mode, setMode] = useState('in'), [email, setEmail] = useState(''), [pw, setPw] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const go = async e => {
    e.preventDefault(); setMsg(''); setBusy(true)
    const { error, data } = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password: pw }) : await supabase.auth.signUp({ email, password: pw })
    setBusy(false)
    if (error) setMsg(/invalid login/i.test(error.message) ? 'Имэйл эсвэл нууц үг буруу байна.' : /already registered/i.test(error.message) ? 'Энэ имэйл бүртгэлтэй байна. Нэвтэрнэ үү.' : error.message)
    else if (mode === 'up' && !data.session) setMsg('Бүртгэл амжилттай үүслээ. Имэйлээ баталгаажуулаад нэвтэрнэ үү.')
  }
  const up = mode === 'up'
  return (
    <form className="form" onSubmit={go}>
      <div>
        <h2>{up ? 'Бүтээгчээр бүртгүүлэх' : 'Бүтээгчээр нэвтрэх'}</h2>
        {up && <p className="hint">Бүртгүүлсний дараа өөрийн бүтээлээ нэмж, засах боломжтой.</p>}
      </div>
      <label>Имэйл<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Нууц үг<input type="password" required minLength="6" autoComplete={up ? 'new-password' : 'current-password'} value={pw} onChange={e => setPw(e.target.value)} /></label>
      {msg && <p className="err" role="alert">{msg}</p>}
      <button disabled={busy}>{busy ? 'Түр хүлээнэ үү...' : up ? 'Бүртгүүлэх' : 'Нэвтрэх'}</button>
      <p className="switch">{up ? 'Бүртгэлтэй юу? ' : 'Бүртгэлгүй юу? '}<button type="button" className="link" onClick={() => { setMode(up ? 'in' : 'up'); setMsg('') }}>{up ? 'Нэвтрэх' : 'Шинээр бүртгүүлэх'}</button></p>
    </form>
  )
}

const num = v => (v === null || v === undefined || v === '' ? null : Number(v))
const yearOf = d => (d ? Number(String(d).slice(0, 4)) : null)
const LockIcon = ({ open }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d={open ? 'M8 11V8a4 4 0 017.5-2' : 'M8 11V8a4 4 0 018 0v3'} />
  </svg>
)

function TmCard({ img, kicker, title, text, plain, full, onOpen }) {
  return (
    <div className={'tm-card' + (onOpen ? ' clickable' : '')} {...(onOpen ? { role: 'button', tabIndex: 0, onClick: onOpen, onKeyDown: e => e.key === 'Enter' && onOpen() } : {})}>
      {img && <img src={img} alt="" loading="lazy" />}
      <div>
        <small>{kicker}</small>
        <h3 className={plain ? 'plain' : undefined}>{title}</h3>
        {text && <p className={full ? 'full-text' : undefined}>{text}</p>}
      </div>
    </div>
  )
}

function Capsule({ c, today, user, admin, onChange, onError }) {
  const open = c.message !== null && c.message !== undefined
  const days = Math.max(0, Math.ceil((new Date(c.open_date + 'T00:00:00') - new Date()) / 864e5))
  const mine = !!user && c.author_id === user.id
  const run = async q => { const { error } = await q; error ? onError(error.message) : onChange() }
  const date = String(c.open_date).replaceAll('-', '.')
  return (
    <div className={'capsule' + (open ? ' open' : '')}>
      <span className="lock"><LockIcon open={open} /></span>
      <div className="cap-main">
        <h3>{c.title}</h3>
        <p className="cap-meta">{c.author_name || 'Нэргүй'} · {open ? `${new Date(c.created_at).getFullYear()} онд үлдээсэн` : `${date}-нд нээгдэнэ`}{mine ? ' · Таны үлдээсэн' : ''}</p>
      </div>
      <div className="cap-side">
        <span className={'badge ' + (open ? 'open' : 'locked')}>{open ? 'Нээгдсэн' : 'Түгжээтэй'}</span>
        {!open && <span className="count">{days} хоног үлдсэн</span>}
      </div>
      {open && (
        <div className="cap-body">
          <p className="msg">{c.message}</p>
          {c.image_url && <img src={c.image_url} alt="" loading="lazy" />}
        </div>
      )}
      {(admin || mine) && (
        <div className="cap-actions">
          {admin && !open && <button onClick={() => run(supabase.from('time_capsules').update({ opened: true }).eq('id', c.id))}>Одоо нээх</button>}
          {admin && c.opened && c.open_date > today && <button className="ghost" onClick={() => run(supabase.from('time_capsules').update({ opened: false }).eq('id', c.id))}>Дахин түгжих</button>}
          <button className="ghost danger" onClick={() => confirm('Устгах уу?') && run(supabase.from('time_capsules').delete().eq('id', c.id))}>Устгах</button>
        </div>
      )}
    </div>
  )
}

function CapsuleForm({ user, onDone }) {
  const [v, setV] = useState({ name: '', title: '', message: '', date: `${new Date().getFullYear() + 1}-01-01`, file: null }), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const tomorrow = new Date(Date.now() + 864e5).toLocaleDateString('sv-SE')
  const save = async e => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const image_url = v.file ? await upload(v.file, user.id) : null
      const { error } = await supabase.from('time_capsules').insert({ author_id: user.id, author_name: v.name, title: v.title, message: v.message, image_url, open_date: v.date, open_year: Number(v.date.slice(0, 4)) })
      if (error) throw error
      onDone()
    } catch (x) { setErr(x.message); setBusy(false) }
  }
  return (
    <form className="form" onSubmit={save}>
      <h3>Шинэ капсул үлдээх</h3>
      <p className="hint">Ирээдүйн оюутнуудад зориулан захидал, дурсамжаа үлдээгээрэй. Капсулыг таны сонгосон өдөр хүртэл түгжих бөгөөд нээх хугацаа болтол агуулгыг үзэх боломжгүй.</p>
      <label>Таны нэр<input required value={v.name} onChange={e => setV({ ...v, name: e.target.value })} /></label>
      <label>Гарчиг<input required value={v.title} onChange={e => setV({ ...v, title: e.target.value })} /></label>
      <label>Ирээдүйн оюутнуудад үлдээх захидал<textarea required rows="6" value={v.message} onChange={e => setV({ ...v, message: e.target.value })} /></label>
      <label>Зураг (заавал биш)<input type="file" accept="image/*" onChange={e => setV({ ...v, file: e.target.files[0] })} /></label>
      <label>Хэзээ нээгдэх вэ?<input type="date" required min={tomorrow} value={v.date} onChange={e => setV({ ...v, date: e.target.value })} /></label>
      {err && <p className="err">{err}</p>}
      <div className="row"><button disabled={busy}>{busy ? 'Хадгалж байна...' : 'Капсул хаах'}</button><button type="button" className="ghost" onClick={() => onDone(true)}>Болих</button></div>
    </form>
  )
}

function TimeMachine({ user, admin }) {
  const thisYear = new Date().getFullYear(), today = new Date().toLocaleDateString('sv-SE')
  const [d, setD] = useState({ h: [], e: [], x: [], c: [] }), [year, setYear] = useState(thisYear), [form, setForm] = useState(false), [open, setOpen] = useState(null), [err, setErr] = useState('')
  const load = async () => {
    const rs = await Promise.all([
      supabase.from('history').select('*'),
      supabase.from('events').select('*'),
      supabase.from('exhibits').select('*'),
      supabase.from('capsules_public').select('*').order('open_year'),
    ])
    const bad = rs.find(r => r.error)
    setErr(bad ? bad.error.message : '')
    setD({ h: rs[0].data || [], e: rs[1].data || [], x: rs[2].data || [], c: rs[3].data || [] })
  }
  useEffect(() => { load() }, [])
  const hY = d.h.map(r => num(r.year)), eY = d.e.map(r => yearOf(r.event_date)), xY = d.x.map(r => num(r.year_created)), cY = d.c.map(r => yearOf(r.open_date))
  const years = [...new Set([thisYear, ...hY, ...eY, ...xY, ...cY].filter(Boolean))].sort((a, b) => a - b)
  const yearsDesc = [...years].sort((x, z) => z - x)
  const hist = d.h.filter(r => num(r.year) === year)
  const evs = d.e.filter(r => yearOf(r.event_date) === year).sort((a, b) => a.event_date.localeCompare(b.event_date))
  const exs = d.x.filter(r => num(r.year_created) === year)
  const caps = d.c.filter(r => yearOf(r.open_date) === year)
  const empty = !hist.length && !evs.length && !exs.length && !caps.length
  if (form) return <CapsuleForm user={user} onDone={c => { setForm(false); c || load() }} />
  return (
    <section>
      <div className="tm-hero">
        <div>
          <p>Тэнхимийн түүхэн замнал, арга хэмжээ, оюутнуудын бүтээлүүдийг он цагийн дарааллаар сонирхон үзэж, ирээдүйн оюутнууддаа зориулан үлдээсэн захидал, дурсамжийн капсулуудтай танилцаарай.</p>
        </div>
        {user ? <button onClick={() => setForm(true)}>+ Капсул үлдээх</button> : <p className="hint">Капсул үлдээхийн тулд нэвтэрнэ үү.</p>}
      </div>
      {err && <p className="err">{err}</p>}
      <div className="tm-layout">
        <aside className="tm-side">
          <h4>Он</h4>
          <div className="tm-list">
            {yearsDesc.map(y => (
              <button type="button" key={y} className={'tm-yr' + (y === year ? ' on' : '')} onClick={() => setYear(y)}>
                <b>{y}</b>
                {y === thisYear && <small>Одоо</small>}
                {y > thisYear && <small className="fut">Ирээдүй</small>}
              </button>
            ))}
          </div>
        </aside>
        <div className="tm-main">
          <select className="tm-select" aria-label="Он сонгох" value={year} onChange={e => setYear(Number(e.target.value))}>
            {yearsDesc.map(y => <option key={y} value={y}>{y}{y === thisYear ? ' · Одоо' : y > thisYear ? ' · Ирээдүй' : ''}</option>)}
          </select>
      <div className="tm-panel">
        <div className="tm-head">
          <h2>{year}</h2>
          <span className={'badge ' + (year > thisYear ? 'future' : year === thisYear ? 'now' : 'past')}>{year === thisYear ? 'Одоо' : year > thisYear ? 'Ирээдүй' : 'Өнгөрсөн'}</span>
          <div className="tm-sum">{[[hist.length, 'түүх'], [evs.length, 'арга хэмжээ'], [exs.length, 'бүтээл'], [caps.length, 'капсул']].filter(([n]) => n > 0).map(([n, l]) => <span key={l}>{n} {l}</span>)}</div>
        </div>
        {empty && <p className="tm-empty">Энэ онд бүртгэл алга.</p>}
        {hist.length > 0 && <div className="tm-group"><h4>Түүх <b>{hist.length}</b></h4><div className="tm-cards">{hist.map(r => <TmCard key={r.id} img={r.image_url} kicker="Түүх" title={r.title} text={r.description} full />)}</div></div>}
        {evs.length > 0 && <div className="tm-group"><h4>Арга хэмжээ <b>{evs.length}</b></h4><div className="tm-cards">{evs.map(r => <TmCard key={r.id} img={r.cover_image_url} kicker="Арга хэмжээ" title={r.event_date.replaceAll('-', '.')} text={r.summary} plain onOpen={() => setOpen({ cfg: SECTIONS.events, row: r })} />)}</div></div>}
        {exs.length > 0 && <div className="tm-group"><h4>Бүтээл <b>{exs.length}</b></h4><div className="tm-cards">{exs.map(r => <TmCard key={r.id} img={r.image_url} kicker={r.category || 'Бүтээл'} title={r.title} onOpen={() => setOpen({ cfg: SECTIONS.exhibits, row: r })} />)}</div></div>}
        {caps.length > 0 && <div className="tm-group"><h4>Капсул <b>{caps.length}</b></h4><div className="tm-cards caps">{caps.map(c => <Capsule key={c.id} c={c} today={today} user={user} admin={admin} onChange={load} onError={setErr} />)}</div></div>}
      </div>
        </div>
      </div>
      {open && <DetailModal cfg={open.cfg} detail={open.row} onClose={() => setOpen(null)} />}
    </section>
  )
}

export default function App() {
  const [tab, setTab] = useState('history'), [user, setUser] = useState(null), [admin, setAdmin] = useState(false), [ready, setReady] = useState(false), [guest, setGuest] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); if (s) setGuest(false) })
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    setAdmin(false)
    if (user) supabase.from('profiles').select('role').eq('id', user.id).single().then(r => setAdmin(r.data?.role === 'admin'))
  }, [user])
  if (!ready) return null
  if (!user && !guest) return (
    <div className="login">
      <aside className="login-brand">
        <h1>ISM Digital Museum</h1>
        <p>Мэдээллийн Системийн Менежментийн тэнхимийн түүх, багш нар, арга хэмжээ болон оюутнуудын бүтээлийг нэг дор хадгалсан дижитал музей.</p>
        <ul><li>Оюутнуудын бүтээл</li><li>Багш нар</li><li>Арга хэмжээ</li><li>Тэнхимийн түүх</li><li>Цаг хугацааны машин ба ирээдүйн капсул</li></ul>
      </aside>
      <div className="login-panel">
        <Auth />
        <div className="guest"><span>Нэвтрэхгүйгээр үзэх үү?</span><button className="ghost" onClick={() => setGuest(true)}>Зочноор үзэх</button></div>
      </div>
    </div>
  )
  return (
    <>
      <header>
        <h1>ISM Digital Museum</h1>
        <nav>
          {['history', 'teachers', 'events', 'exhibits'].map(k => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{SECTIONS[k].label}</button>)}
          <button className={tab === 'time' ? 'on' : ''} onClick={() => setTab('time')}>Цаг хугацааны машин</button>
          {user
            ? <button className="ghost" onClick={() => supabase.auth.signOut()}>Гарах</button>
            : <button className="ghost" onClick={() => setGuest(false)}>Нэвтрэх</button>}
        </nav>
      </header>
      <main>{tab === 'time' ? <TimeMachine user={user} admin={admin} /> : <Section cfg={SECTIONS[tab]} user={user} admin={admin} />}</main>
    </>
  )
}