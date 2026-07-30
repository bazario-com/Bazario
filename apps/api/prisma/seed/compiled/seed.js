"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // --- Admin + demo customer -------------------------------------------------
    const adminPasswordHash = await argon2.hash('Admin!Passw0rd123', { type: argon2.argon2id });
    await prisma.user.upsert({
        where: { email: 'admin@marketplace.test' },
        update: {},
        create: {
            email: 'admin@marketplace.test',
            firstName: 'Admin',
            lastName: 'User',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            emailVerifiedAt: new Date(),
        },
    });
    const customerPasswordHash = await argon2.hash('Customer!Passw0rd123', {
        type: argon2.argon2id,
    });
    await prisma.user.upsert({
        where: { email: 'customer@marketplace.test' },
        update: {},
        create: {
            email: 'customer@marketplace.test',
            firstName: 'Ayesha',
            lastName: 'Khan',
            passwordHash: customerPasswordHash,
            role: 'CUSTOMER',
            emailVerifiedAt: new Date(),
        },
    });
    // --- Demo vendor + store -----------------------------------------------------
    const vendorPasswordHash = await argon2.hash('Vendor!Passw0rd123', { type: argon2.argon2id });
    const vendorUser = await prisma.user.upsert({
        where: { email: 'vendor@marketplace.test' },
        update: {},
        create: {
            email: 'vendor@marketplace.test',
            firstName: 'Bilal',
            lastName: 'Traders',
            passwordHash: vendorPasswordHash,
            role: 'VENDOR',
            emailVerifiedAt: new Date(),
        },
    });
    const vendor = await prisma.vendor.upsert({
        where: { userId: vendorUser.id },
        update: {},
        create: {
            userId: vendorUser.id,
            businessName: 'Bilal Traders',
            status: 'APPROVED',
            approvedAt: new Date(),
            commissionRateBps: 1200,
        },
    });
    await prisma.store.upsert({
        where: { vendorId: vendor.id },
        update: {},
        create: {
            vendorId: vendor.id,
            name: 'Bilal Traders Official Store',
            slug: 'bilal-traders',
            description: 'Genuine electronics and home essentials, shipped nationwide.',
        },
    });
    // --- Categories --------------------------------------------------------------
    const categoryDefs = [
        { name: 'Mobiles & Tablets', slug: 'mobiles-tablets', image: 'category-mobiles.jpg' },
        { name: 'Electronics', slug: 'electronics', image: 'category-electronics.jpg' },
        { name: 'Fashion', slug: 'fashion', image: 'category-fashion.jpg' },
        { name: 'Home & Living', slug: 'home-living', image: 'category-home.jpg' },
        { name: 'Beauty & Health', slug: 'beauty-health', image: 'category-beauty.jpg' },
        { name: 'Groceries', slug: 'groceries', image: 'category-groceries.jpg' },
    ];
    const categories = {};
    for (const [index, def] of categoryDefs.entries()) {
        const category = await prisma.category.upsert({
            where: { slug: def.slug },
            update: {},
            create: { name: def.name, slug: def.slug, imageUrl: def.image, sortOrder: index },
        });
        categories[def.slug] = category.id;
    }
    // --- Products ------------------------------------------------------------------
    const productDefs = [
        {
            title: 'AuroraSound Wireless Earbuds Pro',
            slug: 'aurorasound-wireless-earbuds-pro',
            categorySlug: 'electronics',
            brand: 'AuroraSound',
            basePriceCents: 449900,
            discountPct: 22,
            description: 'Active noise cancellation, 30-hour battery life, and IPX5 water resistance for daily commutes and workouts.',
            isFeatured: true,
        },
        {
            title: 'Nimbus 6.7" Smartphone 128GB',
            slug: 'nimbus-smartphone-128gb',
            categorySlug: 'mobiles-tablets',
            brand: 'Nimbus',
            basePriceCents: 5999900,
            discountPct: 15,
            description: '120Hz AMOLED display, 5000mAh battery, triple camera system with night mode.',
            isFeatured: true,
        },
        {
            title: "Everweave Men's Cotton Kurta",
            slug: 'everweave-mens-cotton-kurta',
            categorySlug: 'fashion',
            brand: 'Everweave',
            basePriceCents: 219900,
            discountPct: 30,
            description: 'Breathable 100% cotton kurta, tailored fit, machine washable.',
            isFeatured: false,
        },
        {
            title: 'Hearth & Co. Non-Stick Cookware Set (7pc)',
            slug: 'hearth-co-cookware-set-7pc',
            categorySlug: 'home-living',
            brand: 'Hearth & Co.',
            basePriceCents: 899900,
            discountPct: 18,
            description: 'Durable non-stick coating, induction-compatible base, soft-touch handles.',
            isFeatured: true,
        },
        {
            title: 'GlowLeaf Vitamin C Serum 30ml',
            slug: 'glowleaf-vitamin-c-serum-30ml',
            categorySlug: 'beauty-health',
            brand: 'GlowLeaf',
            basePriceCents: 159900,
            discountPct: 0,
            description: 'Brightening serum with 15% vitamin C and hyaluronic acid.',
            isFeatured: false,
        },
        {
            title: 'Nimbus Tab 10" 64GB Wi-Fi Tablet',
            slug: 'nimbus-tab-10-64gb',
            categorySlug: 'mobiles-tablets',
            brand: 'Nimbus',
            basePriceCents: 3499900,
            discountPct: 25,
            description: 'Full HD display, 7000mAh battery, ideal for study and entertainment.',
            isFeatured: false,
        },
    ];
    for (const [index, def] of productDefs.entries()) {
        const product = await prisma.product.upsert({
            where: { slug: def.slug },
            update: {},
            create: {
                vendorId: vendor.id,
                categoryId: categories[def.categorySlug],
                title: def.title,
                slug: def.slug,
                description: def.description,
                brand: def.brand,
                status: 'PUBLISHED',
                basePriceCents: def.basePriceCents,
                discountPct: def.discountPct,
                isFeatured: def.isFeatured,
                publishedAt: new Date(),
                averageRating: 4.2 + (index % 3) * 0.2,
                reviewCount: 12 + index * 7,
                totalSold: 30 + index * 15,
                images: {
                    create: [{ url: `product-${index + 1}-main.jpg`, sortOrder: 0 }],
                },
                variants: {
                    create: [
                        {
                            sku: `${def.slug.toUpperCase()}-DEFAULT`,
                            optionsJson: {},
                            priceCents: Math.round(def.basePriceCents * (1 - def.discountPct / 100)),
                            stockQuantity: 50,
                        },
                    ],
                },
            },
        });
        console.log(`Seeded product: ${product.title}`);
    }
    console.log('Seed complete.');
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
