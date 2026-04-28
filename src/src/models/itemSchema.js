const itemSchema = new Schema({
    itemName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    description: String
});