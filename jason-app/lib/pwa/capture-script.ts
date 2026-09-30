// Pas de 'use client' : lu par le layout racine (composant serveur).

/** Script du <head> (layout racine) : garde la proposition d'installation pour plus tard */
export const INSTALL_CAPTURE_SCRIPT =
  "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__jmInstallEvt=e;window.dispatchEvent(new Event('jm-install-available'))});" +
  "window.addEventListener('appinstalled',function(){window.__jmInstallEvt=null;window.__jmInstalled=true;window.dispatchEvent(new Event('jm-app-installed'))});"
