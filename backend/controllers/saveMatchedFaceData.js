import Guest from "../models/Guest.js"; // Import the Guest model

export const saveMatchedFaceData = async (req, res) => {
  try {
    const { matchedFaceId, name, email, phone, country, company, designation } = req.body;

    if (!matchedFaceId || !name || !email || !phone || !country) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    const existingGuest = await Guest.findOne({ email });
    if (existingGuest) {
      // Agar email already hai toh save mat karo, bas 200 success return karo
      return res.status(200).json({ message: "User already exists, skipping save" });
    }

    // Create a new guest with matched face ID and other data
    const newGuest = new Guest({
      matchedFaceId,
      name,
      email,
      phone,
      country,
      company,
      designation,
    });

    // Save the guest in the database
    await newGuest.save();

    return res.status(200).json({ message: "User data saved successfully" });
  } catch (err) {
    console.error("Error saving user data:", err);
    return res.status(500).json({ error: "Failed to save user data" });
  }
};
