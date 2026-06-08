import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bot,
  Calendar,
  Crown,
  ImagePlus,
  MessageCircle,
  Save,
  Trash2,
  Webhook,
} from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/menus/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import useAuthStore from '../../store/authStore';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const DEFAULT_HORAIRES = JOURS.map((jour) => ({
  jour,
  ouvert: jour !== 'Dimanche',
  debut: '11:00',
  fin: '23:00',
}));

function horairesKey(id) {
  return `smarttable_horaires_${id}`;
}

export default function Settings() {
  const toast = useToast();
  const { restaurant, setRestaurant, logout } = useAuthStore();
  const [form, setForm] = useState({ nom: '', whatsapp: '', adresse: '' });
  const [horaires, setHoraires] = useState(DEFAULT_HORAIRES);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then((r) => r.data),
    staleTime: 120_000,
    retry: false,
  });

  useEffect(() => {
    if (restaurant) {
      setForm({
        nom: restaurant.nom || '',
        whatsapp: restaurant.whatsapp || '',
        adresse: restaurant.adresse || '',
      });
      setLogoPreview(restaurant.logo || null);
      const saved = localStorage.getItem(horairesKey(restaurant.id));
      if (saved) {
        try {
          setHoraires(JSON.parse(saved));
        } catch {
          setHoraires(DEFAULT_HORAIRES);
        }
      }
    }
  }, [restaurant]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      body.append('nom', form.nom);
      body.append('whatsapp', form.whatsapp || '');
      body.append('adresse', form.adresse || '');
      if (logoFile) body.append('logo', logoFile);
      if (removeLogo) body.append('remove_logo', '1');

      const { data } = await api.post('/profile', body);
      setRestaurant(data.restaurant);
      if (restaurant?.id) {
        localStorage.setItem(horairesKey(restaurant.id), JSON.stringify(horaires));
      }
      toast.success(data.message);
      if (data.regenerate_qr) {
        toast.info('Régénérez les QR codes dans Tables pour afficher le nouveau logo.');
      }
      setLogoFile(null);
      setRemoveLogo(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== restaurant?.nom) return;
    try {
      await logout();
      toast.success('Compte désactivé. Contactez le support pour suppression définitive.');
      setDeleteOpen(false);
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const planLabel = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' }[restaurant?.plan] || restaurant?.plan;
  const planExpires = restaurant?.plan_expires_at
    ? new Date(restaurant.plan_expires_at).toLocaleDateString('fr-FR')
    : null;

  const StatusDot = ({ ok }) => (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
  );

  return (
    <AdminShell title="Paramètres">
      <PageHeader
        title="Paramètres du restaurant"
        subtitle="Logo, coordonnées, horaires et intégrations."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3">
        <Crown className="h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Plan actuel : {planLabel}
          </p>
          {planExpires && (
            <p className="text-xs text-amber-700">Expire le {planExpires}</p>
          )}
        </div>
        <Link to="/subscription" className="ml-auto text-sm font-medium text-amber-800 hover:underline">
          Gérer l&apos;abonnement →
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
        <section className="surface-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Logo du restaurant</h2>
          <p className="mb-4 text-xs text-slate-500">
            Ce logo apparaît au centre de chaque QR code généré. Formats : JPG, PNG, WebP (max 2 Mo).
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900">
              {logoPreview && !removeLogo ? (
                <img src={logoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-8 w-8 text-slate-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
                Choisir une image
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              {logoPreview && !removeLogo && (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => {
                    setRemoveLogo(true);
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                >
                  Supprimer le logo
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="surface-card space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nom du restaurant</label>
            <input
              className="input-field w-full"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">WhatsApp (notifications Pro)</label>
            <input
              className="input-field w-full"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              placeholder="+212600000000"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Adresse</label>
            <input
              className="input-field w-full"
              value={form.adresse}
              onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
            />
          </div>
          <p className="text-xs text-slate-500">Email : {restaurant?.email}</p>
        </section>

        <section className="surface-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Calendar className="h-4 w-4 text-primary" />
            Horaires d&apos;ouverture
          </h2>
          <div className="space-y-3">
            {horaires.map((h, idx) => (
              <div key={h.jour} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-3">
                <label className="flex w-28 items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={h.ouvert}
                    onChange={(e) => {
                      const next = [...horaires];
                      next[idx] = { ...h, ouvert: e.target.checked };
                      setHoraires(next);
                    }}
                    className="rounded border-slate-300"
                  />
                  {h.jour}
                </label>
                {h.ouvert ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.debut}
                      onChange={(e) => {
                        const next = [...horaires];
                        next[idx] = { ...h, debut: e.target.value };
                        setHoraires(next);
                      }}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="time"
                      value={h.fin}
                      onChange={(e) => {
                        const next = [...horaires];
                        next[idx] = { ...h, fin: e.target.value };
                        setHoraires(next);
                      }}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Fermé</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Intégrations</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-slate-700">
                <MessageCircle className="h-4 w-4" />
                WhatsApp (Twilio)
              </span>
              <span className="flex items-center gap-2 text-xs font-medium">
                <StatusDot ok={health?.services?.whatsapp === 'configured'} />
                {health?.services?.whatsapp === 'configured' ? 'Configuré' : 'Non configuré'}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-slate-700">
                <Webhook className="h-4 w-4" />
                n8n Webhook
              </span>
              <span className="flex items-center gap-2 text-xs font-medium">
                <StatusDot ok={health?.services?.n8n === 'configured'} />
                {health?.services?.n8n === 'configured' ? 'Configuré' : 'Non configuré'}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-slate-700">
                <Bot className="h-4 w-4" />
                OpenAI
              </span>
              <span className="flex items-center gap-2 text-xs font-medium">
                <StatusDot ok={health?.services?.openai === 'configured'} />
                {health?.services?.openai === 'configured' ? 'Configuré' : 'Non configuré'}
              </span>
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>

      <section className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-red-800">
          <AlertTriangle className="h-4 w-4" />
          Zone de danger
        </h2>
        <p className="mt-2 text-xs text-red-700">
          La suppression du compte est irréversible. Toutes vos données seront perdues.
        </p>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer mon compte
        </button>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title="Supprimer votre compte ?"
        itemName={restaurant?.nom}
        message={`Tapez « ${restaurant?.nom} » pour confirmer la suppression.`}
        confirmLabel="Supprimer définitivement"
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteConfirm('');
        }}
        onConfirm={handleDeleteAccount}
        closeOnBackdrop={false}
      />
      {deleteOpen && (
        <div className="mx-auto mt-2 max-w-xl">
          <input
            className="input-field w-full"
            placeholder={restaurant?.nom}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
        </div>
      )}
    </AdminShell>
  );
}
