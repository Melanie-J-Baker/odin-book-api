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

// Display a list of all Comments on a Post
exports.comment_list = asyncHandler(async (req, res, next) => {
  const allComments = await Comment.find({ post: req.params.postid })
    .populate("user")
    .sort({ timestamp: 1 })
    .exec();
  res.json(allComments);
});

// Send details for a specific Comment
exports.comment_detail = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentid)
    .populate("user")
    .exec();
  res.json(comment);
});

// Return a list of likes on a Comment with user details
exports.comment_likes_list = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentid)
    .populate("likes")
    .exec();
  res.json({ comment: req.params.commentid, likes: comment.likes });
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
        user: req.body.user,
        text: req.body.text,
        timestamp: Date.now(),
        likes: [],
      });
      await comment.save();
      res.json({
        status: "Comment created",
        comment: comment,
      });
    }
  }),
];

//Handle Comment image
exports.comment_image_put = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentid).exec();
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI);
    comment.comment_image = cldRes.secure_url;
    await Comment.findByIdAndUpdate(req.params.commentid, comment, {}).exec();
    res.json({
      status: "Comment image uploaded",
      comment: comment,
      url: cldRes.secure_url,
    });
  } catch (error) {
    res.send({
      message: error.message,
    });
  }
});

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
        _id: req.params.commentid, // update Comment instead of creating new one
      });
      await Comment.findByIdAndUpdate(req.params.commentid, comment, {});
      res.json({
        status: "Comment updated",
        comment: comment,
      });
    }
  }),
];

// Handle adding/removing Comment Like
exports.comment_like_put = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentid).exec();
  if (comment.likes.includes(req.body.liked)) {
    const index = comment.likes.indexOf(req.body.liked);
    if (index !== -1) {
      comment.likes.splice(index, 1);
    }
    const newComment = await Comment.findByIdAndUpdate(
      req.params.commentid,
      comment,
      {}
    ).exec();
    return res.json({
      message: "Comment unliked",
      comment: newComment,
      unlikedby: req.body.liked,
    });
  } else {
    comment.likes.push(req.body.liked);
    const newComment = await Comment.findByIdAndUpdate(
      req.params.commentid,
      comment,
      {}
    ).exec();
    res.json({
      message: "Comment liked",
      comment: newComment,
      likedby: req.body.liked,
    });
  }
});

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
