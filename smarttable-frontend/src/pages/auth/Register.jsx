import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuthStore from '../../store/authStore';

export default function Register() {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    whatsapp: '',
    mot_de_passe: '',
    mot_de_passe_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.mot_de_passe !== form.mot_de_passe_confirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const response = await import('../../api/axios').then((m) =>
        m.default.post('/register', form)
      );
      localStorage.setItem('token', response.data.token);
      await login(form.email, form.mot_de_passe);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Créer votre compte" subtitle="Démarrez avec SmartTable en quelques minutes">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nom du restaurant" name="nom" value={form.nom} onChange={handleChange} placeholder="Restaurant Al Baraka" required />
        <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@restaurant.com" required />
        <Input label="WhatsApp (optionnel)" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+212600000000" />
        <Input label="Mot de passe" name="mot_de_passe" type="password" value={form.mot_de_passe} onChange={handleChange} required />
        <Input label="Confirmer le mot de passe" name="mot_de_passe_confirmation" type="password" value={form.mot_de_passe_confirmation} onChange={handleChange} required />
        <Button type="submit" className="mt-2 w-full" size="lg" loading={loading} icon={ArrowRight}>
          Créer mon restaurant
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}
