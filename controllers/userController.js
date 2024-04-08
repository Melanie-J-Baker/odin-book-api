const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");

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
    "Password must contain at least 8 characters (At least one uppercase letter, one lowercase letter and one number"
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
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          res.json({ error: err });
          return;
        } else {
          const user = new User({
            username: req.body.username,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: hashedPassword,
            profile_image: req.body.profile_image,
            date_of_birth: req.body.date_of_birth,
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
      });
    }
  }),
];

// Handle User login on POST
exports.user_login_post = asyncHandler(async (req, res, next) => {
  passport.authenticate("login", async (err, user, info) => {
    try {
      if (err || !user) {
        const error = new Error("An error occurred");
        return next(error);
      }
      req.login(user, { session: false }, async (error) => {
        if (error) return next(error);
        const body = {
          _id: user._id,
          username: user.username,
        };
        const token = jwt.sign({ user: body }, "TOP_SECRET", {
          expiresIn: "12h",
        });
        return res.json({ token: token, user: user });
      });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
});

// Handle User logout on POST
exports.user_logout_post = asyncHandler(async (req, res, next) => {
  exports.user_logout_post = (req, res, next) => {
    res.clearCookie("connect.sid"); // clear the session cookie
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.session.destroy(function (err) {
        // destroy the session
        res.send(); // send to the client
      });
      res.json({ message: "You are now logged out" });
    });
  };
});

// Return a list of all Users
exports.user_list = asyncHandler(async (req, res, next) => {
  const allUsers = await User.find(
    {},
    "username first_name last_name email following profile_image url name"
  )
    .sort({ username: 1 })
    .exec();
  res.json(allUsers);
});

// Return details for a specific User
exports.user_detail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userid)
    .populate("following")
    .exec();
  if (user === null) {
    res.json({ error: "User not found" });
    return next(err);
  }
  const posts = await Post.find({ user: req.params.userid })
    .populate("likes")
    .exec();
  res.json({ user: user, posts: posts });
});

// Return list of users not followed by a specific User
exports.user_addfriend_list = asyncHandler(async (req, res, next) => {
  const currentUser = await User.findById(req.params.userid).exec();
  const allUsers = await User.find({}).sort({ username: 1 }).exec();
  const notFollowedUsers = allUsers.filter(function (user) {
    return (
      user._id != req.params.userid && !currentUser.following.includes(user._id)
    );
  });
  res.json({ users: notFollowedUsers });
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
  body(
    "password",
    "Password must contain at least 8 characters (At least one uppercase letter, one lowercase letter and one number"
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
    // Update User with validated and sanitised data
    if (!errors.isEmpty()) {
      res.json({ error: errors.array() });
      return;
    } else {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          res.json({ error: err });
          return;
        } else {
          const user = new User({
            username: req.body.username,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: hashedPassword,
            profile_image: req.body.profile_image,
            _id: req.params.userid, // Required to update user and not create
          });
          const userExists = await User.findOne({
            username: req.body.username,
          }).exec();
          if (userExists) {
            res.json({ error: "Username already in use" });
          } else {
            await User.findByIdAndUpdate(req.params.id, user, {}).exec();
            res.json({
              status: "User details updated successfully",
              user: user,
            });
          }
        }
      });
    }
  }),
];

// Handle adding User to Following
exports.user_addfriend_put = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userid)
    .populate("following")
    .exec();
  if (user.following.contains(req.body.following)) {
    return res.json({ message: "Already following user" });
  } else {
    user.following.push(req.body.following);
    await User.findByIdAndUpdate(req.params.userid, user, {}).exec();
    res.json({
      message: "Follow request successful",
      following: user.following,
    });
  }
});

// Handle User DELETE
exports.user_delete = asyncHandler(async (req, res, next) => {
  const [user, allPosts] = await Promise.all([
    User.findById(req.params.userid).exec(),
    Post.find({ user: req.params.userid }).exec(),
  ]);
  const allCommentsOnPosts = allPosts.forEach(async (post) => {
    await Comment.find({ post: post._id }).exec();
  });
  if (user === null) {
    res.json({ error: "User not found" });
  }
  if (allPosts) {
    await allPosts.deleteMany({ user: req.params.userid }).exec();
  }
  if (allCommentsOnPosts) {
    allPosts.forEach(async (post) => {
      await Comment.deleteMany({ post: post._id }).exec();
    });
  }
  await User.findByIdAndDelete(req.params.userid).exec();
  res.json({
    message: "User deleted",
    user: user,
    postsDeleted: allPosts,
    commentsDeleted: allCommentsOnPosts,
  });
});
