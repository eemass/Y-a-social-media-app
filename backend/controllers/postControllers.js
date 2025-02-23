import { v2 as cloudinary } from "cloudinary";

import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPosts: ", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    }

    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts },
    })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });
    res.status(200).json(likedPosts);
  } catch (error) {
    console.log("Error in getLikedPosts: ", error.message);
    res.status(500).json({ error: "Internal Server error." });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    }

    const followingPosts = await Post.find({ user: { $in: user.following } })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(followingPosts);
  } catch (error) {
    console.log("Error in getFollowingPosts: ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.status(404).json({ error: "User does not exist." });
    }

    const userPosts = await Post.find({ user: user._id })
      .sort({
        createdAt: -1,
      })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });
    res.status(200).json(userPosts);
  } catch (error) {
    console.log("Error in getUserPosts: ", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { text, image } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }

    if (!text && !image) {
      return res
        .status(400)
        .json({ message: "Post must include text or image." });
    }

    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image);
      image = uploadRes.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      image,
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    console.log("Error in createPost: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      await Post.updateOne({ _id: id }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: id } });
      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      res.status(200).json(updatedLikes);
    } else {
      post.likes.push(userId);
      await User.updateOne({ _id: userId }, { $push: { likedPosts: id } });
      await post.save();

      const notification = new Notification({
        to: post.user,
        from: userId,
        type: "like",
      });

      await notification.save();
      const updatedLikes = post.likes;
      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Error in likePost: ", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const commentPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });
    const { text } = req.body;

    if (!post) {
      return res.status(404).json({ error: "This post does not exist." });
    }

    if (!text) {
      return res.status(400).json({ error: "Comment must include text." });
    }

    post.comments.push({ text, user: req.user._id });

    const notification = new Notification({
      to: post.user,
      from: req.user._id,
      type: "comment",
    });

    await notification.save();

    await post.populate({ path: "comments.user", select: "-password" });

    await post.save();

    const updatedComments = post.comments;

    res.status(200).json(updatedComments);
  } catch (error) {
    console.log("Error in commentPost: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post does not exist." });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this post." });
    }

    if (post.image) {
      await cloudinary.uploader.destroy(
        post.image.split("/").pop().split(".")[0]
      );
    }

    await Post.findByIdAndDelete(id);
    res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.log("Error in deletePost: ", error.message);
    res.status(500).json({ error: "Internal Server Error." });
  }
};
