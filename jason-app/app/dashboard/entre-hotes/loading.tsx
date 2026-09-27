// Squelette de chargement des onglets Entre Hôtes (Forum, Groupes Facebook,
// Écosystème). Sans ce fichier, le seul squelette était celui de /dashboard,
// placé AU-DESSUS de ce layout : en changeant d'onglet, Next ne l'affichait
// pas et l'écran restait figé jusqu'à la fin du rendu serveur (le forum fait
// ~23 requêtes). Ici, le titre et les onglets restent affichés et la zone de
// contenu montre tout de suite le squelette du forum.
export { default } from '@/app/dashboard/chez-nous/loading'
