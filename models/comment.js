const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    text: { type: String, required: true, minLength: 1, maxLength: 5000 },
    timestamp: { type: Date, required: true, default: Date.now() },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: false,
    },
    comment_image: { type: String, required: false },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Virtual to format timestamp into user friendly format
CommentSchema.virtual("timestamp_formatted").get(function () {
  return DateTime.fromJSDate(this.timestamp).toLocaleString(
    DateTime.DATETIME_MED
  );
});

// Virtual for comment's URL
CommentSchema.virtual("url").get(function () {
  return `odin-book/comments/${this._id}`;
});

module.exports = mongoose.model("Comment", CommentSchema);
