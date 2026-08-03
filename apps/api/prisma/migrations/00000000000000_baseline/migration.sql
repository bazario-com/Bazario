--
-- PostgreSQL database dump
--


-- Dumped from database version 18.4 (Debian 18.4-1.pgdg13+1)
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AddressType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AddressType" AS ENUM (
    'HOME',
    'OFFICE',
    'OTHER'
);


--
-- Name: ConversationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConversationStatus" AS ENUM (
    'OPEN',
    'RESOLVED'
);


--
-- Name: ConversationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConversationType" AS ENUM (
    'ORDER_VERIFICATION',
    'CUSTOMER_VENDOR',
    'VENDOR_ADMIN_SUPPORT'
);


--
-- Name: CouponDiscountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CouponDiscountType" AS ENUM (
    'PERCENTAGE',
    'FIXED'
);


--
-- Name: CourierProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CourierProvider" AS ENUM (
    'LEOPARDS',
    'TCS',
    'POSTEX',
    'MANUAL'
);


--
-- Name: OAuthProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OAuthProvider" AS ENUM (
    'GOOGLE',
    'FACEBOOK'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'UNPAID',
    'AUTHORIZED',
    'PAID',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'PUBLISHED',
    'REJECTED',
    'ARCHIVED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'CUSTOMER',
    'VENDOR',
    'ADMIN',
    'SUPER_ADMIN'
);


--
-- Name: ShipmentEventSource; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShipmentEventSource" AS ENUM (
    'WEBHOOK',
    'POLL',
    'MANUAL'
);


--
-- Name: ShipmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShipmentStatus" AS ENUM (
    'PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'RETURNED',
    'FAILED'
);


