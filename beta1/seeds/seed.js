/**
 * Seed script — populates DB with realistic NearBaYan test data.
 * Run: node seeds/seed.js
 */

require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Post = require("../models/Post");
const Item = require("../models/Item");
const LostFound = require("../models/LostFound");
const { hashVerificationAnswers } = require("../utils/claimVerification");

// Calasiao, Pangasinan area coordinates [lng, lat]
const BASE = [120.3664, 16.0023];
const jitter = (n, range = 0.005) => n + (Math.random() - 0.5) * range;

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Clearing existing seed data...");

  await Promise.all([
    User.deleteMany({ email: /@nearBaYan\.seed$/ }),
    Post.deleteMany({ title: /\[SEED\]/ }),
    Item.deleteMany({ name: /\[SEED\]/ }),
    LostFound.deleteMany({ title: /\[SEED\]/ }),
  ]);

  // ─── Users ──────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash("Password123!", 10);

  const users = await User.insertMany([
    {
      name: "Ana Reyes",
      email: "ana@nearBaYan.seed",
      passwordHash: password,
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])], label: "Near Campus Gate" },
      defaultRadius: 1000,
      verification: { email: true, phone: true },
      trust: { score: 4.8, totalRatings: 12, completedTransactions: 15, label: "Trusted Community Member" },
    },
    {
      name: "Marco Santos",
      email: "marco@nearBaYan.seed",
      passwordHash: password,
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])], label: "Dorm Area" },
      defaultRadius: 500,
      verification: { email: true },
      trust: { score: 4.2, totalRatings: 6, completedTransactions: 7, label: "Reliable Helper" },
    },
    {
      name: "Lea Cruz",
      email: "lea@nearBaYan.seed",
      passwordHash: password,
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])], label: "Near Library" },
      defaultRadius: 1000,
      verification: { email: true },
      trust: { score: 3.5, totalRatings: 3, completedTransactions: 4, label: "Verified User" },
    },
    {
      name: "Jake Villanueva",
      email: "jake@nearBaYan.seed",
      passwordHash: password,
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])], label: "Food Court Area" },
      defaultRadius: 1000,
      trust: { score: 0, totalRatings: 0, completedTransactions: 0, label: "New User" },
    },
  ]);

  const [ana, marco, lea, jake] = users;
  console.log(`Created ${users.length} seed users.`);

  // ─── Posts ──────────────────────────────────────────────────────────────────
  const posts = await Post.insertMany([
    {
      author: marco._id,
      type: "errand",
      title: "[SEED] Can someone check if the printing shop near Gate 2 is open?",
      description: "I need to know if Sunshine Printing is accepting walk-ins right now. I'm finishing a report.",
      category: "Printing",
      payment: { offered: true, amount: 20, currency: "PHP", note: "Quick favor lang" },
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])] },
      radius: 1000,
      locationLabel: "Near Gate 2",
      status: "open",
    },
    {
      author: lea._id,
      type: "favor",
      title: "[SEED] Can someone help carry boxes from the guard house to Room 204?",
      description: "I have 3 small boxes of project materials. Room 204, 2nd floor lang naman.",
      category: "Carrying",
      payment: { offered: true, amount: 50, currency: "PHP" },
      deadline: new Date(Date.now() + 1 * 60 * 60 * 1000),
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])] },
      radius: 500,
      locationLabel: "Near Guardhouse",
      status: "open",
    },
    {
      author: jake._id,
      type: "question",
      title: "[SEED] May brownout ba ngayon sa Calasiao area?",
      description: "Nag-go out yung kuryente namin, wondering if community-wide ba ito.",
      category: "Utilities",
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])] },
      radius: 3000,
      locationLabel: "Calasiao",
      status: "open",
      answers: [
        {
          author: ana._id,
          text: "Oo, may brownout. PECO scheduled maintenance daw until 5pm.",
          label: "Confirmed",
          confirmations: 4,
        },
      ],
    },
  ]);
  console.log(`Created ${posts.length} seed posts.`);

  // ─── Items ──────────────────────────────────────────────────────────────────
  const items = await Item.insertMany([
    {
      owner: ana._id,
      name: "[SEED] Power bank 20,000mAh",
      description: "Anker power bank, fully charged. For borrow or rent.",
      category: "Electronics",
      condition: "Like New",
      availabilityType: { borrow: true, rent: true },
      pricing: { rentFee: 15, rentUnit: "day", deposit: 100, currency: "PHP" },
      returnDeadline: 24,
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])] },
      radius: 1000,
      locationLabel: "Near Campus Gate",
      status: "available",
    },
    {
      owner: marco._id,
      name: "[SEED] Formal shoes size 8 — black",
      description: "Worn twice lang. Available for borrow for events.",
      category: "Clothing & Costumes",
      condition: "Like New",
      availabilityType: { borrow: true },
      pricing: { deposit: 200, currency: "PHP" },
      returnDeadline: 48,
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])] },
      radius: 1000,
      locationLabel: "Dorm Area",
      status: "available",
    },
    {
      owner: lea._id,
      name: "[SEED] HDMI cable 2m",
      description: "Working perfectly. Borrow for presentations.",
      category: "Electronics",
      condition: "Good",
      availabilityType: { borrow: true },
      pricing: { deposit: 50, currency: "PHP" },
      returnDeadline: 6,
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])] },
      radius: 500,
      locationLabel: "Near Library",
      status: "available",
    },
  ]);
  console.log(`Created ${items.length} seed items.`);

  // ─── Lost & Found ────────────────────────────────────────────────────────────
  const verificationQuestions = await hashVerificationAnswers([
    { question: "What course or school is printed on the ID?", answer: "Computer Science", hint: "It's a college course name" },
    { question: "What is the last 4 digits of the ID number?", answer: "4821" },
  ]);

  const lostFoundReports = await LostFound.insertMany([
    {
      reporter: ana._id,
      reportType: "found",
      category: "ID",
      title: "[SEED] Found school ID near the library entrance",
      publicDescription: "Found a school ID on the floor near the library entrance door. Details are blurred for privacy. Claim it if it's yours.",
      privateDescription: "ID is from a female student. Blue lanyard. Found Tuesday around 2pm.",
      images: { original: [], blurred: [] },
      verificationQuestions,
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])] },
      radius: 2000,
      locationLabel: "Near Library Entrance",
      handoffPoint: "Library reception desk",
      status: "active",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      reporter: marco._id,
      reportType: "lost",
      category: "Wallet",
      title: "[SEED] Lost brown leather wallet near the food court",
      publicDescription: "Lost a brown leather wallet somewhere near the food court. Has some cash and cards inside.",
      location: { type: "Point", coordinates: [jitter(BASE[0]), jitter(BASE[1])] },
      radius: 1000,
      locationLabel: "Near Food Court",
      handoffPoint: "Campus guardhouse",
      status: "active",
      verificationQuestions: await hashVerificationAnswers([
        { question: "What brand is the wallet?", answer: "Fossil" },
        { question: "Approximately how much cash was inside?", answer: "500", hint: "In pesos, rough amount" },
      ]),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  ]);
  console.log(`Created ${lostFoundReports.length} seed lost & found reports.`);

  console.log("\n✓ Seed complete.");
  console.log("Test accounts (password: Password123!):");
  users.forEach((u) => console.log(`  ${u.email}  [${u.trust.label}]`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
