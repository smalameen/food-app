// Plain static data. No backend, database, or API: everything the app needs lives here.
// Map coordinates use a 400 x 300 schematic city grid (see components/CityMap.tsx).

export type Point = { x: number; y: number };

export type MenuOption = { id: string; en: string; bn: string; price: number };

export type MenuItem = {
  id: string;
  en: string;
  bn: string;
  descEn: string;
  descBn: string;
  price: number;
  image?: string;
  options?: MenuOption[];
  available: boolean;
  popular?: boolean;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisineEn: string;
  cuisineBn: string;
  image: string;
  area: string;
  pos: Point;
  rating: number;
  ratings: number;
  prepMin: number;
  deliveryFee: number;
  minOrder: number;
  plusPartner: boolean;
  /** Platform price is this many percent above the restaurant's in-store menu (0 = same price). */
  platformMarkupPct: number;
  status: 'open' | 'busy' | 'paused';
  pausedReasonEn?: string;
  pausedReasonBn?: string;
  menu: MenuItem[];
};

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'kacchi-house',
    name: 'Kacchi House',
    cuisineEn: 'Biryani · Bangladeshi',
    cuisineBn: 'বিরিয়ানি · দেশি',
    image: '/images/biryani.jpg',
    area: 'Dhanmondi',
    pos: { x: 120, y: 190 },
    rating: 4.7,
    ratings: 2140,
    prepMin: 18,
    deliveryFee: 45,
    minOrder: 150,
    plusPartner: true,
    platformMarkupPct: 0,
    status: 'open',
    menu: [
      { id: 'kh-kacchi', en: 'Mutton Kacchi (full)', bn: 'খাসির কাচ্চি (ফুল)', descEn: 'Basmati, tender mutton, potato, borhani on the side.', descBn: 'বাসমতি চাল, নরম খাসির মাংস, আলু, সাথে বোরহানি।', price: 420, image: '/images/biryani.jpg', available: true, popular: true,
        options: [ { id: 'extra-meat', en: 'Extra mutton piece', bn: 'অতিরিক্ত মাংস', price: 140 }, { id: 'jali-kabab', en: 'Add jali kabab', bn: 'জালি কাবাব যোগ করুন', price: 60 }, { id: 'no-potato', en: 'No potato', bn: 'আলু ছাড়া', price: 0 } ] },
      { id: 'kh-half', en: 'Mutton Kacchi (half)', bn: 'খাসির কাচ্চি (হাফ)', descEn: 'A lighter portion of the house kacchi.', descBn: 'হাউস কাচ্চির ছোট পরিবেশন।', price: 260, image: '/images/biryani.jpg', available: true },
      { id: 'kh-tehari', en: 'Beef Tehari', bn: 'গরুর তেহারি', descEn: 'Mustard-oil rice with spiced beef cubes.', descBn: 'সরিষার তেলে রান্না চাল ও মশলাদার গরুর মাংস।', price: 220, available: true },
      { id: 'kh-firni', en: 'Shahi Firni', bn: 'শাহী ফিরনি', descEn: 'Chilled rice pudding in a clay bowl.', descBn: 'মাটির বাটিতে ঠান্ডা ফিরনি।', price: 90, available: true },
      { id: 'kh-borhani', en: 'Borhani (500ml)', bn: 'বোরহানি (৫০০ মি.লি.)', descEn: 'Spiced yogurt drink.', descBn: 'মশলাদার দই পানীয়।', price: 80, available: false },
    ],
  },
  {
    id: 'smash-lab',
    name: 'Smash Lab',
    cuisineEn: 'Burgers · Fries',
    cuisineBn: 'বার্গার · ফ্রাইজ',
    image: '/images/burger.jpg',
    area: 'Gulshan 2',
    pos: { x: 290, y: 80 },
    rating: 4.5,
    ratings: 1312,
    prepMin: 14,
    deliveryFee: 55,
    minOrder: 200,
    plusPartner: true,
    platformMarkupPct: 8,
    status: 'open',
    menu: [
      { id: 'sl-double', en: 'Double Smash', bn: 'ডাবল স্ম্যাশ', descEn: 'Two smashed beef patties, cheddar, house sauce.', descBn: 'দুটি বিফ প্যাটি, চেডার, হাউস সস।', price: 450, image: '/images/burger.jpg', available: true, popular: true,
        options: [ { id: 'extra-cheese', en: 'Extra cheese', bn: 'অতিরিক্ত চিজ', price: 50 }, { id: 'jalapeno', en: 'Jalapeños', bn: 'হালাপেনো', price: 30 }, { id: 'no-onion', en: 'No onion', bn: 'পেঁয়াজ ছাড়া', price: 0 } ] },
      { id: 'sl-chicken', en: 'Crispy Chicken Burger', bn: 'ক্রিস্পি চিকেন বার্গার', descEn: 'Buttermilk fried chicken, slaw, pickles.', descBn: 'বাটারমিল্ক ফ্রাইড চিকেন, কোলস্ল, আচার।', price: 340, image: '/images/burger2.jpg', available: true },
      { id: 'sl-fries', en: 'Loaded Fries', bn: 'লোডেড ফ্রাইজ', descEn: 'Fries, cheese sauce, beef bits.', descBn: 'ফ্রাইজ, চিজ সস, বিফ।', price: 220, available: true },
      { id: 'sl-shake', en: 'Chocolate Shake', bn: 'চকলেট শেক', descEn: 'Thick, cold, not too sweet.', descBn: 'ঘন ঠান্ডা শেক।', price: 260, available: true },
    ],
  },
  {
    id: 'fire-stone',
    name: 'Fire & Stone Pizza',
    cuisineEn: 'Pizza · Italian',
    cuisineBn: 'পিজ্জা · ইতালিয়ান',
    image: '/images/pizza.jpg',
    area: 'Banani',
    pos: { x: 245, y: 120 },
    rating: 4.4,
    ratings: 876,
    prepMin: 22,
    deliveryFee: 60,
    minOrder: 300,
    plusPartner: false,
    platformMarkupPct: 0,
    status: 'busy',
    menu: [
      { id: 'fs-marg', en: 'Margherita 10"', bn: 'মার্গারিটা ১০"', descEn: 'Tomato, mozzarella, basil, wood-fired.', descBn: 'টমেটো, মোজারেলা, বেসিল।', price: 650, image: '/images/pizza.jpg', available: true, popular: true,
        options: [ { id: 'large', en: 'Make it 12"', bn: '১২" করুন', price: 200 }, { id: 'olives', en: 'Black olives', bn: 'কালো জলপাই', price: 60 } ] },
      { id: 'fs-bbq', en: 'BBQ Chicken 10"', bn: 'বিবিকিউ চিকেন ১০"', descEn: 'Smoky chicken, red onion, BBQ sauce.', descBn: 'স্মোকি চিকেন, লাল পেঁয়াজ।', price: 780, available: true },
      { id: 'fs-garlic', en: 'Garlic Bread', bn: 'গার্লিক ব্রেড', descEn: 'With herb butter.', descBn: 'হার্ব বাটার সহ।', price: 220, available: true },
    ],
  },
  {
    id: 'ramen-ichi',
    name: 'Ramen Ichi',
    cuisineEn: 'Japanese · Noodles',
    cuisineBn: 'জাপানি · নুডলস',
    image: '/images/ramen.jpg',
    area: 'Banani',
    pos: { x: 220, y: 95 },
    rating: 4.8,
    ratings: 640,
    prepMin: 16,
    deliveryFee: 60,
    minOrder: 300,
    plusPartner: true,
    platformMarkupPct: 0,
    status: 'open',
    menu: [
      { id: 'ri-tonkotsu', en: 'Chicken Paitan Ramen', bn: 'চিকেন পাইতান রামেন', descEn: 'Creamy chicken broth, soft egg, scallion.', descBn: 'ক্রিমি চিকেন ব্রথ, ডিম, পেঁয়াজকলি।', price: 590, image: '/images/ramen.jpg', available: true, popular: true,
        options: [ { id: 'egg', en: 'Extra soft egg', bn: 'অতিরিক্ত ডিম', price: 60 }, { id: 'spicy', en: 'Make it spicy', bn: 'ঝাল করুন', price: 0 } ] },
      { id: 'ri-gyoza', en: 'Chicken Gyoza (6)', bn: 'চিকেন গিওজা (৬)', descEn: 'Pan-fried dumplings.', descBn: 'প্যান-ফ্রাইড ডাম্পলিং।', price: 320, available: true },
      { id: 'ri-soup', en: 'Miso Soup', bn: 'মিসো স্যুপ', descEn: 'Tofu, wakame.', descBn: 'টোফু, সামুদ্রিক শৈবাল।', price: 180, image: '/images/soup.jpg', available: true },
    ],
  },
  {
    id: 'green-bowl',
    name: 'Green Bowl',
    cuisineEn: 'Salads · Healthy',
    cuisineBn: 'সালাদ · স্বাস্থ্যকর',
    image: '/images/salad.jpg',
    area: 'Gulshan 1',
    pos: { x: 270, y: 150 },
    rating: 4.3,
    ratings: 412,
    prepMin: 10,
    deliveryFee: 40,
    minOrder: 150,
    plusPartner: true,
    platformMarkupPct: 5,
    status: 'open',
    menu: [
      { id: 'gb-chicken', en: 'Grilled Chicken Bowl', bn: 'গ্রিলড চিকেন বোল', descEn: 'Greens, quinoa, chicken, lemon dressing.', descBn: 'সবজি, কিনোয়া, চিকেন, লেবু ড্রেসিং।', price: 420, image: '/images/salad.jpg', available: true, popular: true },
      { id: 'gb-falafel', en: 'Falafel Bowl', bn: 'ফালাফেল বোল', descEn: 'Chickpea falafel, hummus, pickled onion.', descBn: 'ফালাফেল, হুমাস, আচারি পেঁয়াজ।', price: 360, available: true },
      { id: 'gb-juice', en: 'Green Juice', bn: 'গ্রিন জুস', descEn: 'Cucumber, apple, mint.', descBn: 'শসা, আপেল, পুদিনা।', price: 180, available: true },
    ],
  },
  {
    id: 'coal-grill',
    name: 'Coal Grill House',
    cuisineEn: 'Grill · Kebab',
    cuisineBn: 'গ্রিল · কাবাব',
    image: '/images/grill.jpg',
    area: 'Mohammadpur',
    pos: { x: 80, y: 140 },
    rating: 4.6,
    ratings: 1980,
    prepMin: 20,
    deliveryFee: 50,
    minOrder: 200,
    plusPartner: false,
    platformMarkupPct: 0,
    status: 'open',
    menu: [
      { id: 'cg-platter', en: 'Mixed Grill Platter', bn: 'মিক্সড গ্রিল প্লাটার', descEn: 'Chicken tikka, seekh kebab, naan, salad.', descBn: 'চিকেন টিক্কা, শিক কাবাব, নান, সালাদ।', price: 690, image: '/images/grill.jpg', available: true, popular: true },
      { id: 'cg-chap', en: 'Beef Chap + Naan', bn: 'বিফ চাপ + নান', descEn: 'Old-Dhaka style, 2 naan.', descBn: 'পুরান ঢাকার স্টাইল, ২টি নান।', price: 280, available: true },
      { id: 'cg-naan', en: 'Butter Naan', bn: 'বাটার নান', descEn: 'Fresh from the tandoor.', descBn: 'তন্দুর থেকে টাটকা।', price: 40, available: true },
    ],
  },
  {
    id: 'brew-bean',
    name: 'Brew & Bean',
    cuisineEn: 'Coffee · Bakery',
    cuisineBn: 'কফি · বেকারি',
    image: '/images/coffee.jpg',
    area: 'Dhanmondi',
    pos: { x: 150, y: 215 },
    rating: 4.5,
    ratings: 530,
    prepMin: 8,
    deliveryFee: 35,
    minOrder: 100,
    plusPartner: true,
    platformMarkupPct: 0,
    status: 'open',
    menu: [
      { id: 'bb-latte', en: 'Iced Latte', bn: 'আইসড লাতে', descEn: 'Double shot, fresh milk.', descBn: 'ডাবল শট, তাজা দুধ।', price: 260, image: '/images/coffee.jpg', available: true, popular: true,
        options: [ { id: 'oat', en: 'Oat milk', bn: 'ওট মিল্ক', price: 60 }, { id: 'less-ice', en: 'Less ice', bn: 'কম বরফ', price: 0 } ] },
      { id: 'bb-croissant', en: 'Butter Croissant', bn: 'বাটার ক্রোয়াসাঁ', descEn: 'Baked this morning.', descBn: 'আজ সকালে বেক করা।', price: 160, available: true },
    ],
  },
  {
    id: 'mishti-corner',
    name: 'Mishti Corner',
    cuisineEn: 'Desserts · Sweets',
    cuisineBn: 'ডেজার্ট · মিষ্টি',
    image: '/images/dessert.jpg',
    area: 'Tejgaon',
    pos: { x: 200, y: 165 },
    rating: 4.6,
    ratings: 760,
    prepMin: 6,
    deliveryFee: 40,
    minOrder: 120,
    plusPartner: false,
    platformMarkupPct: 0,
    status: 'paused',
    pausedReasonEn: 'Not taking delivery orders right now. Back at 6:00 PM.',
    pausedReasonBn: 'এখন ডেলিভারি অর্ডার নিচ্ছে না। সন্ধ্যা ৬টায় আবার চালু।',
    menu: [
      { id: 'mc-roshogolla', en: 'Roshogolla (6 pcs)', bn: 'রসগোল্লা (৬ পিস)', descEn: 'Soft, syrupy, classic.', descBn: 'নরম, রসালো।', price: 180, image: '/images/dessert.jpg', available: true },
      { id: 'mc-doi', en: 'Mishti Doi (500g)', bn: 'মিষ্টি দই (৫০০ গ্রাম)', descEn: 'Bogura-style sweet yogurt.', descBn: 'বগুড়ার মিষ্টি দই।', price: 220, available: true },
    ],
  },
];

