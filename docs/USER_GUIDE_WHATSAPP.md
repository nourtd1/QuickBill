# Guide WhatsApp – QuickBill

## Vue d'ensemble

QuickBill permet d'envoyer des factures et devis par WhatsApp et d'automatiser les relances pour les factures en retard.

---

## Envoi manuel

1. **Depuis une facture** : Ouvrez une facture → bouton **Partager** / **WhatsApp**.
2. Le lien de la facture (portail public) est préparé et le client reçoit un message avec le lien.
3. Assurez-vous que le client a un numéro de téléphone au format international (ex. +33 6 12 34 56 78).

---

## Relances automatiques

1. Allez dans **Paramètres** → **Relances** (Reminders).
2. **Activer les relances** : active ou désactive l’envoi automatique.
3. **Délais** : configurez après combien de jours une facture impayée déclenche une relance (ex. 3, 7, 14 jours).
4. **Message** : personnalisez le texte envoyé au client (variables possibles : nom client, montant, numéro de facture).
5. Les relances sont envoyées selon la planification configurée (cron / tâche en arrière-plan).

---

## Statistiques WhatsApp

- **Où** : **Activité** / **Stats** → **WhatsApp Stats** (ou depuis le menu Analytics).
- **Contenu** :
  - **Total envoyé** : nombre total de messages WhatsApp (partages + relances).
  - **Partages** : envois manuels de factures/devis.
  - **Relances** : envois automatiques de relances.
  - **Messages par mois** : graphique en barres sur les 6 derniers mois.
  - **Efficacité des relances** : part des relances dans le total des messages.
  - **Activité récente** : derniers envois avec date et type.

---

## Configuration recommandée

- **Numéros** : toujours en format international (indicatif pays + numéro sans 0 initial).
- **Relances** : délai conseillé 7 jours après échéance, puis 7 jours entre chaque relance.
- **Message de relance** : rester court, rappeler le montant et le lien de paiement si vous utilisez le portail client.

---

## Dépannage

- **Le client ne reçoit pas le message** : vérifier le numéro, le format et que WhatsApp est bien utilisé sur ce numéro.
- **Relances non envoyées** : vérifier que les relances sont activées dans Paramètres → Relances et que la facture est bien « en retard » (date d’échéance dépassée).
- **Historique vide** : les envois sont enregistrés à partir de la mise en place de la table `whatsapp_messages` ; les anciens envois ne sont pas rétro-activement loggés.

---

**Version** : 1.0 – Mars 2026
