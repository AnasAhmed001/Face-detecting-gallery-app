import { User } from "../models/User.js";
import bcrypt from "bcrypt";

export const addPhotographer = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const photographer = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "photographer",
    });

    res.status(201).json({ message: "Photographer added", photographer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllPhotographers = async (req, res) => {
  try {
    const photographers = await User.find({ role: "photographer" });

    res.status(200).json({
      success: true,
      count: photographers.length,
      data: photographers,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deletePhotographer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user || user.role !== "photographer") {
      return res.status(404).json({ message: "Photographer not found" });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "Photographer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const editPhotographer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password } = req.body;

    const user = await User.findById(id);
    if (!user || user.role !== "photographer") {
      return res.status(404).json({ message: "Photographer not found" });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }


    const updatedPhotographer = await user.save();
    res.status(200).json({
      message: "Photographer updated",
      photographer: updatedPhotographer,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
