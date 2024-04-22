const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
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

// Return a list of all Posts by a User
exports.post_list = asyncHandler(async (req, res, next) => {
  const allPosts = await Post.find({ user: req.params.userid })
    .populate("user")
    .exec();
  allPosts.sort((p1, p2) =>
    p1.timestamp < p2.timestamp ? 1 : p1.timestamp > p2.timestamp ? -1 : 0
  );
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
  const allPostsByUser = await Post.find({ user: req.params.userid })
    .populate("user")
    .sort({ timestamp: -1 })
    .exec();
  allPostsByUser.forEach((post) => {
    allFeedPosts.push(post);
  });
  for (const followedUserId of user.following) {
    const feedPosts = await Post.find({ user: followedUserId })
      .sort({ timestamp: -1 })
      .populate("user")
      .exec();
    feedPosts.forEach((post) => {
      allFeedPosts.push(post);
    });
    allFeedPosts.sort((p1, p2) =>
      p1.timestamp < p2.timestamp ? 1 : p1.timestamp > p2.timestamp ? -1 : 0
    );
  }
  res.json({ user: user, feedPosts: allFeedPosts });
});

// Send details for a specific Post
exports.post_detail = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postid).populate("user").exec();
  res.json(post);
});

// Return a list of likes on a Post with user details
exports.post_likes_list = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postid).populate("likes").exec();
  res.json({ post: req.params.postid, likes: post.likes });
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
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      res.json({ error: errors.array() });
    } else {
      const post = new Post({
        user: req.params.userid,
        text: req.body.text,
        timestamp: Date.now(),
        likes: [],
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

//Handle Post image
exports.post_image_put = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postid).exec();
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI);
    post.post_image = cldRes.secure_url;
    await Post.findByIdAndUpdate(req.params.postid, post, {}).exec();
    res.json({
      status: "Post image uploaded",
      post: post,
      url: cldRes.secure_url,
    });
  } catch (error) {
    res.send({
      message: error.message,
    });
  }
});

// Handle adding/removing Post Like
exports.post_like_put = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postid).exec();
  if (post.likes.includes(req.body.likes)) {
    const index = post.likes.indexOf(req.body.likes);
    if (index !== -1) {
      post.likes.splice(index, 1);
    }
    const newPost = await Post.findByIdAndUpdate(
      req.params.postid,
      post,
      {}
    ).exec();
    return res.json({
      message: "Post liked",
      post: newPost,
      likedby: req.body.likes,
    });
  } else {
    post.likes.push(req.body.likes);
    const newPost = await Post.findByIdAndUpdate(
      req.params.postid,
      post,
      {}
    ).exec();
    res.json({
      message: "Post unliked",
      post: newPost,
      unlikedby: req.body.likes,
    });
  }
});

// Handle Post DELETE
exports.post_delete = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postid).exec();
  if (post === null) {
    res.json({ message: "Post not found" });
  }
  const allCommentsOnPost = await Comment.find({
    post: req.params.postid,
  }).exec();
  if (allCommentsOnPost) {
    await Post.deleteMany({ post: req.params.postid }).exec();
  }
  await Post.findByIdAndDelete(req.params.postid).exec();
  res.json({
    message: "Post and associated comments deleted",
    post: post,
    allCommentsOnPost: allCommentsOnPost,
  });
});
