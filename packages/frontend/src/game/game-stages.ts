export type GameStage = Readonly<{
  numServers: number;
  possibleCodes: string[];
}>;

export type GameStages = Readonly<GameStage[]>;

export const gameStages: GameStages = Object.freeze([
  {
    numServers: 4,
    possibleCodes: [
      'bark',
      'bead',
      'bell',
      'book',
      'brick',
      'bush',
      'clay',
      'club',
      'coin',
      'crab',
      'crow',
      'disk',
      'fire',
      'flag',
      'flame',
      'fog',
      'fork',
      'glass',
      'glow',
      'grip',
      'hand',
      'hose',
      'jazz',
      'knot',
      'lace',
      'lamp',
      'leaf',
      'lime',
      'pearl',
      'pool',
      'rain',
      'rice',
      'river',
      'road',
      'rock',
      'roof',
      'room',
      'sand',
      'ship',
      'shoe',
      'silk',
      'sled',
      'star',
      'tool',
      'vine',
      'wave',
      'wind',
      'wolf',
    ],
  },
  {
    numServers: 2,
    possibleCodes: [
      'assembly',
      'colorful',
      'delicate',
      'disclose',
      'generous',
      'governor',
      'guidance',
      'highland',
      'mortgage',
      'leverage',
      'overseas',
      'persuade',
      'profound',
      'reliance',
      'renowned',
      'receiver',
      'scrutiny',
      'suburban',
      'surgical',
      'syndrome',
      'tangible',
      'turnover',
      'whatever',
      'warranty',
    ],
  },
  {
    numServers: 3,
    possibleCodes: [
      'aggregate',
      'darters',
      'deterred',
      'dreader',
      'greaser',
      'greatest',
      'homonym',
      'hymnbook',
      'monopoly',
      'olympion',
      'phylum',
      'pinky',
      'pumpkin',
      'polonium',
      'polygon',
      'regards',
      'restart',
      'retreat',
      'serrated',
      'stagger',
      'starter',
      'stressed',
      'tetrad',
    ],
  },
  {
    numServers: 4,
    possibleCodes: [
      'accumulation',
      'administration',
      'appreciation',
      'celebration',
      'characteristic',
      'circumference',
      'circumnavigate',
      'collaboration',
      'communication',
      'concentration',
      'configuration',
      'conglomeration',
      'consideration',
      'constellation',
      'consternation',
      'constitution',
      'contradiction',
      'counterbalance',
      'decaffeinated',
      'determination',
      'discombobulate',
      'discrimination',
      'disproportion',
      'documentation',
      'enlightenment',
      'entertainment',
      'experimentation',
      'illumination',
      'infrastructure',
      'interconnection',
      'interjection',
      'investigation',
      'misapprehension',
      'procrastinator',
      'recommendation',
      'reconstruction',
      'refrigerator',
      'rehabilitation',
      'representation',
      'reverberation',
      'revolutionary',
      'simultaneity',
      'specification',
      'superannuation',
      'superintendent',
      'transformation',
      'troubleshooter',
      'understanding',
    ],
  },
  {
    numServers: 1,
    possibleCodes: ['pneumonoultramicroscopicsilicovolcanoconiosis'],
  },
]);
