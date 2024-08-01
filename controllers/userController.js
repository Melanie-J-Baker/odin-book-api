const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

// Welcome page with counts of users, conversations and messages
exports.index = asyncHandler(async (req, res, next) => {
  const [numUsers, numPosts, numComments] = await Promise.all([
    User.countDocuments({}).exec(),
    Post.countDocuments({}).exec(),
    Comment.countDocuments({}).exec(),
  ]);
  res.json({
    numberOfUsers: numUsers,
    numberOfPosts: numPosts,
    numberOfComments: numComments,
  });
});

// Handle User signup on POST
exports.user_signup_post = [
  body("username", "Username is not valid")
    .trim()
    .isLength({ min: 4, max: 30 })
    .escape(),
  body("first_name", "First name is not valid")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape(),
  body("last_name", "Last name is not valid")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape(),
  body("email", "Email is required").trim().isLength({ min: 1 }),
  body(
    "password",
    "Password must contain 8+ characters (1+ uppercase letter, 1+ lowercase letter and 1+ number)"
  )
    .trim()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
    .isLength({ min: 8 })
    .escape(),
  body("password_confirm").custom(async (password_confirm, { req }) => {
    const password = req.body.password;
    // If passwords do not match throw error
    if (password !== password_confirm) {
      throw new Error("Passwords do not match");
    }
  }),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    // Create User with validated and sanitised data
    if (!errors.isEmpty()) {
      res.json({ error: errors.array() });
      return;
    } else {
      const user = new User({
        username: req.body.username,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
      });
      const userExists = await User.findOne({
        username: req.body.username,
      }).exec();
      if (userExists) {
        res.json({ error: "Username already in use" });
      } else {
        await user.save();
        res.json({
          status: "Sign up successful",
          user: user,
        });
      }
    }
  }),
];

// Handle User login on POST
exports.user_login_post = asyncHandler(async (req, res, next) => {
  passport.authenticate("login", async (err, user, info) => {
    try {
      if (err || !user) {
        const error = new Error(err || info.message);
        return next(error);
      }
      req.login(user, { session: false }, async (error) => {
        if (error) return next(error);
        const body = {
          _id: user._id,
          username: user.username,
        };
        const token = jwt.sign({ user: body }, process.env.JWT_SECRET, {
          expiresIn: "12h",
        });
        // Create a session cookie
        req.session.token = token;
        req.session.user = user;
        return res.json({ token: token, user: user });
      });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
});

// Handle User logout on POST
exports.user_logout_post = asyncHandler(async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session = null; // Clear cookie-session
    res.json({ message: "You are now logged out" });
  });
});

// Return a list of all Users
exports.user_list = asyncHandler(async (req, res, next) => {
  const allUsers = await User.find(
    {},
    "username first_name last_name email friends profile_image url name"
  )
    .sort({ username: 1 })
    .exec();
  res.json(allUsers);
});

// Return details for a specific User
exports.user_detail = asyncHandler(async (req, res, next, err) => {
  const user = await User.findById(req.params.userid)
    .populate("friends")
    .populate("requests")
    .exec();
  if (user === null) {
    res.json({ error: "User not found" });
    return next(err);
  }
  const posts = await Post.find({ user: req.params.userid })
    .populate("likes")
    .sort({ timestamp: -1 })
    .exec();
  res.json({ user: user, posts: posts });
});

// Return list of users not in friends array of a specific User
exports.user_addfriend_list = asyncHandler(async (req, res, next) => {
  const currentUser = await User.findById(req.params.userid).exec();
  const allUsers = await User.find({}).sort({ username: 1 }).exec();
  const notFriends = allUsers.filter(function (user) {
    return (
      user._id != req.params.userid && !currentUser.friends.includes(user._id)
    );
  });
  res.json({
    users: notFriends,
  });
});

// Handle User update on PUT
exports.user_update_put = [
  body("username", "Username is not valid")
    .trim()
    .isLength({ min: 4, max: 30 })
    .escape(),
  body("first_name", "First name is not valid")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape(),
  body("last_name", "Last name is not valid")
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape(),
  body("email", "Email is required").trim().isLength({ min: 1 }),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    // Update User with validated and sanitised data
    if (!errors.isEmpty()) {
      res.json({ error: errors.array() });
      return;
    } else {
      const user = new User({
        username: req.body.username,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        _id: req.params.userid, // Required to update user and not create
      });
      const currentUser = await User.findById(req.params.userid).exec();
      if (currentUser.username !== req.body.username) {
        const userExists = await User.findOne({
          username: req.body.username,
        }).exec();
        if (userExists) {
          res.json({ status: "Username already in use" });
        } else {
          await User.findByIdAndUpdate(req.params.userid, user, {}).exec();
          res.json({
            status: "Profile updated successfully",
            user: user,
          });
        }
      } else {
        await User.findByIdAndUpdate(req.params.userid, user, {}).exec();
        res.json({
          status: "Profile updated successfully",
          user: user,
        });
      }
    }
  }),
];

// Handle profile image
exports.user_profileimage_put = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userid).exec();
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI);
    user.profile_image = cldRes.secure_url;
    await User.findByIdAndUpdate(req.params.userid, user, {}).exec();
    res.json({
      status: "Profile image updated",
      user: user,
      url: cldRes.secure_url,
    });
  } catch (error) {
    res.send({
      message: error.message,
    });
  }
});