export type Place = {
  id: string;
  en: string;
  bn: string;
  area: string;
  pos: Point;
};

/** Searchable address suggestions (stand-in for a places/autocomplete provider). */
export const PLACES: Place[] = [
  { id: 'p1', en: 'Road 27, Dhanmondi', bn: 'রোড ২৭, ধানমন্ডি', area: 'Dhanmondi', pos: { x: 110, y: 225 } },
  { id: 'p2', en: 'Satmasjid Road, Dhanmondi', bn: 'সাতমসজিদ রোড, ধানমন্ডি', area: 'Dhanmondi', pos: { x: 95, y: 205 } },
  { id: 'p3', en: 'Gulshan 2 Circle', bn: 'গুলশান ২ সার্কেল', area: 'Gulshan', pos: { x: 300, y: 70 } },
  { id: 'p4', en: 'Road 11, Banani', bn: 'রোড ১১, বনানী', area: 'Banani', pos: { x: 235, y: 85 } },
  { id: 'p5', en: 'Mohammadpur Town Hall', bn: 'মোহাম্মদপুর টাউন হল', area: 'Mohammadpur', pos: { x: 70, y: 160 } },
  { id: 'p6', en: 'Tejgaon Industrial Area', bn: 'তেজগাঁও শিল্প এলাকা', area: 'Tejgaon', pos: { x: 215, y: 180 } },
  { id: 'p7', en: 'Farmgate, Tejgaon', bn: 'ফার্মগেট, তেজগাঁও', area: 'Tejgaon', pos: { x: 175, y: 175 } },
  { id: 'p8', en: 'Mirpur 10 Roundabout', bn: 'মিরপুর ১০ গোলচত্বর', area: 'Mirpur', pos: { x: 115, y: 45 } },
  { id: 'p9', en: 'Uttara Sector 7', bn: 'উত্তরা সেক্টর ৭', area: 'Uttara', pos: { x: 330, y: 15 } },
  { id: 'p10', en: 'Old Dhaka, Lalbagh', bn: 'পুরান ঢাকা, লালবাগ', area: 'Lalbagh', pos: { x: 90, y: 285 } },
];

