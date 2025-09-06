import { hashPassword } from "@/lib/password";
import { PrismaClient, Prisma, Role } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice",
    email: "admin@gmail.com",
    password: hashPassword("12345"),
    role: Role.ADMIN, // ✅ use Role.ADMIN instead of "ADMIN"
  },
  {
    name: "Bob",
    email: "cashier@gmail.com",
    password: hashPassword("12345"),
    role: Role.CASHIER, // ✅ use Role.CASHIER instead of "CASHIER"
  },
];

// Restaurant Categories Data
const restaurantCategories = [
  { name: "Naan", description: "Traditional Indian bread varieties", sortOrder: 1 },
  { name: "Pasta", description: "Italian pasta dishes", sortOrder: 2 },
  { name: "Swarma", description: "Middle Eastern wraps", sortOrder: 3 },
  { name: "Chowmein & Noodles", description: "Asian noodle dishes", sortOrder: 4 },
  { name: "Burger", description: "Grilled burgers and sandwiches", sortOrder: 5 },
  { name: "Water", description: "Bottled water varieties", sortOrder: 6 },
  { name: "Juice", description: "Fresh fruit juices", sortOrder: 7 },
  { name: "Kabab", description: "Grilled meat specialties", sortOrder: 8 },
  { name: "Biryani", description: "Aromatic rice dishes", sortOrder: 9 },
  { name: "Soup", description: "Hot soup varieties", sortOrder: 10 },
  { name: "Soft Drink", description: "Carbonated beverages", sortOrder: 11 },
];

// Restaurant Products Data
const restaurantProducts = [
  {
    name: "Garlic Naan (Small)",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=400&q=80",
    categoryName: "Naan",
    price: 8.50,
    cost: 3.00,
    stockQuantity: 50,
    preparationTime: 10,
    isVegetarian: true
  },
  {
    name: "Tawa Naan (Small)",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
    categoryName: "Naan",
    price: 7.00,
    cost: 2.50,
    stockQuantity: 50,
    preparationTime: 8,
    isVegetarian: true
  },
  {
    name: "Vegan Pasta Sauce (Small)",
    image: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=400&q=80",
    categoryName: "Pasta",
    price: 12.00,
    cost: 5.00,
    stockQuantity: 30,
    preparationTime: 15,
    isVegetarian: true,
    isVegan: true
  },
  {
    name: "Vegetable Shawarma (Half)",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=400&q=80",
    categoryName: "Swarma",
    price: 9.50,
    cost: 4.00,
    stockQuantity: 25,
    preparationTime: 12,
    isVegetarian: true
  },
  {
    name: "Chicken shawrma (Half)",
    image: "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?auto=format&fit=crop&w=400&q=80",
    categoryName: "Swarma",
    price: 11.00,
    cost: 6.00,
    stockQuantity: 20,
    preparationTime: 15,
    isVegetarian: false
  },
  {
    name: "Chicken Chowmein (Small)",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80",
    categoryName: "Chowmein & Noodles",
    price: 14.00,
    cost: 7.00,
    stockQuantity: 20,
    preparationTime: 18,
    isVegetarian: false
  },
  {
    name: "Vegetable Beef soup with Noodles (Large)",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80",
    categoryName: "Soup",
    price: 10.50,
    cost: 4.50,
    stockQuantity: 15,
    preparationTime: 20,
    isVegetarian: false
  },
  {
    name: "Crispy Cheeseburgers (Small)",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
    categoryName: "Burger",
    price: 13.50,
    cost: 6.50,
    stockQuantity: 25,
    preparationTime: 12,
    isVegetarian: false
  },
  {
    name: "Juicy Beef Burgers (Juicy Burger)",
    image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=400&q=80",
    categoryName: "Burger",
    price: 15.00,
    cost: 8.00,
    stockQuantity: 20,
    preparationTime: 15,
    isVegetarian: false
  },
  {
    name: "Mineral Water (Mineral Water)",
    image: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?auto=format&fit=crop&w=400&q=80",
    categoryName: "Water",
    price: 2.50,
    cost: 1.00,
    stockQuantity: 100,
    preparationTime: 1,
    isVegetarian: true,
    isVegan: true
  },
  {
    name: "Sparkling water (Sparkling Water)",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80",
    categoryName: "Water",
    price: 3.00,
    cost: 1.20,
    stockQuantity: 80,
    preparationTime: 1,
    isVegetarian: true,
    isVegan: true
  },
  {
    name: "Orange juice (Half Glass)",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=400&q=80",
    categoryName: "Juice",
    price: 5.50,
    cost: 2.50,
    stockQuantity: 40,
    preparationTime: 3,
    isVegetarian: true,
    isVegan: true
  },
  {
    name: "Special Summer (Full Package)",
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80",
    categoryName: "Juice",
    price: 8.00,
    cost: 3.50,
    stockQuantity: 30,
    preparationTime: 5,
    isVegetarian: true,
    isVegan: true
  },
  {
    name: "Strawberry Juice (Half Glass)",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80",
    categoryName: "Juice",
    price: 6.00,
    cost: 2.80,
    stockQuantity: 35,
    preparationTime: 3,
    isVegetarian: true,
    isVegan: true
  },
  {
    name: "Chicken Angara Kabab (Chicken)",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80",
    categoryName: "Kabab",
    price: 16.50,
    cost: 9.00,
    stockQuantity: 15,
    preparationTime: 25,
    isVegetarian: false
  },
  {
    name: "Mutton Seekh Kebab (Mutton)",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=400&q=80",
    categoryName: "Kabab",
    price: 18.00,
    cost: 10.50,
    stockQuantity: 12,
    preparationTime: 30,
    isVegetarian: false
  },
  {
    name: "Chicken Biryani (Large)",
    image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=400&q=80",
    categoryName: "Biryani",
    price: 19.00,
    cost: 10.00,
    stockQuantity: 18,
    preparationTime: 35,
    isVegetarian: false
  },
  {
    name: "Mutton Biryani (Large)",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80",
    categoryName: "Biryani",
    price: 22.00,
    cost: 12.50,
    stockQuantity: 15,
    preparationTime: 40,
    isVegetarian: false
  },
  {
    name: "Vegetable Biryani (Medium)",
    image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80",
    categoryName: "Biryani",
    price: 15.50,
    cost: 7.50,
    stockQuantity: 22,
    preparationTime: 30,
    isVegetarian: true
  },
  {
    name: "Coca Cola (Can)",
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=400&q=80",
    categoryName: "Soft Drink",
    price: 3.50,
    cost: 1.50,
    stockQuantity: 60,
    preparationTime: 1,
    isVegetarian: true,
    isVegan: true
  },
  {
    name: "Pepsi (Bottle)",
    image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80",
    categoryName: "Soft Drink",
    price: 4.00,
    cost: 1.80,
    stockQuantity: 55,
    preparationTime: 1,
    isVegetarian: true,
    isVegan: true
  },
  {
    name: "Sprite (Can)",
    image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80",
    categoryName: "Soft Drink",
    price: 3.50,
    cost: 1.50,
    stockQuantity: 65,
    preparationTime: 1,
    isVegetarian: true,
    isVegan: true
  },
];

