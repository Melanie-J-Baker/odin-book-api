const express = require("express");
const router = express.Router();
// Require controller modules
const user_controller = require("../controllers/userController");
const post_controller = require("../controllers/postController");
const comment_controller = require("../controllers/commentController");

// USER ROUTES
router.post("/users/signup", user_controller.user_signup_post);
router.post("/users/login", user_controller.user_login_post);
router.post("/users/logout", user_controller.user_logout_post);
router.get("/users", user_controller.user_list);
router.get("/users/:userid", user_controller.user_detail);
router.put("/users/:userid", user_controller.user_update_put);
router.delete("/users/:userid", user_controller.user_delete);

// POST ROUTES
router.get("/users/:userid/posts", post_controller.post_list);
router.get("/users/:userid/posts/:postid", post_controller.post_detail);
router.post("/users/:userid/posts", post_controller.post_create_post);
router.put("/users/:userid/posts/:postid", post_controller.post_update_put);
router.delete("/users/:userid/posts/:postid", post_controller.post_delete);

// COMMENT ROUTES
router.get("/posts/:postid/comments", comment_controller.comment_list);
router.get(
  "/posts/:postid/comments/:commentid",
  comment_controller.comment_detail
);
router.post("/posts/:postid/comments/", comment_controller.comment_create_post);
router.put(
  "/posts/:postid/comments/:commentid",
  comment_controller.comment_update_put
);
router.delete(
  "/posts/:postid/comments/:commentid",
  comment_controller.comment_delete
);

module.exports = router;
