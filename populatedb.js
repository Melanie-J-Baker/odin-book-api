#! /usr/bin/env node
const { faker } = require("@faker-js/faker");

console.log(
  'This script populates some test users, posts, and comments to database. Specified database as argument - e.g.: node populatedb "mongodb+srv://cooluser:coolpassword@cluster0.lz91hw2.mongodb.net/local_library?retryWrites=true&w=majority"'
);

// Get arguments passed on command line
const userArgs = process.argv.slice(2);

const User = require("./models/user");
const Post = require("./models/post");
const Comment = require("./models/comment");

const users = [];
const posts = [];
const comments = [];

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
  console.log("Debug: About to connect");
  await mongoose.connect(mongoDB);
  console.log("Debug: Should be connected?");
  await createUsers();
  await createPosts();
  await createComments();
  console.log("Debug: Closing mongoose");
  mongoose.connection.close();
}

async function userCreate(
  index,
  username,
  first_name,
  last_name,
  email,
  password,
  following,
  profile_image
) {
  const userdetail = {
    username: username,
    first_name: first_name,
    last_name: last_name,
    email: email,
    password: password,
    following: following,
    profile_image: profile_image,
  };

  const user = new User(userdetail);

  await user.save();
  users[index] = user;
  console.log(`Added user: ${first_name} ${last_name}`);
}

async function postCreate(index, user, text, likes, post_image) {
  const postdetail = {
    user: user,
    text: text,
    timestamp: Date.now(),
    likes: likes,
    post_image: post_image,
  };

  const post = new Post(postdetail);
  await post.save();
  posts[index] = post;
  console.log(`Added post by: ${user}`);
}

async function commentCreate(index, user, post, text, comment_image, likes) {
  const commentdetail = {
    user: user,
    post: post,
    text: text,
    comment_image: comment_image,
    likes: likes,
  };

  const comment = new Comment(commentdetail);
  await comment.save();
  comments[index] = comment;
  console.log(`Added comment by: ${user}}`);
}

async function createUsers() {
  console.log("Adding users");
  await Promise.all([
    userCreate(
      0,
      faker.internet.displayName(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.internet.email(),
      "Password1",
      [],
      faker.image.avatar()
    ),
    userCreate(
      1,
      faker.internet.displayName(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.internet.email(),
      "Password1",
      [],
      faker.image.avatar()
    ),
    userCreate(
      2,
      faker.internet.displayName(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.internet.email(),
      "Password1",
      [],
      faker.image.avatar()
    ),
    userCreate(
      3,
      faker.internet.displayName(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.internet.email(),
      "Password1",
      [],
      faker.image.avatar()
    ),
    userCreate(
      4,
      faker.internet.displayName(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.internet.email(),
      "Password1",
      [],
      faker.image.avatar()
    ),
    userCreate(
      5,
      faker.internet.displayName(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.internet.email(),
      "Password1",
      [],
      faker.image.avatar()
    ),
    userCreate(
      6,
      faker.internet.displayName(),
      faker.person.firstName(),
      faker.person.lastName(),
      faker.internet.email(),
      "Password1",
      [],
      faker.image.avatar()
    ),
  ]);
}

async function createPosts() {
  console.log("Adding Posts");
  await Promise.all([
    postCreate(
      0,
      users[0],
      faker.lorem.paragraph({ min: 1, max: 3 }),
      [users[3], users[4]],
      faker.image.url()
    ),
    postCreate(
      1,
      users[0],
      faker.lorem.sentences(1),
      [users[3]],
      faker.image.url()
    ),
    postCreate(
      2,
      users[1],
      faker.lorem.paragraph({ min: 1, max: 3 }),
      [users[2], users[4]],
      faker.image.url()
    ),
    postCreate(
      3,
      users[1],
      faker.lorem.sentences(3),
      [users[4]],
      faker.image.url()
    ),
    postCreate(
      4,
      users[1],
      faker.lorem.paragraph({ min: 1, max: 3 }),
      [],
      faker.image.url()
    ),
    postCreate(
      5,
      users[2],
      faker.lorem.sentences(4),
      [users[1]],
      faker.image.url()
    ),
    postCreate(
      6,
      users[3],
      faker.lorem.paragraph({ min: 1, max: 3 }),
      [users[0]],
      faker.image.url()
    ),
    postCreate(
      7,
      users[5],
      faker.lorem.paragraph({ min: 1, max: 3 }),
      [users[3], users[2], users[1]],
      faker.image.url()
    ),
  ]);
}

async function createComments() {
  console.log("Adding comments");
  await Promise.all([
    commentCreate(0, users[3], posts[0], faker.lorem.sentences(1), "", [
      users[0],
    ]),
    commentCreate(1, users[4], posts[0], faker.lorem.sentences(2), "", [
      users[3],
      users[0],
    ]),
    commentCreate(
      2,
      users[3],
      posts[1],
      faker.lorem.sentences(1),
      faker.image.url(),
      [users[0]]
    ),
    commentCreate(3, users[4], posts[2], faker.lorem.sentences(2), "", [
      users[1],
      users[2],
    ]),
    commentCreate(
      4,
      users[1],
      posts[5],
      faker.lorem.paragraph(),
      faker.image.url,
      [users[2], users[0]]
    ),
    commentCreate(5, users[3], posts[7], faker.lorem.sentences(2), "", [
      users[5],
      users[2],
    ]),
    commentCreate(6, users[2], posts[7], faker.lorem.sentences(1), "", [
      users[3],
      users[1],
      users[5],
    ]),
    commentCreate(7, users[5], posts[7], faker.lorem.sentences(2), "", []),
  ]);
}
