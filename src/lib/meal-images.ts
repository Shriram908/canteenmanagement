import meal0 from "@/assets/meals/masala-dosa.jpg";
import meal1 from "@/assets/meals/idli.jpg";
import meal2 from "@/assets/meals/poha.jpg";
import meal3 from "@/assets/meals/upma.jpg";
import meal4 from "@/assets/meals/aloo-paratha.jpg";
import meal5 from "@/assets/meals/omelette.jpg";
import meal6 from "@/assets/meals/veg-thali.jpg";
import meal7 from "@/assets/meals/paneer-masala.jpg";
import meal8 from "@/assets/meals/dal-tadka.jpg";
import meal9 from "@/assets/meals/chole.jpg";
import meal10 from "@/assets/meals/veg-biryani.jpg";
import meal11 from "@/assets/meals/chicken-biryani.jpg";
import meal12 from "@/assets/meals/egg-curry.jpg";
import meal13 from "@/assets/meals/rajma.jpg";
import meal14 from "@/assets/meals/chapati.jpg";
import meal15 from "@/assets/meals/butter-naan.jpg";
import meal16 from "@/assets/meals/tandoori-roti.jpg";
import meal17 from "@/assets/meals/lachha.jpg";
import meal18 from "@/assets/meals/bhakri.jpg";
import meal19 from "@/assets/meals/tomato-soup.jpg";
import meal20 from "@/assets/meals/manchow.jpg";
import meal21 from "@/assets/meals/sweet-corn.jpg";
import meal22 from "@/assets/meals/rasam.jpg";
import meal23 from "@/assets/meals/chicken-soup.jpg";
import meal24 from "@/assets/meals/chai.jpg";
import meal25 from "@/assets/meals/filter-coffee.jpg";
import meal26 from "@/assets/meals/mango-lassi.jpg";
import meal27 from "@/assets/meals/lime-soda.jpg";
import meal28 from "@/assets/meals/buttermilk.jpg";
import meal29 from "@/assets/meals/gulab-jamun.jpg";
import meal30 from "@/assets/meals/kheer.jpg";
import meal31 from "@/assets/meals/shrikhand.jpg";
import meal32 from "@/assets/meals/fruit-bowl.jpg";

const normalizeMealName = (name: string) =>
  name.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const mealPhotos: Record<string, string> = {
  "masala dosa": meal0,
  "idli sambar": meal1,
  "kanda poha": meal2,
  "rava upma": meal3,
  "aloo paratha": meal4,
  "masala omelette": meal5,
  "veg thali": meal6,
  "paneer butter masala": meal7,
  "dal tadka with rice": meal8,
  "chole bhature": meal9,
  "veg biryani": meal10,
  "chicken biryani": meal11,
  "egg curry with rice": meal12,
  "rajma chawal": meal13,
  "chapati": meal14,
  "butter naan": meal15,
  "tandoori roti": meal16,
  "lachha paratha": meal17,
  "jowar bhakri": meal18,
  "tomato soup": meal19,
  "veg manchow soup": meal20,
  "sweet corn soup": meal21,
  "pepper rasam": meal22,
  "chicken clear soup": meal23,
  "masala chai": meal24,
  "filter coffee": meal25,
  "mango lassi": meal26,
  "fresh lime soda": meal27,
  "masala chaas": meal28,
  "gulab jamun": meal29,
  "rice kheer": meal30,
  "shrikhand": meal31,
  "seasonal fruit bowl": meal32,
};

/** Match the current name, not an outlet ID or category; unknown dishes have no guessed photo. */
export function dishImage(name: string): string | undefined {
  return mealPhotos[normalizeMealName(name)];
}
