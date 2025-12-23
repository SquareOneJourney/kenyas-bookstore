
import { Book, Order, Wish } from '../types';

export const BOOKS: Book[] = [
  // Existing Books (updated with missing supplySource field)
  { id: "1", title: "The Shadow of the Wind", author: "Carlos Ruiz Zafon", genre: "Mystery", price: 18.99, isbn: "978-0143126393", description: "A sweeping tale of murder, mystery, and obsessive love set in post-Spanish Civil War Barcelona.", stock: 15, coverUrl: "https://picsum.photos/seed/shadow/400/600", condition: "New", location: "Shelf A-1", tags: ["historical", "barcelona", "books about books"], supplySource: "local" },
  { id: "2", title: "Dune", author: "Frank Herbert", genre: "Sci-Fi", price: 22.50, isbn: "978-0441013593", description: "The story of Paul Atreides, a brilliant young man born into a great destiny, who must travel to the most dangerous planet in the universe.", stock: 10, coverUrl: "https://picsum.photos/seed/dune/400/600", condition: "New", location: "Shelf S-2", tags: ["epic", "space", "politics"], supplySource: "local" },
  { id: "3", title: "Circe", author: "Madeline Miller", genre: "Fantasy", price: 16.99, isbn: "978-0316556347", description: "A feminist retelling of the Greek myth of Circe, the powerful witch banished to a remote island.", stock: 20, coverUrl: "https://picsum.photos/seed/circe/400/600", condition: "New", location: "Table 1", tags: ["mythology", "greek", "witch"], supplySource: "local" },
  { id: "4", title: "Pride and Prejudice", author: "Jane Austen", genre: "Classic", price: 12.00, isbn: "978-0141439518", description: "The timeless story of Elizabeth Bennet and her complex relationship with the proud Mr. Darcy.", stock: 30, coverUrl: "https://picsum.photos/seed/pride/400/600", condition: "Good", location: "Bin 12", tags: ["romance", "classic", "england"], supplySource: "local" },
  { id: "5", title: "The Silent Patient", author: "Alex Michaelides", genre: "Thriller", price: 20.00, isbn: "978-1250301697", description: "A shocking psychological thriller of a woman's act of violence against her husband.", stock: 8, coverUrl: "https://picsum.photos/seed/patient/400/600", condition: "New", location: "Shelf T-4", tags: ["psychological", "twist", "murder"], supplySource: "local" },
  { id: "6", title: "Sapiens", author: "Yuval Noah Harari", genre: "Non-Fiction", price: 25.00, isbn: "978-0062316097", description: "A groundbreaking narrative of humanity's creation and evolution.", stock: 12, coverUrl: "https://picsum.photos/seed/sapiens/400/600", condition: "New", location: "Shelf N-1", tags: ["history", "anthropology", "science"], supplySource: "local" },
  { id: "7", title: "Project Hail Mary", author: "Andy Weir", genre: "Sci-Fi", price: 21.99, isbn: "978-0593135204", description: "A lone astronaut must save the earth from disaster in this cinematic thriller.", stock: 18, coverUrl: "https://picsum.photos/seed/hailmary/400/600", condition: "New", location: "Shelf S-3", tags: ["space", "survival", "science"], supplySource: "local" },
  { id: "8", title: "Where the Crawdads Sing", author: "Delia Owens", genre: "Mystery", price: 18.00, isbn: "978-0735219090", description: "A heartbreaking coming-of-age story and a surprising tale of possible murder.", stock: 25, coverUrl: "https://picsum.photos/seed/crawdads/400/600", condition: "Very Good", location: "Bin 5", tags: ["nature", "mystery", "marsh"], supplySource: "local" },
  { id: "10", title: "1984", author: "George Orwell", genre: "Classic", price: 11.50, isbn: "978-0451524935", description: "A dystopian novel set in a totalitarian society under the constant surveillance of Big Brother.", stock: 40, coverUrl: "https://picsum.photos/seed/1984/400/600", condition: "Acceptable", location: "Bin 99", tags: ["dystopian", "politics", "classic"], supplySource: "local" },
  { id: "12", title: "Atomic Habits", author: "James Clear", genre: "Self-Help", price: 27.00, isbn: "978-0735211292", description: "An easy & proven way to build good habits & break bad ones.", stock: 22, coverUrl: "https://picsum.photos/seed/atomic/400/600", condition: "New", location: "Shelf H-1", tags: ["productivity", "psychology", "growth"], supplySource: "local" }
];

export const GENRES = ["Fiction", "Mystery", "Sci-Fi", "Fantasy", "Classic", "Thriller", "Non-Fiction", "Self-Help", "Biography", "Young Adult", "Horror"];

export const MOCK_ORDERS: Order[] = [
    {
        id: "ORD-12345",
        date: "2023-10-15",
        status: "Delivered",
        total: 41.49,
        shippingMethod: "standard",
        customerEmail: "customer@example.com",
        customerAddress: "123 Library Lane, Booktown",
        fulfillmentSource: "local",
        items: [
            {...BOOKS[6], quantity: 1},
            {...BOOKS[2], quantity: 1},
        ]
    },
    {
        id: "ORD-67890",
        date: "2023-11-01",
        status: "Shipped",
        total: 20.00,
        shippingMethod: "standard",
        customerEmail: "reader@example.com",
        customerAddress: "456 Story St, Narrative City",
        fulfillmentSource: "local",
        items: [
            {...BOOKS[4], quantity: 1},
        ]
    }
];

export const MOCK_WISHES: Wish[] = [
    {
        id: "WISH-001",
        age: 8,
        interests: "Animals, especially dogs and wolves",
        theme: "A book about bravery and finding courage when you feel small.",
        status: "Open",
    },
    {
        id: "WISH-002",
        age: 12,
        interests: "Fantasy, magic, and adventure",
        theme: "An escape to another world for a child going through a tough time at home.",
        status: "Open",
    },
];
