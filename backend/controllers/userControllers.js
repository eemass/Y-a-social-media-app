import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile controller,", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const myId = req.user._id;

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: myId },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    const me = await User.findById(myId);

    const filteredUsers = users.filter(
      (user) => !me.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.splice(0, 4);
    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUsers: ", error.message);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot follow this user." });
    }

    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (!userToModify || !currentUser) {
      return res.status(500).json({ error: "User does not exist." });
    }

    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      await User.findByIdAndUpdate(userToModify._id, {
        $pull: { followers: currentUser._id },
      });
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { following: userToModify._id },
      });
      res.status(200).json({ message: "User unfollowed successfully." });
    } else {
      await User.findByIdAndUpdate(userToModify._id, {
        $push: { followers: currentUser._id },
      });
      await User.findByIdAndUpdate(currentUser._id, {
        $push: {
          following: userToModify._id,
        },
      });

      const notification = new Notification({
        to: userToModify._id,
        from: currentUser._id,
        type: "follow",
      });

      await notification.save();

      res.status(200).json({ message: "User followed successfully." });
    }
  } catch (error) {
    console.log("Error in followUnfollow controller,", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, username, email, bio, link } = req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      const uploadRes = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadRes.secure_url;
    }

    if (coverImg) {
      if (user.coverImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }
      const uploadRes = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadRes.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    await user.save();

    const { password, ...userData } = user.toObject();

    res.status(200).json(userData);
  } catch (error) {
    console.log("Error in updateUser: ", error.message);
    res.status(500).json({ error: "Internal Server Error." });
  }
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const userId = req.user._id;

  try {
    if (!currentPassword?.trim() || !newPassword?.trim()) {
      return res
        .status(400)
        .json({ error: "Please provide both current and new passwords." });
    }

    const user = await User.findById(userId);

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password provided." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long." });
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    const { password, ...userData } = user.toObject();
    res.status(200).json(userData);
  } catch (error) {
    console.log("Error in updatePassword: ", error.message);
    res.status(500).json({ error: "Internal Server Error." });
  }
};
