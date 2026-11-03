import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './context/useAuth'
import { ApiError, api } from './services/api'
import type { Recipe, RecipeInput } from './types'
import './App.css'

type IconName = 'leaf' | 'search' | 'plus' | 'logout' | 'edit' | 'trash' | 'clock' | 'arrow' | 'close' | 'chef' | 'utensils' | 'sparkle'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    leaf: <><path d="M20 4c-8 0-14 4-14 11a5 5 0 0 0 5 5c7 0 11-6 9-16Z" /><path d="M4 21c3-6 7-9 13-12" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" /><path d="M10 11v5m4-5v5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    chef: <><path d="M6 10a4 4 0 1 1 7-2 4 4 0 1 1 6 3v8H6v-9Z" /><path d="M6 14H4a2 2 0 0 1 0-4h2m13 4h1a2 2 0 1 0 0-4h-1M9 19v2m6-2v2" /></>,
    utensils: <><path d="m3 2 7 7M4 3l-2 2 6 6-3 3 2 2 4-4" /><path d="M14 4c-2 3-2 6 0 8l2-2 5 11 2-1-5-12c1-3 0-5-2-7Z" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function formatPrice(recipe: Pick<Recipe, 'prepTimeMinutes' | 'cookTimeMinutes'>) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(15 + 0.5 * (recipe.prepTimeMinutes + recipe.cookTimeMinutes))
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Este prato foi criado nesta sessão e não existe no servidor. A API simulada responde 404 para editar ou excluir pratos novos.'
    if (error.status === 401) return 'Usuário ou senha incorretos. Confira os dados e tente novamente.'
    return `${error.message} (status ${error.status})`
  }
  return 'Não foi possível conectar à API. Verifique sua conexão e tente novamente.'
}

function RecipeCard({ recipe, onEdit, onDelete }: { recipe: Recipe; onEdit: (recipe: Recipe) => void; onDelete: (recipe: Recipe) => void }) {
  return <article className="recipe-card"><div className="recipe-photo"><img src={recipe.image} alt={recipe.name} loading="lazy" /><span className="photo-tag">{recipe.cuisine || 'Da casa'}</span><button className="icon-button edit-float" aria-label={`Editar ${recipe.name}`} onClick={() => onEdit(recipe)}><Icon name="edit" size={17} /></button></div><div className="recipe-info"><div className="recipe-title-row"><h3>{recipe.name}</h3><span className="rating-dot">✦</span></div><div className="recipe-meta"><span><Icon name="clock" size={15} />{recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span><span>{recipe.difficulty || 'Feito na casa'}</span></div><div className="recipe-bottom"><strong>{formatPrice(recipe)}</strong><button className="delete-button" onClick={() => onDelete(recipe)} aria-label={`Excluir ${recipe.name}`}><Icon name="trash" size={17} /></button></div></div></article>
}

function RecipeModal({ recipe, onClose, onSave, saving }: { recipe: Recipe | null; onClose: () => void; onSave: (input: RecipeInput) => void; saving: boolean }) {
  const [name, setName] = useState(recipe?.name ?? '')
  const [cuisine, setCuisine] = useState(recipe?.cuisine ?? '')
  const [prep, setPrep] = useState(String(recipe?.prepTimeMinutes ?? 10))
  const [cook, setCook] = useState(String(recipe?.cookTimeMinutes ?? 20))
  const estimatedPrice = formatPrice({ prepTimeMinutes: Number(prep) || 0, cookTimeMinutes: Number(cook) || 0 })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ name: name.trim(), cuisine: cuisine.trim(), prepTimeMinutes: Number(prep), cookTimeMinutes: Number(cook) })
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="eyebrow">CARDÁPIO DA CASA</span><h2 id="modal-title">{recipe ? 'Editar prato' : 'Novo prato'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button></div><form onSubmit={submit} className="recipe-form"><label>Nome do prato<input required maxLength={70} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Risoto de cogumelos" /></label><label>Cozinha<input required maxLength={40} value={cuisine} onChange={(event) => setCuisine(event.target.value)} placeholder="Ex.: Italiana" /></label><div className="form-two"><label>Preparo (min)<input required type="number" min="0" max="999" value={prep} onChange={(event) => setPrep(event.target.value)} /></label><label>Cozimento (min)<input required type="number" min="0" max="999" value={cook} onChange={(event) => setCook(event.target.value)} /></label></div><div className="price-hint"><span>Preço sugerido</span><strong>{estimatedPrice}</strong><small>R$ 15 + R$ 0,50 por minuto de preparo e cozimento</small></div><div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Salvando...' : recipe ? 'Salvar alterações' : 'Adicionar ao cardápio'}<Icon name="arrow" size={17} /></button></div></form></section></div>
}