--
-- Name: VendorStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VendorStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'SUSPENDED',
    'REJECTED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Announcement" (
    id text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'INFO'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "startsAt" timestamp(3) without time zone,
    "endsAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "orderId" text,
    type public."ConversationType" NOT NULL,
    status public."ConversationStatus" DEFAULT 'OPEN'::public."ConversationStatus" NOT NULL,
    escalated boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ConversationParticipant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ConversationParticipant" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    role public."Role" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    "senderRole" public."Role" NOT NULL,
    body text,
    "imageUrl" text,
    filtered boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Shipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Shipment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "courierProvider" public."CourierProvider" DEFAULT 'LEOPARDS'::public."CourierProvider" NOT NULL,
    "trackingNumber" text,
    "courierRefId" text,
    status public."ShipmentStatus" DEFAULT 'PENDING'::public."ShipmentStatus" NOT NULL,
    "originCity" text,
    "destinationCity" text,
    "estimatedDeliveryAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ShipmentEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShipmentEvent" (
    id text NOT NULL,
    "shipmentId" text NOT NULL,
    status public."ShipmentStatus" NOT NULL,
    location text,
    description text,
    source public."ShipmentEventSource" DEFAULT 'MANUAL'::public."ShipmentEventSource" NOT NULL,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id text NOT NULL,
    "userId" text NOT NULL,
    label text NOT NULL,
    type public."AddressType" DEFAULT 'HOME'::public."AddressType" NOT NULL,
    "recipientName" text NOT NULL,
    phone text NOT NULL,
    line1 text NOT NULL,
    line2 text,
    city text NOT NULL,
    state text,
    "postalCode" text,
    country text DEFAULT 'PK'::text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id text NOT NULL,
    "userId" text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "imageUrl" text,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: coupon_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_redemptions (
    id text NOT NULL,
    "couponId" text NOT NULL,
    "userId" text NOT NULL,
    "orderGroupId" text NOT NULL,
    "discountCents" integer NOT NULL,
    "redeemedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id text NOT NULL,
    code text NOT NULL,
    description text,
    "discountType" public."CouponDiscountType" NOT NULL,
    "discountValue" integer NOT NULL,
    "minOrderCents" integer DEFAULT 0 NOT NULL,
    "maxRedemptions" integer,
    "vendorId" text,
    "startsAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: oauth_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_accounts (
    id text NOT NULL,
    provider public."OAuthProvider" NOT NULL,
    "providerUserId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text NOT NULL,
    "titleSnapshot" text NOT NULL,
    "optionsSnapshot" jsonb NOT NULL,
    "unitPriceCents" integer NOT NULL,
    quantity integer NOT NULL,
    "lineTotalCents" integer NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "orderGroupId" text NOT NULL,
    "orderNumber" text NOT NULL,
    "userId" text NOT NULL,
    "vendorId" text NOT NULL,
    "addressId" text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    "paymentMethod" text NOT NULL,
    "subtotalCents" integer NOT NULL,
    "shippingCents" integer DEFAULT 0 NOT NULL,
    "discountCents" integer DEFAULT 0 NOT NULL,
    "taxCents" integer DEFAULT 0 NOT NULL,
    "totalCents" integer NOT NULL,
    currency text DEFAULT 'PKR'::text NOT NULL,
    "couponCode" text,
    "placedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    "altText" text,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id text NOT NULL,
    "productId" text NOT NULL,
    sku text NOT NULL,
    "optionsJson" jsonb NOT NULL,
    "priceCents" integer NOT NULL,
    "stockQuantity" integer DEFAULT 0 NOT NULL,
    "lowStockAlertAt" integer DEFAULT 5 NOT NULL,
    "weightGrams" integer,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    "vendorId" text NOT NULL,
    "categoryId" text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    brand text,
    status public."ProductStatus" DEFAULT 'DRAFT'::public."ProductStatus" NOT NULL,
    "rejectedReason" text,
    "basePriceCents" integer NOT NULL,
    currency text DEFAULT 'PKR'::text NOT NULL,
    "discountPct" integer DEFAULT 0 NOT NULL,
    "averageRating" numeric(3,2) DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "totalSold" integer DEFAULT 0 NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: recently_viewed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recently_viewed (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    "tokenHash" text NOT NULL,
    "userId" text NOT NULL,
    "userAgent" text,
    "ipAddress" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "replacedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "productId" text NOT NULL,
    "userId" text NOT NULL,
    rating integer NOT NULL,
    title text,
    body text,
    "isVerifiedPurchase" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id text NOT NULL,
    "vendorId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "logoUrl" text,
    "bannerUrl" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    "emailVerifiedAt" timestamp(3) without time zone,
    phone text,
    "phoneVerifiedAt" timestamp(3) without time zone,
    "passwordHash" text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "avatarUrl" text,
    role public."Role" DEFAULT 'CUSTOMER'::public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id text NOT NULL,
    "userId" text NOT NULL,
    "businessName" text NOT NULL,
    "businessRegNumber" text,
    "taxId" text,
    status public."VendorStatus" DEFAULT 'PENDING'::public."VendorStatus" NOT NULL,
    "commissionRateBps" integer DEFAULT 1000 NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "rejectedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist_items (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    "addedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: ConversationParticipant ConversationParticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: ShipmentEvent ShipmentEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShipmentEvent"
    ADD CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY (id);


--
-- Name: Shipment Shipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Shipment"
    ADD CONSTRAINT "Shipment_pkey" PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: coupon_redemptions coupon_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: oauth_accounts oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: recently_viewed recently_viewed_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT recently_viewed_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- Name: ConversationParticipant_conversationId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON public."ConversationParticipant" USING btree ("conversationId", "userId");


--
-- Name: ConversationParticipant_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConversationParticipant_userId_idx" ON public."ConversationParticipant" USING btree ("userId");


--
-- Name: Conversation_escalated_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Conversation_escalated_idx" ON public."Conversation" USING btree (escalated);


--
-- Name: Conversation_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Conversation_orderId_idx" ON public."Conversation" USING btree ("orderId");


--
-- Name: Conversation_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Conversation_status_idx" ON public."Conversation" USING btree (status);


--
-- Name: Message_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_conversationId_idx" ON public."Message" USING btree ("conversationId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: ShipmentEvent_shipmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ShipmentEvent_shipmentId_idx" ON public."ShipmentEvent" USING btree ("shipmentId");


--
-- Name: Shipment_orderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Shipment_orderId_key" ON public."Shipment" USING btree ("orderId");


--
-- Name: Shipment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Shipment_status_idx" ON public."Shipment" USING btree (status);


--
-- Name: Shipment_trackingNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Shipment_trackingNumber_idx" ON public."Shipment" USING btree ("trackingNumber");


--
-- Name: addresses_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "addresses_userId_idx" ON public.addresses USING btree ("userId");


--
-- Name: cart_items_cartId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cart_items_cartId_idx" ON public.cart_items USING btree ("cartId");


--
-- Name: cart_items_cartId_variantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "cart_items_cartId_variantId_key" ON public.cart_items USING btree ("cartId", "variantId");


--
-- Name: cart_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cart_items_productId_idx" ON public.cart_items USING btree ("productId");


--
-- Name: carts_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "carts_userId_key" ON public.carts USING btree ("userId");


--
-- Name: categories_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "categories_parentId_idx" ON public.categories USING btree ("parentId");


--
-- Name: categories_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_slug_idx ON public.categories USING btree (slug);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: coupon_redemptions_couponId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "coupon_redemptions_couponId_idx" ON public.coupon_redemptions USING btree ("couponId");


--
-- Name: coupon_redemptions_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "coupon_redemptions_userId_idx" ON public.coupon_redemptions USING btree ("userId");


--
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- Name: coupons_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "coupons_isActive_idx" ON public.coupons USING btree ("isActive");


--
-- Name: coupons_vendorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "coupons_vendorId_idx" ON public.coupons USING btree ("vendorId");


--
-- Name: oauth_accounts_provider_providerUserId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "oauth_accounts_provider_providerUserId_key" ON public.oauth_accounts USING btree (provider, "providerUserId");


--
-- Name: oauth_accounts_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauth_accounts_userId_idx" ON public.oauth_accounts USING btree ("userId");


--
-- Name: order_items_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_items_orderId_idx" ON public.order_items USING btree ("orderId");


--
-- Name: order_items_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "order_items_productId_idx" ON public.order_items USING btree ("productId");


--
-- Name: orders_orderGroupId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_orderGroupId_idx" ON public.orders USING btree ("orderGroupId");


--
-- Name: orders_orderNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "orders_orderNumber_key" ON public.orders USING btree ("orderNumber");


--
-- Name: orders_placedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_placedAt_idx" ON public.orders USING btree ("placedAt");


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_userId_idx" ON public.orders USING btree ("userId");


--
-- Name: orders_vendorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "orders_vendorId_idx" ON public.orders USING btree ("vendorId");


--
-- Name: product_images_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_images_productId_idx" ON public.product_images USING btree ("productId");


--
-- Name: product_variants_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "product_variants_productId_idx" ON public.product_variants USING btree ("productId");


--
-- Name: product_variants_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);


--
-- Name: products_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "products_categoryId_idx" ON public.products USING btree ("categoryId");


--
-- Name: products_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "products_createdAt_idx" ON public.products USING btree ("createdAt");


--
-- Name: products_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "products_isFeatured_idx" ON public.products USING btree ("isFeatured");


--
-- Name: products_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_slug_idx ON public.products USING btree (slug);


--
-- Name: products_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);


--
-- Name: products_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_status_idx ON public.products USING btree (status);


--
-- Name: products_vendorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "products_vendorId_idx" ON public.products USING btree ("vendorId");


--
-- Name: recently_viewed_userId_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "recently_viewed_userId_productId_key" ON public.recently_viewed USING btree ("userId", "productId");


--
-- Name: recently_viewed_userId_viewedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "recently_viewed_userId_viewedAt_idx" ON public.recently_viewed USING btree ("userId", "viewedAt");


--
-- Name: refresh_tokens_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "refresh_tokens_expiresAt_idx" ON public.refresh_tokens USING btree ("expiresAt");


--
-- Name: refresh_tokens_tokenHash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON public.refresh_tokens USING btree ("tokenHash");


--
-- Name: refresh_tokens_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "refresh_tokens_userId_idx" ON public.refresh_tokens USING btree ("userId");


--
-- Name: reviews_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "reviews_productId_idx" ON public.reviews USING btree ("productId");


--
-- Name: reviews_productId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "reviews_productId_userId_key" ON public.reviews USING btree ("productId", "userId");


--
-- Name: stores_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stores_slug_idx ON public.stores USING btree (slug);


--
-- Name: stores_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX stores_slug_key ON public.stores USING btree (slug);


--
-- Name: stores_vendorId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "stores_vendorId_key" ON public.stores USING btree ("vendorId");


--
-- Name: users_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_createdAt_idx" ON public.users USING btree ("createdAt");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: vendors_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vendors_status_idx ON public.vendors USING btree (status);


--
-- Name: vendors_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "vendors_userId_key" ON public.vendors USING btree ("userId");


--
-- Name: wishlist_items_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "wishlist_items_userId_idx" ON public.wishlist_items USING btree ("userId");


--
-- Name: wishlist_items_userId_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "wishlist_items_userId_productId_key" ON public.wishlist_items USING btree ("userId", "productId");


--
-- Name: ConversationParticipant ConversationParticipant_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationParticipant ConversationParticipant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConversationParticipant"
    ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversation Conversation_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShipmentEvent ShipmentEvent_shipmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShipmentEvent"
    ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES public."Shipment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Shipment Shipment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Shipment"
    ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: addresses addresses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: carts carts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: coupon_redemptions coupon_redemptions_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_redemptions coupon_redemptions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT "coupon_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupons coupons_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT "coupons_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: oauth_accounts oauth_accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_items order_items_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES public.addresses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_images product_images_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recently_viewed recently_viewed_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT "recently_viewed_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recently_viewed recently_viewed_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recently_viewed
    ADD CONSTRAINT "recently_viewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stores stores_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT "stores_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vendors vendors_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT "vendors_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlist_items wishlist_items_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


