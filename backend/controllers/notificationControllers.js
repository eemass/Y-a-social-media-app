import Notification from "../models/notificationModel.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      to: req.user._id,
    }).populate({ path: "from", select: "username profileImg" });

    await Notification.updateMany({ to: req.user._id }, { read: true });

    res.status(200).json(notifications);
  } catch (error) {
    console.log("Error in getNotifications: ", error.message);
    res.status(500).json({ error: "Internal Server error." });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notifications deleted successfully." });
  } catch (error) {
    console.log("Error in deleteNotifications: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: "Notification does not exist." });
    }

    if (notification.to.toString() !== req.user._id) {
      return res
        .status(400)
        .json({ error: "You cannot delete this notification." });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (error) {
    console.log("Error in deleteNotification: ", error.message);
    res.status(500).json({ error: "Internal Server error." });
  }
};
