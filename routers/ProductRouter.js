import express from "express";
import expressAsyncHandler from "express-async-handler";

import Product from "../models/Product.js";
import data from "../data.js";
import { isAuth, isSellerOrisAdmin } from "../utils.js";
import { isAdmin } from "../utils.js";

const ProductRouter = express.Router();

ProductRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const name = req.query.name || "";
    const seller = req.query.seller || "";
    const category = req.query.category || "";
    const order = req.query.order || "";
    const min =
      req.query.min && Number(req.query.min) !== 0 ? Number(req.query.min) : 0;
    const max =
      req.query.max && Number(req.query.max) !== 0 ? Number(req.query.max) : 0;
    const rating =
      req.query.rating && Number(req.query.rating) !== 0
        ? Number(req.query.rating)
        : 0;
    const pageSize = 3;
    const page = Number(req.query.pageNumber) || 1;

    // define filters
    const nameFilter = name ? { name: { $regex: name, $options: "i" } } : {};
    const sellerFilter = seller ? { seller } : {};
    const categoryFilter = category ? { category } : {};
    const priceFilter = min && max ? { price: { $gte: min, $lte: max } } : {};
    const ratingFilter = rating ? { rating: { $gte: rating } } : {};
    const sortOrder =
      order === "lowest"
        ? { price: 1 }
        : order === "highest"
        ? { price: -1 }
        : order === "topRated"
        ? { rating: -1 }
        : { _id: -1 };

    const counts = await Product.count({
      ...nameFilter,
      ...sellerFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });

    const products = await Product.find({
      ...nameFilter,
      ...sellerFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .populate("seller", "seller.name seller.logo")
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.send({ products, page, pages: Math.ceil(counts / pageSize) });
  })
);

// retrieve categories
ProductRouter.get(
  "/categories",
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct("category");
    res.send(categories);
  })
);

ProductRouter.get(
  "/seed",
  expressAsyncHandler(async (req, res) => {
    const createdProducts = await Product.insertMany(data.products);

    res.send({ products: createdProducts });
  })
);

// retrieve single item
ProductRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "seller.name seller.logo seller.rating, seller.numReviews"
    );
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: "Product Not Found!" });
    }
  })
);

// create a new item
ProductRouter.post(
  "/",
  isAuth,
  isSellerOrisAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = new Product({
      sku: 0,
      name: "samle name " + Date.now(),
      seller: req.user._id,
      image: "/images/p1.jpg",
      price: 0,
      category: "sample category",
      brand: "sample brand",
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: "sample description",
    });

    const createdProduct = await product.save();
    res.send({ message: "New Product Created", product: createdProduct });
  })
);

// update the selected item
ProductRouter.put(
  "/:id",
  isAuth,
  isSellerOrisAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = props.match.params.id;
    const product = await Product.findById(productId);
    if (product) {
      product.sku = req.body.sku;
      product.name = req.body.name;
      product.image = req.body.image;
      product.price = req.body.price;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;
      const updatedProduct = await product.save();
      res.send({ message: "Product Updated!", product: updatedProduct });
    } else {
      res.status(404).send({ message: "Product Not Found!" });
    }
  })
);

// delete the selected item
ProductRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      const deleteProduct = await product.remove();
      res.send({
        message: "Product Deleted Successfully!",
        product: deleteProduct,
      });
    } else {
      res.status(404).send({ message: "Product Not Found!" });
    }
  })
);
// update reviews
ProductRouter.post(
  "/:id/reviews",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (product) {
      if (product.reviews.find((r) => r.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: "You already submitted a review" });
      }
      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      // save new review
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((a, b) => b.rating + a, 0) /
        product.reviews.length;
      const updatedProduct = await product.save();
      res.status(201).send({
        message: "New Review Created.",
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
      });
    } else {
      res.status(404).send({ message: "Product Not Found." });
    } // end outer if
  })
);

export default ProductRouter;
