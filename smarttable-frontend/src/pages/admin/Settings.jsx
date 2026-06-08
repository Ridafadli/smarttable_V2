import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Save } from 'lucide-react';
import api from '../../api/axios';
import AdminShell from '../../components/layout/AdminShell';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import useAuthStore from '../../store/authStore';

export default function Settings() {
  const toast = useToast();
  const { restaurant, setRestaurant } = useAuthStore();
  const [form, setForm] = useState({
    nom: '',
    whatsapp: '',
    adresse: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setForm({
        nom: restaurant.nom || '',
        whatsapp: restaurant.whatsapp || '',
        adresse: restaurant.adresse || '',
      });
      setLogoPreview(restaurant.logo || null);
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

  return (
    <AdminShell title="Paramètres">
      <PageHeader
        title="Paramètres du restaurant"
        subtitle="Logo, coordonnées et identité affichés sur les QR codes et l'expérience client."
      />

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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
          <Link to="/subscription" className="text-sm font-medium text-primary hover:underline">
            Voir mon abonnement →
          </Link>
        </div>
      </form>
    </AdminShell>
  );
}