function LoginScreen({ onLogin, busy, error }: { onLogin: (username: string, password: string) => void; busy: boolean; error: string }) {
  const [username, setUsername] = useState('emilys')
  const [password, setPassword] = useState('emilyspass')
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onLogin(username.trim(), password) }
  return <main className="login-page"><section className="login-art"><div className="brand brand-light"><span className="brand-mark"><Icon name="leaf" size={22} /></span><span>Mesa &<br />Manjericão</span></div><div className="art-copy"><span className="eyebrow">BOM TER VOCÊ POR AQUI</span><h1>Feito com cuidado.<br /><em>Servido com carinho.</em></h1><p>Seu cardápio, do seu jeito — simples de cuidar, gostoso de ver.</p></div><div className="art-bottom"><span>✦</span><span>Um lugar para cada sabor encontrar seu caminho.</span></div><div className="art-circle circle-one" /><div className="art-circle circle-two" /></section><section className="login-panel"><div className="login-form-wrap"><div className="mobile-brand brand"><span className="brand-mark"><Icon name="leaf" size={22} /></span><span>Mesa &<br />Manjericão</span></div><span className="eyebrow">PAINEL DO RESTAURANTE</span><h2>Entre na sua cozinha</h2><p className="login-subtitle">Acesse para cuidar do seu cardápio.</p>{error && <div className="alert alert-error" role="alert">{error}</div>}<form onSubmit={submit} className="login-form"><label>Usuário<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Seu usuário" /></label><label>Senha<input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" /></label><button className="button button-primary login-submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar no painel'}<Icon name="arrow" size={18} /></button></form><div className="demo-note"><span className="demo-icon"><Icon name="sparkle" size={17} /></span><span><strong>Conta para experimentar</strong><br />emilys <span className="note-divider">·</span> emilyspass</span></div><p className="login-foot">Ao entrar, você concorda em deixar a cozinha mais gostosa. <span>♥</span></p></div></section></main>
}

function LoginPage() {
  const { token, login } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (token) return <Navigate to="/" replace />

  async function handleLogin(username: string, password: string) {
    setBusy(true)
    setError('')
    try {
      await login(username, password)
    } catch (loginError) {
      setError(getErrorMessage(loginError))
    } finally {
      setBusy(false)
    }
  }

  return <LoginScreen onLogin={handleLogin} busy={busy} error={error} />
}

