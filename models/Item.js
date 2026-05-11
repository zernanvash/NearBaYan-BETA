const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 800 },
    category: {
      type: String,
      enum: [
        "Electronics",
        "School Supplies",
        "Clothing & Costumes",
        "Tools",
        "Books",
        "Food & Drinks",
        "Others",
      ],
      required: true,
    },

    images: [{ type: String }], // S3 URLs — first image is thumbnail
    condition: {
      type: String,
      enum: ["Brand New", "Like New", "Good", "Fair", "For Parts"],
      required: true,
    },

    availabilityType: {
      borrow: { type: Boolean, default: false },
      rent: { type: Boolean, default: false },
      buy: { type: Boolean, default: false },
      swap: { type: Boolean, default: false },
    },

    pricing: {
      rentFee: { type: Number, default: 0 },       // per day
      rentUnit: { type: String, default: "day" },  // "hour" | "day"
      buyPrice: { type: Number, default: 0 },
      deposit: { type: Number, default: 0 },
      currency: { type: String, default: "PHP" },
      negotiable: { type: Boolean, default: false },
    },

    returnDeadline: { type: Number }, // hours from borrow/rent confirmation

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    radius: { type: Number, required: true },
    locationLabel: { type: String },

    status: {
      type: String,
      enum: ["available", "reserved", "borrowed", "sold", "unavailable"],
      default: "available",
    },

    currentBorrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    conditionPhotoOnLend: { type: String },  // S3 URL — taken before lending
    conditionPhotoOnReturn: { type: String }, // S3 URL — taken on return

    isFlagged: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

itemSchema.index({ location: "2dsphere" });
itemSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model("Item", itemSchema);
