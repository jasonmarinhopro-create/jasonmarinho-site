// Photos des villes (Pexels, licence gratuite : https://www.pexels.com/license/), 09/11/2026.
// Fichier : /img/villes/<slug>.webp (560 x 700). Une ville absente n'a pas encore de photo vérifiée.
export const PHOTOS_VILLES = {
  'aix-en-provence': 31990451,
  'ajaccio': 19466911,
  'annecy': 29406500,
  'antibes': 15009981,
  'arcachon': 9750550,
  'avignon': 30037003,
  'bayonne': 12069411,
  'biarritz': 11843489,
  'bordeaux': 17356595,
  'brest': 8013898,
  'caen': 17276266,
  'cannes': 38606077,
  'carcassonne': 21937147,
  'chamonix': 30052814,
  'clermont-ferrand': 31040756,
  'colmar': 32406265,
  'deauville': 13598487,
  'dijon': 30763567,
  'etretat': 4708637,
  'lille': 12040634,
  'lyon': 5773238,
  'marseille': 15878303,
  'megeve': 19727171,
  'menton': 29942554,
  'montpellier': 7143883,
  'nantes': 29477010,
  'nice': 18071382,
  'nimes': 18688863,
  'paris': 165804,
  'quebec': 14339477,
  'reims': 17444784,
  'rennes': 30504816,
  'rouen': 34803488,
  'saint-malo': 29944728,
  'saint-tropez': 29851528,
  'sarlat': 7929678,
  'strasbourg': 12336578,
  'toulouse': 30753301,
  'vannes': 32574447,
  'versailles': 15546889,
}
export const pexelsUrl = id => `https://www.pexels.com/photo/${id}/`

