const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, minLength: 1, maxLength: 10000 },
  timestamp: { type: Date, required: true, default: Date.now() },
  likes: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    required: false,
  },
  post_image: { type: String, required: false },
});

// Virtual to format timestamp into user friendly format
/*PostSchema.virtual("timestamp_formatted").get(function () {
    return
})*/

// Virtual for post's URL
PostSchema.virtual("url").get(function () {
  return `odin-book/posts/${this._id}`;
});

module.exports = mongoose.model("Post", PostSchema);
