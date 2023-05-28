import express from "express";
import expressAsyncHandler from "express-async-handler";

import Order from "../models/Order.js";
import { isAdmin, isAuth, isSellerOrisAdmin } from "../utils.js";

const OrderRouter = express.Router();

OrderRouter.get(
  "/mine",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.send(orders);
  })
);

OrderRouter.post(
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    if (req.body.orderItems.length === 0) {
      res.status(400).send({ message: "Cart is empty!" });
    } else {
      const order = new Order({
        orderItems: req.body.orderItems,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: req.body.paymentMethod,
        itemsPrice: req.body.itemsPrice,
        shippingPrice: req.body.shippingPrice,
        taxPrice: req.body.taxPrice,
        totalPrice: req.body.totalPrice,
        user: req.user._id,
        seller: req.body.orderItems[0].seller,
      });

      const placedOrder = await order.save();
      res
        .status(201)
        .send({ message: "A new order is placed", order: placedOrder });
    } // end if
  })
);

OrderRouter.get(
  "/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: "The Order Not Found!" });
    }
  })
);

OrderRouter.put(
  "/:id/pay",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      // save the order
      const updatedOrder = await order.save();
      res.send({ message: "Order has been paid.", order: updatedOrder });
    } else {
      res.status(404).send({ message: "Order Not Found." });
    }
  })
);

OrderRouter.get(
  "/",
  isAuth,
  isSellerOrisAdmin,
  expressAsyncHandler(async (req, res) => {
    // const orders = await Order.find({}).populate("user", "name");
    const seller = req.query.seller || '';
    const sellerFilter = seller ? { seller } : {};

    const orders = await Order.find({ ...sellerFilter }).populate("user", "name");
    res.send(orders);
  })
);

// delete the selected order
OrderRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      const deleteOrder = await order.remove();
      res.send({
        message: "Order Deleted Successfully!",
        order: deleteOrder,
      });
    } else {
      res.status(404).send({ message: "Order Not Found!" });
    }
  })
);

// update order delivery status
OrderRouter.put(
  "/:id/deliver",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      orderDelivery = await order.save();
      res.send({
        message: "Order Delivered!",
        order: orderDelivery,
      });
    } else {
      res.status(404).send({ message: "Order Not Found!" });
    }
  })
);

export default OrderRouter;
