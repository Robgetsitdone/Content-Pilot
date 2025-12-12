import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Calendar, Eye, EyeOff, CheckCircle2, XCircle, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface InstagramSettings {
  accessToken: string;
  businessAccountId: string;
  igUserId: string;
  autoPublish: boolean;
  isConnected: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [igUserId, setIgUserId] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  
  const { data: settings, isLoading } = useQuery<InstagramSettings>({
    queryKey: ["/api/instagram/settings"],
    retry: false,
  });

  useEffect(() => {
    if (settings) {
      setAccessToken(settings.accessToken || "");
      setBusinessAccountId(settings.businessAccountId || "");
      setIgUserId(settings.igUserId || "");
      setAutoPublish(settings.autoPublish || false);
      setConnectionTested(settings.isConnected || false);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { accessToken: string; businessAccountId: string; igUserId: string; autoPublish: boolean }) => {
      return apiRequest("POST", "/api/instagram/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instagram/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your Instagram settings have been updated.",
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/instagram/test", {
        accessToken,
        businessAccountId,
      });
    },
    onSuccess: (data: any) => {
      setIgUserId(data.igUserId);
      setConnectionTested(true);
      toast({
        title: "Connection Successful",
        description: `Connected to Instagram as @${data.username}. Click Save Settings to complete setup.`,
        duration: 5000,
      });
    },
    onError: () => {
      setConnectionTested(false);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Instagram. Please check your credentials.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const handleSave = () => {
    if (!connectionTested && !igUserId) {
      toast({
        title: "Test Connection First",
        description: "Please test your connection before saving settings.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    saveMutation.mutate({ accessToken, businessAccountId, igUserId, autoPublish });
  };

  const handleTestConnection = () => {
    if (!accessToken || !businessAccountId) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both Access Token and Business Account ID.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    testMutation.mutate();
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <h1 className="font-display text-6xl md:text-7xl font-bold tracking-tighter text-white uppercase leading-none mb-4">
            Settings
          </h1>
          <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">
            Platform Connections & Configuration
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="border border-zinc-800 bg-black p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white uppercase">Instagram</h2>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                Connect your business account for auto-publishing
              </p>
            </div>
            <div className="ml-auto">
              {settings?.isConnected ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-mono text-sm uppercase">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-500">
                  <XCircle className="w-5 h-5" />
                  <span className="font-mono text-sm uppercase">Not Connected</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                Access Token
              </Label>
              <div className="relative">
                <Input
                  type={showAccessToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter your Instagram Graph API access token"
                  className="bg-zinc-950 border-zinc-800 text-white font-mono pr-10 rounded-none"
                  data-testid="input-access-token"
                />
                <button
                  type="button"
                  onClick={() => setShowAccessToken(!showAccessToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="font-mono text-[10px] text-zinc-600">
                Generate via Meta Developer Portal. Requires instagram_content_publish permission.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                Business Account ID
              </Label>
              <Input
                type="text"
                value={businessAccountId}
                onChange={(e) => setBusinessAccountId(e.target.value)}
                placeholder="Enter your Instagram Business Account ID"
                className="bg-zinc-950 border-zinc-800 text-white font-mono rounded-none"
                data-testid="input-business-account-id"
              />
              <p className="font-mono text-[10px] text-zinc-600">
                Found in Meta Business Suite under Business Settings &gt; Instagram Accounts.
              </p>
            </div>

            <div className="flex items-center justify-between border border-zinc-800 p-4 bg-zinc-950">
              <div>
                <Label className="font-mono text-sm text-white">Auto-Publish</Label>
                <p className="font-mono text-[10px] text-zinc-500">
                  Automatically publish posts to Instagram when scheduled time arrives
                </p>
              </div>
              <Switch
                checked={autoPublish}
                onCheckedChange={setAutoPublish}
                data-testid="switch-auto-publish"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testMutation.isPending}
                className="rounded-none border-zinc-700 hover:bg-zinc-800 font-mono uppercase tracking-wider"
                data-testid="button-test-connection"
              >
                {testMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Test Connection
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="rounded-none bg-white text-black hover:bg-zinc-200 font-mono uppercase tracking-wider"
                data-testid="button-save-settings"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 bg-black p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white uppercase">Google Calendar</h2>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                Calendar reminders for personal posts
              </p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-mono text-sm uppercase">Connected</span>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-4">
            <p className="font-mono text-sm text-zinc-400">
              Google Calendar is connected and will create reminders when posts with "Notify Me" enabled go live.
              This helps you engage with comments on personal posts (Family, Parenting) in real-time.
            </p>
          </div>
        </div>

        <div className="border border-dashed border-zinc-800 bg-black/50 p-8 text-center">
          <SettingsIcon className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold text-zinc-600 uppercase mb-2">More Integrations Coming Soon</h3>
          <p className="font-mono text-xs text-zinc-700">
            TikTok, YouTube Shorts, and more platforms will be available in future updates.
          </p>
        </div>
      </div>
    </Layout>
  );
}