/** Active delivery zone polygon on the schematic map. */
export const DELIVERY_ZONE: Point[] = [
  { x: 40, y: 60 }, { x: 180, y: 30 }, { x: 345, y: 45 }, { x: 360, y: 180 },
  { x: 260, y: 255 }, { x: 140, y: 265 }, { x: 40, y: 220 },
];

export type SavedAddress = {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  line: string;
  area: string;
  pos: Point;
  building: string;
  floor: string;
  landmark: string;
  notes: string;
};

export const DEFAULT_ADDRESSES: SavedAddress[] = [
  { id: 'a-home', label: 'Home', line: 'House 14, Road 27', area: 'Dhanmondi', pos: { x: 108, y: 228 }, building: 'Nirjhor Apartments', floor: '5th floor, flat 5B', landmark: 'Opposite Rapa Plaza', notes: 'Guard will call up — please wait at the gate.' },
  { id: 'a-work', label: 'Work', line: 'Plot 9, Road 11', area: 'Banani', pos: { x: 238, y: 88 }, building: 'Tower 9', floor: '3rd floor reception', landmark: 'Next to Banani Super Market', notes: '' },
];

export type PaymentMethodId = 'cod' | 'bkash' | 'nagad' | 'card';

export type PaymentMethod = {
  id: PaymentMethodId;
  en: string;
  bn: string;
  noteEn: string;
  noteBn: string;
  fee: number;
  enabled: boolean;
  disabledEn?: string;
  disabledBn?: string;
  /** Max order total accepted with this method. */
  maxTotal?: number;
  online: boolean;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cod', en: 'Cash on delivery', bn: 'ক্যাশ অন ডেলিভারি', noteEn: 'Pay the rider in cash. Up to ৳3,000.', noteBn: 'রাইডারকে নগদ দিন। ৳৩,০০০ পর্যন্ত।', fee: 0, enabled: true, maxTotal: 3000, online: false },
  { id: 'bkash', en: 'bKash', bn: 'বিকাশ', noteEn: 'No extra fee. You approve in the bKash page.', noteBn: 'অতিরিক্ত ফি নেই। বিকাশ পেজে অনুমোদন দিন।', fee: 0, enabled: true, online: true },
  { id: 'nagad', en: 'Nagad', bn: 'নগদ', noteEn: '', noteBn: '', fee: 0, enabled: false, disabledEn: 'Temporarily unavailable — Nagad is under maintenance.', disabledBn: 'সাময়িকভাবে বন্ধ — নগদ রক্ষণাবেক্ষণে আছে।', online: true },
  { id: 'card', en: 'Debit / credit card', bn: 'ডেবিট / ক্রেডিট কার্ড', noteEn: 'Visa, Mastercard, Amex. No extra fee.', noteBn: 'ভিসা, মাস্টারকার্ড, অ্যামেক্স। অতিরিক্ত ফি নেই।', fee: 0, enabled: true, online: true },
];

