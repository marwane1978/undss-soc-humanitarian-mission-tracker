import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Mail, CheckCircle, Globe } from "lucide-react";
import { useLanguage } from "@/components/language/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createNotification, NotificationTypes, NotificationPriority } from "@/components/notifications/NotificationService";

export default function AccessDenied({ currentUser: propCurrentUser }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(propCurrentUser);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: () => base44.entities.Country.list(),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["userProfiles"],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser) {
        const user = await base44.auth.me();
        setCurrentUser(user);
      }
      
      // Vérifier si l'utilisateur a déjà un profil avec un pays mais pas encore activé
      const profile = userProfiles.find(p => p.user_email === (currentUser?.email || propCurrentUser?.email));
      if (profile?.assigned_country_id && !profile?.is_active) {
        setSelectedCountry(profile.assigned_country_id);
        setSubmitted(true);
      }
    };
    loadUser();
  }, [userProfiles, currentUser, propCurrentUser]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !selectedCountry) return;

      // Créer ou mettre à jour le profil utilisateur avec is_active: false
      const existingProfile = userProfiles.find(p => p.user_email === currentUser.email);
      
      if (existingProfile) {
        await base44.entities.UserProfile.update(existingProfile.id, {
          assigned_country_id: selectedCountry,
          is_active: false,
        });
      } else {
        await base44.entities.UserProfile.create({
          user_email: currentUser.email,
          user_full_name: currentUser.full_name,
          assigned_country_id: selectedCountry,
          is_active: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfiles"] });
      setSubmitted(true);
      toast.success(t('accessDenied.requestSent') || "Demande envoyée avec succès");
    },
    onError: (error) => {
      toast.error(t('errors.generic') || "Une erreur s'est produite");
      console.error(error);
    },
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-green-200 shadow-2xl">
          <CardContent className="pt-12 pb-10 text-center px-8">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-6">
              Request sent
            </h1>
            
            <p className="text-slate-600 mb-8 text-base leading-relaxed">
              Administrators have been notified of your request. You will receive an email when your account is activated.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
              <p className="text-base text-blue-900">
                <span className="font-semibold text-blue-700">Selected country:</span>{" "}
                <span className="font-medium">{countries.find(c => c.id === selectedCountry)?.name}</span>
              </p>
            </div>

            <Button 
              variant="outline" 
              className="mt-4 px-12 py-5 text-base"
              onClick={() => {
                base44.auth.logout();
              }}
            >
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-2xl">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Globe className="w-12 h-12 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4 text-center">
            Welcome!
          </h1>
          
          <p className="text-slate-600 mb-8 text-center text-base">
            Select your country of assignment to continue
          </p>

          <div className="space-y-5">
            <div>
              <Label htmlFor="country" className="text-base font-semibold text-slate-900 mb-2 block">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger id="country" className="h-12 text-base">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                After your selection, the administrators of this country will be notified and can activate your account.
              </p>
            </div>

            <Button 
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-base"
              disabled={!selectedCountry || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? "Sending..." : "Send request"}
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-12 text-base font-medium"
              onClick={() => base44.auth.logout()}
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}