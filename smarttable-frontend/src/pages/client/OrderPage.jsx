import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  MessageCircle,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react';
import api from '../../api/axios';

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

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurant');
  const tableId = searchParams.get('table');

  const [tab, setTab] = useState('order');
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [sauce, setSauce] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [sessionId] = useState(() => crypto.randomUUID());

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const { data: context, isLoading: ctxLoading, isError: ctxError } = useQuery({
    queryKey: ['public-restaurant', restaurantId, tableId],
    queryFn: () =>
      api
        .get(`/public/restaurants/${restaurantId}`, { params: { table_id: tableId } })
        .then((r) => r.data),
    enabled: !!restaurantId && !!tableId,
  });

  const { data: menuData, isLoading: menusLoading } = useQuery({
    queryKey: ['public-menus', restaurantId],
    queryFn: () => api.get(`/menus/public/${restaurantId}`).then((r) => r.data),
    enabled: !!restaurantId,
  });

  const menus = menuData?.menus ?? [];
  const mealLabel = menuData?.meal_period?.label || context?.meal_period?.label || '';

  useEffect(() => {
    if (context?.restaurant?.nom && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          text: `Bienvenue chez ${context.restaurant.nom} ! Je suis votre assistant. Période : ${mealLabel}. Utilisez l'onglet Commander ou demandez « le menu ».`,
        },
      ]);
    }
  }, [context?.restaurant?.nom, mealLabel, messages.length]);

  const variantes = useMemo(
    () => (selectedMenu ? parseVariantes(selectedMenu) : []),
    [selectedMenu]
  );

  const total = selectedMenu ? Number(selectedMenu.prix) * quantite : 0;

  const sendMessage = async () => {
    if (!input.trim() || !restaurantId || !tableId) return;

    const userMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const text = input;
    setInput('');

    try {
      const { data } = await api.post('/chatbot/message', {
        message: text,
        restaurant_id: restaurantId,
        table_id: tableId,
        session_id: sessionId,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Désolé, une erreur est survenue. Réessayez ou commandez via l\'onglet Commander.' },
      ]);
    }
  };

  const submitOrder = async () => {
    if (!selectedMenu || !restaurantId || !tableId) return;
    setSubmitting(true);
    const platNom = selectedMenu.nom_plat;
    try {
      const { data } = await api.post('/orders', {
        restaurant_id: Number(restaurantId),
        table_id: Number(tableId),
        menu_id: selectedMenu.id,
        sauce: sauce || null,
        quantite,
        session_id: sessionId,
        notes: notes || null,
      });
      setConfirmed({
        plat: platNom,
        quantite,
        sauce,
        total: data.commande?.total ?? total,
        message: data.message,
      });
      setSelectedMenu(null);
      setSauce('');
      setQuantite(1);
      setNotes('');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `✅ Commande confirmée : ${data.commande?.quantite ?? quantite}× ${platNom}. Le restaurant a été notifié.`,
        },
      ]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Impossible d\'enregistrer la commande.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!restaurantId || !tableId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted p-6 text-center">
        <p className="text-slate-600">Scannez le QR code de votre table pour commander.</p>
      </div>
    );
  }

  if (ctxLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (ctxError || !context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted p-6 text-center">
        <p className="text-red-600">Lien invalide ou restaurant introuvable.</p>
      </div>
    );
  }

  const { restaurant, table, can_order: canOrder } = context;
  const logoUrl = restaurant.logo;

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-11 w-11 rounded-xl object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-slate-900">{restaurant.nom}</h1>
            <p className="text-xs text-slate-500">
              Table {table?.numero_table ?? tableId}
              {mealLabel ? ` · ${mealLabel}` : ''}
            </p>
          </div>
        </div>

        <div className="mx-auto mt-3 flex max-w-lg gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab('order')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'order' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Commander
          </button>
          <button
            type="button"
            onClick={() => setTab('chat')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-slate-600'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Assistant IA
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-4">
        {confirmed && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Commande confirmée</p>
                <p className="mt-1 text-sm text-emerald-800">
                  {confirmed.quantite}× {confirmed.plat}
                  {confirmed.sauce ? ` (${confirmed.sauce})` : ''} — {confirmed.total} MAD
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-emerald-700 underline"
                  onClick={() => setConfirmed(null)}
                >
                  Commander autre chose
                </button>
              </div>
            </div>
          </div>
        )}

        {!canOrder && tab === 'order' && (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Ce restaurant a atteint sa limite de commandes pour aujourd&apos;hui (plan Free).
          </p>
        )}

        {tab === 'order' ? (
          <div className="space-y-4">
            {menusLoading ? (
              <p className="text-center text-sm text-slate-500">Chargement de la carte…</p>
            ) : menus.length === 0 ? (
              <p className="text-center text-sm text-slate-500">Aucun plat disponible pour cette période.</p>
            ) : (
              <div className="grid gap-3">
                {menus.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => {
                      setSelectedMenu(menu);
                      setSauce('');
                    }}
                    className={`flex gap-3 rounded-2xl border p-3 text-left transition-all ${
                      selectedMenu?.id === menu.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                        : 'border-slate-200/80 bg-white hover:border-primary/40'
                    }`}
                  >
                    {menu.image_url && (
                      <img
                        src={menu.image_url}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{menu.nom_plat}</p>
                      <p className="text-sm font-medium text-primary">{Number(menu.prix).toFixed(0)} MAD</p>
                      {menu.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{menu.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedMenu && (
              <div className="sticky bottom-0 space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                <p className="font-semibold text-slate-900">{selectedMenu.nom_plat}</p>

                {variantes.length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Sauce / option</label>
                    <select
                      className="input-field w-full"
                      value={sauce}
                      onChange={(e) => setSauce(e.target.value)}
                    >
                      <option value="">— Aucune —</option>
                      {variantes.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!variantes.length && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Sauce (optionnel)</label>
                    <input
                      className="input-field w-full"
                      value={sauce}
                      onChange={(e) => setSauce(e.target.value)}
                      placeholder="Ex: harissa, fromage…"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Quantité</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                      aria-label="Moins"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{quantite}</span>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setQuantite((q) => Math.min(20, q + 1))}
                      aria-label="Plus"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <input
                  className="input-field w-full text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note pour la cuisine (optionnel)"
                />

                <button
                  type="button"
                  disabled={submitting || !canOrder}
                  onClick={submitOrder}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95 disabled:opacity-50"
                >
                  {submitting ? 'Envoi…' : `Confirmer — ${total.toFixed(0)} MAD`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary to-accent text-white'
                        : 'border border-slate-200/80 bg-white text-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 flex gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-card">
              <input
                className="input-field flex-1 border-0 shadow-none focus:ring-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Votre message..."
              />
              <button
                type="button"
                onClick={sendMessage}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary-emphasis active:scale-95"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
