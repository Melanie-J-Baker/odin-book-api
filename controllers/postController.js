const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display a list of all Posts by a User
exports.post_list = asyncHandler(async (req, res, next) => {
  const allPosts = await Post.find({ user: req.params.userid })
    .populate("user")
    .populate("likes")
    .sort({ timestamp: -1 })
    .exec();
  res.json(allPosts);
});

// Send details for a specific Post
exports.post_detail = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postid).populate("user").exec();
  res.json({ post });
});

// Handle Post create on POST
exports.post_create_post = [
  body("text", "Post not valid")
    .trim()
    .isLength({ min: 1, max: 100000 })
    .escape(),
  // Process request after validation and sanitization
  asyncHandler(async (req, res, next) => {
    // Extract validation errors from request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.json({ error: errors.array() });
    } else {
      const post = new Post({
        user: req.params.userid,
        text: req.body.text,
        timestamp: Date.now(),
        likes: [],
        post_image: req.body.post_image,
      });
      await post.save();
      res.json({
        status: "Post created successfully",
        post: post,
      });
    }
  }),
];

// Handle Post update on PUT
exports.post_update_put = [
  body("text", "Post not valid")
    .trim()
    .isLength({ min: 1, max: 100000 })
    .escape(),
  // Process request after validation and sanitization
  asyncHandler(async (req, res, next) => {
    // Extract validation errors from request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.json({ error: errors.array() });
    } else {
      const post = new Post({
        user: req.params.userid,
        text: req.body.text,
        timestamp: Date.now(),
        likes: [],
        post_image: req.body.post_image,
        _id: req.params.postid, // update Post instead of creating new one
      });
      await Post.findByIdAndUpdate(req.params.postid, post, {});
      res.json({
        status: "Post updated successfully",
        post: post,
      });
    }
  }),
];

// Handle Post DELETE
exports.post_delete = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postid).exec();
  if (post === null) {
    res.json({ error: "Post not found" });
  }
  await Post.findByIdAndDelete(req.params.postid).exec();
  res.json({
    message: "Post deleted",
    post: post,
  });
});
