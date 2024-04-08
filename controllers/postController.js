const Post = require("../models/post");
const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display a list of all Posts by a User
exports.post_list = asyncHandler(async (req, res, next) => {
  const allPosts = await Post.find({ user: req.params.userid })
    .populate("user")
    .populate("likes")
    .sort({ timestamp: 1 })
    .exec();
  res.json(allPosts);
});

// List of feed posts for a specific user
exports.post_feed_get = asyncHandler(async (req, res, next) => {
  const allFeedPosts = [];
  const user = await User.findById(req.params.userid)
    .populate("following")
    .exec();
  if (user === null) {
    res.json({ error: "User not found" });
    return next(err);
  }
  //const feedUsers = user.following.push(req.params.userid);
  for (const followedUserId of user.following) {
    const feedPosts = await Post.find({ user: followedUserId })
      .sort({ timestamp: -1 })
      .populate("likes")
      .populate("user")
      .exec();
    feedPosts.forEach((post) => {
      allFeedPosts.push(post);
    });
    allFeedPosts.sort((p1, p2) =>
      p1.timestamp > p2.timestamp ? 1 : p1.timestamp < p2.timestamp ? -1 : 0
    );
  }
  res.json({ user: user, feedPosts: allFeedPosts });
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
        status: "Post created",
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
        post_image: req.body.post_image,
        _id: req.params.postid, // update Post instead of creating new one
      });
      await Post.findByIdAndUpdate(req.params.postid, post, {});
      res.json({
        status: "Post updated",
        post: post,
      });
    }
  }),
];

// Handle adding/removing Post Like
exports.post_like_put = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postid).exec();
  if (post.likes.includes(req.body.likes)) {
    const index = post.likes.indexOf(req.body.likes);
    if (index !== -1) {
      post.likes.splice(index, 1);
    }
    await Post.findByIdAndUpdate(req.params.postid, post, {}).exec();
    return res.json({
      message: "Post unliked",
      post: post,
      unlikedby: req.body.likes,
    });
  } else {
    post.likes.push(req.body.likes);
    await Post.findByIdAndUpdate(req.params.postid, post, {}).exec();
    res.json({
      message: "Post liked",
      post: post,
      likedby: req.body.likes,
    });
  }
});

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
