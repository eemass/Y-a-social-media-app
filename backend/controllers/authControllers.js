import { generateTokenSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { fullName, username, password, email } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format.",
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        error: "Username already taken.",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        error: "Account with this email already exists.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password length must be greater than 6 characters.",
      });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateTokenSetCookie(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
        followers: newUser.followers,
        following: newUser.following,
      });
    } else {
      res.status(400).json({
        error: "Invalid User data.",
      });
    }
  } catch (error) {
    console.error("Error in signup controller.", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect) {
      return res.status(400).json({
        error: "Invalid username or password.",
      });
    }

    generateTokenSetCookie(user._id, res);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
      followers: user.followers,
      following: user.following,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("token", "", { maxAge: 0 });
    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Error in logout controller,", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getMe controller,", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};
