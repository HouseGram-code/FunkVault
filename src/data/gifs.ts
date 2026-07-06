export interface Gif {
  /** Tenor post id (used with https://tenor.com/embed/<id>) */
  id: string
  /** width / height aspect ratio from Tenor */
  aspect: number
  label: string
}

/** FNF-flavoured Tenor GIFs shown in the comment picker. */
export const GIFS: Gif[] = [
  { id: "21357154", aspect: 0.984375, label: "Tankman FNF" },
  { id: "1215007993101665827", aspect: 1.33871, label: "BF Griddy" },
  { id: "4870881521608425634", aspect: 0.694779, label: "Pibby Apocalipse" },
  { id: "18180173794220611879", aspect: 1.09211, label: "Ozkantr Twi" },
  { id: "6395306486764578496", aspect: 1.19712, label: "Friendship Weekend" },
  { id: "13972412779505503324", aspect: 0.65261, label: "Sonic.exe" },
  { id: "5945257764045339613", aspect: 0.934579, label: "Sonic" },
  { id: "24433316", aspect: 1.33333, label: "BF Shrug" },
  { id: "11444816873627717528", aspect: 0.801205, label: "FNF GF" },
  { id: "10681998178705441706", aspect: 1, label: "FNF Girlfriend" },
  { id: "15530363800616659473", aspect: 0.745763, label: "Girlfriend" },
  { id: "23940313", aspect: 0.671875, label: "BF Potato" },
  { id: "26935291", aspect: 1.50943, label: "Friday Night Funkin" },
  { id: "25270530", aspect: 0.83125, label: "Pibby Finn" },
  { id: "2600307769620597914", aspect: 1.76596, label: "Pibby 67" },
  { id: "20451033", aspect: 0.625, label: "Senpai" },
  { id: "12612238168488392613", aspect: 1, label: "FNF GF Mobile" },
  { id: "4860124", aspect: 1.01667, label: "Pout" },
  { id: "17430723762970880094", aspect: 1, label: "Utya Duck" },
  { id: "8084791633764427096", aspect: 0.945, label: "RKN" },
]
