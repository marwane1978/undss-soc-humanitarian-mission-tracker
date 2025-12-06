import { createClient } from '@base44/sdk';

// Client Base44 SANS authentification obligatoire
export const base44 = createClient({
  appId: "69302759efd45f79207d6922",
  requiresAuth: false
});
