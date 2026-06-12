import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, fonts } from '@core/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const POLICY_SECTIONS = [
  {
    title: '1. Informações Gerais',
    content:
      'O aplicativo Álbum Copa 2026 ("nós", "nosso" ou "aplicativo") está comprometido com a proteção da sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018).',
  },
  {
    title: '2. Dados Coletados',
    content:
      'Para oferecer a funcionalidade de álbum digital sincronizado, coletamos os seguintes dados pessoais:\n\n• E-mail: utilizado para identificar sua conta e enviar comunicações relacionadas à exclusão da conta.\n• Nome: obtido do seu perfil Google para personalizar a experiência.\n• Avatar (URL): imagem do perfil Google, armazenada apenas como referência.\n• Coleção de figurinhas: registro de figurinhas possuídas, trocadas e álbuns criados.\n\nNão coletamos dados sensíveis, dados biométricos, informações de pagamento ou conteúdo de mensagens.',
  },
  {
    title: '3. Finalidade do Tratamento',
    content:
      'Seus dados são utilizados exclusivamente para:\n\n• Identificar você como usuário do aplicativo.\n• Sincronizar sua coleção de figurinhas entre dispositivos.\n• Permitir a funcionalidade de álbum digital.\n• Gerenciar solicitações de exclusão de conta.\n\nNão utilizamos seus dados para marketing, publicidade direcionada ou compartilhamento com terceiros.',
  },
  {
    title: '4. Período de Retenção',
    content:
      'Seus dados pessoais são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, seus dados serão permanentemente removidos após um período de carência de 30 (trinta) dias, durante o qual você pode cancelar a exclusão. Após esse período, todos os dados associados à sua conta serão irreversivelmente apagados.',
  },
  {
    title: '5. Base Legal',
    content:
      'O tratamento dos seus dados é realizado com base no seu consentimento (Art. 7º, I da LGPD), manifestado ao fazer login com sua conta Google e aceitar esta Política de Privacidade.',
  },
  {
    title: '6. Compartilhamento de Dados',
    content:
      'Não compartilhamos seus dados pessoais com terceiros. Utilizamos o Google Authentication apenas para validação de identidade — a Google não recebe seus dados de coleção. Os dados são armazenados no Supabase (plataforma de banco de dados como serviço), que opera dentro dos padrões de segurança da indústria.',
  },
  {
    title: '7. Direitos do Titular (Art. 18 LGPD)',
    content:
      'Você possui os seguintes direitos garantidos pela LGPD:\n\n• Acesso: solicitar uma cópia dos seus dados pessoais.\n• Correção: solicitar a correção de dados incompletos, inexatos ou desatualizados.\n• Exclusão: solicitar a exclusão dos seus dados (com período de carência de 30 dias).\n• Portabilidade: solicitar a transferência dos seus dados a outro fornecedor.\n• Revogação do consentimento: retirar seu consentimento a qualquer momento.\n\nPara exercer qualquer um desses direitos, entre em contato pelo e-mail: manera@kbase.com.br.',
  },
  {
    title: '8. Segurança dos Dados',
    content:
      'Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição, incluindo criptografia em trânsito (TLS) e políticas de acesso baseadas em função (Row-Level Security).',
  },
  {
    title: '9. Alterações nesta Política',
    content:
      'Esta política pode ser atualizada periodicamente. Recomendamos que você revise esta página regularmente. Em caso de alterações significativas, notificaremos os usuários por meio do aplicativo ou por e-mail.',
  },
  {
    title: '10. Contato do Encarregado (DPO)',
    content:
      'Para questões relacionadas à privacidade ou para exercer seus direitos LGPD, entre em contato com nosso Encarregado de Proteção de Dados (DPO):\n\nE-mail: manera@kbase.com.br\n\nResponderemos no prazo máximo de 15 (quinze) dias úteis.',
  },
];

export function PrivacyPolicyModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Política de Privacidade</Text>
          <TouchableOpacity onPress={onClose} testID="close-button">
            <Text style={styles.closeBtn}>Fechar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.lastUpdated}>
            Álbum Copa 2026 — Última atualização: 10 de junho de 2026
          </Text>

          {POLICY_SECTIONS.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionText}>{section.content}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.ink900,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.tx,
  },
  closeBtn: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.gold,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  lastUpdated: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.txFaint,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.txMut,
    lineHeight: 22,
  },
});
