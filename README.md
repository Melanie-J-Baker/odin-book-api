# odin-book-api

Backend component of a social media site created as a final project piece as part of the Odin Project curriculum: https://www.theodinproject.com/lessons/nodejs-odin-book

Social media app (with most of the core functionality of Facebook) was created using Express, MongoDB/Mongoose, React, passport-jwt, bcrypt and cloudinary (to handle image uploads). Core features of the chosen social media platform (Facebook) like users, profiles, posts, following, and “liking” are implemented. Authenticated using passportJS. Faker module from npm is used to populate the database with some default data like users, posts and comments (see populatedb.js).

The following requirements are a very global list of features the app was required to have:

- Users must sign in to see anything except the sign-in page.
- Users should be able to sign in using your chosen authentication method.
- Users can send friend requests to other users.
- Users can create posts (begin with text only).
- Users can like posts.
- Users can comment on posts.
- Posts should always display the post content, author, comments, and likes.
- There should be an index page for posts, which shows all the recent posts from the current user and users they are following.
- Users can create a profile with a profile picture.
- A user’s profile page should contain their profile information, profile photo, and posts.
- There should be an index page for users, which shows all users and buttons for sending friend requests to users the user is not already following or have a pending request.

Extra credit:

- Make posts also allow images (Cloudinary was used for hosting user-uploaded images. The URLs Cloudinary provides are stored in database instead of the raw image binary data).
- Allow users to update their profile photo.
- Create a guest sign-in functionality that allows visitors to bypass the login screen without creating an account or supplying credentials
