const express = require("express");
const router = express.Router();
const passport = require("passport");
const Multer = require("multer");
// Require controller modules
const user_controller = require("../controllers/userController");
const post_controller = require("../controllers/postController");
const comment_controller = require("../controllers/commentController");

const storage = new Multer.memoryStorage();
const upload = Multer({
  storage,
});

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

// Update a user
router.put(
  "/users/:userid",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_update_put
);

// Handle profile image
router.put(
  "/users/:userid/newprofileimage",
  passport.authenticate("jwt", { session: false }),
  upload.single("profileImage"),
  user_controller.user_profileimage_put
);

// Handle change password
router.put(
  "/users/:userid/changePassword",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_changepassword_put
);

//Add user to following array
router.put(
  "/users/:userid/addfollow",
  passport.authenticate("jwt", { session: false }),
  user_controller.user_addfollow_put
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

// Get feed for a user
router.get(
  "/users/:userid/feed",
  passport.authenticate("jwt", { session: false }),
  post_controller.post_feed_get
);

// Get details of a specific post
router.get(
  "/posts/:postid",
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

// Handle post image
router.put(
  "/users/:userid/posts/:postid/uploadimage",
  passport.authenticate("jwt", { session: false }),
  upload.single("postImage"),
  post_controller.post_image_put
);

// Handle adding/removing Post Like
router.put(
  "/posts/:postid",
  passport.authenticate("jwt", { session: false }),
  post_controller.post_like_put
);

// Delete a post
router.delete(
  "/posts/:postid",
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
  "/comments/:commentid",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_detail
);

// Create a new comment
router.post(
  "/posts/:postid/comments",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_create_post
);

// Upload Comment image
router.put(
  "/comments/:commentid/uploadimage",
  passport.authenticate("jwt", { session: false }),
  upload.single("commentImage"),
  comment_controller.comment_image_put
);

// Update a comment
router.put(
  "/comments/:commentid",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_update_put
);

// Handle adding/removing Comment Like
router.put(
  "/comments/:commentid",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_like_put
);

// Delete a comment
router.delete(
  "/comments/:commentid",
  passport.authenticate("jwt", { session: false }),
  comment_controller.comment_delete
);

module.exports = router;