export type Promo = {
  code: string;
  en: string;
  bn: string;
  kind: 'flat' | 'percent' | 'free_delivery';
  value: number;
  maxDiscount?: number;
  minSubtotal: number;
  restaurantId?: string;
  firstOrderOnly?: boolean;
  expires: string; // ISO date
};

export const PROMOS: Promo[] = [
  { code: 'WELCOME50', en: '৳50 off your first order over ৳300', bn: '৳৩০০+ প্রথম অর্ডারে ৳৫০ ছাড়', kind: 'flat', value: 50, minSubtotal: 300, firstOrderOnly: true, expires: '2026-12-31' },
  { code: 'KACCHI15', en: '15% off at Kacchi House, up to ৳90', bn: 'কাচ্চি হাউসে ১৫% ছাড়, সর্বোচ্চ ৳৯০', kind: 'percent', value: 15, maxDiscount: 90, minSubtotal: 250, restaurantId: 'kacchi-house', expires: '2026-11-30' },
  { code: 'FREEDEL', en: 'Free delivery on any order', bn: 'যেকোনো অর্ডারে ফ্রি ডেলিভারি', kind: 'free_delivery', value: 0, minSubtotal: 0, expires: '2026-10-20' },
];

export const PLUS_PLAN = {
  price: 149,
  cycleEn: 'every 30 days',
  cycleBn: 'প্রতি ৩০ দিনে',
  minSubtotal: 300,
  benefitsEn: ['Free delivery on orders ৳300+ from Plus partner restaurants', 'Priority support chat'],
  benefitsBn: ['প্লাস পার্টনার রেস্টুরেন্টে ৳৩০০+ অর্ডারে ফ্রি ডেলিভারি', 'অগ্রাধিকার সাপোর্ট চ্যাট'],
  exclusionsEn: ['Service fee still applies', 'Not valid at non-partner restaurants', 'Small-order fee still applies below ৳250'],
  exclusionsBn: ['সার্ভিস ফি প্রযোজ্য', 'নন-পার্টনার রেস্টুরেন্টে প্রযোজ্য নয়', '৳২৫০-এর নিচে স্মল-অর্ডার ফি প্রযোজ্য'],
};

