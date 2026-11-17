import breakfast from "@/assets/breakfast.jpg";
import main from "@/assets/main.jpg";
import beverages from "@/assets/beverages.jpg";
import desserts from "@/assets/desserts.jpg";

export type Diet = "veg" | "vegan" | "nonveg" | "egg";
export type CategoryId = "breakfast" | "main" | "breads" | "soups" | "beverages" | "desserts";
export interface Outlet { id: string; name: string; location: string; opens: string; closes: string; }
export interface Dish {
  id: string; outletId: string; category: CategoryId; name: string; description: string;
  pricePaise: number; diet: Diet; spice: 0 | 1 | 2 | 3; prepMins: number;
  allergens: string[] | null; available: boolean; popular?: boolean;
}

export const outlets: Outlet[] = [
  { id: "main", name: "Main Canteen", location: "Near Library Block", opens: "07:30", closes: "21:30" },
  { id: "hostel", name: "Hostel Café", location: "Boys' Hostel B, Ground floor", opens: "08:00", closes: "23:00" },
];

export const categories: { id: CategoryId; label: string; image: string }[] = [
  { id: "breakfast", label: "Breakfast", image: breakfast },
  { id: "main", label: "Main Course", image: main },
  { id: "breads", label: "Breads/Chapatis", image: main },
  { id: "soups", label: "Soups", image: main },
  { id: "beverages", label: "Beverages", image: beverages },
  { id: "desserts", label: "Desserts", image: desserts },
];

const d = (id: string, category: CategoryId, name: string, description: string, rupees: number, diet: Diet, spice: 0|1|2|3, prepMins: number, allergens: string[] | null, extra: Partial<Dish> = {}): Omit<Dish, "outletId"> =>
  ({ id, category, name, description, pricePaise: rupees * 100, diet, spice, prepMins, allergens, available: true, ...extra });

const base = [
  d("masala-dosa","breakfast","Masala Dosa","Crisp rice crêpe with spiced potato, chutney and sambar.",60,"vegan",1,10,null,{popular:true}),
  d("idli","breakfast","Idli Sambar (3 pcs)","Steamed rice cakes with sambar and coconut chutney.",45,"vegan",1,6,null),
  d("poha","breakfast","Kanda Poha","Flattened rice with onion, peanuts and curry leaves.",35,"vegan",1,5,["Peanuts"],{popular:true}),
  d("upma","breakfast","Rava Upma","Semolina cooked with vegetables and mustard seeds.",35,"veg",1,6,["Gluten"]),
  d("aloo-paratha","breakfast","Aloo Paratha","Stuffed flatbread with curd and pickle.",55,"veg",1,10,["Gluten","Dairy"]),
  d("omelette","breakfast","Masala Omelette","Two-egg omelette with onion, chilli and toast.",50,"egg",2,7,["Egg","Gluten"]),
  d("veg-thali","main","Veg Thali","Dal, sabzi, rice, two chapatis, salad and pickle.",110,"veg",1,8,["Gluten","Dairy"],{popular:true}),
  d("paneer-masala","main","Paneer Butter Masala","Cottage cheese in a rich tomato-butter gravy.",130,"veg",1,12,["Dairy","Nuts"]),
  d("dal-tadka","main","Dal Tadka with Rice","Yellow lentils tempered with cumin and garlic.",80,"vegan",1,6,null),
  d("chole","main","Chole Bhature","Spiced chickpeas with two fluffy bhature.",90,"veg",2,10,["Gluten","Dairy"],{popular:true}),
  d("veg-biryani","main","Veg Biryani","Fragrant basmati layered with vegetables and raita.",120,"veg",2,15,["Dairy"]),
  d("chicken-biryani","main","Chicken Biryani","Dum-cooked basmati with chicken and raita.",160,"nonveg",2,18,["Dairy"]),
  d("egg-curry","main","Egg Curry with Rice","Boiled eggs in onion-tomato gravy.",95,"egg",2,10,["Egg"],{available:false}),
  d("rajma","main","Rajma Chawal","Kidney beans curry with steamed rice.",85,"vegan",1,6,null),
  d("chapati","breads","Chapati (2 pcs)","Whole-wheat flatbread, hot off the tawa.",20,"vegan",0,4,["Gluten"]),
  d("butter-naan","breads","Butter Naan","Tandoor naan brushed with butter.",35,"veg",0,6,["Gluten","Dairy"]),
  d("tandoori-roti","breads","Tandoori Roti","Wheat bread baked in the tandoor.",20,"vegan",0,5,["Gluten"]),
  d("lachha","breads","Lachha Paratha","Flaky layered paratha.",40,"veg",0,7,["Gluten","Dairy"]),
  d("bhakri","breads","Jowar Bhakri","Sorghum flatbread, gluten-free grain.",25,"vegan",0,6,null),
  d("tomato-soup","soups","Tomato Soup","Classic tomato soup with croutons.",50,"veg",0,5,["Gluten","Dairy"]),
  d("manchow","soups","Veg Manchow Soup","Spicy Indo-Chinese soup with fried noodles.",60,"vegan",2,7,["Gluten","Soy"]),
  d("sweet-corn","soups","Sweet Corn Soup","Creamy corn and vegetable soup.",55,"veg",0,6,null),
  d("rasam","soups","Pepper Rasam","Tangy tamarind-pepper broth.",40,"vegan",2,4,null),
  d("chicken-soup","soups","Chicken Clear Soup","Light chicken broth with vegetables.",75,"nonveg",1,8,null),
  d("chai","beverages","Masala Chai","Milky tea with ginger and cardamom.",15,"veg",0,3,["Dairy"],{popular:true}),
  d("filter-coffee","beverages","Filter Coffee","South Indian decoction coffee with milk.",25,"veg",0,3,["Dairy"]),
  d("mango-lassi","beverages","Mango Lassi","Chilled yoghurt and mango smoothie.",60,"veg",0,3,["Dairy"]),
  d("lime-soda","beverages","Fresh Lime Soda","Sweet or salted, freshly squeezed.",35,"vegan",0,2,null),
  d("buttermilk","beverages","Masala Chaas","Spiced buttermilk with mint.",25,"veg",0,2,["Dairy"]),
  d("gulab-jamun","desserts","Gulab Jamun (2 pcs)","Milk dumplings in cardamom syrup.",40,"veg",0,2,["Dairy","Gluten"],{popular:true}),
  d("kheer","desserts","Rice Kheer","Slow-cooked rice pudding with nuts.",45,"veg",0,2,["Dairy","Nuts"]),
  d("shrikhand","desserts","Shrikhand","Strained yoghurt with saffron and cardamom.",50,"veg",0,2,["Dairy","Nuts"],{available:false}),
  d("fruit-bowl","desserts","Seasonal Fruit Bowl","Freshly cut seasonal fruit.",50,"vegan",0,3,null),
];

export const dishes: Dish[] = outlets.flatMap((o) =>
  base.map((x, i) => ({ ...x, outletId: o.id, id: `${o.id}-${x.id}`,
    available: o.id === "hostel" && i % 9 === 4 ? false : x.available })),
);

export const categoryImage = (c: CategoryId) => categories.find((x) => x.id === c)!.image;
export const formatINR = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(paise / 100);

/** Open/closed in Asia/Kolkata. */
export function isOutletOpen(o: Outlet, now = new Date()) {
  const t = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  return t >= o.opens && t < o.closes;
}
