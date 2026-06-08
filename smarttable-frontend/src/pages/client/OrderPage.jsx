import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronRight,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import api from '../../api/axios';

const STEPS = [
  { id: 1, label: 'Bienvenue' },
  { id: 2, label: 'Assistant' },
  { id: 3, label: 'Récap' },
  { id: 4, label: 'Confirmé' },
];

function parseVariantes(menu) {
  if (!menu.variantes) return [];
  if (Array.isArray(menu.variantes)) return menu.variantes;
  try {
    const parsed = JSON.parse(menu.variantes);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(menu.variantes)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function getSessionKey(restaurantId, tableId) {
  return `smarttable_session_${restaurantId}_${tableId}`;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-xs">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-amber-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurant');
  const tableId = searchParams.get('table');

  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const [cart, setCart] = useState([]);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directMenu, setDirectMenu] = useState(null);
  const [sauce, setSauce] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  const chatEndRef = useRef(null);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!restaurantId || !tableId) return;
    const key = getSessionKey(restaurantId, tableId);
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(key, sid);
    }
    setSessionId(sid);
  }, [restaurantId, tableId]);

  const { data: context, isLoading: ctxLoading, isError: ctxError } = useQuery({
    queryKey: ['public-restaurant', restaurantId, tableId],
    queryFn: () =>
      api
        .get(`/public/restaurants/${restaurantId}`, { params: { table_id: tableId } })
        .then((r) => r.data),
    enabled: !!restaurantId && !!tableId,
    retry: 2,
  });

  const { data: menuData, isLoading: menusLoading } = useQuery({
    queryKey: ['public-menus', restaurantId],
    queryFn: () => api.get(`/menus/public/${restaurantId}`).then((r) => r.data),
    enabled: !!restaurantId,
    retry: 2,
  });

  const menus = menuData?.menus ?? [];
  const mealLabel = menuData?.meal_period?.label || context?.meal_period?.label || '';

  useEffect(() => {
    if (context?.restaurant?.nom && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          text: `Bonjour ! Bienvenue chez ${context.restaurant.nom}. Je suis votre assistant — demandez le menu, commandez un plat ou dites « confirmer ».`,
        },
      ]);
    }
  }, [context?.restaurant?.nom, messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.prix * item.quantite, 0),
    [cart]
  );

  const directVariantes = useMemo(
    () => (directMenu ? parseVariantes(directMenu) : []),
    [directMenu]
  );

  const sendMessage = useCallback(
    async (text, attempt = 0) => {
      if (!text.trim() || !restaurantId || !tableId || !sessionId) return;

      setChatError(null);
      const userMsg = { role: 'user', text };
      setMessages((prev) => [...prev, userMsg]);
      setTyping(true);

      try {
        const { data } = await api.post('/chatbot/message', {
          message: text,
          restaurant_id: restaurantId,
          table_id: tableId,
          session_id: sessionId,
        });
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
        setRetryCount(0);

        const lower = text.toLowerCase();
        if (lower.includes('commander') || lower.includes('ajouter')) {
          const match = menus.find((m) => lower.includes(m.nom_plat.toLowerCase()));
          if (match) {
            setCart((prev) => [
              ...prev,
              {
                menu_id: match.id,
                nom_plat: match.nom_plat,
                prix: Number(match.prix),
                quantite: 1,
                sauce: '',
              },
            ]);
          }
        }
      } catch {
        if (attempt < 2) {
          setRetryCount(attempt + 1);
          setTimeout(() => sendMessage(text, attempt + 1), 1500 * (attempt + 1));
          return;
        }
        setChatError('Connexion instable. Nouvelle tentative…');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'Désolé, une erreur réseau est survenue. Réessayez ou utilisez « Commander directement ».',
          },
        ]);
      } finally {
        setTyping(false);
      }
    },
    [restaurantId, tableId, sessionId, menus]
  );

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    sendMessage(text);
  };

  const addToCart = (menu, opts = {}) => {
    setCart((prev) => [
      ...prev,
      {
        menu_id: menu.id,
        nom_plat: menu.nom_plat,
        prix: Number(menu.prix),
        quantite: opts.quantite || 1,
        sauce: opts.sauce || '',
        notes: opts.notes || '',
      },
    ]);
    setShowDirectModal(false);
    setDirectMenu(null);
    setSauce('');
    setQuantite(1);
    setNotes('');
    if (step < 3) setStep(3);
  };

  const submitCart = async () => {
    if (!cart.length || !restaurantId || !tableId) return;
    setSubmitting(true);
    try {
      const results = [];
      for (const item of cart) {
        const { data } = await api.post('/orders', {
          restaurant_id: Number(restaurantId),
          table_id: Number(tableId),
          menu_id: item.menu_id,
          sauce: item.sauce || null,
          quantite: item.quantite,
          session_id: sessionId,
          notes: item.notes || null,
        });
        results.push(data);
      }
      setOrderConfirmed({
        items: cart,
        total: cartTotal,
        message: results[0]?.message || 'Commande enregistrée',
      });
      setCart([]);
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Impossible d\'enregistrer la commande.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!restaurantId || !tableId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50/50 p-6 text-center">
        <p className="text-slate-600">Scannez le QR code de votre table pour commander.</p>
      </div>
    );
  }

  if (ctxLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50/50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (ctxError || !context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50/50 p-6 text-center">
        <p className="text-red-600">Lien invalide ou restaurant introuvable.</p>
      </div>
    );
  }

  const { restaurant, table, can_order: canOrder } = context;
  const logoUrl = restaurant.logo;
  const tableNum = table?.numero_table ?? tableId;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-gradient-to-b from-amber-50/80 to-white">
      {/* Stepper */}
      <div className="sticky top-0 z-20 border-b border-amber-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step >= s.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.id ? '✓' : s.id}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`mx-0.5 h-0.5 flex-1 rounded ${step > s.id ? 'bg-amber-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-amber-700/80">
          {STEPS[step - 1]?.label}
        </p>
      </div>

      <div className="flex flex-1 flex-col px-4 py-4">
        {/* Step 1 — Bienvenue */}
        {step === 1 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-slide-up">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="mb-4 h-20 w-20 rounded-2xl object-cover shadow-md ring-2 ring-white" />
            ) : (
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-glow">
                <UtensilsCrossed className="h-9 w-9" />
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-900">{restaurant.nom}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Bonjour, bienvenue à la table N°{tableNum}
              {mealLabel ? ` · ${mealLabel}` : ''}
            </p>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-500">
              Commandez via notre assistant IA ou parcourez la carte. Votre commande part directement en cuisine.
            </p>

            {!menusLoading && menus.length > 0 && (
              <div className="mt-6 w-full">
                <p className="mb-2 text-left text-xs font-semibold text-amber-800">Menu du jour</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {menus.slice(0, 6).map((menu) => (
                    <button
                      key={menu.id}
                      type="button"
                      onClick={() => {
                        setDirectMenu(menu);
                        setShowDirectModal(true);
                      }}
                      className="w-28 shrink-0 rounded-xl border border-amber-100 bg-white p-2 text-left shadow-sm transition hover:border-amber-300"
                    >
                      {menu.image_url && (
                        <img src={menu.image_url} alt="" className="mb-1.5 h-16 w-full rounded-lg object-cover" />
                      )}
                      <p className="line-clamp-2 text-[11px] font-semibold text-slate-800">{menu.nom_plat}</p>
                      <p className="text-[10px] font-bold text-amber-600">{Number(menu.prix).toFixed(0)} MAD</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95"
            >
              Commencer <ChevronRight className="inline h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDirectModal(true)}
              className="mt-3 w-full rounded-xl border border-amber-200 bg-white py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-50"
            >
              <ShoppingBag className="mr-1 inline h-4 w-4" />
              Commander directement
            </button>
          </div>
        )}

        {/* Step 2 — Chat */}
        {step === 2 && (
          <div className="flex flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={() => setStep(1)} className="text-xs text-amber-700 hover:underline">
                ← Retour
              </button>
              <button
                type="button"
                onClick={() => setShowDirectModal(true)}
                className="text-xs font-medium text-amber-700 hover:underline"
              >
                Commander directement
              </button>
            </div>

            {chatError && (
              <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {chatError} {retryCount > 0 && `(tentative ${retryCount}/2)`}
              </p>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                        : 'border border-slate-200/80 bg-white text-slate-800 shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {typing && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="mb-2 w-full rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-semibold text-amber-900"
              >
                Voir le récapitulatif ({cart.length} article{cart.length > 1 ? 's' : ''}) — {cartTotal.toFixed(0)} MAD
              </button>
            )}

            <div className="flex gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-card">
              <input
                className="input-field flex-1 border-0 shadow-none focus:ring-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Votre message…"
                aria-label="Message"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={typing || !input.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white transition hover:opacity-90 disabled:opacity-50"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Récap */}
        {step === 3 && (
          <div className="flex flex-1 flex-col animate-slide-up">
            <button type="button" onClick={() => setStep(2)} className="mb-4 self-start text-xs text-amber-700 hover:underline">
              ← Retour au chat
            </button>

            <h2 className="text-lg font-bold text-slate-900">Récapitulatif</h2>
            <p className="text-sm text-slate-500">Table N°{tableNum}</p>

            {!canOrder && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Limite de commandes atteinte pour aujourd&apos;hui (plan Free).
              </p>
            )}

            {cart.length === 0 ? (
              <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
                <Sparkles className="mb-3 h-10 w-10 text-amber-300" />
                <p className="text-sm text-slate-500">Votre panier est vide.</p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-4 text-sm font-medium text-amber-700 hover:underline"
                >
                  Discuter avec l&apos;assistant
                </button>
                <button
                  type="button"
                  onClick={() => setShowDirectModal(true)}
                  className="mt-2 text-sm font-medium text-amber-700 hover:underline"
                >
                  Ajouter un plat
                </button>
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {cart.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{item.nom_plat}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantite}× {item.prix.toFixed(0)} MAD
                          {item.sauce ? ` · ${item.sauce}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-700">{(item.prix * item.quantite).toFixed(0)} MAD</span>
                        <button
                          type="button"
                          onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500"
                          aria-label="Retirer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto border-t border-slate-100 pt-4">
                  <div className="flex justify-between text-base font-bold text-slate-900">
                    <span>Total</span>
                    <span className="text-amber-700">{cartTotal.toFixed(0)} MAD</span>
                  </div>
                  <button
                    type="button"
                    disabled={submitting || !canOrder}
                    onClick={submitCart}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
                  >
                    {submitting ? 'Envoi en cours…' : 'Confirmer la commande'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4 — Confirmation */}
        {step === 4 && orderConfirmed && (
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-slide-up">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Commande confirmée !</h2>
            <p className="mt-2 text-sm text-slate-600">
              Votre commande est en cours de préparation. Merci et bon appétit !
            </p>
            <ul className="mt-6 w-full space-y-2 text-left">
              {orderConfirmed.items.map((item, i) => (
                <li key={i} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  {item.quantite}× {item.nom_plat}
                  {item.sauce ? ` (${item.sauce})` : ''}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-lg font-bold text-emerald-700">{orderConfirmed.total.toFixed(0)} MAD</p>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOrderConfirmed(null);
              }}
              className="mt-8 text-sm font-medium text-amber-700 hover:underline"
            >
              Commander autre chose
            </button>
          </div>
        )}
      </div>

      {/* Modal commande directe */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white p-4 shadow-xl animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                {directMenu ? directMenu.nom_plat : 'Choisir un plat'}
              </h3>
              <button type="button" onClick={() => { setShowDirectModal(false); setDirectMenu(null); }} className="btn-icon">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!directMenu ? (
              <div className="grid gap-2">
                {menusLoading && <p className="text-sm text-slate-500">Chargement…</p>}
                {menus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setDirectMenu(menu)}
                    className="flex gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-amber-300"
                  >
                    {menu.image_url && (
                      <img src={menu.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{menu.nom_plat}</p>
                      <p className="text-sm text-amber-600">{Number(menu.prix).toFixed(0)} MAD</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {directVariantes.length > 0 ? (
                  <select className="input-field w-full" value={sauce} onChange={(e) => setSauce(e.target.value)}>
                    <option value="">— Sauce / option —</option>
                    {directVariantes.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input-field w-full"
                    placeholder="Sauce (optionnel)"
                    value={sauce}
                    onChange={(e) => setSauce(e.target.value)}
                  />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quantité</span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-icon" onClick={() => setQuantite((q) => Math.max(1, q - 1))}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{quantite}</span>
                    <button type="button" className="btn-icon" onClick={() => setQuantite((q) => Math.min(20, q + 1))}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <input
                  className="input-field w-full text-sm"
                  placeholder="Note cuisine (optionnel)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => addToCart(directMenu, { sauce, quantite, notes })}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white"
                >
                  Ajouter — {(Number(directMenu.prix) * quantite).toFixed(0)} MAD
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
