// Prénoms courants en France (sans accents, en minuscules), pour décider si
// le premier mot d'un nom de contact est vraiment un prénom. Sans cette liste,
// « The Paris Photographer » donnait « Bonjour The, » (29/09/2026). Un prénom
// absent de la liste donne simplement « Bonjour, » : c'est le bon réflexe,
// mieux vaut pas de prénom qu'un faux.
const NAMES = `
aaron abdel abdelkader abdallah adam adele adeline adrien agathe agnes ahmed aicha alain alan alban albane albert alex alexandra alexandre alexia alexis alfred alice alicia aline alison amandine amaury ambre amelie amine amir anais anastasia andre andrea angelique angele anna anne annabelle annie anthony antoine antonin apolline arnaud arthur astrid aubin audrey augustin aurelie aurelien aurore axel axelle aymeric
baptiste barbara basile bastien beatrice benedicte benjamin benoit bernard bertrand blandine blanche bruno
camille capucine carine carla carole caroline catherine cecile cedric celia celine chantal charles charlie charlotte chloe christelle christian christine christophe claire clara clarisse claude clement clemence clementine colette coline corentin corinne cyril cyrille
damien daniel danielle david delphine denis diane didier dimitri dominique dorian
edouard elena eliane elisa elise elodie eloise elsa emeline emilie emile emma emmanuel emmanuelle enzo eric erwan estelle etienne eugenie eva eve evelyne
fabien fabienne fabrice fanny farid fatima felix fernand flavie flora florence florent florian francis franck francoise francois frederic frederique
gabriel gabrielle gael gaelle gaetan gautier genevieve geoffrey georges gerald gerard ghislain gilbert gilles gisele gregoire gregory guillaume gustave guy
hadrien hakim halima hannah hector helene henri herve hugo hugues
ines irene isabelle
jacqueline jacques james jean jeanne jennifer jeremie jeremy jerome jessica joel johan johanna jonathan jordan joseph josephine josiane jules julia julie julien juliette justine
karim karine kathy kevin killian
laetitia laure laurence laurent lea leila leo leon leonie lionel lisa loic lola lorraine louis louise luc luca lucas lucie lucile ludivine ludovic
madeleine magali malik manon marc marceau marcel margaux margot marguerite maria marianne marie marine marion marius marjorie marlene martin martine mathieu mathilde matthias matthieu maud maurice maxime maximilien mehdi melanie melissa michel michele mickael mireille mohamed monique morgan morgane muriel mylene
nadia nadine nathalie nathan nicolas nina noah noe noemie nora norbert
octave odile olivia olivier oscar
pascal pascale patricia patrick paul paula pauline perrine philippe pierre pierrick
quentin
rachel rafael raphael raphaelle regis remi remy renaud rene richard robert robin rodolphe roger romain romane romeo rose roxane ruben
sabine sabrina salome samia samir samuel sandra sandrine sarah sebastien serge severine simon simone solene sonia sophie stephane stephanie steve sylvain sylvie
tatiana theo theophile thibault thibaut thierry thomas timothee tom tristan
valentin valentine valerie vanessa victor victoria vincent violette virginie vivien
william
xavier
yann yannick yasmine yoann yohan youssef yves yvette yvonne
zoe
`

const FIRST_NAMES = new Set(NAMES.split(/\s+/).filter(Boolean))

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Vrai si le mot (ou chaque partie d'un prénom composé : Jean-Luc) est un prénom connu. */
export function isKnownFirstName(word: string): boolean {
  const parts = fold(word).split('-').filter(Boolean)
  return parts.length > 0 && parts.every(p => FIRST_NAMES.has(p))
}