function RestaurantDashboard() {
  const { token, user, logout } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searchResults, setSearchResults] = useState<Recipe[] | null>(null)
  const [searchResultsFor, setSearchResultsFor] = useState('')
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [modalRecipe, setModalRecipe] = useState<Recipe | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadMenu = useCallback(async (activeToken: string) => {
    setLoading(true); setError('')
    try {
      const data = await api.recipes(activeToken)
      setRecipes(data.recipes)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
      if (loadError instanceof ApiError && loadError.status === 401) logout()
    } finally { setLoading(false) }
  }, [logout])

  useEffect(() => {
    if (!token) return
    const timer = window.setTimeout(() => { void loadMenu(token) }, 0)
    return () => window.clearTimeout(timer)
  }, [token, loadMenu])
  useEffect(() => {
    const searchedQuery = query.trim()
    if (!token || !searchedQuery) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const result = await api.searchRecipes(searchedQuery, token)
        if (!cancelled) { setSearchResults(result.recipes); setSearchResultsFor(searchedQuery) }
      } catch (searchError) {
        if (!cancelled) setError(getErrorMessage(searchError))
      }
    }, 350)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [query, token])

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const displayedRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    const base = !normalizedQuery ? recipes : searchResults === null || searchResultsFor !== query.trim()
      ? recipes.filter((item) => item.name.toLocaleLowerCase().includes(normalizedQuery))
      : [
      ...searchResults.map((item) => recipes.find((local) => local.id === item.id) ?? item),
      ...recipes.filter((item) => item.id === 51
        && item.name.toLocaleLowerCase().includes(normalizedQuery)
        && !searchResults.some((result) => result.id === 51)),
    ]
    return cuisine === 'Todas' ? base : base.filter((item) => item.cuisine === cuisine)
  }, [cuisine, query, recipes, searchResults, searchResultsFor])
  const cuisines = useMemo(() => ['Todas', ...new Set(recipes.map((recipe) => recipe.cuisine).filter(Boolean))], [recipes])

  async function saveRecipe(input: RecipeInput) {
    if (!token) return
    setBusy(true); setError('')
    try {
      if (modalRecipe) {
        const updated = await api.updateRecipe(modalRecipe.id, input, token)
        const next = { ...modalRecipe, ...input, ...(updated.image ? { image: updated.image } : {}) }
        setRecipes((current) => current.map((item) => item.id === modalRecipe.id ? next : item))
        setSearchResults((current) => current?.map((item) => item.id === next.id ? next : item) ?? null)
      } else {
        const created = await api.addRecipe(input, token)
        const localRecipe = { ...created, ...input, id: 51, image: created.image || 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80' }
        setRecipes((current) => [localRecipe, ...current.filter((item) => item.id !== localRecipe.id)])
        setSearchResults((current) => current === null ? null : [localRecipe, ...current.filter((item) => item.id !== localRecipe.id)])
        setQuery('')
      }
      setModalOpen(false); setModalRecipe(null)
    } catch (saveError) { setError(getErrorMessage(saveError)) }
    finally { setBusy(false) }
  }
  async function deleteRecipe(recipe: Recipe) {
    if (!token || !window.confirm(`Excluir “${recipe.name}” do cardápio? Esta ação não pode ser desfeita.`)) return
    setBusy(true); setError('')
    try {
      await api.deleteRecipe(recipe.id, token)
      setRecipes((current) => current.filter((item) => item.id !== recipe.id)); setSearchResults((current) => current?.filter((item) => item.id !== recipe.id) ?? null)
    } catch (deleteError) { setError(getErrorMessage(deleteError)) }
    finally { setBusy(false) }
  }

  if (loading) return <main className="loading-screen"><span className="loader" /><p>Preparando a cozinha...</p></main>
  return <div className="app-shell"><aside className="sidebar"><a href="#inicio" className="brand"><span className="brand-mark"><Icon name="leaf" size={22} /></span><span>Mesa &<br />Manjericão</span></a><div className="restaurant-chip"><div className="restaurant-avatar">M</div><div><strong>Manjericão</strong><span>Restaurante parceiro</span></div><span className="online-dot" /></div><nav className="side-nav"><span className="nav-caption">SEU ESPAÇO</span><a className="nav-item active" href="#cardapio"><Icon name="utensils" />Cardápio<span className="nav-count">{recipes.length}</span></a><a className="nav-item" href="#cardapio" onClick={(event) => { event.preventDefault(); setModalRecipe(null); setModalOpen(true) }}><Icon name="plus" />Adicionar prato</a></nav><div className="sidebar-tip"><div className="tip-icon"><Icon name="sparkle" size={18} /></div><strong>Um prato de cada vez</strong><p>Seu cardápio sempre fresquinho faz toda a diferença.</p></div><button className="logout-button" onClick={logout}><Icon name="logout" size={18} />Sair da conta</button></aside>
    <main className="main-area" id="inicio"><header className="topbar"><div className="breadcrumbs">Painel <span>/</span> <strong>Cardápio</strong></div><div className="top-user"><span className="user-greeting">Olá, {user?.firstName || 'cozinheiro'}!</span><div className="user-avatar">{user?.firstName?.[0] || 'M'}</div><button className="mobile-logout" onClick={logout} aria-label="Sair"><Icon name="logout" size={18} /></button></div></header>
      <div className="content-wrap"><section className="welcome-row"><div><span className="eyebrow">TERÇA-FEIRA, SUA COZINHA ESTÁ LINDA</span><h1>O sabor mora <em>nos detalhes.</em></h1><p>Cuide dos pratos que fazem seus clientes voltarem.</p></div><button className="button button-primary add-main" onClick={() => { setModalRecipe(null); setModalOpen(true) }}><Icon name="plus" size={19} />Novo prato</button></section>
        <section className="summary-strip"><div className="summary-icon"><Icon name="chef" size={22} /></div><div className="summary-text"><strong>{recipes.length} pratos no seu cardápio</strong><span>Um menu especial, feito com carinho todos os dias.</span></div><div className="summary-divider" /><div className="summary-stat"><span>Tempo médio</span><strong>{recipes.length ? Math.round(recipes.reduce((sum, item) => sum + item.prepTimeMinutes + item.cookTimeMinutes, 0) / recipes.length) : 0} <small>min</small></strong></div><div className="summary-art">✳</div></section>
        <section className="menu-section" id="cardapio"><div className="menu-heading"><div><span className="eyebrow">A SUA SELEÇÃO</span><h2>Pratos do cardápio <span>{displayedRecipes.length}</span></h2></div><div className="search-box"><Icon name="search" size={19} /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar prato..." aria-label="Buscar prato" /><kbd>⌘ K</kbd></div></div><div className="filter-row" role="group" aria-label="Filtrar cozinha">{cuisines.slice(0, 7).map((item) => <button key={item} className={`filter-pill ${cuisine === item ? 'selected' : ''}`} onClick={() => setCuisine(item)}>{item}</button>)}</div>
          {error && <div className="alert alert-error page-alert" role="alert"><span>{error}</span><button className="alert-close" onClick={() => setError('')} aria-label="Fechar mensagem"><Icon name="close" size={17} /></button></div>}{busy && <div className="save-indicator"><span className="tiny-loader" /> Atualizando seu cardápio...</div>}
          {displayedRecipes.length ? <div className="recipe-grid">{displayedRecipes.map((recipe) => <RecipeCard key={`${recipe.id}-${recipe.name}`} recipe={recipe} onEdit={(item) => { setModalRecipe(item); setModalOpen(true) }} onDelete={deleteRecipe} />)}</div> : <div className="empty-state"><div className="empty-icon"><Icon name="utensils" size={26} /></div><h3>{query ? 'Nenhum prato encontrado' : 'Seu cardápio está esperando'}</h3><p>{query ? 'Tente outra busca ou confira a grafia.' : 'Adicione o primeiro prato para começar a montar sua seleção.'}</p>{!query && <button className="button button-primary" onClick={() => { setModalRecipe(null); setModalOpen(true) }}><Icon name="plus" size={18} />Adicionar primeiro prato</button>}</div>}
        </section><footer className="footer-note"><Icon name="leaf" size={15} /><span>Feito com carinho, servido com orgulho.</span><span className="footer-right">MESA & MANJERICÃO <b>·</b> PAINEL DO RESTAURANTE</span></footer></div>
    </main>{modalOpen && <RecipeModal recipe={modalRecipe} onClose={() => { setModalOpen(false); setModalRecipe(null) }} onSave={saveRecipe} saving={busy} />}</div>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RestaurantDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
