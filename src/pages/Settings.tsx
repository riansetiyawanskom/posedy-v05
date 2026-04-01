import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Store } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";

export default function Settings() {
  const { settings, isLoading, updateSettings, isUpdating } = useStoreSettings();
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (settings) {
      setStoreName(settings.store_name);
      setPhone(settings.phone ?? "");
      setAddress(settings.address ?? "");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings({ store_name: storeName, phone, address });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Kelola profil toko yang tampil di aplikasi dan struk.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Profil Toko
            </CardTitle>
            <CardDescription>
              Nama toko akan ditampilkan di aplikasi POS dan struk. Nomor HP/WA dan alamat hanya ditampilkan di struk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nama Toko</Label>
              <Input
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Masukkan nama toko"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. HP / WhatsApp</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Masukkan alamat toko"
                rows={3}
              />
            </div>
            <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Pengaturan
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
