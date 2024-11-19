const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, minLength: 4, maxLength: 30 },
    first_name: { type: String, required: true, maxLength: 100 },
    last_name: { type: String, required: true, maxLength: 100 },
    email: { type: String, required: true },
    password: { type: String, required: true },
    requests: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: false,
    },
    friends: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: false,
    },
    profile_image: {
      type: String,
      required: true,
      default:
        "../assets/images/default.png",
    },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Virtual for user's full name
UserSchema.virtual("name").get(function () {
  let fullname = "";
  if (this.first_name && this.last_name) {
    fullname = `${this.first_name} ${this.last_name} `;
  }
  return fullname;
});

// Virtual for user's URL
UserSchema.virtual("url").get(function () {
  return `odin-book/users/${this._id}`;
});

UserSchema.pre("save", async function (next) {
  // const user = this
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

UserSchema.methods.isValidPassword = async function (password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
};

module.exports = mongoose.model("User", UserSchema);