// Handle change password
exports.user_changepassword_put = [
  body(
    "newPassword",
    "Password must contain at least 8 characters (At least one uppercase letter, one lowercase letter and one number"
  )
    .trim()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
    .isLength({ min: 8 })
    .escape(),
  body("confirmPassword").custom(async (password_confirm, { req }) => {
    const password = req.body.newPassword;
    // If passwords do not match throw error
    if (password !== password_confirm) {
      throw new Error("Passwords do not match");
    }
  }),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    // Update User with validated and sanitised data
    if (!errors.isEmpty()) {
      res.json({ error: errors.array() });
      return;
    } else {
      const user = await User.findById(req.params.userid);
      const validate = await user.isValidPassword(req.body.currentPassword);
      if (validate) {
        const user = new User({
          password: req.body.newPassword,
          _id: req.params.userid, // Required to update user and not create
        });
        await User.findByIdAndUpdate(req.params.userid, user, {}).exec();
        res.json({
          message: "Password changed successfully",
          user: user,
        });
      } else {
        res.json({
          message: "Wrong password",
        });
      }
    }
  }),
];

// Handle send friend request
exports.user_friendrequest_put = asyncHandler(async (req, res, next) => {
  const currentUser = await User.findById(req.params.userid).exec();
  const toFriendUser = await User.findById(req.body.toFriend).exec();
  if (currentUser.friends.includes(req.body.toFriend)) {
    return res.json({
      message: "Already friends with user",
      user: req.body.toFriend,
    });
  } else if (toFriendUser.requests.includes(req.params.userid)) {
    return res.json({
      message: "Friend request already sent",
      user: req.body.toFriend,
    });
  } else {
    toFriendUser.requests.push(currentUser);
    await User.findByIdAndUpdate(req.body.toFriend, toFriendUser, {}).exec();
    return res.json({
      message: "Friend request sent",
      user: req.body.toFriend,
    });
  }
});

// Handle removing friend request
exports.user_removerequest_put = asyncHandler(async (req, res, next) => {
  const currentUser = await User.findById(req.params.userid).exec();
  if (currentUser.requests.includes(req.body.removeid)) {
    const index = currentUser.requests.indexOf(req.body.removeid);
    if (index !== -1) {
      currentUser.requests.splice(index, 1);
    }
    await User.findByIdAndUpdate(req.params.userid, currentUser, {}).exec();
    return res.json({
      message: "Friend request removed",
      user: req.body.removeid,
      newRequests: currentUser.requests,
    });
  }
});

// Handle adding/removing friend
exports.user_addfriend_put = asyncHandler(async (req, res, next) => {
  const currentUser = await User.findById(req.params.userid).exec();
  const requestUser = await User.findById(req.body.requestUserId);
  if (currentUser.friends.includes(req.body.requestUserId)) {
    const index = currentUser.friends.indexOf(req.body.requestUserId);
    if (index !== -1) {
      currentUser.friends.splice(index, 1);
    }
    const requestIndex = requestUser.friends.indexOf(req.params.userid);
    if (requestIndex !== -1) {
      requestUser.friends.splice(requestIndex, 1);
    }
    await User.findByIdAndUpdate(req.params.userid, currentUser, {}).exec();
    await User.findByIdAndUpdate(
      req.body.requestUserId,
      requestUser,
      {}
    ).exec();
    return res.json({
      message: "Friend removed",
      user: req.body.requestUserId,
      friends: currentUser.friends,
    });
  } else {
    currentUser.friends.push(req.body.requestUserId);
    requestUser.friends.push(req.params.userid);
    const index = currentUser.requests.indexOf(req.body.requestUserId);
    if (index !== -1) {
      currentUser.requests.splice(index, 1);
    }
    const requestIndex = requestUser.requests.indexOf(req.params.userid);
    if (requestIndex !== -1) {
      requestUser.requests.splice(requestIndex, 1);
    }
    await User.findByIdAndUpdate(req.params.userid, currentUser, {}).exec();
    await User.findByIdAndUpdate(
      req.body.requestUserId,
      requestUser,
      {}
    ).exec();
    const allUsers = await User.find({}).sort({ username: 1 }).exec();
    const notFriendUsers = allUsers.filter(function (user) {
      return (
        user._id != req.params.userid && !currentUser.friends.includes(user._id)
      );
    });
    res.json({
      message: "Friend request successful",
      friends: currentUser.friends,
      notFriends: notFriendUsers,
      user: req.body.requestUserId,
    });
  }
});

// Handle User DELETE
exports.user_delete = asyncHandler(async (req, res, next) => {
  const [user, allPosts, allCommentsByUser] = await Promise.all([
    User.findById(req.params.userid).exec(),
    Post.find({ user: req.params.userid }).exec(),
    Comment.find({ user: req.params.userid }).exec(),
  ]);
  const allCommentsOnPosts = allPosts.forEach(async (post) => {
    await Comment.find({ post: post._id }).exec();
  });
  if (user === null) {
    res.json({ error: "User not found" });
  }
  if (allPosts) {
    await Post.deleteMany({ user: req.params.userid }).exec();
  }
  if (allCommentsOnPosts) {
    allPosts.forEach(async (post) => {
      await Comment.deleteMany({ post: post._id }).exec();
    });
  }
  if (allCommentsByUser) {
    await Comment.deleteMany({ user: req.params.userid });
  }
  await User.findByIdAndDelete(req.params.userid).exec();
  res.json({
    message: "User deleted",
    user: user,
    postsDeleted: allPosts,
    postCommentsDeleted: allCommentsOnPosts,
    commentsByUserDeleted: allCommentsByUser,
  });
});
