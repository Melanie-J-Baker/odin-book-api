const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display a list of all Comments on a Post
exports.comment_list = asyncHandler(async (req, res, next) => {
  const allComments = await Comment.find({ post: req.params.postid })
    .populate("user")
    .populate("likes")
    .sort({ timestamp: -1 })
    .exec();
  res.json(allComments);
});

// Send details for a specific Comment
exports.comment_detail = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentid)
    .populate("user")
    .populate("likes")
    .exec();
  res.json(comment);
});

// Handle Comment create on POST
exports.comment_create_post = [
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
      const comment = new Comment({
        post: req.params.postid,
        user: req.body.userid,
        text: req.body.text,
        timestamp: Date.now(),
        comment_image: req.body.comment_image,
        likes: [],
      });
      await comment.save();
      res.json({
        status: "Comment created successfully",
        comment: comment,
      });
    }
  }),
];

// Handle Comment update on PUT
exports.comment_update_put = [
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
      const comment = new Comment({
        post: req.params.postid,
        user: req.body.userid,
        text: req.body.text,
        timestamp: Date.now(),
        comment_image: req.body.comment_image,
        likes: [],
        _id: req.params.commentid, // update Comment instead of creating new one
      });
      await Comment.findByIdAndUpdate(req.params.commentid, comment, {});
      res.json({
        status: "Comment updated successfully",
        comment: comment,
      });
    }
  }),
];

// Handle Comment DELETE
exports.comment_delete = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentid).exec();
  if (comment === null) {
    res.json({ error: "Comment not found" });
  }
  await Comment.findByIdAndDelete(req.params.commentid).exec();
  res.json({
    message: "Comment deleted",
    comment: comment,
  });
});
