import * as React from 'react';
import { Linking, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Check, Crown, Sparkles } from 'lucide-react-native';
import { Screen } from '~/components/layout/Screen';
import { SubScreenHeader } from '~/components/layout/SubScreenHeader';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Text } from '~/components/ui/Text';
import { useBillingStatus, useCheckout } from '~/hooks/billing';
import type { PlanPayant } from '~/services/api/billing';
import { colors } from '~/theme/colors';

type PlanInfo = {
  id: PlanPayant;
  nom: string;
  prix: string;
  atouts: string[];
};

// Offres payantes Kizzo (P33). Le prix réel est porté par Stripe ; affiché ici
// à titre indicatif côté UI.
const PLANS: PlanInfo[] = [
  {
    id: 'famille',
    nom: 'Famille',
    prix: '4,99 €/mois',
    atouts: ["Jusqu'à 3 enfants", 'Quiz IA illimités', 'Contrôles parentaux complets'],
  },
  {
    id: 'famille_plus',
    nom: 'Famille+',
    prix: '8,99 €/mois',
    atouts: ['Enfants illimités', 'Rapports détaillés', 'Support prioritaire'],
  },
];

const PLAN_LABEL: Record<string, string> = {
  gratuit: 'Gratuit',
  famille: 'Famille',
  famille_plus: 'Famille+',
};

export const AbonnementScreen: React.FC = () => {
  const status = useBillingStatus();
  const checkout = useCheckout();
  const [pending, setPending] = React.useState<PlanPayant | null>(null);

  const souscrire = (plan: PlanPayant) => {
    setPending(plan);
    checkout.mutate(plan, {
      onSuccess: async ({ url }) => {
        // Ouvre la page de paiement Stripe hébergée (jamais de saisie carte dans l'app).
        const ok = await Linking.canOpenURL(url);
        if (ok) await Linking.openURL(url);
        else Toast.show({ type: 'error', text1: "Impossible d'ouvrir le paiement" });
      },
      onError: () => Toast.show({ type: 'error', text1: 'Échec de la création du paiement' }),
      onSettled: () => setPending(null),
    });
  };

  const planActuel = status.data?.plan ?? 'gratuit';
  const finPeriode = status.data?.finPeriode
    ? new Date(status.data.finPeriode).toLocaleDateString('fr-FR')
    : null;

  return (
    <Screen scroll noPadding>
      <SubScreenHeader title="Abonnement" subtitle="Gère ton offre Kizzo" />

      <View className="px-5 pb-10">
        {/* Plan actuel */}
        <Card className="mb-5 flex-row items-center">
          <Crown size={20} color={colors.orange} />
          <View className="ml-3 flex-1">
            <Text className="font-heading-semi text-[15px] text-kz-ink">
              Plan actuel : {PLAN_LABEL[planActuel] ?? planActuel}
            </Text>
            <Text className="text-[13px] text-kz-ink-muted">
              {status.isLoading
                ? 'Chargement…'
                : status.data?.actif
                  ? finPeriode
                    ? `Actif — renouvellement le ${finPeriode}`
                    : 'Actif'
                  : 'Aucun abonnement payant en cours'}
            </Text>
          </View>
        </Card>

        {/* Offres payantes */}
        {PLANS.map((plan) => {
          const estActuel = planActuel === plan.id && status.data?.actif;
          return (
            <Card key={plan.id} className="mb-4">
              <View className="flex-row items-center">
                <Sparkles size={18} color={colors.cyan} />
                <Text className="ml-2 font-heading-semi text-[16px] text-kz-ink">{plan.nom}</Text>
                <Text className="ml-auto font-heading-semi text-[15px] text-kz-cyan">
                  {plan.prix}
                </Text>
              </View>

              <View className="mt-3 gap-2">
                {plan.atouts.map((a) => (
                  <View key={a} className="flex-row items-center">
                    <Check size={15} color={colors.green} />
                    <Text className="ml-2 text-[13px] text-kz-ink-soft">{a}</Text>
                  </View>
                ))}
              </View>

              <Button
                className="mt-4"
                variant={plan.id === 'famille_plus' ? 'primary-orange' : 'default'}
                disabled={!!estActuel}
                loading={pending === plan.id}
                onPress={() => souscrire(plan.id)}
              >
                {estActuel ? 'Offre actuelle' : `Choisir ${plan.nom}`}
              </Button>
            </Card>
          );
        })}

        <Text className="mt-2 text-center text-[11px] text-kz-ink-muted">
          Paiement sécurisé par Stripe. Tu peux résilier à tout moment.
        </Text>
      </View>
    </Screen>
  );
};
