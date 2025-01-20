import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  followUnfollowUser,
  getSuggestedUsers,
  getUserProfile,
  updatePassword,
  updateUser,
} from "../controllers/userControllers.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.post("/update", protectRoute, updateUser);
router.post("/updatePassword", protectRoute, updatePassword);

export default router;
