const mongoose = require("mongoose")
const Schema = mongoose.Schema
const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		brand: {
			type: String,
			required: true,
		},
		image: {
			type: String,
			required: true,
		},
		category: {
			type: Schema.Types.ObjectId,
			ref: "category",
			required: true,
		},
		cart:{
			type: Schema.Types.ObjectId,
			ref: "cart",
			required: true,
		}
	},
	{ timestamps: true }
)
module.exports = mongoose.model("product", productSchema)