// Photos Wikimedia Commons (10/11/2026) pour les villes sans photo Pexels :
// licence libre avec attribution, auteur et licence affichés sous la photo.
// Relevées par le workflow « Photos Commons » (scripts/photos-commons.mjs).
export const PHOTOS_COMMONS = {
  "amsterdam": {
    "page": "https://commons.wikimedia.org/wiki/File:Amsterdam_Canals_-_July_2006.jpg",
    "auteur": "Diliff",
    "licence": "CC BY 2.5"
  },
  "angers": {
    "page": "https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_d%27Angers,_South_view_20170611_1.jpg",
    "auteur": "DXR",
    "licence": "CC BY-SA 4.0"
  },
  "barcelone": {
    "page": "https://commons.wikimedia.org/wiki/File:Barcelona_Skyline_as_seen_from_Parc_G%C3%BCell.jpg",
    "auteur": "Chris Koerner from St. Louis, USA",
    "licence": "CC BY 2.0"
  },
  "bastia": {
    "page": "https://commons.wikimedia.org/wiki/File:Panorama_-_Vieux_port_(Bastia).jpg",
    "auteur": "Gzen92",
    "licence": "CC BY-SA 4.0"
  },
  "berlin": {
    "page": "https://commons.wikimedia.org/wiki/File:Berlin_Mitte_June_2023_01.jpg",
    "auteur": "ArildV",
    "licence": "CC BY-SA 4.0"
  },
  "bruxelles": {
    "page": "https://commons.wikimedia.org/wiki/File:Grand-Place,_Brussels_-_panorama,_June_2018.jpg",
    "auteur": "Celuici",
    "licence": "CC BY-SA 4.0"
  },
  "cassis": {
    "page": "https://commons.wikimedia.org/wiki/File:Cassis-Port.jpg",
    "auteur": "Jean-Christophe BENOIST",
    "licence": "CC BY 3.0"
  },
  "chambery": {
    "page": "https://commons.wikimedia.org/wiki/File:Panorama_Chamb%C3%A9ry_-_Rotonde_%2B_TGV.JPG",
    "auteur": "Florian Pépellin",
    "licence": "CC BY-SA 3.0"
  },
  "courchevel": {
    "page": "https://commons.wikimedia.org/wiki/File:Altiport_de_Courchevel_et_panorama.jpg",
    "auteur": "Piponwa",
    "licence": "CC BY-SA 3.0"
  },
  "dinard": {
    "page": "https://commons.wikimedia.org/wiki/File:Dinard_Beach_Panorama,_Brittany,_France_-_July_2011.jpg",
    "auteur": "Diliff",
    "licence": "CC BY-SA 3.0"
  },
  "epernay": {
    "page": "https://commons.wikimedia.org/wiki/File:%C3%89pernay,_h%C3%B4tel_de_ville_(01).jpg",
    "auteur": "",
    "licence": "Public domain"
  },
  "florence": {
    "page": "https://commons.wikimedia.org/wiki/File:Ponte_Vecchio_at_dusk_1.JPG",
    "auteur": "Martin Falbisoner",
    "licence": "CC BY-SA 3.0"
  },
  "funchal": {
    "page": "https://commons.wikimedia.org/wiki/File:Funchal,_Jardim_Bot%C3%A2nico_da_Madeira_(View_of_Funchal_from_Jardim_Bot%C3%A2nico).jpg",
    "auteur": "Dr. Thomas Liptak",
    "licence": "CC BY-SA 4.0"
  },
  "honfleur": {
    "page": "https://commons.wikimedia.org/wiki/File:Honfleur_panorama_at_night.jpg",
    "auteur": "Andrés Nieto Porras",
    "licence": "CC BY-SA 2.0"
  },
  "la-baule": {
    "page": "https://commons.wikimedia.org/wiki/File:Plage_Baule_-_La_Baule-Escoublac_(FR44)_-_2022-09-17_-_3.jpg",
    "auteur": "Chabe01",
    "licence": "CC BY-SA 4.0"
  },
  "la-rochelle": {
    "page": "https://commons.wikimedia.org/wiki/File:Entrance_La_Rochelle_old_harbor.jpg",
    "auteur": "Jebulon",
    "licence": "CC0"
  },
  "le-mans": {
    "page": "https://commons.wikimedia.org/wiki/File:Le_Mans_-_Cite_Plantagenet_01.jpg",
    "auteur": "Selbymay",
    "licence": "CC BY-SA 3.0"
  },
  "le-touquet": {
    "page": "https://commons.wikimedia.org/wiki/File:%C3%89glise_Sainte-Jeanne-d%27Arc_(Le_Touquet-Paris-Plage).jpg",
    "auteur": "Gzen92",
    "licence": "CC BY-SA 4.0"
  },
  "les-sables-d-olonne": {
    "page": "https://commons.wikimedia.org/wiki/File:Gare_des_Sables_d%27Olonne_(a%C3%A9rien_2010).JPG",
    "auteur": "Florian Pépellin",
    "licence": "CC BY-SA 3.0"
  },
  "lisbonne": {
    "page": "https://commons.wikimedia.org/wiki/File:Convento_do_Carmo_-_Lisbon_-_Portugal_-_02.jpg",
    "auteur": "NorbertNagel",
    "licence": "CC BY-SA 4.0"
  },
  "madrid": {
    "page": "https://commons.wikimedia.org/wiki/File:Palacio_de_Comunicaciones_-_47.jpg",
    "auteur": "Carlos Delgado",
    "licence": "CC BY-SA 3.0"
  },
  "metz": {
    "page": "https://commons.wikimedia.org/wiki/File:20201017_Porte_des_Allemands_Metz_03.jpg",
    "auteur": "Flocci Nivis",
    "licence": "CC BY 4.0"
  },
  "munich": {
    "page": "https://commons.wikimedia.org/wiki/File:Nymphenburger_Schloss_at_sunset.JPG",
    "auteur": "Martin Falbisoner",
    "licence": "CC BY-SA 3.0"
  },
  "nancy": {
    "page": "https://commons.wikimedia.org/wiki/File:Nancy_Porte_Here_BW_2015-07-18_13-45-47.jpg",
    "auteur": "Berthold Werner",
    "licence": "CC BY-SA 3.0"
  },
  "perpignan": {
    "page": "https://commons.wikimedia.org/wiki/File:Place_de_la_R%C3%A9publique_Pano_2.jpg",
    "auteur": "Christophe Marcheux",
    "licence": "CC BY-SA 3.0"
  },
  "poitiers": {
    "page": "https://commons.wikimedia.org/wiki/File:Poitiers_ND_Tympan_2012.jpg",
    "auteur": "",
    "licence": "CC BY-SA 3.0"
  },
  "porto": {
    "page": "https://commons.wikimedia.org/wiki/File:Douro_River_banks_with_Porto_Cathedral_in_the_background_in_Porto,_Portugal.jpg",
    "auteur": "ArielSL98",
    "licence": "CC BY-SA 4.0"
  },
  "rome": {
    "page": "https://commons.wikimedia.org/wiki/File:Forum_romanum_6k_(5760x2097).jpg",
    "auteur": "BeBo86",
    "licence": "CC BY-SA 3.0"
  },
  "sete": {
    "page": "https://commons.wikimedia.org/wiki/File:Sete_pano_port.jpg",
    "auteur": "Velvet",
    "licence": "CC BY-SA 3.0"
  },
  "seville": {
    "page": "https://commons.wikimedia.org/wiki/File:Plaza_de_Espa%C3%B1a_-_Seville,_Spain_-_DSC07654.JPG",
    "auteur": "Daderot",
    "licence": "CC0"
  },
  "troyes": {
    "page": "https://commons.wikimedia.org/wiki/File:Troyes_rue_Emile_Zola_maisons_pans_de_bois.jpg",
    "auteur": "Myrabella",
    "licence": "CC BY-SA 4.0"
  },
  "val-d-isere": {
    "page": "https://commons.wikimedia.org/wiki/File:Place_des_Dolomites_%C3%A0_Val-d%27Is%C3%A8re_en_%C3%A9t%C3%A9_(juillet_2022).JPG",
    "auteur": "Florian Pépellin",
    "licence": "CC BY-SA 4.0"
  },
  "valence": {
    "page": "https://commons.wikimedia.org/wiki/File:Hemispheric_Twilight_-_Valencia,_Spain_-_Jan_2007.jpg",
    "auteur": "Diliff",
    "licence": "CC BY-SA 3.0"
  },
  "vienne": {
    "page": "https://commons.wikimedia.org/wiki/File:Palacio_Belvedere,_Viena,_Austria,_2020-02-01,_DD_93-95_HDR.jpg",
    "auteur": "Diego Delso",
    "licence": "CC BY-SA 4.0"
  }
}


/** La ville a-t-elle une photo (Pexels ou Commons) ? */
export const aPhoto = slug => !!(PHOTOS_VILLES[slug] || PHOTOS_COMMONS[slug])

const escC = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function licenceUrl(l) {
  const m = String(l).match(/^CC (BY(?:-SA)?) ([0-9.]+)/i)
  if (m) return `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/`
  if (/^CC0/i.test(l)) return 'https://creativecommons.org/publicdomain/zero/1.0/'
  return null
}
/** Crédit HTML d'une photo : « Pexels » ou « Auteur, CC BY-SA 4.0, Wikimedia Commons » */
export function creditPhoto(slug) {
  if (PHOTOS_VILLES[slug]) return `<a href="https://www.pexels.com/photo/${PHOTOS_VILLES[slug]}/" target="_blank" rel="noopener">Pexels</a>`
  const c = PHOTOS_COMMONS[slug]
  if (!c) return ''
  const lu = licenceUrl(c.licence)
  return `${c.auteur ? `${escC(c.auteur)}, ` : ''}${lu ? `<a href="${lu}" target="_blank" rel="noopener">${escC(c.licence)}</a>` : escC(c.licence)}, <a href="${escC(c.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>`
}
