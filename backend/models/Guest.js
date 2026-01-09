import mongoose from "mongoose";

const guestSchema = new mongoose.Schema({
  matchedFaceId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  company: { type: String},
  designation: { type: String },
}, { timestamps: true });

const Guest = mongoose.model("Guest", guestSchema);

export default Guest;
