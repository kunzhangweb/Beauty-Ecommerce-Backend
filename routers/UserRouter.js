import express from "express";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import data from "../data.js";
import { generateToken, isAuth, isAdmin } from "../utils.js";

const UserRouter = express.Router();

UserRouter.get(
  "/seed",
  expressAsyncHandler(async (req, res) => {
    const createdUsers = await User.insertMany(data.users);
    res.send({ createdUsers });
  })
);

UserRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.send(users);
  })
);

UserRouter.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isSeller: user.isSeller,
          token: generateToken(user),
        });
        return;
      }
    } // end if
    res.status(401).send({ message: "Invalid email address or password!" });
  })
);

UserRouter.post(
  "/signup",
  expressAsyncHandler(async (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    const createdUser = await user.save();
    res.send({
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      isAdmin: createdUser.isAdmin,
      token: generateToken(createdUser),
    });
  })
);

UserRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ message: "User Not Found!" });
    }
  })
);

UserRouter.put(
  "/profile",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (user.isSeller) {
        user.seller.name = req.body.sellerName || user.seller.name;
        user.seller.sellerLogo = req.body.sellerLogo || user.seller.sellerLogo;
        user.seller.description =
          req.body.sellerDescription || user.seller.description;
      }
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }
      const updatedUser = await user.save();
      res.send({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        isSeller: user.isSeller,
        token: generateToken(updatedUser),
      });
    }
  })
);

UserRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.email === "adam@gmail.com") {
        res
          .status(404)
          .send({ message: "To delete an administrator is forbidden!" });
        return;
      }
      const deleteUser = await user.remove();
      res.send({ message: "User deleted Successfully!", user: deleteUser });
    } else {
      res.status(404).send({ message: "User Not Found!" });
    }
  })
);

// edit a user
UserRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isSeller = req.body.isSeller || user.isSeller;
      user.isAdmin = req.body.isAdmin || user.isAdmin;
      const updatedUser = await user.save();
      res.send({ message: "User Updated Successfully", user: updatedUser });
    } else {
      res.status(404).send({ message: "User Not Found" });
    }
  })
);

UserRouter.get(
  "/top-sellers",
  expressAsyncHandler(async (req, res) => {
    const topSellers = await User.find({ isSeller: true })
      .sort({ 'seller.rating': -1 }) //Sort by rating Added DESC
      .limit(3);
    res.send(topSellers);
  })
);

export default UserRouter;
