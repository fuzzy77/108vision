import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { MODEL_TIERS } from '@/lib/constants';
import { Key, Database, Globe, Bell, Shield, Save } from 'lucide-react';

function SettingsPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  const { theme, setTheme } = useUIStore();

  const [deepseekKey, setDeepseekKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('balanced');
  const [customDomain, setCustomDomain] = useState('');
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [budgetAlert, setBudgetAlert] = useState('500');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Impostazioni' }]);
  }, [setBreadcrumbs]);

  const handleSave = () => {
    // API call would go here
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Impostazioni</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configurazione della piattaforma</p>
      </div>

      {/* LLM Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Chiavi API LLM</CardTitle>
          </div>
          <CardDescription>Le chiavi vengono salvate in modo sicuro e non sono mai visibili dopo il salvataggio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="DeepSeek API Key"
            type="password"
            value={deepseekKey}
            onChange={(e) => setDeepseekKey(e.target.value)}
            placeholder="sk-..."
            helperText="Usata per il tier Veloce"
          />
          <Input
            label="Anthropic API Key"
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder="sk-ant-..."
            helperText="Usata per i tier Bilanciato e Potente (Claude)"
          />
          <Input
            label="OpenAI API Key"
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-..."
            helperText="Fallback alternativo (GPT-4o)"
          />
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4" /> Salva chiavi
          </Button>
        </CardContent>
      </Card>

      {/* Default preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Preferenze modello</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="Modello predefinito per nuovi agenti"
            options={Object.entries(MODEL_TIERS).map(([key, val]) => ({
              value: key,
              label: `${val.label} — ${val.description}`,
            }))}
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
          />
          <Input
            label="Soglia budget mensile globale"
            type="number"
            value={budgetAlert}
            onChange={(e) => setBudgetAlert(e.target.value)}
            helperText="Ricevi un alert quando il costo totale supera questa soglia (EUR)"
          />
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Backup e sicurezza</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Switch
            checked={backupEnabled}
            onChange={setBackupEnabled}
            label="Backup automatico giornaliero"
            description="Esegui un backup completo ogni notte alle 03:00"
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tema</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scegli il tema dell&apos;interfaccia</p>
            </div>
            <Select
              options={[
                { value: 'light', label: 'Chiaro' },
                { value: 'dark', label: 'Scuro' },
              ]}
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">Dominio personalizzato</CardTitle>
          </div>
          <CardDescription>Configura un dominio personalizzato per il widget chat dei clienti</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Dominio"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="chat.tuazienda.it"
            helperText="Configura il CNAME nel DNS prima di attivare"
          />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-base">Notifiche</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Switch
            checked={emailNotifications}
            onChange={setEmailNotifications}
            label="Notifiche email"
            description="Ricevi email per alert budget, nuovi clienti e errori critici"
          />
          <Input
            label="Webhook URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/..."
            helperText="Ricevi notifiche anche via webhook (Slack, Teams, ecc.)"
          />
        </CardContent>
      </Card>

      {/* Save all */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4" /> Salva tutte le impostazioni
        </Button>
      </div>
    </div>
  );
}

export { SettingsPage };
