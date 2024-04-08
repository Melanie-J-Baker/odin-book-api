const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, minLength: 1, maxLength: 10000 },
    timestamp: { type: Date, required: true, default: Date.now() },
    likes: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: false,
    },
    post_image: { type: String, required: false },
    comments: { type: Array, required: false },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Virtual to format timestamp into user friendly format
PostSchema.virtual("timestamp_formatted").get(function () {
  return DateTime.fromJSDate(this.timestamp).toLocaleString(
    DateTime.DATETIME_MED
  );
});

module.exports = mongoose.model("Post", PostSchema);
