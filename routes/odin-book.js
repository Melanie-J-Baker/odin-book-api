const express = require("express");
const router = express.Router();
const passport = require("passport");
// Require controller modules
const user_controller = require("../controllers/userController");
const post_controller = require("../controllers/postController");
const comment_controller = require("../controllers/commentController");

// USER ROUTES

// Get index (counts of users, posts and comments)
router.get("/", user_controller.index);
// Sign up new user
router.post("/users/signup", user_controller.user_signup_post);
// Login user
router.post("/users/login", user_controller.user_login_post);
// Logout user
router.post("/users/logout", user_controller.user_logout_post);
// List of all users
router.get(
  "/users",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_list
);
// Details of one user
router.get(
  "/users/:userid",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_detail
);
// List of not followed users for a specific user
router.get(
  "/users/:userid/userslist",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_addfriend_list
);
// Get feed for a user
router.get(
  "/users/:userid/feed",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_feed_get
);
// Update a user
router.put(
  "/users/:userid",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_update_put
);
//Add user to following array
router.put(
  "/users/:userid/addfriend",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_addfriend_put
);
// Delete a user
router.delete(
  "/users/:userid",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_delete
);

// POST ROUTES

// Get list of all posts by a user
router.get(
  "/users/:userid/posts",
  passport.authenticate("jwt", { session: false }),
  post_controller.post_list
);
// Get details of a specific post
router.get(
  "/users/:userid/posts/:postid",
  passport.authenticate("jwt", { session: false }),
  post_controller.post_detail
);
// Create a new post
router.post(
  "/users/:userid/posts",
  passport.authenticate("jwt", { session: false }),
  post_controller.post_create_post
);
// Update a post
router.put(
  "/users/:userid/posts/:postid",
  passport.authenticate("jwt", { session: false }),
  post_controller.post_update_put
);
// Delete a post
router.delete(
  "/users/:userid/posts/:postid",
  passport.authenticate("jwt", { session: false }),
  post_controller.post_delete
);

// COMMENT ROUTES

// Get all comments on a post
router.get(
  "/posts/:postid/comments",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_list
);
// Get details of a specific comment on a post
router.get(
  "/posts/:postid/comments/:commentid",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_detail
);
// Create a new comment
router.post("/posts/:postid/comments/", comment_controller.comment_create_post);
// Update a comment
router.put(
  "/posts/:postid/comments/:commentid",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_update_put
);
// Delete a comment
router.delete(
  "/posts/:postid/comments/:commentid",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_delete
);

module.exports = router;