export const FEES = {
  service: 15,
  smallOrderThreshold: 250,
  smallOrder: 25,
  vatPct: 5,
};

export type Rider = {
  id: string;
  name: string;
  vehicleEn: string;
  vehicleBn: string;
  plate: string;
  rating: number;
  trips: number;
  initials: string;
};

export const RIDERS: Rider[] = [
  { id: 'r1', name: 'Rakib Hasan', vehicleEn: 'Motorbike', vehicleBn: 'মোটরবাইক', plate: 'Dhaka Metro-HA 21-4417', rating: 4.9, trips: 3210, initials: 'RH' },
  { id: 'r2', name: 'Sumon Mia', vehicleEn: 'Bicycle', vehicleBn: 'সাইকেল', plate: 'Cycle · ID 0882', rating: 4.8, trips: 1544, initials: 'SM' },
  { id: 'r3', name: 'Arif Chowdhury', vehicleEn: 'Motorbike', vehicleBn: 'মোটরবাইক', plate: 'Dhaka Metro-LA 13-0921', rating: 4.7, trips: 2088, initials: 'AC' },
];

export const SUPPORT_CATEGORIES = [
  { id: 'deducted', en: 'Payment deducted but no order', bn: 'টাকা কেটেছে কিন্তু অর্ডার নেই' },
  { id: 'duplicate', en: 'I think I was charged twice', bn: 'মনে হচ্ছে দুবার চার্জ হয়েছে' },
  { id: 'delayed', en: 'My order is delayed', bn: 'অর্ডার দেরি হচ্ছে' },
  { id: 'address', en: 'Wrong address or pin', bn: 'ভুল ঠিকানা বা পিন' },
  { id: 'rider', en: 'Can’t reach the rider', bn: 'রাইডারের সাথে যোগাযোগ হচ্ছে না' },
  { id: 'refund', en: 'Refund status', bn: 'রিফান্ডের অবস্থা' },
  { id: 'subscription', en: 'Subscription or billing', bn: 'সাবস্ক্রিপশন বা বিলিং' },
  { id: 'promo', en: 'Promo code not applied', bn: 'প্রোমো কোড কাজ করেনি' },
] as const;

export const ISSUE_TYPES = [
  { id: 'missing', en: 'Item missing', bn: 'আইটেম পাইনি' },
  { id: 'wrong', en: 'Wrong item', bn: 'ভুল আইটেম' },
  { id: 'cold', en: 'Food was cold', bn: 'খাবার ঠান্ডা ছিল' },
  { id: 'damaged', en: 'Spilled or damaged', bn: 'পড়ে গেছে বা নষ্ট' },
  { id: 'late', en: 'Very late', bn: 'অনেক দেরি' },
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number]['id'];
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['id'];