// Restaurant Tables Data
const restaurantTables = [
  { tableNumber: "T01", capacity: 2, location: "Window Side", status: "AVAILABLE" },
  { tableNumber: "T02", capacity: 4, location: "Main Hall", status: "AVAILABLE" },
  { tableNumber: "T03", capacity: 6, location: "Main Hall", status: "OCCUPIED", currentGuests: 4 },
  { tableNumber: "T04", capacity: 2, location: "Corner", status: "AVAILABLE" },
  { tableNumber: "T05", capacity: 4, location: "Main Hall", status: "RESERVED" },
  { tableNumber: "T06", capacity: 8, location: "Private Room", status: "AVAILABLE" },
  { tableNumber: "T07", capacity: 4, location: "Terrace", status: "AVAILABLE" },
  { tableNumber: "T08", capacity: 2, location: "Window Side", status: "OCCUPIED", currentGuests: 2 },
  { tableNumber: "T09", capacity: 6, location: "Main Hall", status: "AVAILABLE" },
  { tableNumber: "T10", capacity: 4, location: "Corner", status: "AVAILABLE" },
];

async function main() {
  console.log("Seeding users...");
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }

  console.log("Seeding restaurant categories...");
  for (const category of restaurantCategories) {
    await prisma.restaurantCategory.create({ data: category });
  }

  console.log("Seeding restaurant products...");
  for (const product of restaurantProducts) {
    const category = await prisma.restaurantCategory.findUnique({
      where: { name: product.categoryName }
    });
    
    if (category) {
      await prisma.restaurantProduct.create({
        data: {
          name: product.name,
          image: product.image,
          price: product.price,
          cost: product.cost,
          stockQuantity: product.stockQuantity,
          preparationTime: product.preparationTime,
          isVegetarian: product.isVegetarian || false,
          isVegan: product.isVegan || false,
          categoryId: category.id,
        }
      });
    }
  }

  console.log("Seeding restaurant tables...");
  for (const table of restaurantTables) {
    await prisma.restaurantTable.create({ data: table });
  }

  console.log("Done seeding.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
