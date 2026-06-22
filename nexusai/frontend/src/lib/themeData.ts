export type ThemePreset = {
  id: string;
  name: string;
  bgUrl: string;
  textColor: string;
};

// Using Pollinations AI to dynamically generate high-quality, perfectly matching 4K/8K aesthetic backgrounds
const genUrl = (prompt: string) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=3840&height=2160&nologo=true`;

export const THEMES: ThemePreset[] = [
  { id: "system", name: "System Default", bgUrl: "", textColor: "" },
  { id: "light", name: "Light Mode", bgUrl: "", textColor: "" },
  { id: "dark", name: "Dark Mode", bgUrl: "", textColor: "" },
  { id: "theme-olivia", name: "Olivia Rodrigo", bgUrl: genUrl("Olivia Rodrigo Sour aesthetic purple grunge concert"), textColor: "white" },
  { id: "theme-backrooms", name: "Backrooms", bgUrl: genUrl("The Backrooms liminal space creepy yellow fluorescent corridor"), textColor: "white" },
  { id: "theme-graduation", name: "Happy Graduation", bgUrl: genUrl("Happy Graduation celebration throwing caps in the air sunny sky"), textColor: "white" },
  { id: "theme-deli", name: "Deli Boys", bgUrl: genUrl("New York deli sandwich shop neon sign aesthetic night"), textColor: "white" },
  { id: "theme-maluma", name: "Maluma", bgUrl: genUrl("Maluma tropical colombia neon pink concert aesthetic"), textColor: "white" },
  { id: "theme-mandalorian", name: "Mandalorian & Grogu", bgUrl: genUrl("Sci-fi desert planet space stars cinematic aesthetic"), textColor: "white" },
  { id: "theme-mothersday", name: "Mother's Day", bgUrl: genUrl("Mothers Day beautiful soft pink spring flowers bouquet"), textColor: "white" },
  { id: "theme-prada", name: "The Devil Wears Prada 2", bgUrl: genUrl("The Devil Wears Prada high fashion new york runway aesthetic"), textColor: "white" },
  { id: "theme-pixel", name: "Pixel Dreamscape", bgUrl: genUrl("Pixel art dreamscape synthwave retrowave landscape 8bit"), textColor: "white" },
  { id: "theme-coachella", name: "Coachella 2026", bgUrl: genUrl("Coachella desert music festival ferris wheel sunset aesthetic"), textColor: "white" },
  { id: "theme-cats", name: "Cats", bgUrl: genUrl("Cute aesthetic cats playing in a sunlit room"), textColor: "white" },
  { id: "theme-dogs", name: "Dogs", bgUrl: genUrl("Cute aesthetic golden retriever dogs running in a field"), textColor: "white" },
  { id: "theme-bts", name: "BTS", bgUrl: genUrl("BTS army purple galaxy concert stadium lights aesthetic"), textColor: "white" },
  { id: "theme-skygarden", name: "Sky Garden", bgUrl: genUrl("Futuristic city sky garden floating plants aesthetic"), textColor: "white" },
  { id: "theme-basketball", name: "Basketball", bgUrl: genUrl("Cinematic basketball court hoop under dramatic stadium lights"), textColor: "white" },
  { id: "theme-blackpink", name: "BLACKPINK", bgUrl: genUrl("BLACKPINK black and neon pink stage concert aesthetic"), textColor: "white" },
  { id: "theme-megan", name: "Megan Moroney", bgUrl: genUrl("Megan Moroney country music cowboy hat acoustic guitar aesthetic"), textColor: "white" },
  { id: "theme-horse", name: "Year of the Horse", bgUrl: genUrl("Majestic wild horse galloping cinematic lighting"), textColor: "white" },
  { id: "theme-valentines", name: "Valentine's Day", bgUrl: genUrl("Valentines day romance red glowing hearts aesthetic"), textColor: "white" },
  { id: "theme-simpsons", name: "The Simpsons", bgUrl: genUrl("Bright yellow cartoon aesthetic with fluffy white clouds blue sky"), textColor: "white" },
  { id: "theme-football", name: "Football", bgUrl: genUrl("Cinematic soccer football field stadium under bright lights"), textColor: "white" },
];
